import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireModule } from '../../middleware/module.middleware';
import { validateBody, validateQuery } from '../../middleware/validation.middleware';
import {
  createLocationSchema,
  adjustStockSchema,
  queryStockSchema,
  queryTransactionsSchema,
  createTransferSchema,
} from './inventory.schema';

export const inventoryRouter = Router();

// Protect all inventory routes with JWT + INVENTORY module check
inventoryRouter.use(authenticateJwt);
inventoryRouter.use(requireModule('INVENTORY'));

// Stock Inquiry & Low Stock Alerts
inventoryRouter.get(
  '/stock',
  requirePermission('inventory.view'),
  validateQuery(queryStockSchema),
  InventoryController.getStock
);

inventoryRouter.get(
  '/stock/low-alerts',
  requirePermission('inventory.view'),
  InventoryController.getLowStockAlerts
);

// Stock Adjustments
inventoryRouter.post(
  '/adjust',
  requirePermission('inventory.adjust'),
  validateBody(adjustStockSchema),
  InventoryController.adjustStock
);

// Immutable Transaction Audit Ledger
inventoryRouter.get(
  '/transactions',
  requirePermission('inventory.view'),
  validateQuery(queryTransactionsSchema),
  InventoryController.getTransactions
);

// Storage Locations
inventoryRouter.get(
  '/locations',
  requirePermission('inventory.view'),
  InventoryController.getLocations
);

inventoryRouter.post(
  '/locations',
  requirePermission('inventory.manage_locations'),
  validateBody(createLocationSchema),
  InventoryController.createLocation
);

// Stock Transfers
inventoryRouter.get(
  '/transfers',
  requirePermission('inventory.transfer'),
  InventoryController.getTransfers
);

inventoryRouter.post(
  '/transfers',
  requirePermission('inventory.transfer'),
  validateBody(createTransferSchema),
  InventoryController.createTransfer
);

inventoryRouter.post(
  '/transfers/:id/dispatch',
  requirePermission('inventory.transfer'),
  InventoryController.dispatchTransfer
);

inventoryRouter.post(
  '/transfers/:id/receive',
  requirePermission('inventory.transfer'),
  InventoryController.receiveTransfer
);
