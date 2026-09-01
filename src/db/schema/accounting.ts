import { pgTable, varchar, timestamp, boolean, numeric, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { users } from './users';

export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  code: varchar('code', { length: 32 }).notNull(), // 1000 (Cash), 1010 (bKash), 1020 (Nagad), 1030 (Bank), 1100 (AR), 1200 (Inventory), 2000 (AP), 4000 (Sales), 5000 (COGS), 6000 (Expense)
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 32 }).notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  isSystem: boolean('is_system').notNull().default(false),
  isBank: boolean('is_bank').notNull().default(false),
  isMfs: boolean('is_mfs').notNull().default(false),
  currentBalance: numeric('current_balance', { precision: 14, scale: 2 }).notNull().default('0.00'),
  currency: varchar('currency', { length: 16 }).notNull().default('BDT'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantAccountCodeUnique: uniqueIndex('accounts_tenant_code_unique').on(table.tenantId, table.code),
  tenantAccountIdx: index('accounts_tenant_idx').on(table.tenantId),
  accountTypeIdx: index('accounts_type_idx').on(table.type),
}));

export const journalEntries = pgTable('journal_entries', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  entryNo: varchar('entry_no', { length: 64 }).notNull(),
  entryDate: timestamp('entry_date', { withTimezone: true }).notNull().defaultNow(),
  referenceType: varchar('reference_type', { length: 32 }).notNull(), // SALE, PURCHASE, EXPENSE, RECHARGE, REPAIR, TRADE_IN, DAY_CLOSE, MANUAL
  referenceId: varchar('reference_id', { length: 64 }),
  totalDebit: numeric('total_debit', { precision: 14, scale: 2 }).notNull(),
  totalCredit: numeric('total_credit', { precision: 14, scale: 2 }).notNull(),
  isBalanced: boolean('is_balanced').notNull().default(true),
  notes: text('notes').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantJournalNoUnique: uniqueIndex('je_tenant_entry_no_unique').on(table.tenantId, table.entryNo),
  tenantJournalDateIdx: index('je_tenant_date_idx').on(table.tenantId, table.entryDate),
  journalRefIdx: index('je_reference_idx').on(table.referenceType, table.referenceId),
}));

export const journalEntryLines = pgTable('journal_entry_lines', {
  id: varchar('id', { length: 64 }).primaryKey(),
  journalEntryId: varchar('journal_entry_id', { length: 64 }).notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  accountId: varchar('account_id', { length: 64 }).notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  debit: numeric('debit', { precision: 14, scale: 2 }).notNull().default('0.00'),
  credit: numeric('credit', { precision: 14, scale: 2 }).notNull().default('0.00'),
  description: text('description').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  journalLineEntryIdx: index('jel_entry_idx').on(table.journalEntryId),
  journalLineAccountIdx: index('jel_account_idx').on(table.accountId),
}));

export const expenses = pgTable('expenses', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  expenseCategory: varchar('expense_category', { length: 64 }).notNull(), // Rent, Electricity, Salaries, Refreshment, Maintenance, Internet, Other
  title: varchar('title', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 32 }).notNull().default('CASH'),
  accountId: varchar('account_id', { length: 64 }).references(() => accounts.id, { onDelete: 'set null' }),
  expenseDate: timestamp('expense_date', { withTimezone: true }).notNull().defaultNow(),
  invoiceNo: varchar('invoice_no', { length: 64 }),
  notes: text('notes').default(''),
  recordedBy: varchar('recorded_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantExpenseIdx: index('expenses_tenant_idx').on(table.tenantId, table.expenseDate),
  expenseCategoryIdx: index('expenses_category_idx').on(table.expenseCategory),
}));

export const dailyClosings = pgTable('daily_closings', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  businessDate: varchar('business_date', { length: 16 }).notNull(), // YYYY-MM-DD
  openingCash: numeric('opening_cash', { precision: 14, scale: 2 }).notNull().default('0.00'),
  cashSales: numeric('cash_sales', { precision: 14, scale: 2 }).notNull().default('0.00'),
  cashReceived: numeric('cash_received', { precision: 14, scale: 2 }).notNull().default('0.00'), // Dues collected, etc.
  cashExpenses: numeric('cash_expenses', { precision: 14, scale: 2 }).notNull().default('0.00'),
  expectedCash: numeric('expected_cash', { precision: 14, scale: 2 }).notNull().default('0.00'),
  actualCash: numeric('actual_cash', { precision: 14, scale: 2 }).notNull().default('0.00'),
  difference: numeric('difference', { precision: 14, scale: 2 }).notNull().default('0.00'), // actualCash - expectedCash (shortage/surplus)
  status: varchar('status', { length: 32 }).notNull().default('OPEN'), // OPEN, CLOSED
  closedBy: varchar('closed_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  reopenReason: text('reopen_reason'),
  reopenedBy: varchar('reopened_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  reopenedAt: timestamp('reopened_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantDateBranchUnique: uniqueIndex('dc_tenant_branch_date_unique').on(table.tenantId, table.branchId, table.businessDate),
  tenantClosingIdx: index('dc_tenant_date_idx').on(table.tenantId, table.businessDate),
}));
