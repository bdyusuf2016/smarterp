import { pgTable, varchar, timestamp, numeric, integer, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { products, productVariants } from './products';

export const devices = pgTable('devices', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).references(() => branches.id, { onDelete: 'set null' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: varchar('variant_id', { length: 64 }).references(() => productVariants.id, { onDelete: 'set null' }),
  imei1: varchar('imei1', { length: 64 }).notNull(),
  imei2: varchar('imei2', { length: 64 }),
  serialNumber: varchar('serial_number', { length: 64 }),
  model: varchar('model', { length: 255 }),
  color: varchar('color', { length: 64 }),
  storage: varchar('storage', { length: 64 }),
  batteryHealth: integer('battery_health'),
  costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  sellingPrice: numeric('selling_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  warrantyMonths: integer('warranty_months').notNull().default(12),
  purchaseId: varchar('purchase_id', { length: 64 }),
  purchaseItemId: varchar('purchase_item_id', { length: 64 }),
  saleId: varchar('sale_id', { length: 64 }),
  saleItemId: varchar('sale_item_id', { length: 64 }),
  soldInvoiceNo: varchar('sold_invoice_no', { length: 64 }),
  status: varchar('status', { length: 32 }).notNull().default('IN_STOCK'), // IN_STOCK, RESERVED, SOLD, REPAIR, RETURNED, TRADE_IN, DAMAGED, LOST
  condition: varchar('condition', { length: 32 }).notNull().default('NEW'), // NEW, USED, REFURBISHED, DEFECTIVE
  notes: text('notes').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantImei1Unique: uniqueIndex('devices_tenant_imei1_unique').on(table.tenantId, table.imei1),
  tenantDeviceStatusIdx: index('devices_tenant_status_idx').on(table.tenantId, table.status),
  deviceProductIdx: index('devices_product_idx').on(table.productId),
  deviceSerialIdx: index('devices_serial_idx').on(table.serialNumber),
}));

export const warranties = pgTable('warranties', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  deviceId: varchar('device_id', { length: 64 }).references(() => devices.id, { onDelete: 'set null' }),
  saleId: varchar('sale_id', { length: 64 }),
  customerId: varchar('customer_id', { length: 64 }),
  invoiceNo: varchar('invoice_no', { length: 64 }).notNull(),
  warrantyType: varchar('warranty_type', { length: 64 }).notNull().default('OFFICIAL_SERVICE'), // OFFICIAL_SERVICE, SHOP_WARRANTY, REPLACEMENT, NONE
  durationMonths: integer('duration_months').notNull().default(12),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  terms: text('terms').default(''),
  status: varchar('status', { length: 32 }).notNull().default('ACTIVE'), // ACTIVE, EXPIRED, CLAIMED, VOID
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantWarrantyIdx: index('warranties_tenant_idx').on(table.tenantId),
  warrantyDeviceIdx: index('warranties_device_idx').on(table.deviceId),
  warrantyInvoiceIdx: index('warranties_invoice_idx').on(table.invoiceNo),
}));
