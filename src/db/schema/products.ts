import { pgTable, varchar, timestamp, boolean, numeric, jsonb, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants } from './tenants';
import { businessCategories } from './business';

export const productCategories = pgTable('product_categories', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  businessCategoryId: varchar('business_category_id', { length: 64 }).references(() => businessCategories.id, { onDelete: 'set null' }),
  parentId: varchar('parent_id', { length: 64 }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 64 }).notNull(),
  icon: varchar('icon', { length: 64 }).default('Folder'),
  badgeColor: varchar('badge_color', { length: 32 }).default('#3b82f6'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantCategoryCodeUnique: uniqueIndex('categories_tenant_code_unique').on(table.tenantId, table.code),
  tenantCategoryIdx: index('categories_tenant_idx').on(table.tenantId),
}));

export const brands = pgTable('brands', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantBrandCodeUnique: uniqueIndex('brands_tenant_code_unique').on(table.tenantId, table.code),
  tenantBrandIdx: index('brands_tenant_idx').on(table.tenantId),
}));

export const units = pgTable('units', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 64 }).notNull(), // Piece, Kilogram, Liter, Meter, Dozen, Box
  code: varchar('code', { length: 32 }).notNull(), // pcs, kg, ltr, mtr, dzn, box
  symbol: varchar('symbol', { length: 16 }).notNull(),
  allowDecimal: boolean('allow_decimal').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantUnitCodeUnique: uniqueIndex('units_tenant_code_unique').on(table.tenantId, table.code),
  tenantUnitIdx: index('units_tenant_idx').on(table.tenantId),
}));

export const products = pgTable('products', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  businessCategoryId: varchar('business_category_id', { length: 64 }).references(() => businessCategories.id, { onDelete: 'set null' }),
  categoryId: varchar('category_id', { length: 64 }).references(() => productCategories.id, { onDelete: 'set null' }),
  brandId: varchar('brand_id', { length: 64 }).references(() => brands.id, { onDelete: 'set null' }),
  unitId: varchar('unit_id', { length: 64 }).references(() => units.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 64 }).notNull(),
  barcode: varchar('barcode', { length: 128 }).notNull(),
  description: text('description').default(''),
  trackingMode: varchar('tracking_mode', { length: 32 }).notNull().default('TRACKING_QUANTITY'), // TRACKING_NONE, TRACKING_QUANTITY, TRACKING_SERIAL, TRACKING_IMEI, TRACKING_BATCH, TRACKING_WEIGHT, TRACKING_BOOK
  costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  sellingPrice: numeric('selling_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  minSellingPrice: numeric('min_selling_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
  reorderLevel: numeric('reorder_level', { precision: 12, scale: 3 }).notNull().default('5.000'),
  alertQty: numeric('alert_qty', { precision: 12, scale: 3 }).notNull().default('5.000'),
  warrantyMonths: varchar('warranty_months', { length: 64 }).default(''),
  isActive: boolean('is_active').notNull().default(true),
  attributes: jsonb('attributes').default(sql`'{}'::jsonb`), // Dynamic category-specific attribute bag
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantSkuUnique: uniqueIndex('products_tenant_sku_unique').on(table.tenantId, table.sku),
  tenantBarcodeUnique: uniqueIndex('products_tenant_barcode_unique').on(table.tenantId, table.barcode),
  tenantProductIdx: index('products_tenant_idx').on(table.tenantId),
  categoryIdx: index('products_category_idx').on(table.categoryId),
  trackingModeIdx: index('products_tracking_idx').on(table.trackingMode),
}));

export const productVariants = pgTable('product_variants', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(), // e.g. "8GB / 128GB - Blue"
  sku: varchar('sku', { length: 64 }).notNull(),
  barcode: varchar('barcode', { length: 128 }).notNull(),
  costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  sellingPrice: numeric('selling_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  attributes: jsonb('attributes').notNull().default(sql`'{}'::jsonb`),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantVariantSkuUnique: uniqueIndex('pv_tenant_sku_unique').on(table.tenantId, table.sku),
  tenantVariantBarcodeUnique: uniqueIndex('pv_tenant_barcode_unique').on(table.tenantId, table.barcode),
  productVariantIdx: index('pv_product_idx').on(table.productId),
}));
