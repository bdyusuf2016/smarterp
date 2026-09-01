import { Router } from 'express';
import { ResponseUtil } from '../shared/utils/response';
import { authRouter } from '../modules/auth/auth.routes';
import { tenantsRouter } from '../modules/tenants/tenants.routes';
import { businessRouter } from '../modules/business/business.routes';
import { productsRouter } from '../modules/products/products.routes';
import { inventoryRouter } from '../modules/inventory/inventory.routes';
import { customersRouter } from '../modules/customers/customers.routes';
import { suppliersRouter } from '../modules/suppliers/suppliers.routes';
import { purchasesRouter } from '../modules/purchases/purchases.routes';
import { salesRouter } from '../modules/sales/sales.routes';
import { telecomRouter } from '../modules/plugins/telecom/telecom.routes';
import { groceryRouter } from '../modules/plugins/grocery/grocery.routes';
import { libraryRouter } from '../modules/plugins/library/library.routes';
import { accountingRouter } from '../modules/accounting/accounting.routes';
import { reportsRouter } from '../modules/reports/reports.routes';

export const rootRouter = Router();

// Health Check Endpoint (System Liveness & Readiness)
rootRouter.get('/health', (_req, res) => {
  ResponseUtil.success(
    res,
    {
      status: 'healthy',
      service: 'Dokan Manager V2 API',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    'Service is operational'
  );
});

// API v1 Router
export const apiV1Router = Router();

apiV1Router.get('/', (_req, res) => {
  ResponseUtil.success(
    res,
    {
      version: 'v1',
      description: 'Dokan Manager V2 Multi-Tenant ERP & POS API Engine',
      endpoints: {
        health: '/health',
        auth: '/api/v1/auth',
        tenants: '/api/v1/tenants',
        products: '/api/v1/products',
        inventory: '/api/v1/inventory',
        sales: '/api/v1/sales',
        purchases: '/api/v1/purchases',
        repairs: '/api/v1/repairs',
        accounting: '/api/v1/accounting',
      },
    },
    'Dokan Manager V2 API Gateway Active'
  );
});

// Mount Module Routes
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/tenants', tenantsRouter);
apiV1Router.use('/business', businessRouter);
apiV1Router.use('/products', productsRouter);
apiV1Router.use('/inventory', inventoryRouter);
apiV1Router.use('/customers', customersRouter);
apiV1Router.use('/suppliers', suppliersRouter);
apiV1Router.use('/purchases', purchasesRouter);
apiV1Router.use('/sales', salesRouter);
apiV1Router.use('/telecom', telecomRouter);
apiV1Router.use('/grocery', groceryRouter);
apiV1Router.use('/library', libraryRouter);
apiV1Router.use('/accounting', accountingRouter);
apiV1Router.use('/reports', reportsRouter);

rootRouter.use('/api/v1', apiV1Router);
