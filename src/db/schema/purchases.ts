import { pgTable, varchar, timestamp, numeric, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { suppliers } from './suppliers';
import { products, productVariants } from './products';
import { users } from './users';

export const purchases = pgTable('purchases', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  supplierId: varchar('supplier_id', { length: 64 }).notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  invoiceNo: varchar('invoice_no', { length: 64 }).notNull(),
  supplierInvoiceNo: varchar('supplier_invoice_no', { length: 64 }),
  purchaseDate: timestamp('purchase_date', { withTimezone: true }).notNull().defaultNow(),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull().default('0.00'),
  discount: numeric('discount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  tax: numeric('tax', { precision: 14, scale: 2 }).notNull().default('0.00'),
  grandTotal: numeric('grand_total', { precision: 14, scale: 2 }).notNull().default('0.00'),
  paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  dueAmount: numeric('due_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  paymentStatus: varchar('payment_status', { length: 32 }).notNull().default('PAID'), // PAID, PARTIAL, DUE
  status: varchar('status', { length: 32 }).notNull().default('RECEIVED'), // ORDERED, RECEIVED, CANCELLED
  notes: text('notes').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPurchaseInvoiceUnique: uniqueIndex('purchases_tenant_invoice_unique').on(table.tenantId, table.invoiceNo),
  tenantPurchaseIdx: index('purchases_tenant_idx').on(table.tenantId, table.purchaseDate),
  supplierPurchaseIdx: index('purchases_supplier_idx').on(table.supplierId),
}));

export const purchaseItems = pgTable('purchase_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  purchaseId: varchar('purchase_id', { length: 64 }).notNull().references(() => purchases.id, { onDelete: 'cascade' }),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar('variant_id', { length: 64 }).references(() => productVariants.id, { onDelete: 'set null' }),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
  total: numeric('total', { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  purchaseItemIdx: index('purchase_items_purchase_idx').on(table.purchaseId),
  productPurchaseIdx: index('purchase_items_product_idx').on(table.productId),
}));

export const purchasePayments = pgTable('purchase_payments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  purchaseId: varchar('purchase_id', { length: 64 }).references(() => purchases.id, { onDelete: 'set null' }),
  supplierId: varchar('supplier_id', { length: 64 }).notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 32 }).notNull(), // CASH, BANK, BKASH, NAGAD, etc.
  paymentDate: timestamp('payment_date', { withTimezone: true }).notNull().defaultNow(),
  referenceNo: varchar('reference_no', { length: 64 }),
  accountId: varchar('account_id', { length: 64 }),
  notes: text('notes').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  purchasePaymentIdx: index('purchase_payments_purchase_idx').on(table.purchaseId),
  supplierPaymentIdx: index('purchase_payments_supplier_idx').on(table.supplierId),
}));

export const purchaseReturns = pgTable('purchase_returns', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  purchaseId: varchar('purchase_id', { length: 64 }).references(() => purchases.id, { onDelete: 'set null' }),
  supplierId: varchar('supplier_id', { length: 64 }).notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  returnNo: varchar('return_no', { length: 64 }).notNull(),
  returnDate: timestamp('return_date', { withTimezone: true }).notNull().defaultNow(),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  refundAmount: numeric('refund_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  reason: text('reason').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantReturnNoUnique: uniqueIndex('pr_tenant_return_no_unique').on(table.tenantId, table.returnNo),
  supplierReturnIdx: index('pr_supplier_idx').on(table.supplierId),
}));

export const purchaseReturnItems = pgTable('purchase_return_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  returnId: varchar('return_id', { length: 64 }).notNull().references(() => purchaseReturns.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar('variant_id', { length: 64 }).references(() => productVariants.id, { onDelete: 'set null' }),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
  total: numeric('total', { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
