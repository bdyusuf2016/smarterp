import { pgTable, varchar, timestamp, numeric, text, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { users } from './users';

export const recharges = pgTable('recharges', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  operator: varchar('operator', { length: 32 }).notNull(), // GP, ROBI, BANGLALINK, TELETALK, BKASH, NAGAD, ROCKET
  serviceType: varchar('service_type', { length: 32 }).notNull().default('FLEXILOAD'), // FLEXILOAD, CASH_IN, CASH_OUT, BILL_PAY
  recipientPhone: varchar('recipient_phone', { length: 32 }).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  commission: numeric('commission', { precision: 14, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 32 }).notNull().default('SUCCESS'), // SUCCESS, PENDING, FAILED
  transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantRechargeIdx: index('recharges_tenant_idx').on(table.tenantId, table.transactionDate),
  operatorRechargeIdx: index('recharges_operator_idx').on(table.operator),
  phoneRechargeIdx: index('recharges_phone_idx').on(table.recipientPhone),
}));
