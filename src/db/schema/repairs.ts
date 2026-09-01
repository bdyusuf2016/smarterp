import { pgTable, varchar, timestamp, numeric, integer, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants, branches } from './tenants';
import { customers } from './customers';
import { products, productVariants } from './products';
import { users } from './users';

export const repairJobs = pgTable('repair_jobs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  branchId: varchar('branch_id', { length: 64 }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  tokenNo: varchar('token_no', { length: 64 }).notNull(),
  customerId: varchar('customer_id', { length: 64 }).references(() => customers.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 32 }).notNull(),
  deviceModel: varchar('device_model', { length: 255 }).notNull(),
  imei: varchar('imei', { length: 64 }),
  passcode: varchar('passcode', { length: 64 }).default(''),
  problemDescription: text('problem_description').notNull(),
  diagnosticNotes: text('diagnostic_notes').default(''),
  technicianId: varchar('technician_id', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  estimatedCost: numeric('estimated_cost', { precision: 14, scale: 2 }).notNull().default('0.00'),
  finalCost: numeric('final_cost', { precision: 14, scale: 2 }).notNull().default('0.00'),
  partsCost: numeric('parts_cost', { precision: 14, scale: 2 }).notNull().default('0.00'),
  laborCost: numeric('labor_cost', { precision: 14, scale: 2 }).notNull().default('0.00'),
  advancePaid: numeric('advance_paid', { precision: 14, scale: 2 }).notNull().default('0.00'),
  dueAmount: numeric('due_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 32 }).notNull().default('RECEIVED'), // RECEIVED, DIAGNOSING, WAITING_APPROVAL, WAITING_PARTS, IN_REPAIR, READY, DELIVERED, CANCELLED
  warrantyMonths: integer('warranty_months').notNull().default(0),
  expectedDeliveryDate: timestamp('expected_delivery_date', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  notes: text('notes').default(''),
  createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantRepairTokenUnique: uniqueIndex('repair_tenant_token_unique').on(table.tenantId, table.tokenNo),
  tenantRepairStatusIdx: index('repair_tenant_status_idx').on(table.tenantId, table.status),
  technicianRepairIdx: index('repair_technician_idx').on(table.technicianId),
  customerPhoneRepairIdx: index('repair_cust_phone_idx').on(table.customerPhone),
}));

export const repairItems = pgTable('repair_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  repairJobId: varchar('repair_job_id', { length: 64 }).notNull().references(() => repairJobs.id, { onDelete: 'cascade' }),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 }).references(() => products.id, { onDelete: 'set null' }),
  variantId: varchar('variant_id', { length: 64 }).references(() => productVariants.id, { onDelete: 'set null' }),
  partName: varchar('part_name', { length: 255 }).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull().default('1.000'),
  unitCost: numeric('unit_cost', { precision: 14, scale: 2 }).notNull().default('0.00'),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull().default('0.00'),
  total: numeric('total', { precision: 14, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  repairItemJobIdx: index('repair_items_job_idx').on(table.repairJobId),
}));

export const repairStatusHistory = pgTable('repair_status_history', {
  id: varchar('id', { length: 64 }).primaryKey(),
  repairJobId: varchar('repair_job_id', { length: 64 }).notNull().references(() => repairJobs.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 32 }).notNull(),
  notes: text('notes').default(''),
  changedBy: varchar('changed_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  repairHistoryJobIdx: index('rsh_job_idx').on(table.repairJobId),
}));
