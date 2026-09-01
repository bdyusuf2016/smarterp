import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { ResponseUtil } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export class InventoryController {
  /**
   * GET /api/v1/inventory/stock
   */
  public static async getStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = (req.query.branchId as string) || req.context?.branchId;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context or branchId query parameter required', 400);
      }

      const filters = req.query as any;
      const result = await InventoryService.getStockByBranch(tenantId, branchId, filters);

      ResponseUtil.paginated(
        res,
        result.items,
        result.meta.page,
        result.meta.limit,
        result.meta.totalCount,
        'Inventory stock retrieved'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/inventory/stock/low-alerts
   */
  public static async getLowStockAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = (req.query.branchId as string) || req.context?.branchId;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);
      }

      const result = await InventoryService.getLowStockAlerts(tenantId, branchId);
      ResponseUtil.success(res, result.items, 'Low stock alerts retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/inventory/adjust
   */
  public static async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);
      }

      const result = await InventoryService.adjustStock({
        ...req.body,
        tenantId,
        branchId,
        createdBy: userId,
      });

      ResponseUtil.success(res, result, 'Stock adjusted successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/inventory/transactions
   */
  public static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const filters = req.query as any;
      const result = await InventoryService.getStockTransactions(tenantId, filters);

      ResponseUtil.paginated(
        res,
        result.items,
        result.meta.page,
        result.meta.limit,
        result.meta.totalCount,
        'Stock audit transactions retrieved'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/inventory/locations
   */
  public static async getLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = (req.query.branchId as string) || req.context?.branchId;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);
      }

      const list = await InventoryService.getLocations(tenantId, branchId);
      ResponseUtil.success(res, list, 'Locations retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/inventory/locations
   */
  public static async createLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);
      }

      const newLoc = await InventoryService.createLocation(
        tenantId,
        branchId,
        req.body.name,
        req.body.code,
        req.body.isDefault
      );

      ResponseUtil.success(res, newLoc, 'Location created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/inventory/transfers
   */
  public static async getTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const list = await InventoryService.getTransfers(tenantId);
      ResponseUtil.success(res, list, 'Stock transfers retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/inventory/transfers
   */
  public static async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.user?.id;

      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const transfer = await InventoryService.createStockTransfer(
        tenantId,
        req.body.fromBranchId,
        req.body.toBranchId,
        req.body.items,
        req.body.notes,
        userId
      );

      ResponseUtil.success(res, transfer, 'Stock transfer created', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/inventory/transfers/:id/dispatch
   */
  public static async dispatchTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.user?.id || 'sys';
      const { id } = req.params;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Transfer ID missing', 400);
      }

      const updated = await InventoryService.dispatchStockTransfer(id, tenantId, userId);
      ResponseUtil.success(res, updated, 'Transfer dispatched (stock in-transit)', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/inventory/transfers/:id/receive
   */
  public static async receiveTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.user?.id || 'sys';
      const { id } = req.params;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Transfer ID missing', 400);
      }

      const updated = await InventoryService.receiveStockTransfer(id, tenantId, userId);
      ResponseUtil.success(res, updated, 'Transfer received and stock added to branch', 200);
    } catch (err) {
      next(err);
    }
  }
}
