import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

describe('Tenants Module Integration Test Suite', () => {
  const app = createApp();

  describe('POST /api/v1/tenants/provision', () => {
    it('should return 400 Validation Error when payload is incomplete', async () => {
      const res = await request(app)
        .post('/api/v1/tenants/provision')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate primaryCategoryId presence during onboarding', async () => {
      const res = await request(app)
        .post('/api/v1/tenants/provision')
        .send({
          name: 'Apex Super Shop',
          code: 'APEX-01',
          ownerName: 'Shahidul Islam',
          phone: '01819000000',
          email: 'shahid@apex.bd',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Protected Tenant & Branch Routes', () => {
    it('GET /api/v1/tenants/current should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/v1/tenants/current');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('GET /api/v1/tenants/branches should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/v1/tenants/branches');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('GET /api/v1/tenants/settings should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/v1/tenants/settings');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });
  });
});
