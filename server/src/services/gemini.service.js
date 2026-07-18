const { GoogleGenAI } = require('@google/genai');
const env = require('../config/env');
const logger = require('../utils/logger');
const { getStadiumById } = require('../data/stadiums.data');
const { getActiveMatch } = require('../data/matches.data');
const { getScenarioById, getSeverityInfo } = require('../data/crisisScenarios.data');

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

// 8 specialist agency domains — one Gemini call returns all 8 sections at once
// (keeps latency/cost/rate-limits sane vs. 8 separate API calls per trigger).
const AGENCY_KEYS = [
  'navigation',    // Stadium Operations
  'medical',       // Emergency Medical Services
  'security',      // Security / Police
  'evacuation',    // Fire & Rescue
  'transport',     // Transport Authority
  'accessibility', // Accessibility Team
  'sustainability',// Sustainability Ops
  'broadcast'      // Communications
];

const AGENCY_LABELS = {
  navigation: 'Stadium Operations',
  medical: 'Emergency Medical Services',
  security: 'Security / Police',
  evacuation: 'Fire & Rescue',
  transport: 'Transport Authority',
  accessibility: 'Accessibility Team',
  sustainability: 'Sustainability Ops',
  broadcast: 'Communications'
};

const AGENCY_DESCRIPTIONS = {
  navigation: 'Gate management and concourse flow directives.',
  medical: 'First aid positioning and mass casualty triage directives.',
  security: 'Perimeter control and pitch protection directives.',
  evacuation: 'Evacuation routing and structural fire response directives.',
  transport: 'Bus, rail, and road diversion directives.',
  accessibility: 'Mobility-impaired evacuation and guidance directives.',
  sustainability: 'Power, water, and waste operations directives.',
  broadcast: 'PA, media, and multilingual announcement directives.'
};

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    ...Object.fromEntries(AGENCY_KEYS.map(key => [
      key,
      { type: 'STRING', description: AGENCY_DESCRIPTIONS[key] }
    ])),
    severity: {
      type: 'STRING',
      description: 'Assessed severity level code: ADVISORY, ELEVATED, CRITICAL, or CATASTROPHIC.'
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
  required: [...AGENCY_KEYS, 'severity', 'operationalRecommendation', 'multilingualScripts']
};

const PREDICTIVE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    risks: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING', description: 'Short name of the forecast risk, e.g. "Exit Surge".' },
          probability: { type: 'NUMBER', description: 'Probability percentage 0-100 within the forecast window.' },
          level: { type: 'STRING', description: 'HIGH, MEDIUM, or LOW.' },
          windowMinutes: { type: 'NUMBER', description: 'Forecast window in minutes.' }
        },
        required: ['label', 'probability', 'level', 'windowMinutes']
      }
    },
    reasoning: { type: 'STRING', description: 'One to two sentence AI reasoning summary explaining the top risk driver.' }
  },
  required: ['risks', 'reasoning']
};

function buildMockAgencyResult(scenarioId) {
  const scenario = getScenarioById(scenarioId);
  const label = scenario ? scenario.label : scenarioId;
  const severityInfo = scenario ? getSeverityInfo(scenario.severityLevel) : getSeverityInfo(1);

  const result = {};
  for (const key of AGENCY_KEYS) {
    result[key] = `${AGENCY_LABELS[key]}: Standard response protocol activated for ${label}. ${AGENCY_DESCRIPTIONS[key]}`;
  }
  result.severity = severityInfo.code;
  result.operationalRecommendation = `Immediate multi-agency coordination recommended to contain ${label} before secondary escalation.`;
  result.multilingualScripts = {
    en: `Operational notice: ${label} in progress. Please follow staff instructions.`,
    es: `Aviso operativo: ${label} en curso. Por favor siga las instrucciones del personal.`,
    fr: `Avis opérationnel: ${label} en cours. Veuillez suivre les instructions du personnel.`
  };
  return result;
}

