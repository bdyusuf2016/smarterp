import { Request, Response, NextFunction } from 'express';
import { PurchasesService } from './purchases.service';
import { ResponseUtil } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export class PurchasesController {
  /**
   * GET /api/v1/purchases
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const filters = req.query as any;
      const result = await PurchasesService.getPurchases(tenantId, filters);

      ResponseUtil.paginated(
        res,
        result.items,
        result.meta.page,
        result.meta.limit,
        result.meta.totalCount,
        'Purchases list retrieved'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/purchases
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);
      }

      const purchase = await PurchasesService.createPurchase({
        ...req.body,
        tenantId,
        branchId,
        createdBy: userId,
      });

      ResponseUtil.success(res, purchase, 'Purchase bill created and stock inwarded successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/purchases/:id
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Purchase ID missing', 400);
      }

      const purchase = await PurchasesService.getPurchaseById(id, tenantId);
      ResponseUtil.success(res, purchase, 'Purchase details retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/purchases/returns
   */
  public static async createReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);
      }

      const returnDoc = await PurchasesService.createPurchaseReturn({
        ...req.body,
        tenantId,
        branchId,
        createdBy: userId,
      });

      ResponseUtil.success(res, returnDoc, 'Purchase return processed successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}
