import { Router } from 'express';
import { GroceryController } from './grocery.controller';
import { authenticateJwt } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/rbac.middleware';
import { requireModule } from '../../../middleware/module.middleware';
import { validateBody } from '../../../middleware/validation.middleware';
import { createBatchSchema } from './grocery.schema';

export const groceryRouter = Router();

// Protect all grocery routes with JWT + GROCERY module check
groceryRouter.use(authenticateJwt);
groceryRouter.use(requireModule('GROCERY'));

groceryRouter.get('/batches', requirePermission('inventory.view'), GroceryController.getBatches);
groceryRouter.post('/batches', requirePermission('inventory.adjust'), validateBody(createBatchSchema), GroceryController.createBatch);
groceryRouter.get('/weigh-scale/parse/:barcode', requirePermission('sales.create'), GroceryController.parseBarcode);
