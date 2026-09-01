import { Request, Response, NextFunction } from 'express';
import { SuppliersService } from './suppliers.service';
import { ResponseUtil } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export class SuppliersController {
  /**
   * GET /api/v1/suppliers
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const filters = req.query as any;
      const result = await SuppliersService.getSuppliers(tenantId, filters);

      ResponseUtil.paginated(
        res,
        result.items,
        result.meta.page,
        result.meta.limit,
        result.meta.totalCount,
        'Suppliers list retrieved'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/suppliers
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const supplier = await SuppliersService.createSupplier({
        ...req.body,
        tenantId,
      });

      ResponseUtil.success(res, supplier, 'Supplier created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/suppliers/:id
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier ID missing', 400);
      }

      const supplier = await SuppliersService.getSupplierById(id, tenantId);
      ResponseUtil.success(res, supplier, 'Supplier details retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/suppliers/:id
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;
      const { customFields, ...updates } = req.body;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier ID missing', 400);
      }

      const updated = await SuppliersService.updateSupplier(id, tenantId, updates, customFields);
      ResponseUtil.success(res, updated, 'Supplier updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/suppliers/:id
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier ID missing', 400);
      }

      const result = await SuppliersService.deleteSupplier(id, tenantId);
      ResponseUtil.success(res, result, 'Supplier deactivated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/suppliers/:id/pay
   */
  public static async paySupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;
      const { id } = req.params;

      if (!tenantId || !branchId || !id) {
        throw new AppError(ErrorCodes.BAD_REQUEST, 'Supplier ID and Branch context required', 400);
      }

      const result = await SuppliersService.paySupplier(
        id,
        tenantId,
        branchId,
        Number(req.body.amount),
        req.body.paymentMethod,
        req.body.notes,
        userId
      );

      ResponseUtil.success(res, result, 'Supplier payment recorded successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}
