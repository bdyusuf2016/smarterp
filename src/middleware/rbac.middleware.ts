import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error';
import { ErrorCodes } from '../shared/errors/error-codes';

export interface PermissionOptions {
  requireAll?: boolean;
}

/**
 * Middleware that guards a route by requiring one or more specific permissions.
 * SUPER_ADMIN and SHOP_OWNER roles bypass granular permission checks automatically.
 */
export function requirePermission(
  requiredPermissions: string | string[],
  options: PermissionOptions = {}
) {
  const permList = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.context?.user;

    if (!user) {
      return next(
        new AppError(
          ErrorCodes.AUTH_UNAUTHORIZED,
          'Authentication required to access this resource',
          401
        )
      );
    }

    // Super Admin and Shop Owner have all permissions
    if (user.roles.includes('SUPER_ADMIN') || user.roles.includes('SHOP_OWNER')) {
      return next();
    }

    const userPerms = new Set(user.permissions || []);

    const hasAccess = options.requireAll
      ? permList.every((perm) => userPerms.has(perm))
      : permList.some((perm) => userPerms.has(perm));

    if (!hasAccess) {
      return next(
        new AppError(
          ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
          `Access denied. Missing required permission: ${permList.join(', ')}`,
          403,
          { requiredPermissions: permList }
        )
      );
    }

    next();
  };
}

/**
 * Middleware that guards a route by requiring one or more specific roles.
 */
export function requireRole(requiredRoles: string | string[]) {
  const roleList = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.context?.user;

    if (!user) {
      return next(
        new AppError(
          ErrorCodes.AUTH_UNAUTHORIZED,
          'Authentication required to access this resource',
          401
        )
      );
    }

    if (user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    const userRoles = new Set(user.roles || []);
    const hasRole = roleList.some((role) => userRoles.has(role));

    if (!hasRole) {
      return next(
        new AppError(
          ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
          `Access denied. Requires one of roles: ${roleList.join(', ')}`,
          403,
          { requiredRoles: roleList }
        )
      );
    }

    next();
  };
}

/**
 * Middleware ensuring a valid Tenant ID is attached to the request context
 */
export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.context?.tenantId) {
    return next(
      new AppError(
        ErrorCodes.TENANT_NOT_FOUND,
        'Tenant context is missing from request',
        400
      )
    );
  }
  next();
}

/**
 * Middleware ensuring a valid Branch ID is attached to the request context
 */
export function requireBranch(req: Request, _res: Response, next: NextFunction): void {
  if (!req.context?.branchId) {
    return next(
      new AppError(
        ErrorCodes.BRANCH_NOT_FOUND,
        'Branch context is missing from request',
        400
      )
    );
  }
  next();
}
