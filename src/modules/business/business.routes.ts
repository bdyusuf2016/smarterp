import { Router } from 'express';
import { BusinessController } from './business.controller';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import {
  enableCategorySchema,
  toggleModuleSchema,
  createCustomFieldSchema,
} from './business.schema';

export const businessRouter = Router();

// Public metadata catalogs
businessRouter.get('/categories', BusinessController.getCategories);
businessRouter.get('/modules', BusinessController.getModules);

// Protected Tenant-specific management
businessRouter.use(authenticateJwt);

businessRouter.get('/tenant-categories', BusinessController.getTenantCategories);
businessRouter.post(
  '/tenant-categories',
  requirePermission('settings.update'),
  validateBody(enableCategorySchema),
  BusinessController.enableCategory
);
businessRouter.delete(
  '/tenant-categories/:id',
  requirePermission('settings.update'),
  BusinessController.disableCategory
);

businessRouter.get('/tenant-modules', BusinessController.getTenantModules);
businessRouter.patch(
  '/tenant-modules',
  requirePermission('settings.update'),
  validateBody(toggleModuleSchema),
  BusinessController.toggleModule
);

businessRouter.get('/custom-fields', BusinessController.getCustomFields);
businessRouter.post(
  '/custom-fields',
  requirePermission('settings.update'),
  validateBody(createCustomFieldSchema),
  BusinessController.createCustomField
);
