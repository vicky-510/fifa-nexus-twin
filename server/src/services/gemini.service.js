const { GoogleGenAI } = require('@google/genai');
const env = require('../config/env');
const logger = require('../utils/logger');

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    navigation: {
      type: 'STRING',
      description: 'Directives for navigation routes, gates, and redirection paths inside and around the stadium.'
    },
    crowdControl: {
      type: 'STRING',
      description: 'Directives for crowd management, barrier deployment, marshal positioning, and gate closures.'
    },
    accessibilityGuidance: {
      type: 'STRING',
      description: 'Directives for accommodating mobility-impaired, elderly, or sensory-sensitive visitors.'
    },
    transportUpdates: {
      type: 'STRING',
      description: 'Directives for transit scheduling, subway frequency adjustment, shuttle rerouting, or bus lane priority.'
    },
    sustainability: {
      type: 'STRING',
      description: 'Directives for power conservation, waste management, or water pumps eco-operations.'
    },
    operationalRecommendation: {
      type: 'STRING',
      description: 'A one-line operational decision rationale explaining why these directives are recommended.'
    },
    multilingualScripts: {
      type: 'OBJECT',
      properties: {
        en: { type: 'STRING', description: 'Announcement script in English for stadium loudspeakers and screens.' },
        es: { type: 'STRING', description: 'Announcement script in Spanish for stadium loudspeakers and screens.' },
        fr: { type: 'STRING', description: 'Announcement script in French for stadium loudspeakers and screens.' }
      },
      required: ['en', 'es', 'fr']
    }
  },
  required: [
    'navigation',
    'crowdControl',
    'accessibilityGuidance',
    'transportUpdates',
    'sustainability',
    'operationalRecommendation',
    'multilingualScripts'
  ]
};

// Static mocks to use under MOCK_MODE or on complete failure
const MOCK_RESPONSES = {
  exitSurge: {
    navigation: '[MOCK] Redirect all arriving spectators to Gate B and C. Utilize perimeter route 4.',
    crowdControl: '[MOCK] Deploy emergency crowd management barrier unit 2 to Gate A. Open security buffers.',
    accessibilityGuidance: '[MOCK] Ensure dedicated wheelchair shuttle at Gate B remains accessible. Assign guides to ramp A.',
    transportUpdates: '[MOCK] Extend subway green line trains frequency to 2-minute intervals. Hold shuttle bus departures.',
    sustainability: '[MOCK] De-energize non-essential lighting at closed Gate A zones to reduce auxiliary power drain.',
    operationalRecommendation: '[MOCK] Phased evacuation pattern immediately to prevent bottlenecking at Gate A exits.',
    multilingualScripts: {
      en: '[MOCK] Operational notice: Please use Gates B and C for exiting the stadium. Gate A is temporarily closed.',
      es: '[MOCK] Aviso operativo: Por favor use las Puertas B y C para salir del estadio. La Puerta A está cerrada temporalmente.',
      fr: '[MOCK] Avis opérationnel: Veuillez utiliser les portes B et C pour sortir du stade. La porte A est temporairement fermée.'
    }
  },
  stormInundation: {
    navigation: '[MOCK] Reroute pedestrians to the elevated North Concourse. Avoid lower level ramps.',
    crowdControl: '[MOCK] Deploy safety marshals to guide fans away from puddle areas. Restrict access to flooded stairwells.',
    accessibilityGuidance: '[MOCK] Utilize elevator elevator-east for mobility impaired fans. Avoid ground-level lifts.',
    transportUpdates: '[MOCK] Reroute park-and-ride buses to avoid low-lying street flood zones.',
    sustainability: '[MOCK] Deploy reusable water barriers and standard drainage pumps to minimize environmental impact.',
    operationalRecommendation: '[MOCK] Divert lower concourse foot traffic to higher platforms to prevent wet weather hazards.',
    multilingualScripts: {
      en: '[MOCK] Safety alert: Ground level access is restricted due to high water. Follow staff to elevated pathways.',
      es: '[MOCK] Alerta de seguridad: El acceso al nivel del suelo está restringido por acumulación de agua. Siga al personal.',
      fr: '[MOCK] Alerte de sécurité: L\'accès au rez-de-chaussée est limité en raison des eaux. Suivez le personnel vers les voies surélevées.'
    }
  },
  gridlockOutage: {
    navigation: '[MOCK] Direct shuttle passengers to alternate loading zone 2. Use path west-walkway.',
    crowdControl: '[MOCK] Deploy perimeter stewards with portable battery megaphones. Manage queue spacing.',
    accessibilityGuidance: '[MOCK] Prioritize low-floor shuttles for senior and disabled visitors. Maintain clear ramp access.',
    transportUpdates: '[MOCK] Divert bus fleets to the East parking loop. Request police control at intersections.',
    sustainability: '[MOCK] Configure emergency hybrid lighting generators in low-emissions eco mode.',
    operationalRecommendation: '[MOCK] Deploy field agents with high-visibility gear to direct crowds to backup transit hubs.',
    multilingualScripts: {
      en: '[MOCK] Transport alert: West transit hub is experiencing delays. Directing lines to alternate boarding zones.',
      es: '[MOCK] Alerta de transporte: El centro de tránsito oeste tiene demoras. Diríjase a las zonas alternativas.',
      fr: '[MOCK] Alerte de transport: La gare de transit ouest subit des retards. Lignes dirigées vers les zones d\'embarquement alternatives.'
    }
  }
};

