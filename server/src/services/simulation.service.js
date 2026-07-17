const GeminiService = require('./gemini.service');
const SimulationModel = require('../models/simulation.model');
const logger = require('../utils/logger');
const { getScenarioById, getSeverityInfo } = require('../data/crisisScenarios.data');
const { getStadiumById } = require('../data/stadiums.data');

const SimulationService = {
  /**
   * Triggers a synchronous simulation, runs Gemini/Mock, stores result in database
   * @param {string} stadiumId
   * @param {string} scenario
   * @returns {Promise<object>} The inserted database row
   */
  async trigger(stadiumId, scenario) {
    logger.info(`Triggering synchronous simulation for: ${stadiumId}/${scenario}`);

    const scenarioDef = getScenarioById(scenario);
    const result = await GeminiService.generateSimulation(stadiumId, scenario);

    const timeline = [{
      timestamp: new Date().toISOString(),
      type: 'declared',
      message: `CRISIS DECLARED — ${scenarioDef ? scenarioDef.label : scenario}`,
      severity: result.severity
    }];

    const dbRecord = await SimulationModel.insert({
      scenario,
      result,
      stadiumId,
      severity: result.severity,
      timeline
    });
    logger.info(`Simulation for ${stadiumId}/${scenario} saved successfully. ID: ${dbRecord.id}`);

    return dbRecord;
  },

  /**
   * Escalates an existing simulation's severity and regenerates directives for the higher level
   * @param {number} simulationId
   * @returns {Promise<object>} The new escalated database row
   */
  async escalate(simulationId) {
    const prior = await SimulationModel.getById(simulationId);
    if (!prior) {
      const err = new Error('Simulation record not found.');
      err.status = 404;
      throw err;
    }

    const scenarioDef = getScenarioById(prior.scenario);
    const nextScenarioId = scenarioDef && scenarioDef.escalatesTo ? scenarioDef.escalatesTo : prior.scenario;
    const nextScenarioDef = getScenarioById(nextScenarioId);
    const severityInfo = getSeverityInfo(nextScenarioDef ? nextScenarioDef.severityLevel : 1);

    logger.info(`Escalating simulation ${simulationId}: ${prior.scenario} -> ${nextScenarioId}`);

    const result = await GeminiService.generateSimulation(prior.stadium_id, nextScenarioId, severityInfo.code);

    const priorTimeline = Array.isArray(prior.timeline) ? prior.timeline : [];
    const timeline = [
      ...priorTimeline,
      {
        timestamp: new Date().toISOString(),
        type: 'escalated',
        message: `ESCALATED to ${nextScenarioDef ? nextScenarioDef.label : nextScenarioId} — ${severityInfo.label}`,
        severity: severityInfo.code
      }
    ];

    const dbRecord = await SimulationModel.insert({
      scenario: nextScenarioId,
      result,
      stadiumId: prior.stadium_id,
      matchId: prior.match_id,
      severity: result.severity,
      escalatedFrom: prior.id,
      timeline
    });

    return dbRecord;
  },

  /**
   * Generates a predictive risk forecast for a stadium (not persisted)
   * @param {string} stadiumId
   * @returns {Promise<object>}
   */
  async predict(stadiumId) {
    logger.info(`Generating predictive risk forecast for: ${stadiumId}`);
    return GeminiService.generatePredictiveRisk(stadiumId);
  },

  /**
   * Retrieves simulation history, optionally filtered by scenario/stadium
   * @param {string} [scenario]
   * @param {string} [stadiumId]
   * @returns {Promise<Array>}
   */
  async getHistory(scenario, stadiumId, limit) {
    logger.info(`Fetching simulation history (scenario: ${scenario || 'none'}, stadium: ${stadiumId || 'none'})`);
    return SimulationModel.getHistory(scenario, stadiumId, limit);
  },

  /**
   * Saves a completed stream result to the database
   * @param {string} stadiumId
   * @param {string} scenario
   * @param {object} result
   * @returns {Promise<object>}
   */
  async saveResult(stadiumId, scenario, result) {
    logger.info(`Saving streamed simulation result for: ${stadiumId}/${scenario}`);
    const scenarioDef = getScenarioById(scenario);
    const timeline = [{
      timestamp: new Date().toISOString(),
      type: 'declared',
      message: `CRISIS DECLARED — ${scenarioDef ? scenarioDef.label : scenario}`,
      severity: result.severity
    }];
    return SimulationModel.insert({ scenario, result, stadiumId, severity: result.severity, timeline });
  },

  /**
   * Public, unauthenticated lookup used by QR-scanned ground-staff mobile cards.
   * Returns a minimal view (no full history/internal fields).
   * @param {number} simulationId
   * @returns {Promise<object|null>}
   */
  async getPublicRecord(simulationId) {
    const record = await SimulationModel.getById(simulationId);
    if (!record) return null;

    const scenarioDef = getScenarioById(record.scenario);
    const stadium = record.stadium_id ? getStadiumById(record.stadium_id) : null;

    return {
      id: record.id,
      scenario: record.scenario,
      scenarioLabel: scenarioDef ? scenarioDef.label : record.scenario,
      severity: record.severity,
      stadiumName: stadium ? stadium.name : null,
      gate: stadium && stadium.gates.length > 0 ? stadium.gates[0] : null,
      result: record.result,
      createdAt: record.created_at
    };
  },

  /**
   * Appends a manual/system entry to a simulation's crisis timeline
   * @param {number} simulationId
   * @param {object} entry - { type, message }
   * @returns {Promise<object>}
   */
  async appendTimelineEntry(simulationId, entry) {
    const record = await SimulationModel.getById(simulationId);
    if (!record) {
      const err = new Error('Simulation record not found.');
      err.status = 404;
      throw err;
    }
    const timeline = Array.isArray(record.timeline) ? record.timeline : [];
    timeline.push({
      timestamp: new Date().toISOString(),
      type: entry.type || 'note',
      message: entry.message
    });
    return SimulationModel.updateTimeline(simulationId, timeline);
  }
};

module.exports = SimulationService;