function buildMockPredictiveResult(stadiumId) {
  return {
    risks: [
      { label: 'Exit Surge', probability: 94, level: 'HIGH', windowMinutes: 15 },
      { label: 'Transit Overload', probability: 78, level: 'MEDIUM', windowMinutes: 30 },
      { label: 'Parking Gridlock', probability: 71, level: 'MEDIUM', windowMinutes: 30 },
      { label: 'Weather Incident', probability: 12, level: 'LOW', windowMinutes: 60 }
    ],
    reasoning: `Stadium ${stadiumId} combines high capacity utilization with constrained transit egress, producing the highest post-match risk profile of the tournament.`
  };
}

/**
 * Builds the rich, stadium-DNA-aware prompt for a crisis simulation.
 * @param {object} stadium
 * @param {object|null} match
 * @param {object} scenario
 * @param {string} [severityOverride]
 */
function buildPrompt(stadium, match, scenario, severityOverride) {
  const severityInfo = getSeverityInfo(severityOverride || scenario.severityLevel);
  let scoreLine = '';
  if (match && match.homeScore != null) {
    scoreLine = ` | Score: ${match.homeScore}-${match.awayScore}`;
  }
  const matchLine = match
    ? `Match: ${match.homeFlagEmoji} ${match.homeTeam} vs ${match.awayFlagEmoji} ${match.awayTeam} | Stage: ${match.stage} | Status: ${match.status}${scoreLine}`
    : 'Match: No active match context.';

  return [
    'You are StadiumPulse AI, the FIFA World Cup 2026 Venue Operations Centre (VOC) intelligence system.',
    'Respond ONLY in JSON matching the specified schema. Generate detailed, actionable, agency-specific operational directives for a live stadium command center.',
    '',
    `Stadium: ${stadium.name}, ${stadium.city}, ${stadium.country}`,
    `Capacity: ${stadium.capacity.toLocaleString()} | Map Type: ${stadium.mapType}`,
    matchLine,
    `Risk Profile: ${stadium.riskProfile.join(', ')}`,
    `Transport: ${stadium.transport.join(', ')}`,
    `Gates: ${stadium.gates.join(', ')}`,
    `Medical Zones: ${stadium.medicalZones.join(', ')}`,
    '',
    `Scenario: ${scenario.label} (${scenario.category})`,
    `Severity: ${severityInfo.label} — response time target: ${severityInfo.responseTime}`,
    scenario.promptFragment,
    '',
    'Generate specific, actionable directives for each of the 8 specialist agencies (navigation, medical, security, evacuation, transport, accessibility, sustainability, broadcast), an assessed severity code, a one-line operational recommendation rationale, and public announcement scripts in English, Spanish, and French.'
  ].join('\n');
}

function buildPredictivePrompt(stadium, match) {
  const matchLine = match
    ? `Match: ${match.homeFlagEmoji} ${match.homeTeam} vs ${match.awayFlagEmoji} ${match.awayTeam} | Stage: ${match.stage}`
    : 'Match: No active match context.';

  return [
    'You are StadiumPulse AI, the FIFA World Cup 2026 Venue Operations Centre (VOC) predictive risk intelligence system.',
    'Respond ONLY in JSON matching the specified schema.',
    '',
    `Stadium: ${stadium.name}, ${stadium.city}, ${stadium.country}`,
    `Capacity: ${stadium.capacity.toLocaleString()}`,
    matchLine,
    `Risk Profile: ${stadium.riskProfile.join(', ')}`,
    `Transport: ${stadium.transport.join(', ')}`,
    '',
    'Forecast the top 3-5 operational risks for the next 60 minutes given this stadium\'s risk DNA, capacity, and match context. Rank by probability and explain the top driver in one to two sentences.'
  ].join('\n');
}

