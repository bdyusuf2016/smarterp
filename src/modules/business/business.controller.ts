import { Request, Response, NextFunction } from 'express';
import { BusinessService } from './business.service';
import { ResponseUtil } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export class BusinessController {
  /**
   * GET /api/v1/business/categories
   */
  public static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await BusinessService.getAllCategories();
      ResponseUtil.success(res, categories, 'Business categories retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/business/modules
   */
  public static async getModules(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const modules = await BusinessService.getAllModules();
      ResponseUtil.success(res, modules, 'Modules list retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/business/tenant-categories
   */
  public static async getTenantCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const tenantCats = await BusinessService.getTenantCategories(tenantId);
      ResponseUtil.success(res, tenantCats, 'Tenant business categories retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/business/tenant-categories
   */
  public static async enableCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { categoryId, isPrimary } = req.body;

      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const result = await BusinessService.enableTenantCategory(tenantId, categoryId, isPrimary);
      ResponseUtil.success(res, result, 'Category enabled for tenant', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/business/tenant-categories/:id
   */
  public static async disableCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id: categoryId } = req.params;

      if (!tenantId || !categoryId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant or Category ID missing', 400);
      }

      const result = await BusinessService.disableTenantCategory(tenantId, categoryId);
      ResponseUtil.success(res, result, 'Category disabled for tenant', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/business/tenant-modules
   */
  public static async getTenantModules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const enabledModules = await BusinessService.getTenantEnabledModules(tenantId);
      ResponseUtil.success(res, enabledModules, 'Tenant enabled modules retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/business/tenant-modules
   */
  public static async toggleModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { moduleId, isEnabled } = req.body;

      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const result = await BusinessService.toggleTenantModule(tenantId, moduleId, isEnabled);
      ResponseUtil.success(res, result, 'Module state updated', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/business/custom-fields
   */
  public static async getCustomFields(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const entityType = (req.query.entityType as string) || 'PRODUCT';

      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const fields = await BusinessService.getCustomFieldDefinitions(tenantId, entityType);
      ResponseUtil.success(res, fields, 'Custom fields retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/business/custom-fields
   */
  public static async createCustomField(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const newField = await BusinessService.createCustomFieldDefinition({
        ...req.body,
        tenantId,
      });

      ResponseUtil.success(res, newField, 'Custom field defined successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}
