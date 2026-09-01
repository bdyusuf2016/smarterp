import { Request, Response, NextFunction } from 'express';
import { CustomersService } from './customers.service';
import { ResponseUtil } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export class CustomersController {
  /**
   * GET /api/v1/customers
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const filters = req.query as any;
      const result = await CustomersService.getCustomers(tenantId, filters);

      ResponseUtil.paginated(
        res,
        result.items,
        result.meta.page,
        result.meta.limit,
        result.meta.totalCount,
        'Customers list retrieved'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/customers
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const customer = await CustomersService.createCustomer({
        ...req.body,
        tenantId,
      });

      ResponseUtil.success(res, customer, 'Customer created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/customers/:id
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Customer ID missing', 400);
      }

      const customer = await CustomersService.getCustomerById(id, tenantId);
      ResponseUtil.success(res, customer, 'Customer details retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/customers/:id
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;
      const { customFields, ...updates } = req.body;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Customer ID missing', 400);
      }

      const updated = await CustomersService.updateCustomer(id, tenantId, updates, customFields);
      ResponseUtil.success(res, updated, 'Customer updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/customers/:id
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Customer ID missing', 400);
      }

      const result = await CustomersService.deleteCustomer(id, tenantId);
      ResponseUtil.success(res, result, 'Customer deactivated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/customers/:id/collect-due
   */
  public static async collectDue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;
      const { id } = req.params;

      if (!tenantId || !branchId || !id) {
        throw new AppError(ErrorCodes.BAD_REQUEST, 'Customer ID and Branch context required', 400);
      }

      const result = await CustomersService.collectDue(
        id,
        tenantId,
        branchId,
        Number(req.body.amount),
        req.body.paymentMethod,
        req.body.notes,
        userId
      );

      ResponseUtil.success(res, result, 'Due payment recorded successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}
