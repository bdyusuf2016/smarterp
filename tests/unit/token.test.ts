import { describe, it, expect } from 'vitest';
import { TokenService, JwtTokenPayload } from '../../src/modules/auth/token.service';

describe('TokenService Unit Tests', () => {
  const samplePayload: JwtTokenPayload = {
    userId: 'user-001',
    tenantId: 'tenant-001',
    branchId: 'branch-001',
    roles: ['SHOP_OWNER'],
    permissions: ['products.view', 'sales.create'],
    sessionId: 'sess-001',
  };

  it('should generate and verify valid JWT access tokens', () => {
    const token = TokenService.generateAccessToken(samplePayload);
    expect(token).toBeDefined();

    const decoded = TokenService.verifyAccessToken(token);
    expect(decoded.userId).toBe('user-001');
    expect(decoded.tenantId).toBe('tenant-001');
    expect(decoded.branchId).toBe('branch-001');
    expect(decoded.roles).toContain('SHOP_OWNER');
    expect(decoded.permissions).toContain('sales.create');
  });

  it('should throw error on invalid token verification', () => {
    expect(() => TokenService.verifyAccessToken('invalid.jwt.token')).toThrowError();
  });

  it('should generate paired auth tokens and hash refresh tokens', () => {
    const pair = TokenService.generateTokenPair(samplePayload);
    expect(pair.tokens.accessToken).toBeDefined();
    expect(pair.tokens.refreshToken).toBeDefined();
    expect(pair.refreshTokenHash).toBeDefined();

    const verifiedHash = TokenService.hashToken(pair.rawRefreshToken);
    expect(verifiedHash).toBe(pair.refreshTokenHash);
  });
});
