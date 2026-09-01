import { Router } from 'express';
import { TenantsController } from './tenants.controller';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createTenantSchema,
  updateTenantSchema,
  updateSettingsSchema,
  createBranchSchema,
  updateBranchSchema,
} from './tenants.schema';

export const tenantsRouter = Router();

// Public provisioning
tenantsRouter.post('/provision', validateBody(createTenantSchema), TenantsController.provision);

// Protected routes (Tenant admin/owner context)
tenantsRouter.use(authenticateJwt);

tenantsRouter.get('/current', TenantsController.getCurrent);
tenantsRouter.patch(
  '/current',
  requirePermission('tenants.update'),
  validateBody(updateTenantSchema),
  TenantsController.updateCurrent
);

tenantsRouter.get('/settings', TenantsController.getSettings);
tenantsRouter.patch(
  '/settings',
  requirePermission('settings.update'),
  validateBody(updateSettingsSchema),
  TenantsController.updateSettings
);

tenantsRouter.get('/branches', requirePermission('branches.view'), TenantsController.getBranches);
tenantsRouter.post(
  '/branches',
  requirePermission('branches.create'),
  validateBody(createBranchSchema),
  TenantsController.createBranch
);
tenantsRouter.patch(
  '/branches/:id',
  requirePermission('branches.update'),
  validateBody(updateBranchSchema),
  TenantsController.updateBranch
);
