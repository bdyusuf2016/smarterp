import { z } from 'zod';

export const loginSchema = z.object({
  phoneOrEmail: z.string().min(3, 'Phone number or email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenantCode: z.string().optional(),
  branchId: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Valid refresh token is required'),
  sessionId: z.string().min(5, 'Session ID is required'),
});

export const switchBranchSchema = z.object({
  branchId: z.string().min(1, 'Target branch ID is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type SwitchBranchInput = z.infer<typeof switchBranchSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
