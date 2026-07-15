process.env.DATABASE_URL = 'postgres://localhost:5432/mock_db';
process.env.GEMINI_API_KEY = 'mock_key';
process.env.ACCESS_CODE = 'FIFA2026OPS';

const request = require('supertest');
const app = require('../app');
const AuthService = require('../services/auth.service');
const pool = require('../config/db');

// Mock pg module
jest.mock('pg', () => {
  const mPool = {
    on: jest.fn(),
    query: jest.fn(),
    connect: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

const mockAccessCodeLookup = (code = 'FIFA2026OPS') => {
  pool.query.mockResolvedValueOnce({ rows: [{ value: code }] });
};

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AuthService._resetCacheForTests();
  });

  it('should return 400 if access code is missing', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Access code is required.');
  });

  it('should return 401 for an invalid access code', async () => {
    mockAccessCodeLookup();

    const res = await request(app)
      .post('/api/auth/verify')
      .send({ code: 'WRONGCODE' });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Invalid access code. Access denied.');
  });

  it('should return 200 and a token for a valid access code', async () => {
    mockAccessCodeLookup();

    const res = await request(app)
      .post('/api/auth/verify')
      .send({ code: 'FIFA2026OPS' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  it('should change the access code when authenticated and the current code matches', async () => {
    mockAccessCodeLookup();
    const verifyRes = await request(app).post('/api/auth/verify').send({ code: 'FIFA2026OPS' });
    const token = verifyRes.body.token;

    // authMiddleware + AuthService.changeCode both read the now-cached code — no extra query.
    // Only the AppConfigModel.set() upsert hits the DB.
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/auth/change-code')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentCode: 'FIFA2026OPS', newCode: 'NEWCODE123' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toContain('changed successfully');
  });

  it('should reject an access-code change with the wrong current code', async () => {
    mockAccessCodeLookup();
    const verifyRes = await request(app).post('/api/auth/verify').send({ code: 'FIFA2026OPS' });
    const token = verifyRes.body.token;

    const res = await request(app)
      .post('/api/auth/change-code')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentCode: 'WRONGCODE', newCode: 'NEWCODE123' });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Current access code is incorrect.');
  });

  it('should reject an access-code change without authentication', async () => {
    const res = await request(app)
      .post('/api/auth/change-code')
      .send({ currentCode: 'FIFA2026OPS', newCode: 'NEWCODE123' });

    expect(res.statusCode).toEqual(401);
  });

  it('should reject a new access code shorter than 6 characters', async () => {
    mockAccessCodeLookup();
    const verifyRes = await request(app).post('/api/auth/verify').send({ code: 'FIFA2026OPS' });
    const token = verifyRes.body.token;

    const res = await request(app)
      .post('/api/auth/change-code')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentCode: 'FIFA2026OPS', newCode: 'abc' });

    expect(res.statusCode).toEqual(400);
  });
});
