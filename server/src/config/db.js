const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

logger.info('Initializing PostgreSQL connection pool...');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err);
});

module.exports = pool;
