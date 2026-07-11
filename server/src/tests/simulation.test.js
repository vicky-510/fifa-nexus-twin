process.env.DATABASE_URL = 'postgres://localhost:5432/mock_db';
process.env.GEMINI_API_KEY = 'mock_key';
process.env.ACCESS_CODE = 'FIFA2026OPS';
process.env.MOCK_MODE = 'true'; // Force GeminiService to use static mocks

const request = require('supertest');
const app = require('../app');
const AuthService = require('../services/auth.service');
const pool = require('../config/db');
const GeminiService = require('../services/gemini.service');
const http = require('http');

// Ignore close events on request objects in testing environment to prevent premature connection drops
const originalOn = http.IncomingMessage.prototype.on;
http.IncomingMessage.prototype.on = function(event, listener) {
  if (event === 'close') {
    return this;
  }
  return originalOn.call(this, event, listener);
};

// Mock pg module
jest.mock('pg', () => {
  const mPool = {
    on: jest.fn(),
    query: jest.fn(),
    connect: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

// Mock express-rate-limit to bypass rate limiter in tests
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req, res, next) => next());
});

describe('Simulation Endpoints', () => {
  let authToken;

  beforeAll(() => {
    // Generate a valid authorization token for tests
    authToken = AuthService.verifyCode('FIFA2026OPS');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should block unauthenticated requests to simulation endpoints', async () => {
    const res = await request(app)
      .post('/api/simulation-trigger')
      .send({ scenario: 'exitSurge' });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Unauthorized');
  });

  it('should trigger a synchronous simulation successfully when authenticated', async () => {
    const mockDbRow = {
      id: 10,
      scenario: 'exitSurge',
      result: {
        navigation: 'Mock Navigation',
        crowdControl: 'Mock Barriers',
        accessibilityGuidance: 'Mock Ramp Guide',
        transportUpdates: 'Mock Transit',
        sustainability: 'Mock Energy Saving',
        operationalRecommendation: 'Mock Recommendation',
        multilingualScripts: { en: 'Mock EN', es: 'Mock ES', fr: 'Mock FR' }
      },
      created_at: new Date().toISOString()
    };

    // Mock pg query response for insertion
    pool.query.mockResolvedValueOnce({ rows: [mockDbRow] });

    const res = await request(app)
      .post('/api/simulation-trigger')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ scenario: 'exitSurge' });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id', 10);
    expect(res.body).toHaveProperty('scenario', 'exitSurge');
    expect(res.body.result).toHaveProperty('navigation');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when triggering with an invalid scenario', async () => {
    const res = await request(app)
      .post('/api/simulation-trigger')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ scenario: 'invalidScenarioName' });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Invalid or missing scenario');
  });

  it('should retrieve simulation history successfully', async () => {
    const mockHistory = [
      { id: 2, scenario: 'exitSurge', result: {}, created_at: new Date().toISOString() },
      { id: 1, scenario: 'stormInundation', result: {}, created_at: new Date().toISOString() }
    ];

    pool.query.mockResolvedValueOnce({ rows: mockHistory });

    const res = await request(app)
      .get('/api/simulation-history')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should support streaming SSE simulation trigger endpoint', async () => {
    // Mock database save query at the end of the stream
    pool.query.mockResolvedValue({ rows: [{ id: 50 }] });

    // Mock GeminiService stream generator to yield synchronously for the test
    const streamSpy = jest.spyOn(GeminiService, 'generateSimulationStream').mockImplementation(async function* (scenario) {
      yield { text: '{"navigation": "test"' };
      yield { text: '}' };
    });

    const res = await request(app)
      .post('/api/simulation-trigger/stream')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ scenario: 'exitSurge' });

    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('data:');
    
    streamSpy.mockRestore();
  });
});
