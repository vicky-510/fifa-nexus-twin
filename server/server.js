const app = require('./src/app');
const env = require('./src/config/env');
const runMigrations = require('./src/migrations/runMigrations');
const logger = require('./src/utils/logger');

const PORT = env.PORT;

async function bootstrap() {
  try {
    // 1. Execute DB migrations and seed sample data
    await runMigrations();
    
    // 2. Bind application listener
    app.listen(PORT, () => {
      logger.info(`StadiumPulse Backend running on port ${PORT}`);
      logger.info(`Endpoint base URL: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    logger.error('Bootstrap failure: Server shutting down', err);
    process.exit(1);
  }
}

bootstrap();
