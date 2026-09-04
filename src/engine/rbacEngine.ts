import { UserRole } from '../types';

export interface PermissionDefinition {
  code: string;
  module: string;
  name: string;
  description: string;
  category: 'CORE' | 'SALES' | 'INVENTORY' | 'TELECOM' | 'GROCERY' | 'STATIONERY' | 'FINANCE' | 'SYSTEM';
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Dashboard & Core
  { code: 'dashboard.view', module: 'DASHBOARD', name: 'ড্যাশবোর্ড দর্শন', description: 'সামগ্রিক সেলস ও স্টক ওভারভিউ দেখা', category: 'CORE' },
  
  // Sales & POS
  { code: 'sales.pos_access', module: 'SALES', name: 'POS সেলস এক্সেস', description: 'কুইক বিলিং ও বিক্রয় রসিদ তৈরি', category: 'SALES' },
  { code: 'sales.give_discount', module: 'SALES', name: 'ডিসকাউন্ট অনুমতি', description: 'পণ্যে বিশেষ ছাড় বা ডিসকাউন্ট প্রদান', category: 'SALES' },
  { code: 'sales.void_invoice', module: 'SALES', name: 'ইনভয়েস বাতিল', description: 'ভুল ইনভয়েস বাতিল বা রিফান্ড অনুমোদন', category: 'SALES' },
  { code: 'sales.view_history', module: 'SALES', name: 'বিক্রয় ইতিহাস', description: 'পূর্ববর্তী সকল বিক্রয় রসিদ দেখা', category: 'SALES' },
  
  // Products & Inventory
  { code: 'products.view', module: 'PRODUCTS', name: 'প্রোডাক্ট তালিকা দর্শন', description: 'দোকানের সকল পণ্যের ক্যাটালগ ও মূল্য দেখা', category: 'INVENTORY' },
  { code: 'products.create', module: 'PRODUCTS', name: 'নতুন প্রোডাক্ট এন্ট্রি', description: 'ক্যাটালগে নতুন আইটেম যুক্ত করা', category: 'INVENTORY' },
  { code: 'products.edit_price', module: 'PRODUCTS', name: 'মূল্য ও স্টক আপডেট', description: 'ক্রয় ও বিক্রয় মূল্য পরিবর্তন এবং স্টক সমন্বয়', category: 'INVENTORY' },
  { code: 'products.delete', module: 'PRODUCTS', name: 'প্রোডাক্ট ডিলিট', description: 'ক্যাটালগ থেকে পণ্য মুছে ফেলা', category: 'INVENTORY' },
  { code: 'barcode.print', module: 'BARCODE_PRINT', name: 'বারকোড স্টিকার প্রিন্ট স্টুডিও', description: 'বারকোড ও প্রাইস ট্যাগ স্টিকার জেনারেট ও প্রিন্ট', category: 'INVENTORY' },
  { code: 'tools.billing_calc', module: 'BILLING_CALC', name: 'ক্যাশ ও বিলিং ক্যালকুলেটর', description: 'নোট গণনা ও দ্রুত ক্যাশ ফেরত হিসাব টুল', category: 'SALES' },
  
  // Customers & Dues
  { code: 'customers.view', module: 'CRM', name: 'কাস্টমার তালিকা', description: 'গ্রাহকদের নাম ও ফোন নম্বর দেখা', category: 'SALES' },
  { code: 'customers.manage_due', module: 'CRM', name: 'বাকির খাতা ও কালেকশন', description: 'বাকি এন্ট্রি ও বকেয়া টাকা জমা নেওয়া', category: 'FINANCE' },
  
  // Suppliers & Vendor Payables
  { code: 'suppliers.view', module: 'PURCHASE', name: 'সাপ্লায়ার ও ভেন্ডর তালিকা', description: 'পণ্য সরবরাহকারীদের নাম, ফোন ও দেনা দেখা', category: 'FINANCE' },
  { code: 'suppliers.manage_payments', module: 'PURCHASE', name: 'সাপ্লায়ার বিল পরিশোধ ও চালান', description: 'সাপ্লায়ারদের বিল পেমেন্ট ও ক্রয় চালান এন্ট্রি', category: 'FINANCE' },
  
