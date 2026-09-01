import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { TokenService } from '../../src/modules/auth/token.service';
import { SessionService } from '../../src/modules/auth/session.service';
import { BusinessService } from '../../src/modules/business/business.service';

describe('Purchases Module Integration Test Suite', () => {
  const app = createApp();

  const mockToken = TokenService.generateAccessToken({
    userId: 'user-001',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    roles: ['SHOP_OWNER'],
    permissions: [
      'purchases.view',
      'purchases.create',
      'purchases.return',
    ],
    sessionId: 'sess-test-pur',
  });

  describe('Unauthenticated & Module Gate Access', () => {
    it('GET /api/v1/purchases should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/v1/purchases');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('GET /api/v1/purchases should reject if PURCHASES module is not enabled for tenant (403)', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-pur',
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

      vi.spyOn(BusinessService, 'isModuleEnabled').mockResolvedValue(false);

      const res = await request(app)
        .get('/api/v1/purchases')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('MODULE_NOT_ENABLED');
    });
  });

  describe('Purchase Creation & Return Validation', () => {
    it('POST /api/v1/purchases should return 400 Validation Error when items array is empty', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-pur',
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

      vi.spyOn(BusinessService, 'isModuleEnabled').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/purchases')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          supplierId: 'supp-001',
          items: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/purchases/returns should return 400 when supplierId is missing', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-pur',
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

      vi.spyOn(BusinessService, 'isModuleEnabled').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/purchases/returns')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          items: [
            {
              productId: 'prod-001',
              quantity: 2,
              unitPrice: 1500,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
