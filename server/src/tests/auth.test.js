process.env.DATABASE_URL = 'postgres://localhost:5432/mock_db';
process.env.GEMINI_API_KEY = 'mock_key';
process.env.ACCESS_CODE = 'FIFA2026OPS';

const request = require('supertest');
const app = require('../app');

// Mock pg module
jest.mock('pg', () => {
  const mPool = {
    on: jest.fn(),
    query: jest.fn(),
    connect: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Auth Endpoints', () => {
  it('should return 400 if access code is missing', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({});
    
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Access code is required.');
  });

  it('should return 401 for an invalid access code', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ code: 'WRONGCODE' });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Invalid access code. Access denied.');
  });

  it('should return 200 and a token for a valid access code', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ code: 'FIFA2026OPS' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });
});
