import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateQuery } from '../../middleware/validation.middleware';
import {
  queryExecutiveSummarySchema,
  querySalesAnalyticsSchema,
  queryInventoryValuationSchema,
  queryAuditLogsSchema,
} from './reports.schema';

export const reportsRouter = Router();

reportsRouter.use(authenticateJwt);

reportsRouter.get(
  '/dashboard/summary',
  requirePermission('reports.view'),
  validateQuery(queryExecutiveSummarySchema),
  ReportsController.getExecutiveSummary
);

reportsRouter.get(
  '/sales-analytics',
  requirePermission('reports.view'),
  validateQuery(querySalesAnalyticsSchema),
  ReportsController.getSalesAnalytics
);

reportsRouter.get(
  '/inventory-valuation',
  requirePermission('reports.view'),
  validateQuery(queryInventoryValuationSchema),
  ReportsController.getInventoryValuation
);

reportsRouter.get(
  '/audit-logs',
  requirePermission('reports.view'),
  validateQuery(queryAuditLogsSchema),
  ReportsController.getAuditLogs
);