const GeminiService = {
  /**
   * Generates simulation response from Gemini 2.5 Flash for a given stadium + scenario
   * @param {string} stadiumId
   * @param {string} scenarioId
   * @param {string} [severityOverride]
   * @returns {Promise<object>} JSON schema object
   */
  async generateSimulation(stadiumId, scenarioId, severityOverride) {
    const stadium = getStadiumById(stadiumId);
    const scenario = getScenarioById(scenarioId);

    if (env.MOCK_MODE || !stadium || !scenario) {
      logger.info(`[MOCK MODE] Returning mock response for: ${stadiumId}/${scenarioId}`);
      return buildMockAgencyResult(scenarioId);
    }

    const match = getActiveMatch(stadiumId);
    const prompt = buildPrompt(stadium, match, scenario, severityOverride);
    let attempts = 0;
    const maxRetries = 2; // initial try + 1 retry

    while (attempts < maxRetries) {
      try {
        attempts++;
        logger.info(`Calling Gemini API for ${stadiumId}/${scenarioId} (Attempt ${attempts})...`);

        const response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
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
        logger.info(`Successfully received response from Gemini for ${stadiumId}/${scenarioId}`);
        return data;
      } catch (err) {
        logger.error(`Gemini API call failed (Attempt ${attempts}/${maxRetries})`, err);
        if (attempts >= maxRetries) {
          logger.warn(`Max retries reached. Falling back to MOCK response for ${stadiumId}/${scenarioId}`);
          return buildMockAgencyResult(scenarioId);
        }
      }
    }
  },

  /**
   * Streams simulation response chunk-by-chunk from Gemini 2.5 Flash
   * @param {string} stadiumId
   * @param {string} scenarioId
   * @param {string} [severityOverride]
   * @returns {Promise<AsyncIterable>} Stream chunk iterator
   */
  async generateSimulationStream(stadiumId, scenarioId, severityOverride) {
    const stadium = getStadiumById(stadiumId);
    const scenario = getScenarioById(scenarioId);

    if (env.MOCK_MODE || !stadium || !scenario) {
      logger.info(`[MOCK MODE] Streaming mock response for: ${stadiumId}/${scenarioId}`);
      return this.createMockStream(scenarioId);
    }

    const match = getActiveMatch(stadiumId);
    const prompt = buildPrompt(stadium, match, scenario, severityOverride);
    try {
      logger.info(`Calling Gemini Streaming API for ${stadiumId}/${scenarioId}...`);
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-flash-latest',
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
      return this.createMockStream(scenarioId);
    }
  },

  /**
   * Helper to emulate streaming for mock fallback / mock mode
   */
  async *createMockStream(scenarioId) {
    const mockData = buildMockAgencyResult(scenarioId);
    const jsonStr = JSON.stringify(mockData, null, 2);

    const chunkSize = 40;
    for (let i = 0; i < jsonStr.length; i += chunkSize) {
      const chunk = jsonStr.substring(i, i + chunkSize);
      yield { text: chunk };
      await new Promise(resolve => setTimeout(resolve, 80)); // 80ms delay
    }
  },

  /**
   * Generates a forward-looking predictive risk forecast for a stadium
   * @param {string} stadiumId
   * @returns {Promise<object>}
   */
  async generatePredictiveRisk(stadiumId) {
    const stadium = getStadiumById(stadiumId);

    if (env.MOCK_MODE || !stadium) {
      logger.info(`[MOCK MODE] Returning mock predictive risk for: ${stadiumId}`);
      return buildMockPredictiveResult(stadiumId);
    }

    const match = getActiveMatch(stadiumId);
    const prompt = buildPredictivePrompt(stadium, match);

    try {
      logger.info(`Calling Gemini API for predictive risk: ${stadiumId}...`);
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: PREDICTIVE_SCHEMA,
          temperature: 0.3
        }
      });

      if (!response.text) {
        throw new Error('Gemini returned an empty response.');
      }

      return JSON.parse(response.text);
    } catch (err) {
      logger.error('Gemini predictive risk call failed. Falling back to mock.', err);
      return buildMockPredictiveResult(stadiumId);
    }
  }
};

module.exports = GeminiService;
module.exports.AGENCY_KEYS = AGENCY_KEYS;
module.exports.AGENCY_LABELS = AGENCY_LABELS;
