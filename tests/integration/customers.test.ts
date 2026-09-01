import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { TokenService } from '../../src/modules/auth/token.service';
import { SessionService } from '../../src/modules/auth/session.service';
import { BusinessService } from '../../src/modules/business/business.service';

describe('Customers Module Integration Test Suite', () => {
  const app = createApp();

  const mockToken = TokenService.generateAccessToken({
    userId: 'user-001',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    roles: ['SHOP_OWNER'],
    permissions: [
      'customers.view',
      'customers.create',
      'customers.update',
      'customers.delete',
      'customers.collect_due',
    ],
    sessionId: 'sess-test-cust',
  });

  describe('Unauthenticated & Module Gate Access', () => {
    it('GET /api/v1/customers should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/v1/customers');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('GET /api/v1/customers should reject if CUSTOMERS module is not enabled for tenant (403)', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-cust',
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
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('MODULE_NOT_ENABLED');
    });
  });

  describe('Customer Creation & Due Collection Validation', () => {
    it('POST /api/v1/customers should return 400 Validation Error when phone is missing', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-cust',
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
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 'Rahim Uddin',
          // missing phone
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/customers/:id/collect-due should return 400 when amount is not positive', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-cust',
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
        .post('/api/v1/customers/cust-001/collect-due')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          amount: -500,
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
