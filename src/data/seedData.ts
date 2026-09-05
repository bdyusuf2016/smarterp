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
  // 1. Stationery Category Custom Fields (বই-খাতা ও স্টেশনারি)
  { id: 'cf_stat_paper_gsm', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['কাগজ ও অফসেট রিম'], name: 'কাগজের জিএসএম (GSM)', code: 'paper_gsm', field_type: 'select', options: ['70 GSM', '75 GSM', '80 GSM', '100 GSM', '120 GSM', '150 GSM', '200+ GSM'], is_required: false },
  { id: 'cf_stat_paper_size', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['কাগজ ও অফসেট রিম'], name: 'কাগজের সাইজ (Paper Size)', code: 'paper_size', field_type: 'select', options: ['A4 (210 x 297 mm)', 'A3 (297 x 420 mm)', 'Legal (8.5 x 14 in)', 'Letter (8.5 x 11 in)', 'Foolscap (F4)'], is_required: false },
  { id: 'cf_stat_sheets', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['কাগজ ও অফসেট রিম'], name: 'শিট সংখ্যা (Sheets per Ream)', code: 'sheets_per_ream', field_type: 'select', options: ['500 Sheets (1 Ream)', '450 Sheets', '250 Sheets', '100 Sheets', '50 Sheets'], is_required: false },
  { id: 'cf_stat_paper_finish', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['কাগজ ও অফসেট রিম'], name: 'কাগজের টাইপ (Finish)', code: 'paper_finish', field_type: 'select', options: ['Offset White (অফসেট হোয়াইট)', 'Glossy Photo Paper (চকচকে ফটো)', 'Matte Photo Paper', 'Art Paper', 'Newsprint', 'Kraft / Brown Paper'], is_required: false },
  
  { id: 'cf_stat_nb_pages', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['খাতা ও নোটবুক'], name: 'পৃষ্ঠা সংখ্যা (Pages)', code: 'pages', field_type: 'select', options: ['48 Pages', '64 Pages', '96 Pages', '120 Pages', '160 Pages', '200 Pages', '300 Pages'], is_required: false },
  { id: 'cf_stat_nb_ruling', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['খাতা ও নোটবুক'], name: 'রুলিং টাইপ (Ruling Type)', code: 'ruling_type', field_type: 'select', options: ['একটানা রুলটানা (Single Line)', 'বাংলা মার্জিন খাতা', 'ইংরেজি চারদাগি রুল', 'অংক / গ্রাফ ছককাটা (Grid)', 'সাদা / প্লেইন (Unruled)'], is_required: false },
  { id: 'cf_stat_nb_cover', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['খাতা ও নোটবুক'], name: 'কভার টাইপ (Cover)', code: 'cover_type', field_type: 'select', options: ['হার্ড কভার (Hardcover)', 'পেপারব্যাক (Softcover)', 'স্পাইরাল বাইন্ডিং (Spiral)', 'প্লাস্টিক লেমিনেটেড'], is_required: false },

  { id: 'cf_stat_ink_color', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['কলম, পেন্সিল ও মার্কার'], name: 'কালির রঙ (Ink Color)', code: 'ink_color', field_type: 'select', options: ['নীল (Blue)', 'কালো (Black)', 'লাল (Red)', 'সবুজ (Green)', 'মাল্টিকালার (Multicolor)'], is_required: false },
  { id: 'cf_stat_nib_size', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['কলম, পেন্সিল ও মার্কার'], name: 'নিব / পয়েন্ট সাইজ (Nib Size)', code: 'nib_size', field_type: 'select', options: ['0.5 mm (Fine)', '0.6 mm', '0.7 mm (Medium)', '1.0 mm (Bold)', 'Chisel Tip (মার্কার)'], is_required: false },

  { id: 'cf_stat_book_author', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['বই, গাইড ও টেস্ট পেপার'], name: 'লেখক / সম্পাদক (Author)', code: 'author', field_type: 'text', placeholder: 'যেমন: অধ্যাপক ড. মুহম্মদ জাফর ইকবাল', is_required: false },
  { id: 'cf_stat_book_pub', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['বই, গাইড ও টেস্ট পেপার'], name: 'প্রকাশনী (Publisher)', code: 'publisher', field_type: 'text', placeholder: 'যেমন: অনুপম, লেকচার, পাঞ্জেরী', is_required: false },
  { id: 'cf_stat_art_shades', entity_type: 'product', business_category_id: 'cat_stationery', target_subcategories: ['আর্ট, ড্রয়িং ও কালার'], name: 'কালার শেড সংখ্যা (Shades)', code: 'color_shades', field_type: 'select', options: ['12 Shades', '18 Shades', '24 Shades', '36 Shades', '48 Shades'], is_required: false },

  // 2. Telecom Category Custom Fields (টেলিকম ও মোবাইল শপ)
  { id: 'cf_tel_ram', entity_type: 'product', business_category_id: 'cat_telecom', target_subcategories: ['স্মার্টফোন ও ফিচারফোন'], name: 'RAM (GB)', code: 'ram', field_type: 'select', options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB'], is_required: false },
  { id: 'cf_tel_storage', entity_type: 'product', business_category_id: 'cat_telecom', target_subcategories: ['স্মার্টফোন ও ফিচারফোন'], name: 'ইন্টারনাল স্টোরেজ (ROM)', code: 'storage', field_type: 'select', options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'], is_required: false },
  { id: 'cf_tel_color', entity_type: 'product', business_category_id: 'cat_telecom', target_subcategories: ['স্মার্টফোন ও ফিচারফোন', 'গ্লাস ও ব্যাক কভার'], name: 'কালার / রঙ (Color)', code: 'color', field_type: 'text', placeholder: 'যেমন: Midnight Black, Titanium Blue', is_required: false },
  { id: 'cf_tel_network', entity_type: 'product', business_category_id: 'cat_telecom', target_subcategories: ['স্মার্টফোন ও ফিচারফোন', 'সিম, রাউটার ও মেমোরি কার্ড'], name: 'নেটওয়ার্ক টাইপ (Network)', code: 'network_type', field_type: 'select', options: ['5G Dual SIM', '4G LTE VoLTE', '4G + 2G Dual SIM', 'WiFi Only'], is_required: false },
  { id: 'cf_tel_wattage', entity_type: 'product', business_category_id: 'cat_telecom', target_subcategories: ['চার্জার ও ডেটা কেবল'], name: 'আউটপুট ওয়াট (Wattage)', code: 'wattage', field_type: 'select', options: ['18W Quick Charge', '20W PD Fast', '25W Fast Charge', '33W Super Charge', '45W PD Fast', '65W GaN Fast', '100W+ Flash Charge'], is_required: false },
  { id: 'cf_tel_port', entity_type: 'product', business_category_id: 'cat_telecom', target_subcategories: ['চার্জার ও ডেটা কেবল'], name: 'পোর্ট টাইপ (Port Type)', code: 'port_type', field_type: 'select', options: ['Type-C to Type-C', 'Type-C to Lightning (Apple)', 'USB-A to Type-C', 'USB-A to Lightning', 'Micro-USB'], is_required: false },
  { id: 'cf_tel_anc', entity_type: 'product', business_category_id: 'cat_telecom', target_subcategories: ['হেডফোন, বাডস ও স্পিকার'], name: 'নয়েজ ক্যান্সেলেশন (ANC)', code: 'anc_type', field_type: 'select', options: ['Active Noise Cancellation (ANC)', 'Environmental Noise (ENC)', 'Standard Audio'], is_required: false },
  { id: 'cf_tel_mat', entity_type: 'product', business_category_id: 'cat_telecom', target_subcategories: ['গ্লাস ও ব্যাক কভার'], name: 'ম্যাটেরিয়াল (Material)', code: 'material', field_type: 'select', options: ['9D Tempered Glass', 'Privacy Matte Glass', 'Silicone TPU Case', 'Leather Finish Flip', 'Shockproof Hard Case'], is_required: false },

  // 3. Grocery Category Custom Fields (মুদি ও সুপারশপ)
  { id: 'cf_groc_variety', entity_type: 'product', business_category_id: 'cat_grocery', target_subcategories: ['চাল, ডাল ও আটা-ময়দা'], name: 'চালের জাত / ভ্যারাইটি', code: 'rice_variety', field_type: 'select', options: ['নাজিরশাইল প্রিমিয়াম', 'মিনিকেট অটো রাইস', 'বাসমতী চাল', 'চিনিগুড়া সুগন্ধি', 'কাটারিভোগ', 'বিআর-২৮ সিদ্ধ চাল'], is_required: false },
  { id: 'cf_groc_oil_type', entity_type: 'product', business_category_id: 'cat_grocery', target_subcategories: ['তেল, ঘি ও মশলাপাতি'], name: 'তেলের প্রকার (Oil Type)', code: 'oil_type', field_type: 'select', options: ['ফর্টিফাইড সয়াবিন তেল', 'ঘানি ভাঙা খাঁটি সরিষার তেল', 'সানফ্লাওয়ার অয়েল', 'এক্সট্রা ভার্জিন অলিভ অয়েল', 'খাঁটি গাওয়া ঘি'], is_required: false },
  { id: 'cf_groc_temp', entity_type: 'product', business_category_id: 'cat_grocery', target_subcategories: ['দুধ, ডিম ও ডেইরি', 'অন্যান্য মুদি পণ্য'], name: 'সংরক্ষণ তাপমাত্রা (Storage Temp)', code: 'temp_requirement', field_type: 'select', options: ['Ambient / Room (স্বাভাবিক)', 'Chilled (0-4°C চিলার)', 'Frozen (-18°C ডিপ ফ্রিজ)'], is_required: false },

  // 4. Digital Services Category Custom Fields (ফটোকপি ও ডিজিটাল সেবা)
  { id: 'cf_serv_size', entity_type: 'product', business_category_id: 'cat_services', target_subcategories: ['ফটোকপি ও জেরক্স', 'কালার ও ব্ল্যাক প্রিন্টিং', 'ছবি প্রিন্ট ও পাসপোর্ট সাইজ ছবি'], name: 'প্রিন্ট পেপার সাইজ (Size)', code: 'print_paper_size', field_type: 'select', options: ['A4 Standard', 'Legal Size', 'A3 Large', '4R Photo Size', 'Stamp Size'], is_required: false },
  { id: 'cf_serv_sides', entity_type: 'product', business_category_id: 'cat_services', target_subcategories: ['ফটোকপি ও জেরক্স', 'কালার ও ব্ল্যাক প্রিন্টিং'], name: 'প্রিন্ট সাইড (Print Sides)', code: 'print_sides', field_type: 'select', options: ['এক পিঠ (Single Side)', 'উভয় পিঠ (Double Sided)'], is_required: false },
  { id: 'cf_serv_app_type', entity_type: 'product', business_category_id: 'cat_services', target_subcategories: ['অনলাইন আবেদন ও সরকারি ফরম'], name: 'আবেদনের ধরন (Application Type)', code: 'application_type', field_type: 'select', options: ['সরকারি চাকরির আবেদন', 'পাসপোর্ট ও ভিসা ফরম', 'এনআইডি ও ভোটার তথ্য সংশোধন', 'অনলাইন জন্ম নিবন্ধন', 'জমি-জমা ই-পর্চা / খতিয়ান', 'বিশ্ববিদ্যালয় ভর্তি আবেদন'], is_required: false },

  // 5. Library Category Custom Fields (লাইব্রেরি ও বইঘর)
  { id: 'cf_lib_author', entity_type: 'product', business_category_id: 'cat_library', name: 'লেখক (Author)', code: 'author', field_type: 'text', is_required: false, placeholder: 'যেমন: কাজী নজরুল ইসলাম, রবীন্দ্রনাথ ঠাকুর' },
  { id: 'cf_lib_publisher', entity_type: 'product', business_category_id: 'cat_library', name: 'প্রকাশনী (Publisher)', code: 'publisher', field_type: 'text', is_required: false, placeholder: 'যেমন: সময় প্রকাশনী, ঐতিহ্য' },
  { id: 'cf_lib_isbn', entity_type: 'product', business_category_id: 'cat_library', name: 'ISBN-13 কোড', code: 'isbn', field_type: 'text', is_required: false, placeholder: '978-XXXXXXXXXX' },
  { id: 'cf_lib_edition', entity_type: 'product', business_category_id: 'cat_library', name: 'সংস্করণ (Edition)', code: 'edition', field_type: 'text', is_required: false, placeholder: 'যেমন: ৪র্থ সংস্করণ ২০২৩' }
];

// ==================================================
// MULTI-TENANTS (CLEAN INITIAL STATE - NO DEMO SHOPS)
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

