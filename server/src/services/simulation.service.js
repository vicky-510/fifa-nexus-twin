const GeminiService = require('./gemini.service');
const SimulationModel = require('../models/simulation.model');
const logger = require('../utils/logger');

const SimulationService = {
  /**
   * Triggers a synchronous simulation, runs Gemini/Mock, stores result in database
   * @param {string} scenario 
   * @returns {Promise<object>} The inserted database row
   */
  async trigger(scenario) {
    logger.info(`Triggering synchronous simulation for: ${scenario}`);
    
    // Get structured guidance from Gemini (or mock fallback)
    const result = await GeminiService.generateSimulation(scenario);
    
    // Insert into database
    const dbRecord = await SimulationModel.insert(scenario, result);
    logger.info(`Simulation for ${scenario} saved successfully. ID: ${dbRecord.id}`);
    
    return dbRecord;
  },

  /**
   * Retrieves simulation history, optionally filtered by scenario
   * @param {string} [scenario] 
   * @returns {Promise<Array>}
   */
  async getHistory(scenario) {
    logger.info(`Fetching simulation history (filter: ${scenario || 'none'})`);
    return await SimulationModel.getHistory(scenario);
  },

  /**
   * Saves a completed stream result to the database
   * @param {string} scenario 
   * @param {object} result 
   * @returns {Promise<object>}
   */
  async saveResult(scenario, result) {
    logger.info(`Saving streamed simulation result for: ${scenario}`);
    return await SimulationModel.insert(scenario, result);
  }
};

module.exports = SimulationService;
