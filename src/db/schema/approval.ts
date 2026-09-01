import { pgTable, varchar, timestamp, boolean, numeric, jsonb, text, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants, branches } from './tenants';
import { roles } from './rbac';
import { users } from './users';

export const approvalPolicies = pgTable('approval_policies', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  module: varchar('module', { length: 64 }).notNull(), // sales, expenses, inventory, pricing
  action: varchar('action', { length: 64 }).notNull(), // discount, refund, price_override, stock_adjust, large_expense
  thresholdAmount: numeric('threshold_amount', { precision: 14, scale: 2 }),
  thresholdPercentage: numeric('threshold_percentage', { precision: 5, scale: 2 }),
  requiresApproval: boolean('requires_approval').notNull().default(true),
  approverRoleId: varchar('approver_role_id', { length: 64 }).references(() => roles.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPolicyIdx: index('ap_tenant_idx').on(table.tenantId, table.module, table.action),
}));

export const approvalRequests = pgTable('approval_requests', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  policyId: varchar('policy_id', { length: 64 }).references(() => approvalPolicies.id, { onDelete: 'set null' }),
  module: varchar('module', { length: 64 }).notNull(),
  action: varchar('action', { length: 64 }).notNull(),
  requestedBy: varchar('requested_by', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  requestedAmount: numeric('requested_amount', { precision: 14, scale: 2 }),
  payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
  status: varchar('status', { length: 32 }).notNull().default('PENDING'), // PENDING, APPROVED, REJECTED
  decidedBy: varchar('decided_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  decisionReason: text('decision_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantRequestIdx: index('ar_tenant_status_idx').on(table.tenantId, table.status),
  requesterIdx: index('ar_requester_idx').on(table.requestedBy),
}));
