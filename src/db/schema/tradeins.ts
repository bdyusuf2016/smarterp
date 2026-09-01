import { pgTable, varchar, timestamp, numeric, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { customers } from './customers';
import { devices } from './devices';
import { users } from './users';

export const tradeIns = pgTable('trade_ins', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  tradeInNo: varchar('trade_in_no', { length: 64 }).notNull(),
  customerId: varchar('customer_id', { length: 64 }).references(() => customers.id, { onDelete: 'set null' }),
  sellerName: varchar('seller_name', { length: 255 }).notNull(),
  sellerPhone: varchar('seller_phone', { length: 32 }).notNull(),
  sellerNid: varchar('seller_nid', { length: 64 }).notNull(),
  deviceModel: varchar('device_model', { length: 255 }).notNull(),
  imei1: varchar('imei1', { length: 64 }).notNull(),
  imei2: varchar('imei2', { length: 64 }),
  condition: varchar('condition', { length: 32 }).notNull().default('USED'), // LIKE_NEW, GOOD, FAIR, POOR
  evaluationNotes: text('evaluation_notes').default(''),
  valuationAmount: numeric('valuation_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  purchasePrice: numeric('purchase_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  targetSellingPrice: numeric('target_selling_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  convertedToDeviceId: varchar('converted_to_device_id', { length: 64 }).references(() => devices.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 32 }).notNull().default('EVALUATED'), // EVALUATED, PURCHASED, CONVERTED_TO_STOCK, REJECTED
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantTradeInNoUnique: uniqueIndex('tradein_tenant_no_unique').on(table.tenantId, table.tradeInNo),
  tenantImeiTradeInIdx: index('tradein_tenant_imei_idx').on(table.tenantId, table.imei1),
  tenantNidTradeInIdx: index('tradein_tenant_nid_idx').on(table.tenantId, table.sellerNid),
}));
