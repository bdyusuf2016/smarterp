import { Router } from 'express';
import { PurchasesController } from './purchases.controller';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireModule } from '../../middleware/module.middleware';
import { validateBody, validateQuery } from '../../middleware/validation.middleware';
import {
  createPurchaseSchema,
  queryPurchasesSchema,
  createPurchaseReturnSchema,
} from './purchases.schema';

export const purchasesRouter = Router();

// Protect all purchase routes with JWT + PURCHASES module check
purchasesRouter.use(authenticateJwt);
purchasesRouter.use(requireModule('PURCHASES'));

purchasesRouter.get(
  '/',
  requirePermission('purchases.view'),
  validateQuery(queryPurchasesSchema),
  PurchasesController.list
);

purchasesRouter.post(
  '/',
  requirePermission('purchases.create'),
  validateBody(createPurchaseSchema),
  PurchasesController.create
);

purchasesRouter.post(
  '/returns',
  requirePermission('purchases.return'),
  validateBody(createPurchaseReturnSchema),
  PurchasesController.createReturn
);

purchasesRouter.get('/:id', requirePermission('purchases.view'), PurchasesController.getById);
