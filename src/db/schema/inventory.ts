import { pgTable, varchar, timestamp, boolean, numeric, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { products, productVariants } from './products';
import { users } from './users';

export const inventoryLocations = pgTable('inventory_locations', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(), // e.g. "Main Display Rack", "Backroom Warehouse"
  code: varchar('code', { length: 32 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantLocationCodeUnique: uniqueIndex('loc_tenant_code_unique').on(table.tenantId, table.branchId, table.code),
  tenantBranchIdx: index('loc_tenant_branch_idx').on(table.tenantId, table.branchId),
}));

export const inventoryStock = pgTable('inventory_stock', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  locationId: varchar('location_id', { length: 64 }).references(() => inventoryLocations.id, { onDelete: 'set null' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar('variant_id', { length: 64 }).references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull().default('0.000'),
  reservedQuantity: numeric('reserved_quantity', { precision: 12, scale: 3 }).notNull().default('0.000'),
  avgCostPrice: numeric('avg_cost_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  stockUnique: uniqueIndex('stock_tenant_branch_prod_variant_unique').on(
    table.tenantId,
    table.branchId,
    table.productId,
    table.variantId
  ),
  tenantStockIdx: index('stock_tenant_branch_idx').on(table.tenantId, table.branchId),
  productStockIdx: index('stock_product_idx').on(table.productId),
}));

export const inventoryTransactions = pgTable('inventory_transactions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  locationId: varchar('location_id', { length: 64 }).references(() => inventoryLocations.id, { onDelete: 'set null' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar('variant_id', { length: 64 }).references(() => productVariants.id, { onDelete: 'set null' }),
  transactionType: varchar('transaction_type', { length: 32 }).notNull(), // OPENING, PURCHASE, SALE, SALE_RETURN, PURCHASE_RETURN, ADJUSTMENT, DAMAGE, TRANSFER_IN, TRANSFER_OUT, REPAIR_USAGE, TRADE_IN
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(), // positive for stock increment, negative for decrement
  unitCost: numeric('unit_cost', { precision: 14, scale: 2 }).notNull().default('0.00'),
  totalCost: numeric('total_cost', { precision: 14, scale: 2 }).notNull().default('0.00'),
  balanceAfter: numeric('balance_after', { precision: 12, scale: 3 }).notNull(),
  referenceType: varchar('reference_type', { length: 32 }), // SALE, PURCHASE, TRANSFER, REPAIR, ADJUSTMENT, TRADE_IN
  referenceId: varchar('reference_id', { length: 64 }),
  notes: text('notes').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantTransIdx: index('inv_trans_tenant_idx').on(table.tenantId, table.createdAt),
  productTransIdx: index('inv_trans_product_idx').on(table.productId),
  branchTransIdx: index('inv_trans_branch_idx').on(table.branchId),
}));

export const stockTransfers = pgTable('stock_transfers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  transferNo: varchar('transfer_no', { length: 64 }).notNull(),
  fromBranchId: varchar('from_branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  toBranchId: varchar('to_branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 32 }).notNull().default('PENDING'), // PENDING, IN_TRANSIT, RECEIVED, CANCELLED
  notes: text('notes').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  receivedBy: varchar('received_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantTransferNoUnique: uniqueIndex('st_tenant_transfer_no_unique').on(table.tenantId, table.transferNo),
  tenantTransferIdx: index('st_tenant_idx').on(table.tenantId),
}));

export const stockTransferItems = pgTable('stock_transfer_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  transferId: varchar('transfer_id', { length: 64 }).notNull().references(() => stockTransfers.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar('variant_id', { length: 64 }).references(() => productVariants.id, { onDelete: 'set null' }),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  receivedQuantity: numeric('received_quantity', { precision: 12, scale: 3 }).notNull().default('0.000'),
  costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
