const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const logger = require('../utils/logger');

async function runMigrations() {
  logger.info('Starting database migration checks...');
  
  const client = await pool.connect();
  try {
    // 1. Run the migration SQL files
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Run in order e.g. 001_..., 002_...

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      logger.info(`Executing migration file: ${file}`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
    }
    logger.info('Migrations completed successfully.');

    // 2. Check if the simulations table is empty and seed if necessary
    const { rows } = await client.query('SELECT COUNT(*) FROM simulations');
    const count = parseInt(rows[0].count, 10);

    if (count === 0) {
      logger.info('Database has 0 simulations. Seeding 3 sample records for the dashboard demo...');
      
      const seedData = [
        {
          scenario: 'exitSurge',
          result: {
            navigation: 'Redirect all arriving spectators to Gate B and C. Utilize perimeter route 4.',
            crowdControl: 'Deploy emergency crowd management barrier unit 2 to Gate A. Open security buffers.',
            accessibilityGuidance: 'Ensure dedicated wheelchair shuttle at Gate B remains accessible. Assign guides to ramp A.',
            transportUpdates: 'Extend subway green line trains frequency to 2-minute intervals. Hold shuttle bus departures.',
            sustainability: 'De-energize non-essential lighting at closed Gate A zones to reduce auxiliary power drain.',
            operationalRecommendation: 'Initiate phased evacuation pattern immediately to prevent bottlenecking at Gate A exits.',
            multilingualScripts: {
              en: 'Operational notice: Please use Gates B and C for exiting the stadium. Gate A is temporarily closed.',
              es: 'Aviso operativo: Por favor use las Puertas B y C para salir del estadio. La Puerta A está cerrada temporalmente.',
              fr: 'Avis opérationnel: Veuillez utiliser les portes B et C pour sortir du stade. La porte A est temporairement fermée.'
            }
          }
        },
        {
          scenario: 'stormInundation',
          result: {
            navigation: 'Reroute pedestrians to the elevated North Concourse. Avoid lower level ramps.',
            crowdControl: 'Deploy safety marshals to guide fans away from puddle areas. Restrict access to flooded stairwells.',
            accessibilityGuidance: 'Utilize elevator elevator-east for mobility impaired fans. Avoid ground-level lifts.',
            transportUpdates: 'Reroute park-and-ride buses to avoid low-lying street flood zones.',
            sustainability: 'Deploy reusable water barriers and standard drainage pumps to minimize environmental impact.',
            operationalRecommendation: 'Divert lower concourse foot traffic to higher platforms to prevent wet weather hazards.',
            multilingualScripts: {
              en: 'Safety alert: Ground level access is restricted due to high water. Follow staff to elevated pathways.',
              es: 'Alerta de seguridad: El acceso al nivel del suelo está restringido por acumulación de agua. Siga al personal.',
              fr: "Alerte de sécurité: L'accès au rez-de-chaussée est limité en raison des eaux. Suivez le personnel vers les voies surélevées."
            }
          }
        },
        {
          scenario: 'gridlockOutage',
          result: {
            navigation: 'Direct shuttle passengers to alternate loading zone 2. Use path west-walkway.',
            crowdControl: 'Deploy perimeter stewards with portable battery megaphones. Manage queue spacing.',
            accessibilityGuidance: 'Prioritize low-floor shuttles for senior and disabled visitors. Maintain clear ramp access.',
            transportUpdates: 'Divert bus fleets to the East parking loop. Request police control at intersections.',
            sustainability: 'Configure emergency hybrid lighting generators in low-emissions eco mode.',
            operationalRecommendation: 'Deploy field agents with high-visibility gear to direct crowds to backup transit hubs.',
            multilingualScripts: {
              en: 'Transport alert: West transit hub is experiencing delays. Directing lines to alternate boarding zones.',
              es: 'Alerta de transporte: El centro de tránsito oeste tiene demoras. Diríjase a las zonas alternativas.',
              fr: "Alerte de transport: La gare de transit ouest subit des retards. Lignes dirigées vers les zones d'embarquement alternatives."
            }
          }
        }
      ];

      for (const item of seedData) {
        await client.query(
          'INSERT INTO simulations (scenario, result) VALUES ($1, $2)',
          [item.scenario, JSON.stringify(item.result)]
        );
      }
      logger.info('Database seeded successfully.');
    } else {
      logger.info(`Database already has ${count} simulation records. Skipping seeding.`);
    }

  } catch (err) {
    logger.error('Failed to run database migrations and seeding', err);
    client.release();
    process.exit(1); // Fail fast and exit the server process
  } finally {
    client.release();
  }
}

module.exports = runMigrations;
