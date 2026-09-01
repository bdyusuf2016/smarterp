import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { TokenService } from '../../src/modules/auth/token.service';
import { SessionService } from '../../src/modules/auth/session.service';

describe('Auth Module Integration Test Suite', () => {
  const app = createApp();
  describe('POST /api/v1/auth/login', () => {
    it('should return 400 Validation Error when body is missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 Validation Error when password is too short', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phoneOrEmail: '01711000000',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/auth/me & Protected Route Guards', () => {
    it('should return 401 Unauthorized when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('should return 401 Unauthorized when invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-value');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_TOKEN_INVALID');
    });

    it('should authenticate user and return 200 when valid JWT and active session are provided', async () => {
      // Mock session service to return active session and mock revoke
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-001',
        userId: 'user-001',
        tenantId: 'tenant-001',
        tokenHash: 'thash',
        refreshTokenHash: 'rfhash',
        ipAddress: '127.0.0.1',
        userAgent: 'Vitest Agent',
        expiresAt: new Date(Date.now() + 86400000),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.spyOn(SessionService, 'revokeSession').mockResolvedValue(undefined);

      const validToken = TokenService.generateAccessToken({
        userId: 'user-001',
        tenantId: 'tenant-001',
        branchId: 'branch-001',
        roles: ['SHOP_OWNER'],
        permissions: ['products.view', 'sales.create'],
        sessionId: 'sess-test-001',
      });

      // Test logout endpoint with this token
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loggedOut).toBe(true);
    });
  });
});
