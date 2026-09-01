import { pgTable, varchar, timestamp, numeric, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { products } from './products';

export const productBatches = pgTable('product_batches', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  batchNumber: varchar('batch_number', { length: 64 }).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull().default('0.000'),
  mfgDate: timestamp('mfg_date', { withTimezone: true }).notNull(),
  expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
  costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  sellingPrice: numeric('selling_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  supplierId: varchar('supplier_id', { length: 64 }),
  status: varchar('status', { length: 32 }).notNull().default('ACTIVE'), // ACTIVE, EXPIRING_SOON, EXPIRED, DEPLETED
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantProductBatchUnique: uniqueIndex('pb_tenant_product_batch_unique').on(table.tenantId, table.productId, table.batchNumber),
  tenantBatchExpiryIdx: index('pb_tenant_expiry_idx').on(table.tenantId, table.expiryDate),
  productBatchIdx: index('pb_product_idx').on(table.productId),
}));
