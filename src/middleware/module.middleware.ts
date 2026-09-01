import { Request, Response, NextFunction } from 'express';
import { BusinessService } from '../modules/business/business.service';
import { AppError } from '../shared/errors/app-error';
import { ErrorCodes } from '../shared/errors/error-codes';

/**
 * Middleware that guarantees an industry/platform module is enabled for the tenant
 * before allowing access to the module's routes.
 */
export function requireModule(moduleCode: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(
          ErrorCodes.TENANT_NOT_FOUND,
          'Tenant context is required to verify enabled modules',
          400
        );
      }

      const isEnabled = await BusinessService.isModuleEnabled(tenantId, moduleCode);

      if (!isEnabled) {
        throw new AppError(
          ErrorCodes.MODULE_NOT_ENABLED,
          `Module '${moduleCode}' is not enabled for your store. Please enable it in Business Settings.`,
          403,
          { module: moduleCode }
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
