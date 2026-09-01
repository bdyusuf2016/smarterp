import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { requirePermission, requireRole, requireTenant, requireBranch } from '../../src/middleware/rbac.middleware';
import { errorHandler } from '../../src/middleware/error.middleware';

describe('RBAC Middleware Guard Integration Tests', () => {
  const app = express();
  app.use(express.json());

  // Test setup route with mock context injection
  app.use((req: Request, _res: Response, next) => {
    const roleHeader = (req.headers['x-mock-role'] as string) || 'CASHIER';
    const permsHeader = (req.headers['x-mock-perms'] as string) || 'sales.create,products.view';

    req.context = {
      requestId: 'test-req-id',
      tenantId: 'tenant-001',
      branchId: 'branch-001',
      sessionId: 'sess-001',
      user: {
        id: 'user-001',
        tenantId: 'tenant-001',
        phone: '01711000000',
        name: 'Test Cashier',
        roles: roleHeader.split(','),
        permissions: permsHeader.split(','),
        branchIds: ['branch-001'],
      },
    };
    next();
  });

  // Protected endpoint with permission requirement
  app.get('/test/sales', requirePermission('sales.create'), (_req, res) => {
    res.status(200).json({ allowed: true });
  });

  // Protected endpoint with missing permission requirement
  app.get('/test/admin-delete', requirePermission('tenants.delete'), (_req, res) => {
    res.status(200).json({ allowed: true });
  });

  // Protected endpoint with role requirement
  app.get('/test/owner-only', requireRole('SHOP_OWNER'), (_req, res) => {
    res.status(200).json({ allowed: true });
  });

  // Protected endpoint with tenant & branch requirement
  app.get('/test/tenant-branch', requireTenant, requireBranch, (_req, res) => {
    res.status(200).json({ valid: true });
  });

  app.use(errorHandler);

  it('should allow access when user has the required permission', async () => {
    const res = await request(app).get('/test/sales');
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(true);
  });

  it('should deny access (403) when user lacks required permission', async () => {
    const res = await request(app).get('/test/admin-delete');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
  });

  it('should bypass granular permission checks for SUPER_ADMIN role', async () => {
    const res = await request(app)
      .get('/test/admin-delete')
      .set('x-mock-role', 'SUPER_ADMIN');
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(true);
  });

  it('should allow access when user has required role', async () => {
    const res = await request(app)
      .get('/test/owner-only')
      .set('x-mock-role', 'SHOP_OWNER');
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(true);
  });

  it('should deny access when user lacks required role', async () => {
    const res = await request(app)
      .get('/test/owner-only')
      .set('x-mock-role', 'CASHIER');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
  });

  it('should validate tenant and branch presence in request context', async () => {
    const res = await request(app).get('/test/tenant-branch');
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });
});
