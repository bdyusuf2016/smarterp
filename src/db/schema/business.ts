import { pgTable, varchar, timestamp, boolean, jsonb, text, integer, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants } from './tenants';

export const businessCategories = pgTable('business_categories', {
  id: varchar('id', { length: 64 }).primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(), // TELECOM, GROCERY, STATIONERY, LIBRARY, ELECTRONICS
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default(''),
  icon: varchar('icon', { length: 64 }).notNull().default('Store'),
  isSystem: boolean('is_system').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  configuration: jsonb('configuration').notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  codeIdx: index('business_categories_code_idx').on(table.code),
}));

export const modules = pgTable('modules', {
  id: varchar('id', { length: 64 }).primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(), // SALES, PURCHASES, INVENTORY, IMEI, REPAIR, BATCH, BOOKS, etc.
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default(''),
  categoryGroup: varchar('category_group', { length: 32 }).notNull().default('COMMON'), // CORE, COMMON, OPTIONAL
  icon: varchar('icon', { length: 64 }).notNull().default('Box'),
  isCore: boolean('is_core').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  codeIdx: index('modules_code_idx').on(table.code),
  groupIdx: index('modules_group_idx').on(table.categoryGroup),
}));

export const businessCategoryModules = pgTable('business_category_modules', {
  id: varchar('id', { length: 64 }).primaryKey(),
  businessCategoryId: varchar('business_category_id', { length: 64 }).notNull().references(() => businessCategories.id, { onDelete: 'cascade' }),
  moduleId: varchar('module_id', { length: 64 }).notNull().references(() => modules.id, { onDelete: 'cascade' }),
  enabledByDefault: boolean('enabled_by_default').notNull().default(true),
  configuration: jsonb('configuration').default(sql`'{}'::jsonb`),
}, (table) => ({
  catModuleUnique: uniqueIndex('bcm_category_module_unique').on(table.businessCategoryId, table.moduleId),
}));

export const tenantBusinessCategories = pgTable('tenant_business_categories', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  businessCategoryId: varchar('business_category_id', { length: 64 }).notNull().references(() => businessCategories.id, { onDelete: 'cascade' }),
  isPrimary: boolean('is_primary').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  configuration: jsonb('configuration').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantCatUnique: uniqueIndex('tbc_tenant_category_unique').on(table.tenantId, table.businessCategoryId),
  tenantIdx: index('tbc_tenant_idx').on(table.tenantId),
}));

export const tenantModules = pgTable('tenant_modules', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  moduleId: varchar('module_id', { length: 64 }).notNull().references(() => modules.id, { onDelete: 'cascade' }),
  isEnabled: boolean('is_enabled').notNull().default(true),
  configuration: jsonb('configuration').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantModuleUnique: uniqueIndex('tm_tenant_module_unique').on(table.tenantId, table.moduleId),
  tenantIdx: index('tm_tenant_idx').on(table.tenantId),
}));

export const customFieldDefinitions = pgTable('custom_field_definitions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  businessCategoryId: varchar('business_category_id', { length: 64 }).references(() => businessCategories.id, { onDelete: 'set null' }),
  entityType: varchar('entity_type', { length: 32 }).notNull(), // PRODUCT, CUSTOMER, SALE, SUPPLIER, REPAIR, MEMBER, BORROW
  name: varchar('name', { length: 128 }).notNull(),
  code: varchar('code', { length: 64 }).notNull(),
  fieldType: varchar('field_type', { length: 32 }).notNull(), // TEXT, NUMBER, DECIMAL, BOOLEAN, DATE, DATETIME, SELECT, MULTI_SELECT, PHONE, EMAIL
  options: jsonb('options').default(sql`'[]'::jsonb`), // Options array for select/multi-select
  isRequired: boolean('is_required').notNull().default(false),
  defaultValue: text('default_value'),
  placeholder: varchar('placeholder', { length: 255 }),
  helpText: text('help_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantEntityCodeUnique: uniqueIndex('cfd_tenant_entity_code_unique').on(table.tenantId, table.entityType, table.code),
  tenantIdx: index('cfd_tenant_idx').on(table.tenantId),
}));

export const customFieldValues = pgTable('custom_field_values', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customFieldId: varchar('custom_field_id', { length: 64 }).notNull().references(() => customFieldDefinitions.id, { onDelete: 'cascade' }),
  entityId: varchar('entity_id', { length: 64 }).notNull(),
  valueText: text('value_text'),
  valueNumber: integer('value_number'),
  valueBoolean: boolean('value_boolean'),
  valueDate: timestamp('value_date', { withTimezone: true }),
  valueJson: jsonb('value_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  entityCustomFieldUnique: uniqueIndex('cfv_entity_field_unique').on(table.entityId, table.customFieldId),
  tenantEntityIdx: index('cfv_tenant_entity_idx').on(table.tenantId, table.entityId),
}));
