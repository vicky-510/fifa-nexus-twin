const pool = require('../config/db');
const logger = require('../utils/logger');

const AppConfigModel = {
  /**
   * Fetches a config value by key
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async get(key) {
    try {
      const { rows } = await pool.query('SELECT value FROM app_config WHERE key = $1', [key]);
      return rows[0] ? rows[0].value : null;
    } catch (err) {
      logger.error(`Error in AppConfigModel.get(${key})`, err);
      throw err;
    }
  },

  /**
   * Upserts a config value
   * @param {string} key
   * @param {string} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    try {
      await pool.query(
        `INSERT INTO app_config (key, value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
    } catch (err) {
      logger.error(`Error in AppConfigModel.set(${key})`, err);
      throw err;
    }
  }
};

module.exports = AppConfigModel;
