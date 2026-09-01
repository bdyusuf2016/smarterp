import { pgTable, varchar, timestamp, boolean, numeric, jsonb, text, integer, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const tenants = pgTable('tenants', {
  id: varchar('id', { length: 64 }).primaryKey(),
  code: varchar('code', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerName: varchar('owner_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }).notNull(),
  currency: varchar('currency', { length: 16 }).notNull().default('BDT'),
  currencySymbol: varchar('currency_symbol', { length: 8 }).notNull().default('৳'),
  address: text('address').default(''),
  status: varchar('status', { length: 32 }).notNull().default('active'), // active, suspended, expired
  planType: varchar('plan_type', { length: 32 }).notNull().default('pro'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  codeIdx: index('tenants_code_idx').on(table.code),
  statusIdx: index('tenants_status_idx').on(table.status),
}));

export const branches = pgTable('branches', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 32 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }).default(''),
  email: varchar('email', { length: 255 }).default(''),
  address: text('address').default(''),
  isMain: boolean('is_main').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantBranchCodeUnique: uniqueIndex('branches_tenant_code_unique').on(table.tenantId, table.code),
  tenantIdx: index('branches_tenant_idx').on(table.tenantId),
}));

export const tenantSettings = pgTable('tenant_settings', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  receiptHeader: text('receipt_header').default(''),
  receiptFooter: text('receipt_footer').default('Thank you for shopping with us!'),
  defaultTaxRate: numeric('default_tax_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
  defaultWarrantyMonths: integer('default_warranty_months').notNull().default(12),
  allowNegativeInventory: boolean('allow_negative_inventory').notNull().default(false),
  autoFocusScanner: boolean('auto_focus_scanner').notNull().default(true),
  theme: varchar('theme', { length: 32 }).notNull().default('dark'),
  language: varchar('language', { length: 8 }).notNull().default('bn'),
  customJson: jsonb('custom_json').default(sql`'{}'::jsonb`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUnique: uniqueIndex('tenant_settings_tenant_unique').on(table.tenantId),
}));

export const numberSequences = pgTable('number_sequences', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  sequenceType: varchar('sequence_type', { length: 32 }).notNull(), // SALE, PURCHASE, REPAIR, TRADE_IN, PAYMENT, EXPENSE, JOURNAL, BORROW
  prefix: varchar('prefix', { length: 16 }).notNull(), // INV, PUR, REP, TRD, PAY, EXP, JRN, BOR
  year: integer('year').notNull(),
  lastNumber: integer('last_number').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantSeqUnique: uniqueIndex('number_sequences_tenant_type_year_unique').on(
    table.tenantId,
    table.sequenceType,
    table.year
  ),
  tenantBranchIdx: index('number_sequences_tenant_branch_idx').on(table.tenantId, table.branchId),
}));
