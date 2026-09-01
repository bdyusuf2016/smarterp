import { Tenant, UserRole } from '../types';
import { RuleEngine } from './ruleEngine';
import { storageService } from '../services/storageService';
import { RbacEngine } from './rbacEngine';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  moduleCode: string;
  badge?: string | number;
  category?: string;
  requiredPermission?: string;
}

export class NavigationEngine {
  static getDynamicNavigation(tenant: Tenant, userRole: UserRole): NavItem[] {
    const nav: NavItem[] = [];

    // 0. Always include Core Overview Dashboard if role has permission
    if (RbacEngine.hasPermission(userRole, 'dashboard.view')) {
      nav.push({
        id: 'dashboard',
        label: 'ড্যাশবোর্ড (Overview)',
        icon: 'LayoutDashboard',
        moduleCode: 'DASHBOARD',
        category: 'সার্বিক চিত্র',
        requiredPermission: 'dashboard.view'
      });
    }

    // 1. Sales & POS
    if (RbacEngine.hasPermission(userRole, 'sales.pos_access')) {
      nav.push({
        id: 'pos_sales',
        label: 'POS কুইক বিলিং',
        icon: 'ShoppingCart',
        moduleCode: 'SALES',
        category: 'দৈনিক সেলস ও বিলিং',
        requiredPermission: 'sales.pos_access'
      });
    }

    // 2. Products, Stock Inward & Services Catalog (ইনভেন্টরি ও স্টক)
    if (RbacEngine.hasPermission(userRole, 'products.view')) {
      nav.push({
        id: 'products',
        label: 'পণ্য ও নতুন স্টক ইনওয়ার্ড',
        icon: 'Package',
        moduleCode: 'PRODUCTS',
        category: 'ইনভেন্টরি ও স্টক',
        requiredPermission: 'products.view'
      });
    }

    // Digital Services & Photocopy Rate Cards Catalog (Managed like stock)
    if (RbacEngine.hasPermission(userRole, 'services.digital_desk')) {
      nav.push({
        id: 'digital_services',
        label: 'সেবা ও মূল্যহার তালিকা',
        icon: 'Tag',
        moduleCode: 'DIGITAL_SERVICES',
        category: 'ইনভেন্টরি ও স্টক',
        requiredPermission: 'services.digital_desk'
      });
    }

    // Barcode Sticker Studio
    if (RbacEngine.hasPermission(userRole, 'barcode.print')) {
      nav.push({
        id: 'barcode_studio',
        label: 'বারকোড স্টিকার প্রিন্ট',
        icon: 'Printer',
        moduleCode: 'PRODUCTS',
        category: 'ইনভেন্টরি ও স্টক',
        requiredPermission: 'barcode.print'
      });
    }

    // ==========================================
    // INDUSTRY SPECIALIZED MODULES
    // ==========================================

    // Telecom / Electronics Suite
    const hasTelecomSuite = 
      RuleEngine.isModuleEnabled(tenant, 'IMEI') || 
      RuleEngine.isModuleEnabled(tenant, 'REPAIRS') || 
      RuleEngine.isModuleEnabled(tenant, 'TRADE_IN') || 
      RuleEngine.isModuleEnabled(tenant, 'RECHARGE');

    if (hasTelecomSuite) {
      if (RuleEngine.isModuleEnabled(tenant, 'IMEI') && RbacEngine.hasPermission(userRole, 'telecom.imei_stock')) {
        nav.push({
          id: 'telecom_imei',
          label: 'IMEI হ্যান্ডসেট স্টক',
          icon: 'Smartphone',
          moduleCode: 'IMEI',
          category: 'টেলিকম ও সার্ভিস',
          requiredPermission: 'telecom.imei_stock'
        });
      }
      if (RuleEngine.isModuleEnabled(tenant, 'REPAIRS') && RbacEngine.hasPermission(userRole, 'telecom.repairs_manage')) {
        const pendingRepairs = storageService.getRepairs(tenant.id).filter(r => r.status === 'in_progress' || r.status === 'received').length;
        nav.push({
          id: 'telecom_repairs',
          label: 'মোবাইল সার্ভিসিং',
          icon: 'Wrench',
          moduleCode: 'REPAIRS',
          badge: pendingRepairs > 0 ? pendingRepairs : undefined,
          category: 'টেলিকম ও সার্ভিস',
          requiredPermission: 'telecom.repairs_manage'
        });
      }
      if (RuleEngine.isModuleEnabled(tenant, 'RECHARGE') && RbacEngine.hasPermission(userRole, 'telecom.recharge_mfs')) {
        nav.push({
          id: 'telecom_recharge',
          label: 'রিচার্জ ও MFS রেজিস্টার',
          icon: 'Zap',
          moduleCode: 'RECHARGE',
          category: 'টেলিকম ও সার্ভিস',
          requiredPermission: 'telecom.recharge_mfs'
        });
      }
    }

    // Grocery Supermarket Suite
    const hasGrocerySuite = 
      RuleEngine.isModuleEnabled(tenant, 'BATCH_EXPIRY') || 
      RuleEngine.isModuleEnabled(tenant, 'WEIGH_SCALE');

    if (hasGrocerySuite) {
      if (RuleEngine.isModuleEnabled(tenant, 'BATCH_EXPIRY') && RbacEngine.hasPermission(userRole, 'grocery.batch_expiry')) {
        const expiringBatches = storageService.getBatches().filter(b => b.status === 'expiring_soon').length;
        nav.push({
          id: 'grocery_batches',
          label: 'ব্যাচ ও মেয়াদ ট্র্যাকিং',
          icon: 'Layers',
          moduleCode: 'BATCH_EXPIRY',
          badge: expiringBatches > 0 ? expiringBatches : undefined,
          category: 'গ্রোসারি কন্ট্রোল',
          requiredPermission: 'grocery.batch_expiry'
        });
      }
      if (RuleEngine.isModuleEnabled(tenant, 'WEIGH_SCALE') && RbacEngine.hasPermission(userRole, 'grocery.weigh_scale')) {
        nav.push({
          id: 'grocery_scale',
          label: 'ডিজিটাল ওয়েট স্কেল',
          icon: 'Scale',
          moduleCode: 'WEIGH_SCALE',
          category: 'গ্রোসারি কন্ট্রোল',
          requiredPermission: 'grocery.weigh_scale'
        });
      }
    }

    // Bookstore & Stationery Suite (বই-খাতা, প্রকাশনী ও স্টেশনারি দোকান)
    const hasStationerySuite = 
      RuleEngine.isModuleEnabled(tenant, 'BOOK_CATALOG') || 
      RuleEngine.isModuleEnabled(tenant, 'CIRCULATION') ||
      RuleEngine.isModuleEnabled(tenant, 'BOOKS');

    if (hasStationerySuite) {
      if ((RuleEngine.isModuleEnabled(tenant, 'BOOK_CATALOG') || RuleEngine.isModuleEnabled(tenant, 'BOOKS')) && RbacEngine.hasPermission(userRole, 'stationery.book_catalog')) {
        nav.push({
          id: 'library_catalog',
          label: 'বই-খাতা ও প্রকাশনী ক্যাটালগ',
          icon: 'BookOpen',
          moduleCode: 'BOOK_CATALOG',
          category: 'বই ও স্টেশনারি ডেস্ক',
          requiredPermission: 'stationery.book_catalog'
        });
      }
      if (RuleEngine.isModuleEnabled(tenant, 'CIRCULATION') && RbacEngine.hasPermission(userRole, 'stationery.stock_sales')) {
        nav.push({
          id: 'library_circulation',
          label: 'বুকস্টোর সেলস ও সাপ্লাই',
          icon: 'BookOpen',
          moduleCode: 'CIRCULATION',
          category: 'বই ও স্টেশনারি ডেস্ক',
          requiredPermission: 'stationery.stock_sales'
        });
      }
    }

    // CRM / Customers & Due Ledger
    if (RbacEngine.hasPermission(userRole, 'customers.view')) {
      nav.push({
        id: 'customers',
        label: 'কাস্টমার বাকির খাতা',
        icon: 'Users',
        moduleCode: 'CRM',
        category: 'হিসাব ও লেজার',
        requiredPermission: 'customers.view'
      });
    }

    // Suppliers & Vendor Payables Ledger
    if (RbacEngine.hasPermission(userRole, 'suppliers.view')) {
      nav.push({
        id: 'suppliers',
        label: 'সাপ্লায়ার ও বিল পেমেন্ট',
        icon: 'Truck',
        moduleCode: 'PURCHASE',
        category: 'হিসাব ও লেজার',
        requiredPermission: 'suppliers.view'
      });
    }

    // Accounting & Daily Closing
    if (RbacEngine.hasPermission(userRole, 'accounting.view_ledger')) {
      nav.push({
        id: 'accounting',
        label: 'হিসাব ও ক্যাশ খাতা',
        icon: 'CreditCard',
        moduleCode: 'ACCOUNTING',
        category: 'হিসাব ও লেজার',
        requiredPermission: 'accounting.view_ledger'
      });
    }

    // Executive Reports
    if (RbacEngine.hasPermission(userRole, 'reports.view_analytics')) {
      nav.push({
        id: 'reports',
        label: 'লাভ-ক্ষতি ও আর্থিক রিপোর্ট',
        icon: 'BarChart3',
        moduleCode: 'REPORTS',
        category: 'হিসাব ও লেজার',
        requiredPermission: 'reports.view_analytics'
      });
    }

    // Staff & Employee RBAC Management (Shop Owner / Admin & Super Admin)
    if (RbacEngine.hasPermission(userRole, 'system.staff_manage')) {
      nav.push({
        id: 'staff_management',
        label: 'কর্মচারী ও পারমিশন',
        icon: 'Users',
        moduleCode: 'SETTINGS',
        category: 'দোকান প্রশাসন',
        requiredPermission: 'system.staff_manage'
      });
    }

    // Global Settings (থিম, ভাষা, দোকান, পেমেন্ট, ক্যাটাগরি ও ব্যাকআপ)
    if (RbacEngine.hasPermission(userRole, 'system.settings_manage')) {
      nav.push({
        id: 'global_settings',
        label: 'গ্লোবাল সেটিংস',
        icon: 'Settings',
        moduleCode: 'SETTINGS',
        category: 'দোকান প্রশাসন',
        requiredPermission: 'system.settings_manage'
      });
    }

    // Security & Audit Log (Admin & Super Admin)
    if (RbacEngine.hasPermission(userRole, 'system.audit_view')) {
      nav.push({
        id: 'audit',
        label: 'সিকিউরিটি অডিট লগ',
        icon: 'ShieldCheck',
        moduleCode: 'SETTINGS',
        category: userRole === 'SUPER_ADMIN' ? 'সিস্টেম অ্যাডমিন' : 'দোকান প্রশাসন',
        requiredPermission: 'system.audit_view'
      });
    }

    // Category Studio, Tenant Provisioning & Platform Controls (Super Admin Md. Yusuf Ali only)
    if (userRole === 'SUPER_ADMIN') {
      nav.push({
        id: 'tenant_provisioning',
        label: 'দোকান ও ডোমেন প্রভিশনিং',
        icon: 'Building2',
        moduleCode: 'SETTINGS',
        category: 'সিস্টেম অ্যাডমিন',
        requiredPermission: 'system.super_admin_matrix'
      });

      nav.push({
        id: 'category_studio',
        label: 'বিজনেস ক্যাটাগরি স্টুডিও',
        icon: 'SlidersHorizontal',
        moduleCode: 'SETTINGS',
        category: 'সিস্টেম অ্যাডমিন',
        requiredPermission: 'system.category_studio'
      });

      nav.push({
        id: 'rbac_matrix',
        label: 'রোল ও পারমিশন ম্যাট্রিক্স',
        icon: 'Lock',
        moduleCode: 'SETTINGS',
        category: 'সিস্টেম অ্যাডমিন',
        requiredPermission: 'system.super_admin_matrix'
      });
    }

    return nav;
  }
}