  // Telecom Specialization (IMEI, Repairs, Recharge)
  { code: 'telecom.imei_stock', module: 'IMEI', name: 'IMEI হ্যান্ডসেট স্টক', description: 'মোবাইল ফোনের IMEI এন্ট্রি ও ভেরিফিকেশন', category: 'TELECOM' },
  { code: 'telecom.repairs_manage', module: 'REPAIRS', name: 'মোবাইল রিপেয়ারিং সার্ভিস', description: 'সার্ভিসিং টিকেট তৈরি, ডায়াগনসিস ও ডেলিভারি', category: 'TELECOM' },
  { code: 'telecom.recharge_mfs', module: 'RECHARGE', name: 'মোবাইল রিচার্জ ও MFS', description: 'ফ্লেক্সিলোড, বিকাশ/নগদ লেনদেন ও কমিশন', category: 'TELECOM' },

  // Grocery Specialization
  { code: 'grocery.batch_expiry', module: 'BATCH_EXPIRY', name: 'ব্যাচ ও মেয়াদ ট্র্যাকিং', description: 'পণ্যের মেয়াদ উত্তীর্ণ ও ব্যাচ কন্ট্রোল', category: 'GROCERY' },
  { code: 'grocery.weigh_scale', module: 'WEIGH_SCALE', name: 'ডিজিটাল ওয়েট স্কেল', description: 'ওজন পরিমাপক স্কেল কানেকশন ও ওজন ভিত্তিক বিলিং', category: 'GROCERY' },

  // Stationery, Bookstore & Digital Services (বই-খাতা, ফটোকপি ও অনলাইন সেবা)
  { code: 'stationery.book_catalog', module: 'BOOK_CATALOG', name: 'বই ও প্রকাশনী ক্যাটালগ', description: 'বইয়ের নাম, লেখক, প্রকাশনী, এডিশন ও স্টেশনারি খাতা ব্যবস্থাপনা', category: 'STATIONERY' },
  { code: 'stationery.stock_sales', module: 'CIRCULATION', name: 'বই-খাতা ও স্টেশনারি সেলস', description: 'গাইড বই, খাতা, কলম ও স্টেশনারি খুচরা/পাইকারি বিক্রয়', category: 'STATIONERY' },
  { code: 'services.digital_desk', module: 'DIGITAL_SERVICES', name: 'ফটোকপি, প্রিন্ট ও অনলাইন সার্ভিস', description: 'ফটোকপি, কালার প্রিন্টিং, লেমিনেটিং, এনআইডি ও অনলাইন ফরম সেবা', category: 'STATIONERY' },

  // Finance & Accounting
  { code: 'accounting.view_ledger', module: 'ACCOUNTING', name: 'ক্যাশ খাতা ও হিসাব', description: 'দৈনিক আয়-ব্যয়, ক্যাশ ও লেজার খাতা দেখা', category: 'FINANCE' },
  { code: 'accounting.manage_expense', module: 'ACCOUNTING', name: 'খরচ ও এন্ট্রি ব্যবস্থাপনা', description: 'দোকানের খরচ, ব্যাংক ট্রানজেকশন ও ক্যাশ ক্লোজিং', category: 'FINANCE' },

  // Reports
  { code: 'reports.view_analytics', module: 'REPORTS', name: 'ব্যবসায়িক রিপোর্ট', description: 'দৈনিক/মাসিক লাভ-ক্ষতি ও সেলস রিপোর্ট দেখা', category: 'FINANCE' },

