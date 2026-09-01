import { eq, and, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import { users, userBranchAccess } from '../../db/schema/users';
import { roles, userRoles, rolePermissions, permissions } from '../../db/schema/rbac';
import { tenants, branches } from '../../db/schema/tenants';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { PasswordService } from './password.service';
import { TokenService, JwtTokenPayload, AuthTokens } from './token.service';
import { SessionService } from './session.service';

export interface LoginParams {
  phoneOrEmail: string;
  password: string;
  tenantCode?: string;
  branchId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    status: string;
  };
  tenant: {
    id: string;
    code: string;
    name: string;
    currency: string;
    currencySymbol: string;
  };
  branch: {
    id: string;
    code: string;
    name: string;
  };
  roles: string[];
  permissions: string[];
  tokens: AuthTokens;
}

export class AuthService {
  /**
   * Authenticates a user by Phone/Email + Password and returns user profile, tenant, branch, roles, permissions, and JWT tokens.
   */
  public static async login(params: LoginParams): Promise<LoginResponse> {
    const identifier = params.phoneOrEmail.trim();

    // 1. Locate user record
    const user = (await db.query.users.findFirst({
      where: (u, { or, eq }) => or(eq(u.phone, identifier), eq(u.email, identifier)),
    })) as any;

    if (!user) {
      throw new AppError(
        ErrorCodes.AUTH_INVALID_CREDENTIALS,
        'Invalid phone number/email or password',
        401
      );
    }

    if (user.status !== 'active') {
      throw new AppError(
        ErrorCodes.USER_INACTIVE,
        `Your user account is ${user.status}. Please contact store administration.`,
        403
      );
    }

    // 2. Verify password with Argon2id
    const isPasswordValid = await PasswordService.verify(user.passwordHash, params.password);
    if (!isPasswordValid) {
      throw new AppError(
        ErrorCodes.AUTH_INVALID_CREDENTIALS,
        'Invalid phone number/email or password',
        401
      );
    }

    // 3. Fetch Tenant & Validate Tenant Status
    const tenant = (await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId),
    })) as any;

    if (!tenant) {
      throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant account not found', 404);
    }

    if (tenant.status !== 'active') {
      throw new AppError(
        ErrorCodes.TENANT_SUSPENDED,
        `Your organization subscription is ${tenant.status}. Please contact support.`,
        403
      );
    }

    // 4. Resolve Active Branch
    let targetBranchId = params.branchId;

    if (!targetBranchId) {
      const userBranch = (await db.query.userBranchAccess.findFirst({
        where: and(eq(userBranchAccess.userId, user.id), eq(userBranchAccess.isDefault, true)),
      })) as any;

      if (userBranch) {
        targetBranchId = userBranch.branchId;
      } else {
        const mainBranch = (await db.query.branches.findFirst({
          where: and(eq(branches.tenantId, tenant.id), eq(branches.isMain, true)),
        })) as any;

        if (mainBranch) {
          targetBranchId = mainBranch.id;
        } else {
          const anyBranch = (await db.query.branches.findFirst({
            where: eq(branches.tenantId, tenant.id),
          })) as any;

          if (!anyBranch) {
            throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'No branch found for tenant', 404);
          }
          targetBranchId = anyBranch.id;
        }
      }
    }

    const activeBranch = (await db.query.branches.findFirst({
      where: and(eq(branches.id, targetBranchId), eq(branches.tenantId, tenant.id)),
    })) as any;

    if (!activeBranch || !activeBranch.isActive) {
      throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Specified branch is invalid or inactive', 404);
    }

    // 5. Aggregate Roles & Permissions
    const { roleCodes, permissionCodes } = await this.getUserRolesAndPermissions(user.id);

    // 6. Create Session
    const tempSessionId = `sess-${crypto.randomUUID()}`;
    const initialPayload: JwtTokenPayload = {
      userId: user.id,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      roles: roleCodes,
      permissions: permissionCodes,
      sessionId: tempSessionId,
    };

    const { refreshTokenHash } = TokenService.generateTokenPair(initialPayload);

    const session = await SessionService.createSession({
      userId: user.id,
      tenantId: tenant.id,
      refreshTokenHash,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
    });

    const finalPayload: JwtTokenPayload = {
      ...initialPayload,
      sessionId: session.id,
    };

    const finalTokens = TokenService.generateTokenPair(finalPayload);

    await db
      .update(users)
      .set({ updatedAt: new Date() } as any)
      .where(eq(users.id, user.id));

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        status: user.status,
      },
      tenant: {
        id: tenant.id,
        code: tenant.code,
        name: tenant.name,
        currency: tenant.currency,
        currencySymbol: tenant.currencySymbol,
      },
      branch: {
        id: activeBranch.id,
        code: activeBranch.code,
        name: activeBranch.name,
      },
      roles: roleCodes,
      permissions: permissionCodes,
      tokens: finalTokens.tokens,
    };
  }

  /**
   * Refreshes access token and rotates refresh token
   */
  public static async refreshToken(
    sessionId: string,
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ tokens: AuthTokens }> {
    const session = await SessionService.getActiveSession(sessionId);

    const user = (await db.query.users.findFirst({ where: eq(users.id, session.userId) })) as any;
    if (!user || user.status !== 'active') {
      throw new AppError(ErrorCodes.USER_INACTIVE, 'User account is inactive', 403);
    }

    const { roleCodes, permissionCodes } = await this.getUserRolesAndPermissions(user.id);

    const defaultBranch = (await db.query.branches.findFirst({
      where: and(eq(branches.tenantId, session.tenantId), eq(branches.isMain, true)),
    })) as any;

    const branchId = defaultBranch?.id || '';

    const newRawRefreshToken = TokenService.generateRefreshToken();
    const newRefreshTokenHash = TokenService.hashToken(newRawRefreshToken);

    await SessionService.rotateRefreshToken(
      session.id,
      rawRefreshToken,
      newRefreshTokenHash,
      ipAddress,
      userAgent
    );

    const tokenPayload: JwtTokenPayload = {
      userId: user.id,
      tenantId: session.tenantId,
      branchId,
      roles: roleCodes,
      permissions: permissionCodes,
      sessionId: session.id,
    };

    const accessToken = TokenService.generateAccessToken(tokenPayload);

    return {
      tokens: {
        accessToken,
        refreshToken: newRawRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 15 * 60,
      },
    };
  }

  /**
   * Switches user's active branch and returns updated access token
   */
  public static async switchBranch(
    userId: string,
    tenantId: string,
    targetBranchId: string,
    sessionId: string
  ): Promise<{ branch: { id: string; code: string; name: string }; accessToken: string }> {
    const { roleCodes, permissionCodes } = await this.getUserRolesAndPermissions(userId);
    const isOwnerOrAdmin = roleCodes.includes('SUPER_ADMIN') || roleCodes.includes('SHOP_OWNER');

    if (!isOwnerOrAdmin) {
      const branchAccess = await db.query.userBranchAccess.findFirst({
        where: and(
          eq(userBranchAccess.userId, userId),
          eq(userBranchAccess.branchId, targetBranchId)
        ),
      });

      if (!branchAccess) {
        throw new AppError(
          ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
          'You do not have access to this branch',
          403
        );
      }
    }

    const targetBranch = (await db.query.branches.findFirst({
      where: and(eq(branches.id, targetBranchId), eq(branches.tenantId, tenantId)),
    })) as any;

    if (!targetBranch || !targetBranch.isActive) {
      throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Target branch not found or inactive', 404);
    }

    const newPayload: JwtTokenPayload = {
      userId,
      tenantId,
      branchId: targetBranch.id,
      roles: roleCodes,
      permissions: permissionCodes,
      sessionId,
    };

    const newAccessToken = TokenService.generateAccessToken(newPayload);

    return {
      branch: {
        id: targetBranch.id,
        code: targetBranch.code,
        name: targetBranch.name,
      },
      accessToken: newAccessToken,
    };
  }

  /**
   * Retrieves full profile information for the authenticated user
   */
  public static async getCurrentUser(userId: string, tenantId: string, branchId: string) {
    const user = (await db.query.users.findFirst({ where: eq(users.id, userId) })) as any;
    if (!user) {
      throw new AppError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404);
    }

    const tenant = (await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) })) as any;
    const branch = (await db.query.branches.findFirst({ where: eq(branches.id, branchId) })) as any;

    const { roleCodes, permissionCodes } = await this.getUserRolesAndPermissions(userId);

    const accessibleBranches = (await db.query.branches.findMany({
      where: eq(branches.tenantId, tenantId),
    })) as any[];

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
      },
      tenant: tenant ? {
        id: tenant.id,
        code: tenant.code,
        name: tenant.name,
        currency: tenant.currency,
        currencySymbol: tenant.currencySymbol,
        planType: tenant.planType,
      } : null,
      branch: branch ? {
        id: branch.id,
        code: branch.code,
        name: branch.name,
        isMain: branch.isMain,
      } : null,
      roles: roleCodes,
      permissions: permissionCodes,
      accessibleBranches: accessibleBranches.map((b) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        isMain: b.isMain,
      })),
    };
  }

  /**
   * Helper to fetch role codes and deduplicated permission codes for a user
   */
  private static async getUserRolesAndPermissions(userId: string): Promise<{
    roleCodes: string[];
    permissionCodes: string[];
  }> {
    const userRoleMappings = (await db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
    })) as any[];

    if (userRoleMappings.length === 0) {
      return { roleCodes: [], permissionCodes: [] };
    }

    const roleIds = userRoleMappings.map((ur) => ur.roleId);

    const userRolesList = (await db.query.roles.findMany({
      where: inArray(roles.id, roleIds),
    })) as any[];

    const roleCodes = userRolesList.map((r) => String(r.code));

    if (roleCodes.includes('SUPER_ADMIN') || roleCodes.includes('SHOP_OWNER')) {
      const allPerms = (await db.query.permissions.findMany()) as any[];
      return {
        roleCodes,
        permissionCodes: allPerms.map((p) => String(p.code)),
      };
    }

    const rolePermMappings = (await db.query.rolePermissions.findMany({
      where: inArray(rolePermissions.roleId, roleIds),
    })) as any[];

    if (rolePermMappings.length === 0) {
      return { roleCodes, permissionCodes: [] };
    }

    const permIds = [...new Set(rolePermMappings.map((rp) => rp.permissionId))];

    const permRecords = (await db.query.permissions.findMany({
      where: inArray(permissions.id, permIds),
    })) as any[];

    const permissionCodes = [...new Set(permRecords.map((p) => String(p.code)))];

    return {
      roleCodes,
      permissionCodes,
    };
  }
}
