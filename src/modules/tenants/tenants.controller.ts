import { Request, Response, NextFunction } from 'express';
import { TenantsService } from './tenants.service';
import { ResponseUtil } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export class TenantsController {
  /**
   * POST /api/v1/tenants/provision (Public or SuperAdmin onboarding)
   */
  public static async provision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TenantsService.createTenant(req.body);
      ResponseUtil.success(
        res,
        result,
        'Organization tenant provisioned successfully',
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/tenants/current
   */
  public static async getCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const tenant = await TenantsService.getTenant(tenantId);
      ResponseUtil.success(res, tenant, 'Tenant profile retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/tenants/current
   */
  public static async updateCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const updated = await TenantsService.updateTenant(tenantId, req.body);
      ResponseUtil.success(res, updated, 'Tenant profile updated', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/tenants/settings
   */
  public static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const settings = await TenantsService.getTenantSettings(tenantId);
      ResponseUtil.success(res, settings, 'Tenant settings retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/tenants/settings
   */
  public static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const updated = await TenantsService.updateTenantSettings(tenantId, req.body);
      ResponseUtil.success(res, updated, 'Tenant settings updated', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/tenants/branches
   */
  public static async getBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const branchList = await TenantsService.getBranches(tenantId);
      ResponseUtil.success(res, branchList, 'Branches retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/tenants/branches
   */
  public static async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const newBranch = await TenantsService.createBranch({
        ...req.body,
        tenantId,
      });

      ResponseUtil.success(res, newBranch, 'Branch created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/tenants/branches/:id
   */
  public static async updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id: branchId } = req.params;

      if (!tenantId || !branchId) {
        throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch ID or tenant context missing', 400);
      }

      const updated = await TenantsService.updateBranch(branchId, tenantId, req.body);
      ResponseUtil.success(res, updated, 'Branch updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}
