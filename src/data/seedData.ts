import { 
  BusinessCategory, 
  Module, 
  BusinessCategoryModule, 
  Tenant, 
  GenericProduct, 
  DeviceItem, 
  ProductBatch, 
  BookItem, 
  RepairTicket, 
  TradeInRecord, 
  RechargeRecord, 
  BorrowRecord, 
  CustomerMember, 
  Supplier, 
  CustomFieldDefinition,
  SaleTransaction,
  AccountingEntry,
  AuditLog
} from '../types';

// ==================================================
// SYSTEM MODULES REGISTRY
// ==================================================
export const INITIAL_MODULES: Module[] = [
  // Core Modules
  { id: 'mod_auth', code: 'AUTH', name: 'Authentication & Security', description: 'User login, token sessions and 2FA', category_group: 'CORE', icon: 'Shield', is_core: true, is_active: true },
  { id: 'mod_users', code: 'USERS', name: 'User Management', description: 'Staff members, credentials, and activity', category_group: 'CORE', icon: 'Users', is_core: true, is_active: true },
  { id: 'mod_rbac', code: 'RBAC', name: 'Role & Permissions', description: 'Granular access control and security policies', category_group: 'CORE', icon: 'Lock', is_core: true, is_active: true },
  { id: 'mod_tenants', code: 'TENANTS', name: 'Tenant Profiles', description: 'Multi-tenant organization structures', category_group: 'CORE', icon: 'Building2', is_core: true, is_active: true },
  { id: 'mod_branches', code: 'BRANCHES', name: 'Store Branches', description: 'Multi-outlet and warehouse locations', category_group: 'CORE', icon: 'Store', is_core: true, is_active: true },
  { id: 'mod_settings', code: 'SETTINGS', name: 'System Settings', description: 'Platform preferences, tax and invoice setup', category_group: 'CORE', icon: 'Settings', is_core: true, is_active: true },
  { id: 'mod_audit', code: 'AUDIT', name: 'Audit Trail', description: 'Immutable log of system modifications', category_group: 'CORE', icon: 'FileText', is_core: true, is_active: true },

  // Common Business Modules
  { id: 'mod_products', code: 'PRODUCTS', name: 'Product Catalog', description: 'Generic item master data and variants', category_group: 'COMMON', icon: 'Package', is_core: false, is_active: true },
  { id: 'mod_inventory', code: 'INVENTORY', name: 'Multi-Mode Stock', description: 'Stock levels, reorder alerts and tracking', category_group: 'COMMON', icon: 'Boxes', is_core: false, is_active: true },
  { id: 'mod_sales', code: 'SALES', name: 'Sales & POS', description: 'Point of Sale, invoice billing and checkout', category_group: 'COMMON', icon: 'ShoppingCart', is_core: false, is_active: true },
  { id: 'mod_purchases', code: 'PURCHASES', name: 'Purchases & POs', description: 'Stock procurement and incoming shipments', category_group: 'COMMON', icon: 'Truck', is_core: false, is_active: true },
  { id: 'mod_customers', code: 'CUSTOMERS', name: 'Customer CRM', description: 'Client profiles, credit accounts and history', category_group: 'COMMON', icon: 'UserCheck', is_core: false, is_active: true },
  { id: 'mod_suppliers', code: 'SUPPLIERS', name: 'Supplier Directory', description: 'Vendor relations, ledgers and payables', category_group: 'COMMON', icon: 'Briefcase', is_core: false, is_active: true },
  { id: 'mod_payments', code: 'PAYMENTS', name: 'Payment Processing', description: 'Cash, card, digital wallet and credit settlements', category_group: 'COMMON', icon: 'CreditCard', is_core: false, is_active: true },
  { id: 'mod_expenses', code: 'EXPENSES', name: 'Expense Tracking', description: 'Operating expenses, utilities and overheads', category_group: 'COMMON', icon: 'Receipt', is_core: false, is_active: true },
  { id: 'mod_accounting', code: 'ACCOUNTING', name: 'Financial Accounting', description: 'Double-entry journal, ledger and P&L', category_group: 'COMMON', icon: 'Landmark', is_core: false, is_active: true },
  { id: 'mod_reports', code: 'REPORTS', name: 'Modular Reports', description: 'Business analytics and category-specific reporting', category_group: 'COMMON', icon: 'BarChart3', is_core: false, is_active: true },

  // Optional Industry Modules
  { id: 'mod_imei', code: 'IMEI', name: 'IMEI Tracking', description: 'Dual-SIM/IMEI lifecycle, activation and sale audit', category_group: 'OPTIONAL', icon: 'Smartphone', is_core: false, is_active: true },
  { id: 'mod_serial', code: 'SERIAL_NUMBERS', name: 'Serial Numbers', description: 'Individual item serialization and verification', category_group: 'OPTIONAL', icon: 'Hash', is_core: false, is_active: true },
  { id: 'mod_repairs', code: 'REPAIRS', name: 'Repairs & Service', description: 'Job ticketing, diagnostics, technicians & parts', category_group: 'OPTIONAL', icon: 'Wrench', is_core: false, is_active: true },
  { id: 'mod_trade_in', code: 'TRADE_IN', name: 'Trade-In / Buyback', description: 'Used device grading, evaluation and trade credit', category_group: 'OPTIONAL', icon: 'RefreshCw', is_core: false, is_active: true },
  { id: 'mod_recharge', code: 'RECHARGE', name: 'Airtime & Recharge', description: 'Instant telecom topup and commission accounting', category_group: 'OPTIONAL', icon: 'Zap', is_core: false, is_active: true },
  { id: 'mod_warranty', code: 'WARRANTY', name: 'Warranty Center', description: 'Serial/IMEI warranty card claims and renewals', category_group: 'OPTIONAL', icon: 'ShieldCheck', is_core: false, is_active: true },
  { id: 'mod_batch', code: 'BATCH', name: 'Batch & Lot Control', description: 'Manufacture batch numbers and lot tracking', category_group: 'OPTIONAL', icon: 'Layers', is_core: false, is_active: true },
  { id: 'mod_expiry', code: 'EXPIRY', name: 'Expiry Date Monitor', description: 'Perishable countdown, markdown triggers & write-offs', category_group: 'OPTIONAL', icon: 'CalendarAlert', is_core: false, is_active: true },
  { id: 'mod_weight', code: 'WEIGHT', name: 'Weight Scale Sales', description: 'Decimal unit sales, scale tare, kg/lb pricing', category_group: 'OPTIONAL', icon: 'Scale', is_core: false, is_active: true },
  { id: 'mod_barcode', code: 'BARCODE', name: 'Barcode Generator', description: 'UPC/EAN-13 label printing and fast scanning', category_group: 'OPTIONAL', icon: 'ScanLine', is_core: false, is_active: true },
  { id: 'mod_books', code: 'BOOKS', name: 'Book Catalog Master', description: 'ISBN, author, publisher, genre, and shelf location', category_group: 'OPTIONAL', icon: 'BookOpen', is_core: false, is_active: true },
  { id: 'mod_digital_services', code: 'DIGITAL_SERVICES', name: 'ফটোকপি ও অনলাইন সেবা', description: 'ফটোকপি, কালার প্রিন্টিং, লেমিনেটিং, এনআইডি ও নাগরিক সেবা', category_group: 'OPTIONAL', icon: 'Globe', is_core: false, is_active: true },
  { id: 'mod_barcode_studio', code: 'BARCODE_PRINT', name: 'বারকোড স্টিকার প্রিন্ট', description: 'থার্মাল লেবেল ও প্রাইস ট্যাগ স্টিকার জেনারেশন', category_group: 'OPTIONAL', icon: 'Printer', is_core: false, is_active: true },
  { id: 'mod_members', code: 'MEMBERS', name: 'Library Membership', description: 'Member cards, borrowing limits and active loans', category_group: 'OPTIONAL', icon: 'Contact2', is_core: false, is_active: true },
  { id: 'mod_borrowing', code: 'BORROWING', name: 'Circulation & Borrowing', description: 'Book issue, due date tracking, return & late fees', category_group: 'OPTIONAL', icon: 'BookmarkCheck', is_core: false, is_active: true },
  { id: 'mod_loyalty', code: 'LOYALTY', name: 'Loyalty Points', description: 'Customer reward points and tiered discounts', category_group: 'OPTIONAL', icon: 'Gift', is_core: false, is_active: true },
  { id: 'mod_commissions', code: 'COMMISSIONS', name: 'Staff Commissions', description: 'Agent/Clerk sales incentive tracking', category_group: 'OPTIONAL', icon: 'BadgePercent', is_core: false, is_active: true },
  { id: 'mod_delivery', code: 'DELIVERY', name: 'Dispatch & Delivery', description: 'Order delivery dispatch and courier tracking', category_group: 'OPTIONAL', icon: 'Navigation', is_core: false, is_active: true }
];

