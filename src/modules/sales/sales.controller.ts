import { Request, Response, NextFunction } from 'express';
import { SalesService } from './sales.service';
import { ResponseUtil } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export class SalesController {
  /**
   * GET /api/v1/sales
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const filters = req.query as any;
      const result = await SalesService.getSales(tenantId, filters);

      ResponseUtil.paginated(
        res,
        result.items,
        result.meta.page,
        result.meta.limit,
        result.meta.totalCount,
        'Sales invoices retrieved'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/sales (POS Checkout)
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;
      const userName = req.context?.user?.name;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);
      }

      const sale = await SalesService.createSale({
        ...req.body,
        tenantId,
        branchId,
        cashierId: userId,
        cashierName: userName,
      });

      ResponseUtil.success(res, sale, 'Sale completed and invoice generated successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/sales/:id
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Sale ID missing', 400);
      }

      const sale = await SalesService.getSaleById(id, tenantId);
      ResponseUtil.success(res, sale, 'Sale invoice details retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/sales/returns
   */
  public static async createReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);
      }

      const returnDoc = await SalesService.createSaleReturn({
        ...req.body,
        tenantId,
        branchId,
        createdBy: userId,
      });

      ResponseUtil.success(res, returnDoc, 'Sale return processed successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // HELD / PARKED CARTS
  // ==========================================

  public static async getParkedCarts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = (req.query.branchId as string) || req.context?.branchId;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);
      }

      const carts = SalesService.getParkedCarts(tenantId, branchId);
      ResponseUtil.success(res, carts, 'Parked carts retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async parkCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);
      }

      const cart = SalesService.parkCart(tenantId, branchId, req.body);
      ResponseUtil.success(res, cart, 'Cart parked successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteParkedCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Cart ID missing', 400);
      }

      const deleted = SalesService.deleteParkedCart(id, tenantId);
      ResponseUtil.success(res, { deleted }, 'Parked cart removed', 200);
    } catch (err) {
      next(err);
    }
  }
}
