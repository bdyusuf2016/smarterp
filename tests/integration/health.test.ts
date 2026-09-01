import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

describe('Health & Root API Integration Tests', () => {
  const app = createApp();

  it('GET /health should return 200 with service metadata and X-Request-ID header', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.service).toBe('Dokan Manager V2 API');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/v1 should return API gateway directory', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe('v1');
  });

  it('GET /non-existent-route should return 404 with structured error envelope', async () => {
    const res = await request(app).get('/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