// ==================================================
// BUSINESS CATEGORIES
// ==================================================
export const INITIAL_BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: 'cat_telecom',
    code: 'TELECOM',
    name: 'Telecom & Mobile',
    description: 'Smartphones, SIM cards, device repairs, IMEIs, airtime recharge, trade-ins and warranties.',
    icon: 'Smartphone',
    is_system: true,
    is_active: true,
    configuration: {
      requiresIMEI: true,
      requiresSerial: false,
      requiresBatch: false,
      supportsExpiry: false,
      supportsWeight: false,
      supportsBorrowing: false,
      supportsLateFee: false,
      supportsRepairs: true,
      supportsTradeIn: true,
      supportsRecharge: true,
      supportsWarranty: true,
      defaultWarrantyMonths: 12,
      defaultTrackingMode: 'TRACKING_IMEI',
      defaultTaxRate: 0
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat_grocery',
    code: 'GROCERY',
    name: 'Grocery & Supermarket',
    description: 'Fresh produce, packaged goods, weight scale items, batch lots, and expiry date management.',
    icon: 'ShoppingBag',
    is_system: true,
    is_active: true,
    configuration: {
      requiresIMEI: false,
      requiresSerial: false,
      requiresBatch: true,
      supportsExpiry: true,
      supportsWeight: true,
      supportsBorrowing: false,
      supportsLateFee: false,
      supportsRepairs: false,
      supportsTradeIn: false,
      supportsRecharge: false,
      supportsWarranty: false,
      defaultTrackingMode: 'TRACKING_BATCH',
      defaultTaxRate: 0
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat_stationery',
    code: 'STATIONERY',
    name: 'Stationery & Office Supplies',
    description: 'Pens, paper, notebooks, desk equipment, art supplies, and high-frequency retail scanning.',
    icon: 'PenTool',
    is_system: true,
    is_active: true,
    configuration: {
      requiresIMEI: false,
      requiresSerial: false,
      requiresBatch: false,
      supportsExpiry: false,
      supportsWeight: false,
      supportsBorrowing: false,
      supportsLateFee: false,
      supportsRepairs: false,
      supportsTradeIn: false,
      supportsRecharge: false,
      supportsWarranty: false,
      defaultTrackingMode: 'TRACKING_QUANTITY',
      defaultTaxRate: 0
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat_library',
    code: 'LIBRARY',
    name: 'Library & Archive',
    description: 'Book cataloging, member issue/return circulation, overdue fines, and reservation management.',
    icon: 'Library',
    is_system: true,
    is_active: true,
    configuration: {
      requiresIMEI: false,
      requiresSerial: false,
      requiresBatch: false,
      supportsExpiry: false,
      supportsWeight: false,
      supportsBorrowing: true,
      supportsLateFee: true,
      borrowingDurationDays: 14,
      lateFeePerDay: 1.0,
      supportsRepairs: false,
      supportsTradeIn: false,
      supportsRecharge: false,
      supportsWarranty: false,
      defaultTrackingMode: 'TRACKING_BOOK',
      defaultTaxRate: 0
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cat_electronics',
    code: 'ELECTRONICS',
    name: 'Consumer Electronics & Appliances',
    description: 'Televisions, laptops, audio gear, serialized units, warranty claims and authorized repairs.',
    icon: 'Cpu',
    is_system: true,
    is_active: true,
    configuration: {
      requiresIMEI: false,
      requiresSerial: true,
      requiresBatch: false,
      supportsExpiry: false,
      supportsWeight: false,
      supportsBorrowing: false,
      supportsLateFee: false,
      supportsRepairs: true,
      supportsTradeIn: true,
      supportsRecharge: false,
      supportsWarranty: true,
      defaultWarrantyMonths: 24,
      defaultTrackingMode: 'TRACKING_SERIAL',
      defaultTaxRate: 0
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// ==================================================
// BUSINESS CATEGORY MODULE MAPPINGS
// ==================================================
export const INITIAL_CATEGORY_MODULES: BusinessCategoryModule[] = [
  // TELECOM
  { business_category_id: 'cat_telecom', module_id: 'mod_sales', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_purchases', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_inventory', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_customers', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_suppliers', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_payments', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_repairs', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_imei', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_serial', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_trade_in', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_recharge', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_warranty', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_accounting', enabled_by_default: true },
  { business_category_id: 'cat_telecom', module_id: 'mod_reports', enabled_by_default: true },

  // GROCERY
  { business_category_id: 'cat_grocery', module_id: 'mod_sales', enabled_by_default: true },
  { business_category_id: 'cat_grocery', module_id: 'mod_purchases', enabled_by_default: true },
  { business_category_id: 'cat_grocery', module_id: 'mod_inventory', enabled_by_default: true },
  { business_category_id: 'cat_grocery', module_id: 'mod_customers', enabled_by_default: true },
  { business_category_id: 'cat_grocery', module_id: 'mod_suppliers', enabled_by_default: true },
  { business_category_id: 'cat_grocery', module_id: 'mod_payments', enabled_by_default: true },
  { business_category_id: 'cat_grocery', module_id: 'mod_batch', enabled_by_default: true },
  { business_category_id: 'cat_grocery', module_id: 'mod_expiry', enabled_by_default: true },
  { business_category_id: 'cat_grocery', module_id: 'mod_weight', enabled_by_default: true },
  { business_category_id: 'cat_grocery', module_id: 'mod_barcode', enabled_by_default: true },
  { business_category_id: 'cat_grocery', module_id: 'mod_accounting', enabled_by_default: true },
  { business_category_id: 'cat_grocery', module_id: 'mod_reports', enabled_by_default: true },

  // STATIONERY
  { business_category_id: 'cat_stationery', module_id: 'mod_sales', enabled_by_default: true },
  { business_category_id: 'cat_stationery', module_id: 'mod_purchases', enabled_by_default: true },
  { business_category_id: 'cat_stationery', module_id: 'mod_inventory', enabled_by_default: true },
  { business_category_id: 'cat_stationery', module_id: 'mod_customers', enabled_by_default: true },
  { business_category_id: 'cat_stationery', module_id: 'mod_suppliers', enabled_by_default: true },
  { business_category_id: 'cat_stationery', module_id: 'mod_payments', enabled_by_default: true },
  { business_category_id: 'cat_stationery', module_id: 'mod_barcode', enabled_by_default: true },
  { business_category_id: 'cat_stationery', module_id: 'mod_accounting', enabled_by_default: true },
  { business_category_id: 'cat_stationery', module_id: 'mod_reports', enabled_by_default: true },

  // LIBRARY
  { business_category_id: 'cat_library', module_id: 'mod_books', enabled_by_default: true },
  { business_category_id: 'cat_library', module_id: 'mod_members', enabled_by_default: true },
  { business_category_id: 'cat_library', module_id: 'mod_borrowing', enabled_by_default: true },
  { business_category_id: 'cat_library', module_id: 'mod_inventory', enabled_by_default: true },
  { business_category_id: 'cat_library', module_id: 'mod_payments', enabled_by_default: true },
  { business_category_id: 'cat_library', module_id: 'mod_reports', enabled_by_default: true },

  // ELECTRONICS
  { business_category_id: 'cat_electronics', module_id: 'mod_sales', enabled_by_default: true },
  { business_category_id: 'cat_electronics', module_id: 'mod_purchases', enabled_by_default: true },
  { business_category_id: 'cat_electronics', module_id: 'mod_inventory', enabled_by_default: true },
  { business_category_id: 'cat_electronics', module_id: 'mod_serial', enabled_by_default: true },
  { business_category_id: 'cat_electronics', module_id: 'mod_repairs', enabled_by_default: true },
  { business_category_id: 'cat_electronics', module_id: 'mod_warranty', enabled_by_default: true },
  { business_category_id: 'cat_electronics', module_id: 'mod_customers', enabled_by_default: true },
  { business_category_id: 'cat_electronics', module_id: 'mod_suppliers', enabled_by_default: true },
  { business_category_id: 'cat_electronics', module_id: 'mod_payments', enabled_by_default: true },
  { business_category_id: 'cat_electronics', module_id: 'mod_accounting', enabled_by_default: true },
  { business_category_id: 'cat_electronics', module_id: 'mod_reports', enabled_by_default: true }
];

// ==================================================
// CUSTOM FIELD DEFINITIONS
// ==================================================
export const INITIAL_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  // Telecom fields
  { id: 'cf_ram', entity_type: 'product', business_category_id: 'cat_telecom', name: 'RAM (GB)', code: 'ram', field_type: 'select', options: ['4GB', '6GB', '8GB', '12GB', '16GB'], is_required: false },
  { id: 'cf_storage', entity_type: 'product', business_category_id: 'cat_telecom', name: 'Internal Storage', code: 'storage', field_type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'], is_required: false },
  { id: 'cf_color', entity_type: 'product', business_category_id: 'cat_telecom', name: 'Color Finish', code: 'color', field_type: 'text', is_required: false, placeholder: 'e.g. Midnight Black' },
  { id: 'cf_network', entity_type: 'product', business_category_id: 'cat_telecom', name: 'Network Tech', code: 'network_type', field_type: 'select', options: ['5G / LTE', '4G LTE', 'Dual SIM 5G', 'WiFi Only'], is_required: false },

  // Grocery fields
  { id: 'cf_brand', entity_type: 'product', business_category_id: 'cat_grocery', name: 'Brand Name', code: 'brand', field_type: 'text', is_required: false, placeholder: 'e.g. Nestlé, Organic Farms' },
  { id: 'cf_unit_size', entity_type: 'product', business_category_id: 'cat_grocery', name: 'Pack / Unit Size', code: 'unit_size', field_type: 'text', is_required: false, placeholder: 'e.g. 500g, 1L, 12 Pack' },
  { id: 'cf_temp_req', entity_type: 'product', business_category_id: 'cat_grocery', name: 'Storage Temp', code: 'temp_requirement', field_type: 'select', options: ['Ambient / Room', 'Chilled (0-4°C)', 'Frozen (-18°C)'], is_required: false },

  // Book fields
  { id: 'cf_author', entity_type: 'product', business_category_id: 'cat_library', name: 'Primary Author', code: 'author', field_type: 'text', is_required: true, placeholder: 'e.g. Robert C. Martin' },
  { id: 'cf_publisher', entity_type: 'product', business_category_id: 'cat_library', name: 'Publisher House', code: 'publisher', field_type: 'text', is_required: false, placeholder: 'e.g. O\'Reilly, Pearson' },
  { id: 'cf_isbn', entity_type: 'product', business_category_id: 'cat_library', name: 'ISBN-13', code: 'isbn', field_type: 'text', is_required: true, placeholder: '978-0132350884' },
  { id: 'cf_edition', entity_type: 'product', business_category_id: 'cat_library', name: 'Edition', code: 'edition', field_type: 'text', is_required: false, placeholder: '2nd Revised Edition' },

  // Electronics fields
  { id: 'cf_power_rating', entity_type: 'product', business_category_id: 'cat_electronics', name: 'Power Consumption', code: 'power_rating', field_type: 'text', is_required: false, placeholder: 'e.g. 65W, 220V' },
  { id: 'cf_screen_size', entity_type: 'product', business_category_id: 'cat_electronics', name: 'Screen Size (in)', code: 'screen_size', field_type: 'text', is_required: false, placeholder: 'e.g. 15.6", 65"' }
];

// ==================================================
// MULTI-TENANTS (CLEAN INITIAL STATE)
// ==================================================
export const INITIAL_TENANTS: Tenant[] = [];

// ==================================================
// GENERIC PRODUCTS & INVENTORY (CLEAN INITIAL STATE)
// ==================================================
export const INITIAL_PRODUCTS: GenericProduct[] = [];
export const INITIAL_DEVICES: DeviceItem[] = [];
export const INITIAL_BATCHES: ProductBatch[] = [];
export const INITIAL_BOOKS: BookItem[] = [];
export const INITIAL_CUSTOMERS: CustomerMember[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_REPAIRS: RepairTicket[] = [];
export const INITIAL_TRADE_INS: TradeInRecord[] = [];
export const INITIAL_RECHARGES: RechargeRecord[] = [];
export const INITIAL_BORROW_RECORDS: BorrowRecord[] = [];
export const INITIAL_SALES: SaleTransaction[] = [];
export const INITIAL_ACCOUNTING: AccountingEntry[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

