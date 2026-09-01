import { Router } from 'express';
import { SalesController } from './sales.controller';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireModule } from '../../middleware/module.middleware';
import { validateBody, validateQuery } from '../../middleware/validation.middleware';
import {
  createSaleSchema,
  querySalesSchema,
  createSaleReturnSchema,
  parkCartSchema,
} from './sales.schema';

export const salesRouter = Router();

// Protect all sales routes with JWT + SALES module check
salesRouter.use(authenticateJwt);
salesRouter.use(requireModule('SALES'));

// Parked / Held Carts
salesRouter.get('/parked-carts', requirePermission('sales.create'), SalesController.getParkedCarts);
salesRouter.post(
  '/parked-carts',
  requirePermission('sales.create'),
  validateBody(parkCartSchema),
  SalesController.parkCart
);
salesRouter.delete('/parked-carts/:id', requirePermission('sales.create'), SalesController.deleteParkedCart);

// Sales Core & POS
salesRouter.get(
  '/',
  requirePermission('sales.view'),
  validateQuery(querySalesSchema),
  SalesController.list
);

salesRouter.post(
  '/',
  requirePermission('sales.create'),
  validateBody(createSaleSchema),
  SalesController.create
);

salesRouter.post(
  '/returns',
  requirePermission('sales.return'),
  validateBody(createSaleReturnSchema),
  SalesController.createReturn
);

salesRouter.get('/:id', requirePermission('sales.view'), SalesController.getById);
