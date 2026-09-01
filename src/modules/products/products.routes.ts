import { Router } from 'express';
import { ProductsController } from './products.controller';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireModule } from '../../middleware/module.middleware';
import { validateBody, validateQuery } from '../../middleware/validation.middleware';
import {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema,
  createCategorySchema,
  createBrandSchema,
  createUnitSchema,
} from './products.schema';

export const productsRouter = Router();

// Protect all product endpoints with JWT + Module Enablement Check
productsRouter.use(authenticateJwt);
productsRouter.use(requireModule('PRODUCTS'));

// Categories, Brands, Units sub-routes
productsRouter.get('/categories', requirePermission('products.view'), ProductsController.getCategories);
productsRouter.post(
  '/categories',
  requirePermission('products.create'),
  validateBody(createCategorySchema),
  ProductsController.createCategory
);

productsRouter.get('/brands', requirePermission('products.view'), ProductsController.getBrands);
productsRouter.post(
  '/brands',
  requirePermission('products.create'),
  validateBody(createBrandSchema),
  ProductsController.createBrand
);

productsRouter.get('/units', requirePermission('products.view'), ProductsController.getUnits);
productsRouter.post(
  '/units',
  requirePermission('products.create'),
  validateBody(createUnitSchema),
  ProductsController.createUnit
);

// Barcode scanner lookup (High priority POS route)
productsRouter.get('/scan/:code', requirePermission('products.view'), ProductsController.scanBarcode);

// Products Core CRUD
productsRouter.get(
  '/',
  requirePermission('products.view'),
  validateQuery(queryProductsSchema),
  ProductsController.list
);

productsRouter.post(
  '/',
  requirePermission('products.create'),
  validateBody(createProductSchema),
  ProductsController.create
);

productsRouter.get('/:id', requirePermission('products.view'), ProductsController.getById);

productsRouter.patch(
  '/:id',
  requirePermission('products.update'),
  validateBody(updateProductSchema),
  ProductsController.update
);

productsRouter.delete(
  '/:id',
  requirePermission('products.delete'),
  ProductsController.delete
);
