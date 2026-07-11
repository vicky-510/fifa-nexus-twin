require('dotenv').config();

const requiredEnvVars = [
  'DATABASE_URL',
  'GEMINI_API_KEY',
  'ACCESS_CODE'
];

const missingVars = [];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    missingVars.push(key);
  }
}

if (missingVars.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please configure them in your .env file or host environment before running the server.');
  process.exit(1);
}

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ACCESS_CODE: process.env.ACCESS_CODE,
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  MOCK_MODE: process.env.MOCK_MODE === 'true'
};
