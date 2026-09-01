import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import { sessions } from '../../db/schema/users';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { TokenService } from './token.service';

export interface CreateSessionParams {
  userId: string;
  tenantId: string;
  tokenHash?: string;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  ttlDays?: number;
}

export class SessionService {
  /**
   * Creates a new persistent user session in PostgreSQL
   */
  public static async createSession(params: CreateSessionParams) {
    const sessionId = `sess-${crypto.randomUUID()}`;
    const ttl = params.ttlDays || 7;
    const expiresAt = new Date(Date.now() + ttl * 24 * 60 * 60 * 1000);
    const tokenHash = params.tokenHash || TokenService.hashToken(sessionId);

    const [newSession] = await db
      .insert(sessions)
      .values({
        id: sessionId,
        userId: params.userId,
        tenantId: params.tenantId,
        tokenHash,
        refreshTokenHash: params.refreshTokenHash,
        userAgent: params.userAgent || '',
        ipAddress: params.ipAddress || '',
        isRevoked: false,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();

    return newSession;
  }

  /**
   * Finds an active, valid session by its ID
   */
  public static async getActiveSession(sessionId: string) {
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.id, sessionId),
        eq(sessions.isRevoked, false),
        gt(sessions.expiresAt, new Date())
      ),
    });

    if (!session) {
      throw new AppError(
        ErrorCodes.AUTH_SESSION_EXPIRED,
        'Session is invalid or has expired',
        401
      );
    }

    return session;
  }

  /**
   * Validates a refresh token against the stored hash and performs atomic rotation
   */
  public static async rotateRefreshToken(
    sessionId: string,
    rawRefreshToken: string,
    newRefreshTokenHash: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const session = await this.getActiveSession(sessionId);

    const providedHash = TokenService.hashToken(rawRefreshToken);
    if (session.refreshTokenHash !== providedHash) {
      // Possible token reuse attack - Revoke the session immediately!
      await this.revokeSession(sessionId);
      throw new AppError(
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Invalid refresh token. Session has been revoked for security.',
        401
      );
    }

    // Refresh sliding expiration (extend 7 days from now)
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [updatedSession] = await db
      .update(sessions)
      .set({
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
        ipAddress: ipAddress || session.ipAddress,
        userAgent: userAgent || session.userAgent,
      } as any)
      .where(eq(sessions.id, sessionId))
      .returning();

    return updatedSession;
  }

  /**
   * Revokes a single session (Logout)
   */
  public static async revokeSession(sessionId: string) {
    await db
      .update(sessions)
      .set({
        isRevoked: true,
        updatedAt: new Date(),
      } as any)
      .where(eq(sessions.id, sessionId));
  }

  /**
   * Revokes all active sessions for a user (Logout all devices / Password change)
   */
  public static async revokeAllUserSessions(userId: string) {
    await db
      .update(sessions)
      .set({
        isRevoked: true,
        updatedAt: new Date(),
      } as any)
      .where(and(eq(sessions.userId, userId), eq(sessions.isRevoked, false)));
  }

  /**
   * Updates last activity timestamp of a session
   */
  public static async touchSession(sessionId: string) {
    await db
      .update(sessions)
      .set({ updatedAt: new Date() } as any)
      .where(eq(sessions.id, sessionId));
  }
}
