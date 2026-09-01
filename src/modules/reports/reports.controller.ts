import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { ResponseUtil } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export class ReportsController {
  public static async getExecutiveSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const branchId = (req.query.branchId as string) || req.context?.branchId;
      const summary = await ReportsService.getExecutiveSummary(tenantId, branchId);
      ResponseUtil.success(res, summary, 'Executive KPI summary retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getSalesAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const analytics = await ReportsService.getSalesAnalytics(tenantId, req.query as any);
      ResponseUtil.success(res, analytics, 'Sales analytics retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getInventoryValuation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const branchId = (req.query.branchId as string) || req.context?.branchId;
      const report = await ReportsService.getInventoryValuation(tenantId, branchId);
      ResponseUtil.success(res, report, 'Inventory valuation report retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const result = await ReportsService.getAuditLogs(tenantId, req.query as any);
      ResponseUtil.paginated(res, result.items, result.meta.page, result.meta.limit, result.meta.totalCount, 'Audit logs retrieved');
    } catch (err) {
      next(err);
    }
  }
}
