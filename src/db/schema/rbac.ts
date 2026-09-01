import { pgTable, varchar, timestamp, boolean, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';

export const permissions = pgTable('permissions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  module: varchar('module', { length: 64 }).notNull(), // sales, products, inventory, repairs, accounting, etc.
  action: varchar('action', { length: 64 }).notNull(), // view, create, update, delete, void, refund, etc.
  code: varchar('code', { length: 128 }).notNull().unique(), // format: module.action (e.g. 'sales.refund')
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default(''),
  isSystem: boolean('is_system').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  codeIdx: index('permissions_code_idx').on(table.code),
  moduleIdx: index('permissions_module_idx').on(table.module),
}));

export const roles = pgTable('roles', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).references(() => tenants.id, { onDelete: 'cascade' }), // NULL for system default template roles
  code: varchar('code', { length: 64 }).notNull(), // SUPER_ADMIN, SHOP_OWNER, MANAGER, CASHIER, etc.
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default(''),
  isSystem: boolean('is_system').notNull().default(false),
  isProtected: boolean('is_protected').notNull().default(false), // Protected from deletion
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantRoleCodeUnique: uniqueIndex('roles_tenant_code_unique').on(table.tenantId, table.code),
  tenantIdx: index('roles_tenant_idx').on(table.tenantId),
}));

export const rolePermissions = pgTable('role_permissions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  roleId: varchar('role_id', { length: 64 }).notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: varchar('permission_id', { length: 64 }).notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  rolePermissionUnique: uniqueIndex('rp_role_permission_unique').on(table.roleId, table.permissionId),
  roleIdx: index('rp_role_idx').on(table.roleId),
}));

export const userRoles = pgTable('user_roles', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: varchar('role_id', { length: 64 }).notNull().references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userRoleUnique: uniqueIndex('ur_user_role_unique').on(table.userId, table.roleId),
  userIdx: index('ur_user_idx').on(table.userId),
}));
