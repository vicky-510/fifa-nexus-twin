const pool = require('../config/db');
const logger = require('../utils/logger');

const SimulationModel = {
  /**
   * Inserts a new simulation run
   * @param {object} params
   * @param {string} params.scenario
   * @param {object} params.result
   * @param {string} [params.stadiumId]
   * @param {string} [params.matchId]
   * @param {string} [params.severity]
   * @param {number} [params.escalatedFrom]
   * @param {Array} [params.timeline]
   * @returns {Promise<object>} The inserted simulation row
   */
  async insert({ scenario, result, stadiumId = null, matchId = null, severity = null, escalatedFrom = null, timeline = [] }) {
    const query = `
      INSERT INTO simulations (scenario, result, stadium_id, match_id, severity, escalated_from, timeline)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, scenario, result, stadium_id, match_id, severity, escalated_from, timeline, created_at
    `;
    const values = [scenario, JSON.stringify(result), stadiumId, matchId, severity, escalatedFrom, JSON.stringify(timeline)];
    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (err) {
      logger.error('Error in SimulationModel.insert', err);
      throw err;
    }
  },

  /**
   * Fetches a single simulation record by ID
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async getById(id) {
    const query = 'SELECT id, scenario, result, stadium_id, match_id, severity, escalated_from, timeline, created_at FROM simulations WHERE id = $1';
    try {
      const { rows } = await pool.query(query, [id]);
      return rows[0] || null;
    } catch (err) {
      logger.error('Error in SimulationModel.getById', err);
      throw err;
    }
  },

  /**
   * Updates the timeline JSONB array for a simulation record
   * @param {number} id
   * @param {Array} timeline
   * @returns {Promise<object>}
   */
  async updateTimeline(id, timeline) {
    const query = `
      UPDATE simulations SET timeline = $2
      WHERE id = $1
      RETURNING id, scenario, result, stadium_id, match_id, severity, escalated_from, timeline, created_at
    `;
    try {
      const { rows } = await pool.query(query, [id, JSON.stringify(timeline)]);
      return rows[0];
    } catch (err) {
      logger.error('Error in SimulationModel.updateTimeline', err);
      throw err;
    }
  },

  /**
   * Fetches simulation history, with optional scenario/stadium filtering
   * @param {string} [scenario] - Whitelisted scenario filter
   * @param {string} [stadiumId]
   * @returns {Promise<Array>} List of simulation rows
   */
  async getHistory(scenario, stadiumId) {
    let query = 'SELECT id, scenario, result, stadium_id, match_id, severity, escalated_from, timeline, created_at FROM simulations';
    const conditions = [];
    const values = [];

    if (scenario) {
      values.push(scenario);
      conditions.push(`scenario = $${values.length}`);
    }
    if (stadiumId) {
      values.push(stadiumId);
      conditions.push(`stadium_id = $${values.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
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
