import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { TokenService } from '../../src/modules/auth/token.service';
import { SessionService } from '../../src/modules/auth/session.service';
import { ReportsService } from '../../src/modules/reports/reports.service';

describe('Reports & Analytics Integration Test Suite', () => {
  const app = createApp();

  const mockToken = TokenService.generateAccessToken({
    userId: 'user-001',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    roles: ['SHOP_OWNER'],
    permissions: ['reports.view'],
    sessionId: 'sess-test-rep',
  });

  describe('Unauthenticated & Access Guard', () => {
    it('GET /api/v1/reports/dashboard/summary should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/v1/reports/dashboard/summary');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('GET /api/v1/reports/dashboard/summary should return 200 with dashboard metrics for authenticated manager', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-rep',
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

      vi.spyOn(ReportsService, 'getExecutiveSummary').mockResolvedValue({
        today: {
          totalInvoices: 24,
          totalRevenue: 54000,
          totalPaid: 48000,
          totalDue: 6000,
          cogs: 41000,
          grossProfit: 13000,
        },
        partyBalances: {
          totalCustomers: 120,
          totalCustomerDues: 34500,
          totalSuppliers: 15,
          totalSupplierPayables: 68000,
        },
        inventoryHealth: {
          totalStockedProducts: 340,
          lowStockCount: 4,
          outOfStockCount: 1,
        },
      });

      const res = await request(app)
        .get('/api/v1/reports/dashboard/summary')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.today.grossProfit).toBe(13000);
      expect(res.body.data.partyBalances.totalCustomerDues).toBe(34500);
    });

    it('GET /api/v1/reports/inventory-valuation should return 200 with stock valuations', async () => {
      vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
        id: 'sess-test-rep',
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

      vi.spyOn(ReportsService, 'getInventoryValuation').mockResolvedValue({
        summary: {
          totalUniqueProducts: 50,
          totalCostValuation: 250000,
          totalRetailValuation: 320000,
          potentialGrossProfit: 70000,
        },
        items: [],
      });

      const res = await request(app)
        .get('/api/v1/reports/inventory-valuation')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.potentialGrossProfit).toBe(70000);
    });
  });
});
