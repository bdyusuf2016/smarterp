import { pgTable, varchar, timestamp, boolean, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  phone: varchar('phone', { length: 32 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('active'), // active, inactive, suspended
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPhoneUnique: uniqueIndex('users_tenant_phone_unique').on(table.tenantId, table.phone),
  tenantIdx: index('users_tenant_idx').on(table.tenantId),
}));

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
  ipAddress: varchar('ip_address', { length: 64 }).default(''),
  userAgent: text('user_agent').default(''),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isRevoked: boolean('is_revoked').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userSessionIdx: index('sessions_user_idx').on(table.userId),
  tenantSessionIdx: index('sessions_tenant_idx').on(table.tenantId),
  refreshTokenHashIdx: index('sessions_refresh_hash_idx').on(table.refreshTokenHash),
}));

export const userBranchAccess = pgTable('user_branch_access', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userBranchUnique: uniqueIndex('uba_user_branch_unique').on(table.userId, table.branchId),
  userIdx: index('uba_user_idx').on(table.userId),
}));
