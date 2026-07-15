process.env.DATABASE_URL = 'postgres://localhost:5432/mock_db';
process.env.GEMINI_API_KEY = 'mock_key';
process.env.ACCESS_CODE = 'FIFA2026OPS';
process.env.MOCK_MODE = 'true';

const request = require('supertest');
const app = require('../app');
const AuthService = require('../services/auth.service');
const pool = require('../config/db');

jest.mock('pg', () => {
  const mPool = {
    on: jest.fn(),
    query: jest.fn(),
    connect: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req, res, next) => next());
});

describe('Reference Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ value: 'FIFA2026OPS' }] });
    authToken = await AuthService.verifyCode('FIFA2026OPS');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should block unauthenticated requests to reference endpoints', async () => {
    const res = await request(app).get('/api/stadiums');
    expect(res.statusCode).toEqual(401);
  });

  it('should return all 16 stadiums', async () => {
    const res = await request(app)
      .get('/api/stadiums')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(16);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('availableCrisisIds');
  });

  it('should return a single stadium by id', async () => {
    const res = await request(app)
      .get('/api/stadiums/metlife')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toBe('metlife');
  });

  it('should return 404 for an unknown stadium id', async () => {
    const res = await request(app)
      .get('/api/stadiums/nonexistent')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(404);
  });

  it('should return the full match schedule', async () => {
    const res = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should return all 12 crisis scenarios', async () => {
    const res = await request(app)
      .get('/api/scenarios')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(12);
  });

  it('should return only scenarios relevant to a given stadium', async () => {
    const res = await request(app)
      .get('/api/scenarios/metlife')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    const ids = res.body.map(s => s.id);
    expect(ids).toEqual(expect.arrayContaining(['exitSurge', 'gridlockOutage']));
    expect(ids).not.toContain('tornadoWarning');
  });

  it('should predict risk for a stadium', async () => {
    const res = await request(app)
      .post('/api/simulation-trigger/predict')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ stadiumId: 'metlife' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('risks');
    expect(res.body).toHaveProperty('reasoning');
  });

  it('should return a public simulation record without authentication', async () => {
    const row = {
      id: 7,
      scenario: 'exitSurge',
      stadium_id: 'metlife',
      severity: 'CRITICAL',
      result: { navigation: 'test' },
      created_at: new Date().toISOString(),
      timeline: []
    };
    pool.query.mockResolvedValueOnce({ rows: [row] });

    const res = await request(app).get('/api/simulation/7/public');

    expect(res.statusCode).toEqual(200);
    expect(res.body.stadiumName).toBe('MetLife Stadium');
    expect(res.body.scenarioLabel).toBe('Post-Match Exit Surge');
  });

  it('should return 404 for a public lookup of a nonexistent simulation', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/simulation/999/public');

    expect(res.statusCode).toEqual(404);
  });

  it('should escalate an existing simulation to the next severity', async () => {
    const priorRow = {
      id: 5,
      scenario: 'exitSurge',
      stadium_id: 'metlife',
      match_id: null,
      timeline: []
    };
    pool.query.mockResolvedValueOnce({ rows: [priorRow] }); // getById
    pool.query.mockResolvedValueOnce({ rows: [{ id: 6, scenario: 'crowdCrush', stadium_id: 'metlife' }] }); // insert

    const res = await request(app)
      .post('/api/simulation-trigger/escalate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ simulationId: 5 });

    expect(res.statusCode).toEqual(201);
    expect(res.body.scenario).toBe('crowdCrush');
  });
});
