import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../modules/auth/token.service';
import { SessionService } from '../modules/auth/session.service';
import { AppError } from '../shared/errors/app-error';
import { ErrorCodes } from '../shared/errors/error-codes';

/**
 * Middleware that validates the Bearer JWT token from the Authorization header,
 * verifies the session state against the database, and injects user context into req.context.
 */
export async function authenticateJwt(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Authorization header missing or malformed',
        401
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(
        ErrorCodes.AUTH_UNAUTHORIZED,
        'Bearer token is missing',
        401
      );
    }

    // 1. Verify cryptographic JWT signature and expiration
    const payload = TokenService.verifyAccessToken(token);

    // 2. Validate session is still active in database (not revoked or expired)
    await SessionService.getActiveSession(payload.sessionId);

    // 3. Inject into request context
    req.context.tenantId = payload.tenantId;
    req.context.branchId = payload.branchId;
    req.context.sessionId = payload.sessionId;
    req.context.user = {
      id: payload.userId,
      tenantId: payload.tenantId,
      phone: '',
      name: '',
      roles: payload.roles,
      permissions: payload.permissions,
      branchIds: [payload.branchId],
      isSuperAdmin: payload.roles.includes('SUPER_ADMIN'),
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication middleware - does not reject if token is missing,
 * but sets context if a valid token is provided.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const payload = TokenService.verifyAccessToken(token);
    await SessionService.getActiveSession(payload.sessionId);

    req.context.tenantId = payload.tenantId;
    req.context.branchId = payload.branchId;
    req.context.sessionId = payload.sessionId;
    req.context.user = {
      id: payload.userId,
      tenantId: payload.tenantId,
      phone: '',
      name: '',
      roles: payload.roles,
      permissions: payload.permissions,
      branchIds: [payload.branchId],
      isSuperAdmin: payload.roles.includes('SUPER_ADMIN'),
    };
  } catch {
    // Silently continue without context on optional auth
  }

  next();
}
