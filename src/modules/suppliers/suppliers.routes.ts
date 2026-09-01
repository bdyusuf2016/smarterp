import { Router } from 'express';
import { SuppliersController } from './suppliers.controller';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireModule } from '../../middleware/module.middleware';
import { validateBody, validateQuery } from '../../middleware/validation.middleware';
import {
  createSupplierSchema,
  updateSupplierSchema,
  querySuppliersSchema,
  paySupplierSchema,
} from './suppliers.schema';

export const suppliersRouter = Router();

// Protect all supplier routes with JWT + SUPPLIERS module check
suppliersRouter.use(authenticateJwt);
suppliersRouter.use(requireModule('SUPPLIERS'));

suppliersRouter.get(
  '/',
  requirePermission('suppliers.view'),
  validateQuery(querySuppliersSchema),
  SuppliersController.list
);

suppliersRouter.post(
  '/',
  requirePermission('suppliers.create'),
  validateBody(createSupplierSchema),
  SuppliersController.create
);

suppliersRouter.get('/:id', requirePermission('suppliers.view'), SuppliersController.getById);

suppliersRouter.patch(
  '/:id',
  requirePermission('suppliers.update'),
  validateBody(updateSupplierSchema),
  SuppliersController.update
);

suppliersRouter.delete(
  '/:id',
  requirePermission('suppliers.delete'),
  SuppliersController.delete
);

suppliersRouter.post(
  '/:id/pay',
  requirePermission('suppliers.pay'),
  validateBody(paySupplierSchema),
  SuppliersController.paySupplier
);
