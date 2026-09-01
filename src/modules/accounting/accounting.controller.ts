import { Request, Response, NextFunction } from 'express';
import { AccountingService } from './accounting.service';
import { ResponseUtil } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export class AccountingController {
  // Accounts
  public static async getAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const type = req.query.type as string;
      const list = await AccountingService.getAccounts(tenantId, type);
      ResponseUtil.success(res, list, 'Chart of Accounts retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const acc = await AccountingService.createAccount({ ...req.body, tenantId, branchId });
      ResponseUtil.success(res, acc, 'Account created in Chart of Accounts', 201);
    } catch (err) {
      next(err);
    }
  }

  // Journal Entries
  public static async createJournalEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const entry = await AccountingService.createJournalEntry({
        ...req.body,
        tenantId,
        branchId,
        createdBy: userId,
      });

      ResponseUtil.success(res, entry, 'Double-entry journal entry recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  // Expenses
  public static async getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const result = await AccountingService.getExpenses(tenantId, req.query as any);
      ResponseUtil.paginated(res, result.items, result.meta.page, result.meta.limit, result.meta.totalCount, 'Expenses retrieved');
    } catch (err) {
      next(err);
    }
  }

  public static async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const exp = await AccountingService.createExpense({ ...req.body, tenantId, branchId, recordedBy: userId });
      ResponseUtil.success(res, exp, 'Expense recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  // Daily Closings
  public static async getDailyStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = (req.query.branchId as string) || req.context?.branchId;
      const businessDate = (req.query.businessDate as string) || new Date().toISOString().split('T')[0];

      if (!tenantId || !branchId) throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);

      const status = await AccountingService.getDailyClosingStatus(tenantId, branchId, businessDate);
      ResponseUtil.success(res, status, 'Daily cash closing status retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async openDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;

      if (!tenantId || !branchId) throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);

      const record = await AccountingService.openDay({ ...req.body, tenantId, branchId, userId });
      ResponseUtil.success(res, record, 'Business day opened successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  public static async closeDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;

      if (!tenantId || !branchId) throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);

      const record = await AccountingService.closeDay({ ...req.body, tenantId, branchId, userId });
      ResponseUtil.success(res, record, 'Business day closed and reconciled', 200);
    } catch (err) {
      next(err);
    }
  }

  // Reports
  public static async getTrialBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const tb = await AccountingService.getTrialBalance(tenantId);
      ResponseUtil.success(res, tb, 'Trial Balance generated', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async getIncomeStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const pnl = await AccountingService.getIncomeStatement(tenantId);
      ResponseUtil.success(res, pnl, 'Income Statement (P&L) generated', 200);
    } catch (err) {
      next(err);
    }
  }
}
