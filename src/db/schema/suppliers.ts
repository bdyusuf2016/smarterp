import { pgTable, varchar, timestamp, boolean, numeric, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { users } from './users';

export const suppliers = pgTable('suppliers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }).default(''),
  contactPerson: varchar('contact_person', { length: 255 }).default(''),
  phone: varchar('phone', { length: 32 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address').default(''),
  currentPayable: numeric('current_payable', { precision: 14, scale: 2 }).notNull().default('0.00'),
  totalPurchases: numeric('total_purchases', { precision: 14, scale: 2 }).notNull().default('0.00'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantSupplierPhoneUnique: uniqueIndex('suppliers_tenant_phone_unique').on(table.tenantId, table.phone),
  tenantSupplierIdx: index('suppliers_tenant_idx').on(table.tenantId),
  supplierPayableIdx: index('suppliers_payable_idx').on(table.currentPayable),
}));

export const supplierTransactions = pgTable('supplier_transactions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  supplierId: varchar('supplier_id', { length: 64 }).notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull().defaultNow(),
  transactionType: varchar('transaction_type', { length: 32 }).notNull(), // OPENING, PURCHASE, PAYMENT, RETURN, ADJUSTMENT
  debit: numeric('debit', { precision: 14, scale: 2 }).notNull().default('0.00'), // Decreases payable (e.g. Payment / Return)
  credit: numeric('credit', { precision: 14, scale: 2 }).notNull().default('0.00'), // Increases payable (e.g. Purchase on credit)
  balance: numeric('balance', { precision: 14, scale: 2 }).notNull(), // Cumulative running payable balance
  invoiceNo: varchar('invoice_no', { length: 64 }),
  paymentMethod: varchar('payment_method', { length: 32 }), // CASH, BANK, BKASH, etc.
  notes: text('notes').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  supplierTransIdx: index('supp_trans_supplier_idx').on(table.supplierId),
  tenantSuppTransIdx: index('supp_trans_tenant_idx').on(table.tenantId, table.transactionDate),
}));
