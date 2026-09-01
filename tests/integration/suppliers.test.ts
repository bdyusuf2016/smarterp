import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { TokenService } from '../../src/modules/auth/token.service';
import { SessionService } from '../../src/modules/auth/session.service';
import { BusinessService } from '../../src/modules/business/business.service';

describe('Suppliers Module Integration Test Suite', () => {
  const app = createApp();

  const mockToken = TokenService.generateAccessToken({
    userId: 'user-001',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    roles: ['SHOP_OWNER'],
    permissions: [
      'suppliers.view',
      'suppliers.create',
      'suppliers.update',
      'suppliers.delete',
      'suppliers.pay',
    ],
    sessionId: 'sess-test-supp',
  });

  describe('Unauthenticated & Module Gate Access', () => {
    it('GET /api/v1/suppliers should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/v1/suppliers');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('GET /api/v1/suppliers should reject if SUPPLIERS module is not enabled for tenant (403)', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-supp',
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
        .get('/api/v1/suppliers')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('MODULE_NOT_ENABLED');
    });
  });

  describe('Supplier Creation & Payment Validation', () => {
    it('POST /api/v1/suppliers should return 400 Validation Error when phone is missing', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-supp',
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
        .post('/api/v1/suppliers')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 'Flora Telecom Ltd.',
          // missing phone
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/suppliers/:id/pay should return 400 when payment amount is invalid', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-supp',
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
        .post('/api/v1/suppliers/supp-001/pay')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          amount: 0,
          paymentMethod: 'BANK',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
