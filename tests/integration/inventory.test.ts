import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { TokenService } from '../../src/modules/auth/token.service';
import { SessionService } from '../../src/modules/auth/session.service';
import { BusinessService } from '../../src/modules/business/business.service';

describe('Inventory Module Integration Test Suite', () => {
  const app = createApp();

  const mockToken = TokenService.generateAccessToken({
    userId: 'user-001',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    roles: ['SHOP_OWNER'],
    permissions: [
      'inventory.view',
      'inventory.adjust',
      'inventory.transfer',
      'inventory.manage_locations',
    ],
    sessionId: 'sess-test-inv',
  });

  describe('Unauthenticated & Module Gate Access', () => {
    it('GET /api/v1/inventory/stock should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/v1/inventory/stock');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('GET /api/v1/inventory/stock should reject if INVENTORY module is not enabled for tenant (403)', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-inv',
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
        .get('/api/v1/inventory/stock')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('MODULE_NOT_ENABLED');
    });
  });

  describe('Stock Adjustment & Transfer Validation', () => {
    it('POST /api/v1/inventory/adjust should return 400 Validation Error when required fields are missing', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-inv',
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
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          // missing productId, quantityDelta, transactionType
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/inventory/transfers should return 400 when items array is empty', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-inv',
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
        .post('/api/v1/inventory/transfers')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          fromBranchId: 'branch-001',
          toBranchId: 'branch-002',
          items: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
