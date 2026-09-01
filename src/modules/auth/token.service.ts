import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export interface JwtTokenPayload {
  userId: string;
  tenantId: string;
  branchId: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // In seconds
}

export class TokenService {
  /**
   * Generates a signed Access Token (JWT)
   */
  public static generateAccessToken(payload: JwtTokenPayload): string {
    const secret = env.JWT_ACCESS_SECRET || 'default-access-jwt-secret-key-at-least-32-chars';
    const expiresIn = (env.JWT_ACCESS_EXPIRES || '15m') as jwt.SignOptions['expiresIn'];
    return jwt.sign(payload, secret, {
      expiresIn,
      algorithm: 'HS256',
    });
  }

  /**
   * Generates an opaque Refresh Token string
   */
  public static generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * Generates SHA-256 hash of a refresh token for safe DB storage
   */
  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates both Access Token and Refresh Token
   */
  public static generateTokenPair(payload: JwtTokenPayload): { tokens: AuthTokens; refreshTokenHash: string; rawRefreshToken: string } {
    const accessToken = this.generateAccessToken(payload);
    const rawRefreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashToken(rawRefreshToken);

    // Convert e.g. "15m" to seconds roughly for client metadata
    const expiresInSeconds = 15 * 60;

    return {
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        tokenType: 'Bearer',
        expiresIn: expiresInSeconds,
      },
      refreshTokenHash,
      rawRefreshToken,
    };
  }

  /**
   * Verifies an Access Token and returns the decoded payload
   */
  public static verifyAccessToken(token: string): JwtTokenPayload {
    try {
      const secret = env.JWT_ACCESS_SECRET || 'default-access-jwt-secret-key-at-least-32-chars';
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as JwtTokenPayload;
      return decoded;
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError(
          ErrorCodes.AUTH_TOKEN_EXPIRED,
          'Access token has expired',
          401
        );
      }
      throw new AppError(
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Invalid access token',
        401
      );
    }
  }

  /**
   * Decodes a token without verifying signature (useful for logging/debugging)
   */
  public static decodeToken(token: string): JwtTokenPayload | null {
    try {
      return jwt.decode(token) as JwtTokenPayload | null;
    } catch {
      return null;
    }
  }
}
