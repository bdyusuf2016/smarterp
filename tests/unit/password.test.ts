import { describe, it, expect } from 'vitest';
import { PasswordService } from '../../src/modules/auth/password.service';

describe('PasswordService Unit Tests', () => {
  it('should hash and verify passwords using Argon2id', async () => {
    const raw = 'SuperSecret123!';
    const hash = await PasswordService.hash(raw);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const isMatch = await PasswordService.verify(hash, raw);
    expect(isMatch).toBe(true);

    const isWrongMatch = await PasswordService.verify(hash, 'WrongPassword999!');
    expect(isWrongMatch).toBe(false);
  });

  it('should enforce password strength rules', () => {
    expect(PasswordService.validateStrength('short').isValid).toBe(false);
    expect(PasswordService.validateStrength('nouppercase123').isValid).toBe(false);
    expect(PasswordService.validateStrength('NOLOWERCASE123').isValid).toBe(false);
    expect(PasswordService.validateStrength('NoNumberPass!').isValid).toBe(false);
    expect(PasswordService.validateStrength('StrongPass123!').isValid).toBe(true);
  });
});
