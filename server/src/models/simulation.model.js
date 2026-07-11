const pool = require('../config/db');
const logger = require('../utils/logger');

const SimulationModel = {
  /**
   * Inserts a new simulation run
   * @param {string} scenario 
   * @param {object} result 
   * @returns {Promise<object>} The inserted simulation row
   */
  async insert(scenario, result) {
    const query = `
      INSERT INTO simulations (scenario, result)
      VALUES ($1, $2)
      RETURNING id, scenario, result, created_at
    `;
    const values = [scenario, JSON.stringify(result)];
    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (err) {
      logger.error('Error in SimulationModel.insert', err);
      throw err;
    }
  },

  /**
   * Fetches simulation history, with optional scenario filtering
   * @param {string} [scenario] - Whitelisted scenario filter
   * @returns {Promise<Array>} List of simulation rows
   */
  async getHistory(scenario) {
    let query = 'SELECT id, scenario, result, created_at FROM simulations';
    const values = [];

    if (scenario) {
      query += ' WHERE scenario = $1';
      values.push(scenario);
    }

    query += ' ORDER BY created_at DESC';

    try {
      const { rows } = await pool.query(query, values);
      return rows;
    } catch (err) {
      logger.error('Error in SimulationModel.getHistory', err);
      throw err;
    }
  }
};

module.exports = SimulationModel;
