import { Router } from 'express';
import { CustomersController } from './customers.controller';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireModule } from '../../middleware/module.middleware';
import { validateBody, validateQuery } from '../../middleware/validation.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  queryCustomersSchema,
  collectDueSchema,
} from './customers.schema';

export const customersRouter = Router();

// Protect all customer routes with JWT + CUSTOMERS module check
customersRouter.use(authenticateJwt);
customersRouter.use(requireModule('CUSTOMERS'));

customersRouter.get(
  '/',
  requirePermission('customers.view'),
  validateQuery(queryCustomersSchema),
  CustomersController.list
);

customersRouter.post(
  '/',
  requirePermission('customers.create'),
  validateBody(createCustomerSchema),
  CustomersController.create
);

customersRouter.get('/:id', requirePermission('customers.view'), CustomersController.getById);

customersRouter.patch(
  '/:id',
  requirePermission('customers.update'),
  validateBody(updateCustomerSchema),
  CustomersController.update
);

customersRouter.delete(
  '/:id',
  requirePermission('customers.delete'),
  CustomersController.delete
);

customersRouter.post(
  '/:id/collect-due',
  requirePermission('customers.collect_due'),
  validateBody(collectDueSchema),
  CustomersController.collectDue
);
