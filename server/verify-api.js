const assert = require('assert');
const logger = require('./src/utils/logger');
const AuthService = require('./src/services/auth.service');
const GeminiService = require('./src/services/gemini.service');
const validateScenario = require('./src/middleware/validateScenario.middleware');

async function testAuthService() {
  logger.info('--- Testing AuthService ---');
  const code = 'FIFA2026OPS';
  
  // Test code verification
  const token = AuthService.verifyCode(code);
  assert.ok(token, 'Should generate a token for valid access code');
  logger.info('Token generated successfully.');

  // Test token validation
  const isValid = AuthService.verifyToken(token);
  assert.strictEqual(isValid, true, 'Token should be verified as valid');
  logger.info('Token verified successfully.');

  // Test invalid token
  const isInvalid = AuthService.verifyToken('invalid-base64-token-signature');
  assert.strictEqual(isInvalid, false, 'Invalid token should return false');
  logger.info('Invalid token rejected successfully.');
}

async function testGeminiService() {
  logger.info('--- Testing GeminiService (MOCK_MODE) ---');
  
  // Test exitSurge scenario
  const exitSurgeRes = await GeminiService.generateSimulation('exitSurge');
  assert.ok(exitSurgeRes, 'Should return a simulation result object');
  assert.ok(exitSurgeRes.navigation, 'Result should have navigation');
  assert.ok(exitSurgeRes.crowdControl, 'Result should have crowdControl');
  assert.ok(exitSurgeRes.multilingualScripts.en, 'Result should have english scripts');
  logger.info('Mock ExitSurge scenario checked.');

  // Test streaming generator under mock
  logger.info('Testing Streaming Generator chunks...');
  const stream = await GeminiService.generateSimulationStream('stormInundation');
  let accumulated = '';
  for await (const chunk of stream) {
    accumulated += chunk.text;
  }
  const parsedStream = JSON.parse(accumulated);
  assert.ok(parsedStream.navigation, 'Streamed result should have navigation');
  assert.ok(parsedStream.operationalRecommendation, 'Streamed result should have recommendation');
  logger.info('Mock Streaming scenario checked and parsed successfully.');
}

async function testScenarioMiddleware() {
  logger.info('--- Testing Scenario Middleware ---');
  
  // Test whitelist POST validation
  const mockReqPostOk = { method: 'POST', body: { scenario: 'exitSurge' } };
  const mockRes = {
    status: (code) => {
      return {
        json: (payload) => {
          throw new Error(`Should not fail! Code ${code}: ${JSON.stringify(payload)}`);
        }
      }
    }
  };
  
  let nextCalled = false;
  validateScenario(mockReqPostOk, mockRes, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, 'Whitelisted scenario should pass validation');

  // Test invalid POST scenario validation
  const mockReqPostBad = { method: 'POST', body: { scenario: 'invalidScenario' } };
  let errCode = 0;
  const mockResFail = {
    status: (code) => {
      errCode = code;
      return {
        json: (payload) => {
          return payload;
        }
      }
    }
  };
  
  validateScenario(mockReqPostBad, mockResFail, () => {
    throw new Error('Should not call next() on invalid scenario');
  });
  assert.strictEqual(errCode, 400, 'Invalid scenario should return 400 Bad Request');
  logger.info('Scenario validation middleware verified successfully.');
}

async function main() {
  try {
    logger.info('=== STARTING BACKEND COMPONENT VERIFICATION ===');
    await testAuthService();
    await testGeminiService();
    await testScenarioMiddleware();
    logger.info('=== ALL BACKEND COMPONENT TESTS PASSED SUCCESFULLY ===');
  } catch (err) {
    logger.error('Verification failed', err);
    process.exit(1);
  }
}

main();
