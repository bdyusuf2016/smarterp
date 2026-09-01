import { pgTable, varchar, timestamp, boolean, numeric, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { customers } from './customers';
import { products, productVariants } from './products';
import { devices } from './devices';
import { productBatches } from './grocery';
import { bookCopies } from './library';
import { users } from './users';

export const sales = pgTable('sales', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  customerId: varchar('customer_id', { length: 64 }).references(() => customers.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 255 }).notNull().default('Cash Customer'),
  customerPhone: varchar('customer_phone', { length: 32 }).default(''),
  invoiceNo: varchar('invoice_no', { length: 64 }).notNull(),
  saleDate: timestamp('sale_date', { withTimezone: true }).notNull().defaultNow(),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull().default('0.00'),
  discount: numeric('discount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  tax: numeric('tax', { precision: 14, scale: 2 }).notNull().default('0.00'),
  grandTotal: numeric('grand_total', { precision: 14, scale: 2 }).notNull().default('0.00'),
  paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  dueAmount: numeric('due_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  changeAmount: numeric('change_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 32 }).notNull().default('COMPLETED'), // COMPLETED, VOIDED, REFUNDED, PARTIAL_REFUND
  paymentMethodSummary: varchar('payment_method_summary', { length: 128 }).default('Cash'),
  cashierId: varchar('cashier_id', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  cashierName: varchar('cashier_name', { length: 255 }),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantSaleInvoiceUnique: uniqueIndex('sales_tenant_invoice_unique').on(table.tenantId, table.invoiceNo),
  tenantSaleDateIdx: index('sales_tenant_date_idx').on(table.tenantId, table.saleDate),
  customerSaleIdx: index('sales_customer_idx').on(table.customerId),
  branchSaleIdx: index('sales_branch_idx').on(table.branchId),
}));

export const saleItems = pgTable('sale_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  saleId: varchar('sale_id', { length: 64 }).notNull().references(() => sales.id, { onDelete: 'cascade' }),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar('variant_id', { length: 64 }).references(() => productVariants.id, { onDelete: 'set null' }),
  deviceId: varchar('device_id', { length: 64 }).references(() => devices.id, { onDelete: 'set null' }),
  batchId: varchar('batch_id', { length: 64 }).references(() => productBatches.id, { onDelete: 'set null' }),
  bookCopyId: varchar('book_copy_id', { length: 64 }).references(() => bookCopies.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 64 }).notNull(),
  barcode: varchar('barcode', { length: 128 }).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
  costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  discount: numeric('discount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  tax: numeric('tax', { precision: 14, scale: 2 }).notNull().default('0.00'),
  total: numeric('total', { precision: 14, scale: 2 }).notNull(),
  imei: varchar('imei', { length: 64 }),
  warrantyText: varchar('warranty_text', { length: 128 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  saleItemSaleIdx: index('sale_items_sale_idx').on(table.saleId),
  saleItemProductIdx: index('sale_items_product_idx').on(table.productId),
  saleItemDeviceIdx: index('sale_items_device_idx').on(table.deviceId),
}));

export const payments = pgTable('payments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  referenceType: varchar('reference_type', { length: 32 }).notNull(), // SALE, PURCHASE, CUSTOMER_DUE, SUPPLIER_PAYMENT, REPAIR, TRADE_IN, EXPENSE, LATE_FEE
  referenceId: varchar('reference_id', { length: 64 }).notNull(),
  customerId: varchar('customer_id', { length: 64 }).references(() => customers.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 32 }).notNull(), // CASH, BKASH, NAGAD, ROCKET, BANK, CARD, OTHER
  transactionNo: varchar('transaction_no', { length: 64 }),
  accountId: varchar('account_id', { length: 64 }),
  status: varchar('status', { length: 32 }).notNull().default('COMPLETED'), // COMPLETED, REFUNDED, VOIDED
  paymentDate: timestamp('payment_date', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPaymentIdx: index('payments_tenant_idx').on(table.tenantId, table.paymentDate),
  paymentRefIdx: index('payments_reference_idx').on(table.referenceType, table.referenceId),
  paymentMethodIdx: index('payments_method_idx').on(table.paymentMethod),
}));

export const saleReturns = pgTable('sale_returns', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  saleId: varchar('sale_id', { length: 64 }).notNull().references(() => sales.id, { onDelete: 'cascade' }),
  customerId: varchar('customer_id', { length: 64 }).references(() => customers.id, { onDelete: 'set null' }),
  returnNo: varchar('return_no', { length: 64 }).notNull(),
  returnDate: timestamp('return_date', { withTimezone: true }).notNull().defaultNow(),
  returnAmount: numeric('return_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  refundAmount: numeric('refund_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  reason: text('reason').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantSaleReturnNoUnique: uniqueIndex('sr_tenant_return_no_unique').on(table.tenantId, table.returnNo),
  saleReturnIdx: index('sr_sale_idx').on(table.saleId),
}));

export const saleReturnItems = pgTable('sale_return_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  returnId: varchar('return_id', { length: 64 }).notNull().references(() => saleReturns.id, { onDelete: 'cascade' }),
  saleItemId: varchar('sale_item_id', { length: 64 }).notNull().references(() => saleItems.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar('variant_id', { length: 64 }).references(() => productVariants.id, { onDelete: 'set null' }),
  deviceId: varchar('device_id', { length: 64 }).references(() => devices.id, { onDelete: 'set null' }),
  batchId: varchar('batch_id', { length: 64 }).references(() => productBatches.id, { onDelete: 'set null' }),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
  refundTotal: numeric('refund_total', { precision: 14, scale: 2 }).notNull(),
  restockItem: boolean('restock_item').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
