import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { createApp } from '../../src/app';
import { requireModule } from '../../src/middleware/module.middleware';
import { BusinessService } from '../../src/modules/business/business.service';
import { errorHandler } from '../../src/middleware/error.middleware';

describe('Business Engine Integration Test Suite', () => {
  const app = createApp();

  it('GET /api/v1/business/categories should return 200 with categories list', async () => {
    vi.spyOn(BusinessService, 'getAllCategories').mockResolvedValue([
      {
        id: 'cat-telecom',
        code: 'TELECOM',
        name: 'Telecom & Mobile Shop',
        description: 'Handsets & accessories',
        icon: 'Smartphone',
        isSystem: true,
        isActive: true,
        configuration: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ]);

    const res = await request(app).get('/api/v1/business/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].code).toBe('TELECOM');
  });

  it('GET /api/v1/business/modules should return 200 with modules list', async () => {
    vi.spyOn(BusinessService, 'getAllModules').mockResolvedValue([
      {
        id: 'mod-sales',
        code: 'SALES',
        name: 'POS & Billing',
        categoryGroup: 'COMMON',
        isCore: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ]);

    const res = await request(app).get('/api/v1/business/modules');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].code).toBe('SALES');
  });

  describe('Module Guard Middleware Integration Tests', () => {
    const guardApp = express();
    guardApp.use(express.json());

    guardApp.use((req: Request, _res: Response, next) => {
      req.context = {
        requestId: 'test-mod-req',
        tenantId: 'tenant-test-001',
      };
      next();
    });

    guardApp.get('/test/imei', requireModule('IMEI'), (_req, res) => {
      res.status(200).json({ allowed: true });
    });

    guardApp.use(errorHandler);

    it('should allow access when the requested module is enabled for tenant', async () => {
      vi.spyOn(BusinessService, 'isModuleEnabled').mockResolvedValue(true);

      const res = await request(guardApp).get('/test/imei');
      expect(res.status).toBe(200);
      expect(res.body.allowed).toBe(true);
    });

    it('should deny access (403 MODULE_NOT_ENABLED) when the module is not enabled', async () => {
      vi.spyOn(BusinessService, 'isModuleEnabled').mockResolvedValue(false);

      const res = await request(guardApp).get('/test/imei');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MODULE_NOT_ENABLED');
    });
  });
});
