import argon2 from 'argon2';
import { db, pool, testDatabaseConnection } from '../config/database';
import { logger } from '../config/logger';
import {
  businessCategories,
  modules,
  businessCategoryModules,
  permissions,
  roles,
  rolePermissions,
  tenants,
  branches,
  tenantSettings,
  tenantBusinessCategories,
  tenantModules,
  users,
  userRoles,
  userBranchAccess,
  accounts,
  units,
  numberSequences,
} from './schema';
import { eq } from 'drizzle-orm';

export async function runSeed() {
  logger.info('🌱 Starting deterministic database seed for Dokan Manager V2...');

  const isConnected = await testDatabaseConnection();
  if (!isConnected) {
    logger.error('❌ Cannot seed database: Connection failed');
    process.exit(1);
  }

  // 1. SEED BUSINESS CATEGORIES
  logger.info('1️⃣ Seeding Business Categories...');
  const defaultCategories = [
    {
      id: 'cat-telecom',
      code: 'TELECOM',
      name: 'Telecom & Mobile Shop',
      description: 'Mobile phone handsets, IMEI tracking, repairs, accessories, trade-in, and recharge.',
      icon: 'Smartphone',
      isSystem: true,
      configuration: {
        requiresIMEI: true,
        supportsRepairs: true,
        supportsTradeIn: true,
        supportsRecharge: true,
        supportsWarranty: true,
        defaultWarrantyMonths: 12,
        defaultTrackingMode: 'TRACKING_IMEI',
      },
    },
    {
      id: 'cat-grocery',
      code: 'GROCERY',
      name: 'Grocery & Supermarket',
      description: 'Packaged foods, fresh produce, weight scales, batch numbers, and expiry tracking.',
      icon: 'ShoppingBasket',
      isSystem: true,
      configuration: {
        requiresBatch: true,
        supportsExpiry: true,
        supportsWeight: true,
        defaultTrackingMode: 'TRACKING_BATCH',
      },
    },
    {
      id: 'cat-stationery',
      code: 'STATIONERY',
      name: 'Stationery & Books Shop',
      description: 'Office supplies, student notebooks, paper reams, guide books, and pens.',
      icon: 'PenTool',
      isSystem: true,
      configuration: {
        defaultTrackingMode: 'TRACKING_QUANTITY',
      },
    },
    {
      id: 'cat-library',
      code: 'LIBRARY',
      name: 'Book Library & Rental',
      description: 'Book cataloging, multiple copies, member borrowing, returns, and overdue fees.',
      icon: 'BookOpen',
      isSystem: true,
      configuration: {
        supportsBorrowing: true,
        supportsLateFee: true,
        borrowingDurationDays: 14,
        lateFeePerDay: 5,
        defaultTrackingMode: 'TRACKING_BOOK',
      },
    },
    {
      id: 'cat-electronics',
      code: 'ELECTRONICS',
      name: 'Consumer Electronics & Appliances',
      description: 'Electronics, serial number tracking, appliance warranty, and spare parts repair.',
      icon: 'Tv',
      isSystem: true,
      configuration: {
        requiresSerial: true,
        supportsWarranty: true,
        supportsRepairs: true,
        defaultWarrantyMonths: 24,
        defaultTrackingMode: 'TRACKING_SERIAL',
      },
    },
  ];

  for (const cat of defaultCategories) {
    await db
      .insert(businessCategories)
      .values(cat as any)
      .onConflictDoUpdate({
        target: businessCategories.code,
        set: {
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          configuration: cat.configuration,
        } as any,
      });
  }

  // 2. SEED MODULES
  logger.info('2️⃣ Seeding Platform Modules...');
  const defaultModules = [
    // Core Modules
    { id: 'mod-auth', code: 'AUTH', name: 'Authentication', categoryGroup: 'CORE', isCore: true },
    { id: 'mod-users', code: 'USERS', name: 'User Management', categoryGroup: 'CORE', isCore: true },
    { id: 'mod-rbac', code: 'RBAC', name: 'Role-Based Access Control', categoryGroup: 'CORE', isCore: true },
    { id: 'mod-tenants', code: 'TENANTS', name: 'Multi-Tenancy', categoryGroup: 'CORE', isCore: true },
    { id: 'mod-branches', code: 'BRANCHES', name: 'Multi-Branch Management', categoryGroup: 'CORE', isCore: true },
    { id: 'mod-settings', code: 'SETTINGS', name: 'System Settings', categoryGroup: 'CORE', isCore: true },
    { id: 'mod-audit', code: 'AUDIT', name: 'Audit Logs', categoryGroup: 'CORE', isCore: true },

    // Common Business Modules
    { id: 'mod-products', code: 'PRODUCTS', name: 'Products Catalog', categoryGroup: 'COMMON', isCore: false },
    { id: 'mod-inventory', code: 'INVENTORY', name: 'Inventory & Stock', categoryGroup: 'COMMON', isCore: false },
    { id: 'mod-customers', code: 'CUSTOMERS', name: 'Customer Management', categoryGroup: 'COMMON', isCore: false },
    { id: 'mod-suppliers', code: 'SUPPLIERS', name: 'Supplier Management', categoryGroup: 'COMMON', isCore: false },
    { id: 'mod-sales', code: 'SALES', name: 'POS & Billing', categoryGroup: 'COMMON', isCore: false },
    { id: 'mod-purchases', code: 'PURCHASES', name: 'Purchasing & Receiving', categoryGroup: 'COMMON', isCore: false },
    { id: 'mod-payments', code: 'PAYMENTS', name: 'Multi-Method Payments', categoryGroup: 'COMMON', isCore: false },
    { id: 'mod-expenses', code: 'EXPENSES', name: 'Expense Tracking', categoryGroup: 'COMMON', isCore: false },
    { id: 'mod-accounting', code: 'ACCOUNTING', name: 'Double-Entry Accounting', categoryGroup: 'COMMON', isCore: false },
    { id: 'mod-reports', code: 'REPORTS', name: 'Analytics & Reporting', categoryGroup: 'COMMON', isCore: false },

    // Optional Industry Modules
    { id: 'mod-imei', code: 'IMEI', name: 'IMEI & Device Tracking', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-serial', code: 'SERIAL_NUMBERS', name: 'Serial Number Tracking', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-repairs', code: 'REPAIR', name: 'Repair Job Management', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-tradein', code: 'TRADE_IN', name: 'Trade-in & Used Phone Buyback', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-recharge', code: 'RECHARGE', name: 'Flexiload & MFS Register', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-warranty', code: 'WARRANTY', name: 'Warranty Tracking', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-batch', code: 'BATCH', name: 'Batch & Lot Numbers', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-expiry', code: 'EXPIRY', name: 'Expiry Date Control', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-weight', code: 'WEIGHT', name: 'Weight Scale Billing', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-books', code: 'BOOKS', name: 'Book Cataloging', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-members', code: 'MEMBERS', name: 'Library Memberships', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-borrowing', code: 'BORROWING', name: 'Book Borrow & Returns', categoryGroup: 'OPTIONAL', isCore: false },
    { id: 'mod-latefees', code: 'LATE_FEES', name: 'Late Fees Management', categoryGroup: 'OPTIONAL', isCore: false },
  ];

  for (const mod of defaultModules) {
    await db
      .insert(modules)
      .values(mod as any)
      .onConflictDoUpdate({
        target: modules.code,
        set: { name: mod.name, categoryGroup: mod.categoryGroup, isCore: mod.isCore } as any,
      });
  }

  // 3. SEED CATEGORY-MODULE MAPPINGS
  logger.info('3️⃣ Mapping Modules to Business Categories...');
  const categoryModuleMap: Record<string, string[]> = {
    TELECOM: ['SALES', 'PURCHASES', 'INVENTORY', 'CUSTOMERS', 'SUPPLIERS', 'PAYMENTS', 'EXPENSES', 'ACCOUNTING', 'REPORTS', 'IMEI', 'SERIAL_NUMBERS', 'REPAIR', 'TRADE_IN', 'RECHARGE', 'WARRANTY'],
    GROCERY: ['SALES', 'PURCHASES', 'INVENTORY', 'CUSTOMERS', 'SUPPLIERS', 'PAYMENTS', 'EXPENSES', 'ACCOUNTING', 'REPORTS', 'BATCH', 'EXPIRY', 'WEIGHT'],
    STATIONERY: ['SALES', 'PURCHASES', 'INVENTORY', 'CUSTOMERS', 'SUPPLIERS', 'PAYMENTS', 'EXPENSES', 'ACCOUNTING', 'REPORTS'],
    LIBRARY: ['BOOKS', 'MEMBERS', 'BORROWING', 'LATE_FEES', 'INVENTORY', 'PAYMENTS', 'EXPENSES', 'ACCOUNTING', 'REPORTS'],
    ELECTRONICS: ['SALES', 'PURCHASES', 'INVENTORY', 'CUSTOMERS', 'SUPPLIERS', 'PAYMENTS', 'EXPENSES', 'ACCOUNTING', 'REPORTS', 'SERIAL_NUMBERS', 'REPAIR', 'WARRANTY'],
  };

  for (const [catCode, modCodes] of Object.entries(categoryModuleMap)) {
    const cat = (await db.query.businessCategories.findFirst({ where: eq(businessCategories.code, catCode) })) as any;
    if (!cat) continue;

    for (const modCode of modCodes) {
      const mod = (await db.query.modules.findFirst({ where: eq(modules.code, modCode) })) as any;
      if (!mod) continue;

      await db
        .insert(businessCategoryModules)
        .values({
          id: `bcm-${cat.id}-${mod.id}`,
          businessCategoryId: cat.id,
          moduleId: mod.id,
          enabledByDefault: true,
        } as any)
        .onConflictDoNothing();
    }
  }

  // 4. SEED PERMISSIONS
  logger.info('4️⃣ Seeding Granular RBAC Permissions...');
  const permissionList = [
    // Auth & Users
    { module: 'auth', action: 'login', name: 'User Login', desc: 'Authenticate to system' },
    { module: 'auth', action: 'session_revoke', name: 'Revoke Sessions', desc: 'Revoke active user sessions' },
    { module: 'users', action: 'view', name: 'View Users', desc: 'View user list' },
    { module: 'users', action: 'create', name: 'Create Users', desc: 'Create new users' },
    { module: 'users', action: 'update', name: 'Update Users', desc: 'Update user profiles' },
    { module: 'users', action: 'delete', name: 'Delete Users', desc: 'Delete or deactivate users' },
    { module: 'roles', action: 'view', name: 'View Roles', desc: 'View RBAC roles' },
    { module: 'roles', action: 'create', name: 'Create Roles', desc: 'Create custom roles' },
    { module: 'roles', action: 'update', name: 'Update Roles', desc: 'Modify role permissions' },
    { module: 'roles', action: 'delete', name: 'Delete Roles', desc: 'Delete custom roles' },
    { module: 'tenants', action: 'view', name: 'View Tenant Profile', desc: 'View tenant details' },
    { module: 'tenants', action: 'update', name: 'Update Tenant Settings', desc: 'Update tenant business configuration' },
    { module: 'branches', action: 'view', name: 'View Branches', desc: 'View branch list' },
    { module: 'branches', action: 'create', name: 'Create Branches', desc: 'Create branch' },
    { module: 'branches', action: 'update', name: 'Update Branches', desc: 'Update branch' },

    // Products & Inventory
    { module: 'products', action: 'view', name: 'View Products', desc: 'View product catalog' },
    { module: 'products', action: 'create', name: 'Create Products', desc: 'Create new products' },
    { module: 'products', action: 'update', name: 'Update Products', desc: 'Update existing products' },
    { module: 'products', action: 'delete', name: 'Delete Products', desc: 'Delete products' },
    { module: 'products', action: 'view_cost', name: 'View Cost Price', desc: 'View buy / cost price' },
    { module: 'inventory', action: 'view', name: 'View Stock', desc: 'View stock levels' },
    { module: 'inventory', action: 'adjust', name: 'Adjust Stock', desc: 'Manual stock adjustment' },
    { module: 'inventory', action: 'transfer', name: 'Transfer Stock', desc: 'Transfer stock between branches' },
    { module: 'devices', action: 'view', name: 'View Devices', desc: 'View IMEI & serials' },
    { module: 'devices', action: 'create', name: 'Register Device', desc: 'Add device IMEI' },
    { module: 'devices', action: 'imei_search', name: 'Search IMEI', desc: 'Global IMEI search' },

    // Sales & POS
    { module: 'sales', action: 'view', name: 'View Sales', desc: 'View sales invoices' },
    { module: 'sales', action: 'create', name: 'Create Sale / POS', desc: 'Create sale invoice at POS' },
    { module: 'sales', action: 'void', name: 'Void Sale', desc: 'Void sale invoice' },
    { module: 'sales', action: 'refund', name: 'Refund Sale', desc: 'Refund sale return' },
    { module: 'sales', action: 'discount', name: 'Apply Discount', desc: 'Apply custom discount at POS' },
    { module: 'sales', action: 'price_override', name: 'Price Override', desc: 'Override selling price at POS' },
    { module: 'payments', action: 'create', name: 'Collect Payment', desc: 'Process cash, bank, or MFS payment' },

    // Purchases & Partners
    { module: 'purchases', action: 'view', name: 'View Purchases', desc: 'View purchase orders' },
    { module: 'purchases', action: 'create', name: 'Create Purchase', desc: 'Inward purchase and receiving' },
    { module: 'purchases', action: 'cancel', name: 'Cancel Purchase', desc: 'Cancel purchase' },
    { module: 'customers', action: 'view', name: 'View Customers', desc: 'View customer directory' },
    { module: 'customers', action: 'create', name: 'Create Customer', desc: 'Register customer' },
    { module: 'customers', action: 'update', name: 'Update Customer', desc: 'Update customer info' },
    { module: 'customers', action: 'view_due', name: 'View Customer Due', desc: 'View customer balance' },
    { module: 'customers', action: 'collect_due', name: 'Collect Customer Due', desc: 'Collect dues and issue receipts' },
    { module: 'suppliers', action: 'view', name: 'View Suppliers', desc: 'View supplier directory' },
    { module: 'suppliers', action: 'create', name: 'Create Supplier', desc: 'Register supplier' },
    { module: 'suppliers', action: 'make_payment', name: 'Supplier Payment', desc: 'Pay supplier invoices' },

    // Industry Specializations
    { module: 'repairs', action: 'view', name: 'View Repairs', desc: 'View repair job sheets' },
    { module: 'repairs', action: 'create', name: 'Create Repair Job', desc: 'Create new repair job' },
    { module: 'repairs', action: 'update', name: 'Update Repair Status', desc: 'Change diagnostic status' },
    { module: 'repairs', action: 'deliver', name: 'Deliver Repair', desc: 'Deliver device and collect payment' },
    { module: 'tradeins', action: 'view', name: 'View Trade-Ins', desc: 'View trade-in records' },
    { module: 'tradeins', action: 'create', name: 'Create Trade-In', desc: 'Buy used phone and record NID' },
    { module: 'recharges', action: 'view', name: 'View Recharges', desc: 'View flexiload log' },
    { module: 'recharges', action: 'create', name: 'Execute Recharge', desc: 'Log flexiload / MFS cash transaction' },
    { module: 'library', action: 'manage_books', name: 'Manage Books', desc: 'Manage library catalog' },
    { module: 'library', action: 'borrow', name: 'Issue Book', desc: 'Issue book to member' },
    { module: 'library', action: 'return', name: 'Return Book', desc: 'Process book return and late fees' },

    // Accounting & Reports
    { module: 'accounting', action: 'view', name: 'View Accounts', desc: 'View chart of accounts & ledger' },
    { module: 'accounting', action: 'cash', name: 'Cash Management', desc: 'Manage cash in/out' },
    { module: 'accounting', action: 'bank', name: 'Bank Management', desc: 'Manage bank & MFS wallets' },
    { module: 'accounting', action: 'close_day', name: 'Daily Closing', desc: 'Perform daily shift closing' },
    { module: 'accounting', action: 'reopen_day', name: 'Reopen Closed Day', desc: 'Reopen day for audit correction' },
    { module: 'reports', action: 'sales', name: 'Sales Reports', desc: 'Daily, monthly, and cashier sales' },
    { module: 'reports', action: 'profit', name: 'Profit & Loss Report', desc: 'Financial gross and net margin' },
    { module: 'reports', action: 'inventory', name: 'Inventory Report', desc: 'Valuation and low stock report' },
    { module: 'reports', action: 'financial', name: 'Financial Statements', desc: 'Balance sheet and ledgers' },
    { module: 'audit', action: 'view', name: 'View Audit Logs', desc: 'Inspect immutable audit trail' },
    { module: 'settings', action: 'update', name: 'Update Settings', desc: 'Change application configuration' },
  ];

  for (const p of permissionList) {
    const code = `${p.module}.${p.action}`;
    await db
      .insert(permissions)
      .values({
        id: `perm-${p.module}-${p.action}`,
        module: p.module,
        action: p.action,
        code,
        name: p.name,
        description: p.desc,
        isSystem: true,
      } as any)
      .onConflictDoUpdate({
        target: permissions.code,
        set: { name: p.name, description: p.desc } as any,
      });
  }

  // 5. SEED DEFAULT ROLES
  logger.info('5️⃣ Seeding System Default Roles...');
  const systemRoles = [
    { id: 'role-super-admin', code: 'SUPER_ADMIN', name: 'Super Administrator', isSystem: true, isProtected: true },
    { id: 'role-shop-owner', code: 'SHOP_OWNER', name: 'Shop Owner', isSystem: true, isProtected: true },
    { id: 'role-manager', code: 'MANAGER', name: 'Store Manager', isSystem: true, isProtected: false },
    { id: 'role-cashier', code: 'CASHIER', name: 'POS Cashier', isSystem: true, isProtected: false },
    { id: 'role-inventory-mgr', code: 'INVENTORY_MANAGER', name: 'Inventory Manager', isSystem: true, isProtected: false },
    { id: 'role-purchase-mgr', code: 'PURCHASE_MANAGER', name: 'Purchase Manager', isSystem: true, isProtected: false },
    { id: 'role-accountant', code: 'ACCOUNTANT', name: 'Accountant', isSystem: true, isProtected: false },
    { id: 'role-repair-mgr', code: 'REPAIR_MANAGER', name: 'Repair Manager', isSystem: true, isProtected: false },
    { id: 'role-technician', code: 'REPAIR_TECHNICIAN', name: 'Repair Technician', isSystem: true, isProtected: false },
    { id: 'role-viewer', code: 'VIEWER', name: 'Auditor / Viewer', isSystem: true, isProtected: false },
  ];

  for (const r of systemRoles) {
    await db
      .insert(roles)
      .values(r as any)
      .onConflictDoNothing();
  }
  // Map Permissions to Roles
  const allPerms = (await db.query.permissions.findMany()) as any[];
  const allPermCodes: string[] = allPerms.map((p) => String(p.code));

  const rolePermissionMap: Record<string, string[]> = {
    SUPER_ADMIN: allPermCodes,
    SHOP_OWNER: allPermCodes,
    MANAGER: allPermCodes.filter((p) => !p.startsWith('tenants.delete') && !p.startsWith('roles.delete')),
    CASHIER: [
      'auth.login', 'auth.logout',
      'products.view', 'devices.view', 'devices.imei_search',
      'sales.view', 'sales.create', 'sales.discount',
      'payments.create',
      'customers.view', 'customers.create', 'customers.view_due', 'customers.collect_due',
      'recharges.view', 'recharges.create',
      'repairs.view', 'repairs.create',
      'accounting.view', 'accounting.cash', 'accounting.close_day',
      'reports.sales',
    ],
    INVENTORY_MANAGER: [
      'auth.login', 'auth.logout',
      'products.view', 'products.create', 'products.update', 'products.view_cost',
      'inventory.view', 'inventory.adjust', 'inventory.transfer',
      'devices.view', 'devices.create', 'devices.imei_search',
      'purchases.view', 'purchases.create',
      'suppliers.view',
      'reports.inventory',
    ],
    PURCHASE_MANAGER: [
      'auth.login', 'auth.logout',
      'products.view', 'products.view_cost',
      'purchases.view', 'purchases.create', 'purchases.cancel',
      'suppliers.view', 'suppliers.create', 'suppliers.update', 'suppliers.make_payment',
      'inventory.view',
      'reports.purchases',
    ],
    ACCOUNTANT: [
      'auth.login', 'auth.logout',
      'accounting.view', 'accounting.cash', 'accounting.bank', 'accounting.close_day', 'accounting.reopen_day',
      'sales.view', 'purchases.view', 'customers.view_due', 'suppliers.view',
      'reports.sales', 'reports.purchases', 'reports.profit', 'reports.financial', 'reports.customer_due', 'reports.supplier_due',
      'audit.view',
    ],
    REPAIR_MANAGER: [
      'auth.login', 'auth.logout',
      'repairs.view', 'repairs.create', 'repairs.update', 'repairs.deliver',
      'products.view', 'inventory.view',
      'customers.view', 'customers.create',
    ],
    REPAIR_TECHNICIAN: [
      'auth.login', 'auth.logout',
      'repairs.view', 'repairs.update',
      'products.view',
    ],
    VIEWER: [
      'auth.login', 'auth.logout',
      'products.view', 'sales.view', 'reports.sales', 'reports.inventory',
    ],
  };

  for (const [roleCode, permList] of Object.entries(rolePermissionMap)) {
    const roleRec = (await db.query.roles.findFirst({ where: eq(roles.code, roleCode) })) as any;
    if (!roleRec) continue;

    for (const pCode of permList) {
      const permRec = allPerms.find((p) => p.code === pCode);
      if (!permRec) continue;

      await db
        .insert(rolePermissions)
        .values({
          id: `rp-${roleRec.id}-${permRec.id}`,
          roleId: roleRec.id,
          permissionId: permRec.id,
        } as any)
        .onConflictDoNothing();
    }
  }

  // 6. SEED MASTER PLATFORM SYSTEM ADMINISTRATOR (ROOT LEVEL)
  logger.info('6️⃣ Provisioning Master Platform System Administrator (Root Level)...');

  const adminUserId = 'usr_super_admin';
  const hashedPassword = await argon2.hash('BdYusuf@2026');

  // Insert Master Platform Admin User
  await db
    .insert(users)
    .values({
      id: adminUserId,
      tenantId: null,
      phone: '01711000000',
      name: 'Md. Yusuf Ali (System Admin)',
      email: 'bdyusuf2016@gmail.com',
      passwordHash: hashedPassword,
      status: 'active',
    } as any)
    .onConflictDoUpdate({
      target: [users.phone],
      set: { 
        name: 'Md. Yusuf Ali (System Admin)', 
        email: 'bdyusuf2016@gmail.com', 
        passwordHash: hashedPassword,
        tenantId: null
      } as any,
    });

  // Assign SUPER_ADMIN role to platform admin
  await db
    .insert(userRoles)
    .values([
      { id: `ur-${adminUserId}-admin`, userId: adminUserId, roleId: 'role-super-admin' },
    ])
    .onConflictDoNothing();

  logger.info('🎉 Seed completed successfully! Platform is ready without demo shops.');
}

// Allow direct CLI invocation via `npm run db:seed`
if (process.argv[1]?.includes('seed')) {
  runSeed()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, 'Seed script crashed with an unhandled exception');
      await pool.end();
      process.exit(1);
    });
}
