import { pgTable, varchar, timestamp, boolean, numeric, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { users } from './users';

export const customers = pgTable('customers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address').default(''),
  notes: text('notes').default(''),
  creditLimit: numeric('credit_limit', { precision: 14, scale: 2 }).notNull().default('0.00'),
  currentDue: numeric('current_due', { precision: 14, scale: 2 }).notNull().default('0.00'),
  totalPurchases: numeric('total_purchases', { precision: 14, scale: 2 }).notNull().default('0.00'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantCustomerPhoneUnique: uniqueIndex('customers_tenant_phone_unique').on(table.tenantId, table.phone),
  tenantCustomerIdx: index('customers_tenant_idx').on(table.tenantId),
  customerDueIdx: index('customers_due_idx').on(table.currentDue),
}));

export const customerTransactions = pgTable('customer_transactions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  customerId: varchar('customer_id', { length: 64 }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull().defaultNow(),
  transactionType: varchar('transaction_type', { length: 32 }).notNull(), // OPENING, SALE, PAYMENT, RETURN, ADJUSTMENT
  debit: numeric('debit', { precision: 14, scale: 2 }).notNull().default('0.00'), // Increases due (e.g. Credit Sale)
  credit: numeric('credit', { precision: 14, scale: 2 }).notNull().default('0.00'), // Decreases due (e.g. Payment / Return)
  balance: numeric('balance', { precision: 14, scale: 2 }).notNull(), // Cumulative running balance
  invoiceNo: varchar('invoice_no', { length: 64 }),
  paymentMethod: varchar('payment_method', { length: 32 }), // CASH, BKASH, NAGAD, BANK, etc.
  notes: text('notes').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  customerTransIdx: index('cust_trans_customer_idx').on(table.customerId),
  tenantCustTransIdx: index('cust_trans_tenant_idx').on(table.tenantId, table.transactionDate),
}));
