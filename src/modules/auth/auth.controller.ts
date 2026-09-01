import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { ResponseUtil } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { PasswordService } from './password.service';
import { db } from '../../config/database';
import { users } from '../../db/schema/users';
import { eq } from 'drizzle-orm';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneOrEmail, password, tenantCode, branchId } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const result = await AuthService.login({
        phoneOrEmail,
        password,
        tenantCode,
        branchId,
        ipAddress,
        userAgent,
      });

      ResponseUtil.success(
        res,
        result,
        'User authenticated successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, refreshToken } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const result = await AuthService.refreshToken(sessionId, refreshToken, ipAddress, userAgent);

      ResponseUtil.success(
        res,
        result,
        'Token refreshed successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.context?.sessionId;
      if (sessionId) {
        await SessionService.revokeSession(sessionId);
      }

      ResponseUtil.success(
        res,
        { loggedOut: true },
        'Logged out successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/logout-all
   */
  public static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.context?.user?.id;
      if (userId) {
        await SessionService.revokeAllUserSessions(userId);
      }

      ResponseUtil.success(
        res,
        { loggedOutAll: true },
        'Logged out from all active devices successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext = req.context?.user;
      if (!userContext) {
        throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, 'Authentication required', 401);
      }

      const tenantId = req.context?.tenantId || userContext.tenantId;
      const branchId = req.context?.branchId || userContext.branchIds[0] || '';

      const profile = await AuthService.getCurrentUser(userContext.id, tenantId, branchId);

      ResponseUtil.success(
        res,
        profile,
        'User profile retrieved successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/switch-branch
   */
  public static async switchBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext = req.context?.user;
      const sessionId = req.context?.sessionId;
      const tenantId = req.context?.tenantId;
      const { branchId: targetBranchId } = req.body;

      if (!userContext || !sessionId || !tenantId) {
        throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, 'Authentication required', 401);
      }

      const result = await AuthService.switchBranch(
        userContext.id,
        tenantId,
        targetBranchId,
        sessionId
      );

      ResponseUtil.success(
        res,
        result,
        'Active branch switched successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/change-password
   */
  public static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.context?.user?.id;
      if (!userId) {
        throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, 'Authentication required', 401);
      }

      const { currentPassword, newPassword } = req.body;

      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!user) {
        throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404);
      }

      const isCurrentValid = await PasswordService.verify(user.passwordHash, currentPassword);
      if (!isCurrentValid) {
        throw new AppError(
          ErrorCodes.AUTH_INVALID_CREDENTIALS,
          'Current password does not match',
          400
        );
      }

      const newPasswordHash = await PasswordService.hash(newPassword);

      await db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, userId));

      // Revoke all sessions to force re-login
      await SessionService.revokeAllUserSessions(userId);

      ResponseUtil.success(
        res,
        { changed: true },
        'Password changed successfully. Please log in again with your new password.',
        200
      );
    } catch (err) {
      next(err);
    }
  }
}