  // System & Platform Admin
  { code: 'system.staff_manage', module: 'SETTINGS', name: 'কর্মচারী ও পারমিশন কন্ট্রোল', description: 'দোকানের কর্মচারী তৈরি, রোল ও কাস্টম পারমিশন নির্ধারণ', category: 'SYSTEM' },
  { code: 'system.settings_manage', module: 'SETTINGS', name: 'দোকান সেটিংস কনফিগার', description: 'দোকানের প্রোফাইল, প্রিন্টার ও ইনভয়েস কনফিগ', category: 'SYSTEM' },
  { code: 'system.category_studio', module: 'SETTINGS', name: 'ক্যাটাগরি স্টুডিও কন্ট্রোল', description: 'মডিউল অন/অফ ও কাস্টম ফিল্ড বিল্ডার', category: 'SYSTEM' },
  { code: 'system.audit_view', module: 'SETTINGS', name: 'সিকিউরিটি অডিট লগ', description: 'ইউজার লগইন ও ডেটা পরিবর্তনের অডিট ট্রেইল', category: 'SYSTEM' },
  { code: 'system.super_admin_matrix', module: 'PLATFORM', name: 'প্ল্যাটফর্ম ও মাল্টি-টেন্যান্ট ম্যাট্রিক্স', description: 'সিস্টেম অ্যাডমিন গ্লোবাল নিয়ন্ত্রণ ও টেন্যান্ট প্রভিশনিং', category: 'SYSTEM' },
];

/**
 * Granular Role to Permission Mappings
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map(p => p.code), // Full Unrestricted Access
  
  ADMIN: [
    'dashboard.view',
    'sales.pos_access',
    'sales.give_discount',
    'sales.void_invoice',
    'sales.view_history',
    'products.view',
    'products.create',
    'products.edit_price',
    'products.delete',
    'customers.view',
    'customers.manage_due',
    'suppliers.view',
    'suppliers.manage_payments',
    'telecom.imei_stock',
    'telecom.repairs_manage',
    'telecom.recharge_mfs',
    'grocery.batch_expiry',
    'grocery.weigh_scale',
    'stationery.book_catalog',
    'stationery.stock_sales',
    'services.digital_desk',
    'barcode.print',
    'tools.billing_calc',
    'accounting.view_ledger',
    'accounting.manage_expense',
    'reports.view_analytics',
    'system.staff_manage',
    'system.settings_manage',
    'system.audit_view'
  ],

  MANAGER: [
    'dashboard.view',
    'sales.pos_access',
    'sales.give_discount',
    'sales.view_history',
    'products.view',
    'products.create',
    'products.edit_price',
    'customers.view',
    'customers.manage_due',
    'suppliers.view',
    'suppliers.manage_payments',
    'telecom.imei_stock',
    'telecom.repairs_manage',
    'telecom.recharge_mfs',
    'grocery.batch_expiry',
    'grocery.weigh_scale',
    'stationery.book_catalog',
    'stationery.stock_sales',
    'services.digital_desk',
    'barcode.print',
    'tools.billing_calc',
    'accounting.view_ledger',
    'reports.view_analytics'
  ],

  CASHIER: [
    'dashboard.view',
    'sales.pos_access',
    'sales.view_history',
    'products.view',
    'customers.view',
    'customers.manage_due',
    'telecom.recharge_mfs',
    'stationery.stock_sales',
    'services.digital_desk',
    'barcode.print',
    'tools.billing_calc'
  ],

  TECHNICIAN: [
    'dashboard.view',
    'telecom.repairs_manage',
    'telecom.imei_stock',
    'products.view',
    'customers.view'
  ],

  LIBRARIAN: [
    'dashboard.view',
    'stationery.book_catalog',
    'stationery.stock_sales',
    'services.digital_desk',
    'sales.pos_access',
    'products.view',
    'customers.view',
    'customers.manage_due',
    'barcode.print',
    'tools.billing_calc'
  ]
};

export class RbacEngine {
  static getRolePermissions(role: UserRole): string[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  static hasPermission(role: UserRole, permissionCode: string): boolean {
    if (role === 'SUPER_ADMIN') return true;
    const permissions = this.getRolePermissions(role);
    return permissions.includes(permissionCode);
  }

  static hasAnyPermission(role: UserRole, permissionCodes: string[]): boolean {
    if (role === 'SUPER_ADMIN') return true;
    const permissions = this.getRolePermissions(role);
    return permissionCodes.some(code => permissions.includes(code));
  }

  static getPermissionsByCategory(role?: UserRole) {
    const list = role ? ALL_PERMISSIONS.filter(p => this.hasPermission(role, p.code)) : ALL_PERMISSIONS;
    const groups: { [key: string]: PermissionDefinition[] } = {};
    list.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }
}
