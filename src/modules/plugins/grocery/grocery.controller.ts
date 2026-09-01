import { Request, Response, NextFunction } from 'express';
import { GroceryService } from './grocery.service';
import { ResponseUtil } from '../../../shared/utils/response';
import { AppError } from '../../../shared/errors/app-error';
import { ErrorCodes } from '../../../shared/errors/error-codes';

export class GroceryController {
  public static async getBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const filters: any = req.query;
      if (filters.expiringDays) filters.expiringDays = Number(filters.expiringDays);

      const list = await GroceryService.getBatches(tenantId, filters);
      ResponseUtil.success(res, list, 'Product batches retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const batch = await GroceryService.createBatch({ ...req.body, tenantId, branchId });
      ResponseUtil.success(res, batch, 'Product batch registered successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  public static async parseBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { barcode } = req.params;
      if (!barcode) throw new AppError(ErrorCodes.BAD_REQUEST, 'Barcode parameter required', 400);

      const parsed = GroceryService.parseWeighScaleBarcode(barcode);
      ResponseUtil.success(res, parsed, 'Weigh-scale barcode parsed', 200);
    } catch (err) {
      next(err);
    }
  }
}