const getPrompt = (scenario) => {
  const base = "You are StadiumPulse AI, the World Cup 2026 operations intelligence system. Respond ONLY in JSON matching the specified schema. Generate detailed, actionable operational directives for a stadium staff command center.";
  
  if (scenario === 'exitSurge') {
    return `${base} Scenario: Crowd exit surge at Gate A. Specators are exiting rapidly and crowding Gate A exits. Provide navigation routing directives, crowd control barriers, accessibility ramp guides, transit line increases, sustainability green energy actions (de-energizing closed zones), a one-line recommendation rationale, and public announcement scripts.`;
  }
  if (scenario === 'stormInundation') {
    return `${base} Scenario: Flash storm causing flooding in the main concourse level and pedestrian ramps. Provide navigation routing to elevated pathways, crowd hazard controls, accessibility elevator directives, transport bus rerouting, sustainability eco drainage actions, a one-line recommendation rationale, and public announcement scripts.`;
  }
  if (scenario === 'gridlockOutage') {
    return `${base} Scenario: Severe transport gridlock combined with a power outage at the West Transit Hub. Provide navigation to alternate zones, crowd megaphone control, accessibility shuttle boarding priority, transport traffic diversion, sustainability backup low-emissions generation, a one-line recommendation rationale, and public announcement scripts.`;
  }
  return `${base} Scenario: ${scenario}. Provide operational directives matching the schema.`;
};

const GeminiService = {
  /**
   * Generates simulation response from Gemini 2.5 Flash
   * @param {string} scenario 
   * @returns {Promise<object>} JSON schema object
   */
  async generateSimulation(scenario) {
    if (env.MOCK_MODE) {
      logger.info(`[MOCK MODE] Returning mock response for: ${scenario}`);
      return MOCK_RESPONSES[scenario] || MOCK_RESPONSES.exitSurge;
    }

    const prompt = getPrompt(scenario);
    let attempts = 0;
    const maxRetries = 2; // initial try + 1 retry

    while (attempts < maxRetries) {
      try {
        attempts++;
        logger.info(`Calling Gemini API for ${scenario} (Attempt ${attempts})...`);

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.2
          }
        });

        if (!response.text) {
          throw new Error('Gemini returned an empty response.');
        }

        const data = JSON.parse(response.text);
        logger.info(`Successfully received response from Gemini for ${scenario}`);
        return data;
      } catch (err) {
        logger.error(`Gemini API call failed (Attempt ${attempts}/${maxRetries})`, err);
        if (attempts >= maxRetries) {
          logger.warn(`Max retries reached. Falling back to MOCK response for ${scenario}`);
          return MOCK_RESPONSES[scenario] || MOCK_RESPONSES.exitSurge;
        }
      }
    }
  },

  /**
   * Streams simulation response chunk-by-chunk from Gemini 2.5 Flash
   * @param {string} scenario 
   * @returns {Promise<AsyncIterable>} Stream chunk iterator
   */
  async generateSimulationStream(scenario) {
    if (env.MOCK_MODE) {
      logger.info(`[MOCK MODE] Streaming mock response for: ${scenario}`);
      return this.createMockStream(scenario);
    }

    const prompt = getPrompt(scenario);
    try {
      logger.info(`Calling Gemini Streaming API for ${scenario}...`);
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.2
        }
      });
      return responseStream;
    } catch (err) {
      logger.error('Gemini Streaming API call failed. Falling back to Mock stream.', err);
      return this.createMockStream(scenario);
    }
  },

  /**
   * Helper to emulate streaming for mock fallback / mock mode
   */
  async *createMockStream(scenario) {
    const mockData = MOCK_RESPONSES[scenario] || MOCK_RESPONSES.exitSurge;
    const jsonStr = JSON.stringify(mockData, null, 2);
    
    // Chunk size: let's send parts of the string slowly to simulate real generation
    const chunkSize = 40;
    for (let i = 0; i < jsonStr.length; i += chunkSize) {
      const chunk = jsonStr.substring(i, i + chunkSize);
      yield { text: chunk };
      await new Promise(resolve => setTimeout(resolve, 80)); // 80ms delay
    }
  }
};

module.exports = GeminiService;
