import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { TokenService } from '../../src/modules/auth/token.service';
import { SessionService } from '../../src/modules/auth/session.service';
import { BusinessService } from '../../src/modules/business/business.service';

describe('Sales & POS Module Integration Test Suite', () => {
  const app = createApp();

  const mockToken = TokenService.generateAccessToken({
    userId: 'user-001',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    roles: ['SHOP_OWNER'],
    permissions: [
      'sales.view',
      'sales.create',
      'sales.return',
    ],
    sessionId: 'sess-test-pos',
  });

  describe('Unauthenticated & Module Gate Access', () => {
    it('GET /api/v1/sales should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/v1/sales');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('GET /api/v1/sales should reject if SALES module is not enabled for tenant (403)', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-pos',
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
        .get('/api/v1/sales')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('MODULE_NOT_ENABLED');
    });
  });

  describe('POS Checkout Validation & Parked Carts', () => {
    it('POST /api/v1/sales should return 400 Validation Error when items or payments are missing', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-pos',
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
        .post('/api/v1/sales')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          items: [],
          payments: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/sales/parked-carts should successfully hold cart for later resumption', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-pos',
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
        .post('/api/v1/sales/parked-carts')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          customerName: 'Tanvir Hossain',
          items: [
            {
              productId: 'prod-001',
              quantity: 1,
              unitPrice: 550,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customerName).toBe('Tanvir Hossain');
    });
  });
});
