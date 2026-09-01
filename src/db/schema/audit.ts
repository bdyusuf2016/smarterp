import { pgTable, varchar, timestamp, jsonb, text, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants, branches } from './tenants';
import { users } from './users';

export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  userId: varchar('user_id', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 64 }).notNull(), // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VOID, REFUND, PRICE_OVERRIDE, DISCOUNT_OVERRIDE, STOCK_ADJUST, STOCK_TRANSFER, ROLE_CHANGE, PERMISSION_CHANGE, PASSWORD_CHANGE, SETTINGS_CHANGE, DAY_CLOSE, APPROVAL
  module: varchar('module', { length: 64 }).notNull(), // sales, purchases, inventory, repairs, accounting, users, auth, settings
  resource: varchar('resource', { length: 64 }).notNull(), // sale, product, device, repair_job, account, user
  resourceId: varchar('resource_id', { length: 64 }),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 64 }).default(''),
  userAgent: text('user_agent').default(''),
  requestId: varchar('request_id', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantAuditIdx: index('audit_tenant_idx').on(table.tenantId, table.createdAt),
  actionAuditIdx: index('audit_action_idx').on(table.action),
  resourceAuditIdx: index('audit_resource_idx').on(table.resource, table.resourceId),
  userAuditIdx: index('audit_user_idx').on(table.userId),
}));
