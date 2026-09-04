import {
  Tenant,
  BusinessCategory,
  BusinessCategoryConfig,
  GenericProduct,
  CustomerMember,
  BorrowRecord
} from '../types';
import { storageService } from '../services/storageService';

export class RuleEngine {
  /**
   * Resolve consolidated category configuration for a tenant
   */
  static getEffectiveConfig(tenant: Tenant): BusinessCategoryConfig {
    const allCategories = storageService.getCategories();
    const activeCategoryIds = tenant.active_categories
      .filter(ac => ac.is_active)
      .map(ac => ac.business_category_id);

    const configs: BusinessCategoryConfig[] = [];

    // Find active categories
    allCategories
      .filter(c => activeCategoryIds.includes(c.id))
      .forEach(c => {
        // Find tenant override if any
        const tenantMapping = tenant.active_categories.find(ac => ac.business_category_id === c.id);
        const merged = { ...c.configuration, ...(tenantMapping?.configuration || {}) };
        configs.push(merged);
      });

    // Merge configurations (primary category takes precedence or logical OR for features)
    const consolidated: BusinessCategoryConfig = {
      requiresIMEI: configs.some(c => c.requiresIMEI),
      requiresSerial: configs.some(c => c.requiresSerial),
      requiresBatch: configs.some(c => c.requiresBatch),
      supportsExpiry: configs.some(c => c.supportsExpiry),
      supportsWeight: configs.some(c => c.supportsWeight),
      supportsBorrowing: configs.some(c => c.supportsBorrowing),
      supportsLateFee: configs.some(c => c.supportsLateFee),
      supportsRepairs: configs.some(c => c.supportsRepairs),
      supportsTradeIn: configs.some(c => c.supportsTradeIn),
      supportsRecharge: configs.some(c => c.supportsRecharge),
      supportsWarranty: configs.some(c => c.supportsWarranty),
      defaultWarrantyMonths: Math.max(...configs.map(c => c.defaultWarrantyMonths || 12)),
      borrowingDurationDays: configs.find(c => c.borrowingDurationDays)?.borrowingDurationDays || 14,
      lateFeePerDay: configs.find(c => c.lateFeePerDay)?.lateFeePerDay || 1.0,
      defaultTaxRate: configs[0]?.defaultTaxRate ?? 0,
      allowNegativeInventory: configs.some(c => c.allowNegativeInventory)
    };

    return consolidated;
  }

  /**
   * Check if a specific module is enabled for a tenant
   */
  static isModuleEnabled(tenant: Tenant, moduleCode: string): boolean {
    if (!tenant) return true;

    const normalizedCode = (moduleCode || '').toUpperCase().trim();

    // 1. Explicit tenant enabled_modules check configured by System Admin
    if (tenant.enabled_modules && Array.isArray(tenant.enabled_modules)) {
      const allowed = new Set(tenant.enabled_modules.map(m => m.toUpperCase().trim()));

      // Direct match
      if (allowed.has(normalizedCode)) return true;

      // Platform Core & System modules are always enabled for any active shop
      if (['DASHBOARD', 'SETTINGS', 'AUDIT', 'PLATFORM', 'BRANCHES', 'TENANTS'].includes(normalizedCode)) return true;

      // Handle common aliases/sub-modules
      if (normalizedCode === 'CRM' && (allowed.has('CUSTOMERS') || allowed.has('CRM'))) return true;
      if (normalizedCode === 'CUSTOMERS' && (allowed.has('CRM') || allowed.has('CUSTOMERS'))) return true;
      if (normalizedCode === 'PURCHASE' && (allowed.has('PURCHASES') || allowed.has('SUPPLIERS') || allowed.has('PURCHASE'))) return true;
      if (normalizedCode === 'PURCHASES' && (allowed.has('PURCHASE') || allowed.has('SUPPLIERS') || allowed.has('PURCHASES'))) return true;
      if (normalizedCode === 'SUPPLIERS' && (allowed.has('PURCHASES') || allowed.has('SUPPLIERS') || allowed.has('PURCHASE'))) return true;
      if (normalizedCode === 'BATCH_EXPIRY' && (allowed.has('BATCH') || allowed.has('EXPIRY') || allowed.has('BATCH_EXPIRY'))) return true;
      if ((normalizedCode === 'BATCH' || normalizedCode === 'EXPIRY') && (allowed.has('BATCH_EXPIRY') || allowed.has('BATCH') || allowed.has('EXPIRY'))) return true;
      if (normalizedCode === 'WEIGH_SCALE' && (allowed.has('WEIGHT') || allowed.has('WEIGH_SCALE'))) return true;
      if (normalizedCode === 'WEIGHT' && (allowed.has('WEIGH_SCALE') || allowed.has('WEIGHT'))) return true;
      if (normalizedCode === 'BOOK_CATALOG' && (allowed.has('BOOKS') || allowed.has('BOOK_CATALOG'))) return true;
      if (normalizedCode === 'BOOKS' && (allowed.has('BOOK_CATALOG') || allowed.has('BOOKS'))) return true;
      if ((normalizedCode === 'CIRCULATION' || normalizedCode === 'STATIONERY_SALES' || normalizedCode === 'BORROWING') && (allowed.has('BORROWING') || allowed.has('CIRCULATION') || allowed.has('BOOKS'))) return true;
      if (normalizedCode === 'BARCODE' && allowed.has('BARCODE')) return true;
      if (
        (normalizedCode === 'DIGITAL_SERVICES' || normalizedCode === 'SERVICES' || normalizedCode === 'PHOTOCOPY' || normalizedCode === 'ONLINE_SERVICES' || normalizedCode === 'PHOTOCOPY_PRINT') && 
        (allowed.has('DIGITAL_SERVICES') || allowed.has('SERVICES') || allowed.has('PHOTOCOPY') || allowed.has('ONLINE_SERVICES') || allowed.has('PHOTOCOPY_PRINT'))
      ) return true;
      if (normalizedCode === 'BILLING_CALC' && allowed.has('SALES')) return true;
      if (normalizedCode === 'EXPENSES' && (allowed.has('ACCOUNTING') || allowed.has('EXPENSES'))) return true;
      if (normalizedCode === 'PAYMENTS' && (allowed.has('ACCOUNTING') || allowed.has('PAYMENTS') || allowed.has('SALES'))) return true;
      if ((normalizedCode === 'SERIAL' || normalizedCode === 'SERIAL_NUMBERS') && (allowed.has('SERIAL_NUMBERS') || allowed.has('IMEI'))) return true;
      if (normalizedCode === 'WARRANTY' && (allowed.has('WARRANTY') || allowed.has('IMEI') || allowed.has('REPAIRS'))) return true;

      // If System Admin explicitly configured enabled_modules and this module is not included, it is disabled!
      return false;
    }

    // Default fallback if tenant.enabled_modules is not explicitly set yet (Core modules only)
    if (['SALES', 'PRODUCTS', 'INVENTORY', 'CUSTOMERS', 'ACCOUNTING', 'REPORTS'].includes(normalizedCode)) {
      return true;
    }

    const modules = storageService.getModules();
    const targetModule = modules.find(m => m.code === normalizedCode);
    if (!targetModule || !targetModule.is_active) {
      return false;
    }

    // Core & Common business modules are enabled by default
    if (targetModule.is_core || targetModule.category_group === 'CORE' || targetModule.category_group === 'COMMON') {
      return true;
    }

    // Check category mappings for all active tenant categories
    const mappings = storageService.getCategoryModules();
    const activeCategoryIds = (tenant.active_categories || [])
      .filter(ac => ac.is_active)
      .map(ac => ac.business_category_id);

    return mappings.some(m => 
      activeCategoryIds.includes(m.business_category_id) && 
      m.module_id === targetModule.id && 
      m.enabled_by_default
    );
  }

  /**
   * Validate if a cart item satisfies product tracking mode requirements
   */
  static validateCartItemRequirements(product: GenericProduct, itemData: {
    quantity: number;
    selected_imei?: string;
    selected_serial?: string;
    selected_batch?: string;
    weight_kg?: number;
  }): { valid: boolean; errorMessage?: string } {
    if (product.tracking_mode === 'TRACKING_IMEI') {
      if (!itemData.selected_imei) {
        return { valid: false, errorMessage: `"${product.name}" পণ্যের জন্য নির্দিষ্ট IMEI ডিভাইস নির্বাচন আবশ্যক (IMEI required)` };
      }
      const devices = storageService.getDevices();
      const dev = devices.find(d => d.imei === itemData.selected_imei);
      if (!dev || dev.status !== 'available') {
        return { valid: false, errorMessage: `IMEI ${itemData.selected_imei} বিক্রির জন্য উপলব্ধ নেই (Device not available)` };
      }
    }

    if (product.tracking_mode === 'TRACKING_SERIAL') {
      if (!itemData.selected_serial) {
        return { valid: false, errorMessage: `"${product.name}" পণ্যের জন্য সিরিয়াল নম্বর যাচাই আবশ্যক (Serial number required)` };
      }
    }

    if (product.tracking_mode === 'TRACKING_BATCH') {
      if (!itemData.selected_batch) {
        return { valid: false, errorMessage: `"${product.name}" পণ্যের জন্য সচল ব্যাচ/লট নির্বাচন আবশ্যক (Batch selection required)` };
      }
      const batches = storageService.getBatches();
      const batch = batches.find(b => b.id === itemData.selected_batch);
      if (!batch) {
        return { valid: false, errorMessage: `নির্বাচিত ব্যাচটি পাওয়া যায়নি (Invalid batch)` };
      }
      if (batch.quantity < itemData.quantity) {
        return { valid: false, errorMessage: `ব্যাচ ${batch.batch_number}-এ পর্যাপ্ত স্টক নেই (${batch.quantity} টি বিদ্যমান)` };
      }
      // Check expiration
      const expDate = new Date(batch.expiry_date);
      if (expDate < new Date()) {
        return { valid: false, errorMessage: `ব্যাচ ${batch.batch_number} এর মেয়াদ উত্তীর্ণ (${batch.expiry_date}) হয়ে গেছে, বিক্রি করা যাবে না` };
      }
    }

    if (product.tracking_mode === 'TRACKING_WEIGHT') {
      if (!itemData.weight_kg || itemData.weight_kg <= 0) {
        return { valid: false, errorMessage: `"${product.name}" পণ্যের জন্য ডিজিটাল স্কেল ওজন আবশ্যক (Scale weight required)` };
      }
    }

    return { valid: true };
  }

  /**
   * Library Circulation: Check if member can borrow book
   */
  static checkMemberBorrowEligibility(member: CustomerMember, tenant: Tenant): { allowed: boolean; reason?: string } {
    const config = this.getEffectiveConfig(tenant);
    if (!config.supportsBorrowing) {
      return { allowed: false, reason: 'এই ক্যাটাগরিতে বই ধার দেওয়া মডিউলটি সক্রিয় নেই।' };
    }

    const maxLimit = member.max_borrow_limit || 3;
    const currentActive = member.active_borrow_count || 0;

    if (currentActive >= maxLimit) {
      return { allowed: false, reason: `সদস্য সর্বোচ্চ বই ধার নেওয়ার সীমা (${maxLimit} টি বই) অতিক্রম করেছেন।` };
    }

    if (member.current_due > 100) {
      return { allowed: false, reason: `সদস্যের পূর্বের বকেয়া পাওনা ৳${member.current_due.toFixed(2)} অপরিশোধিত রয়েছে।` };
    }

    return { allowed: true };
  }

  /**
   * Calculate late fee for an overdue book borrow record
   */
  static calculateBorrowLateFee(borrowRecord: BorrowRecord, lateFeeRate = 1.0): { daysOverdue: number; lateFee: number } {
    if (borrowRecord.status === 'returned') {
      return { daysOverdue: 0, lateFee: borrowRecord.calculated_late_fee || 0 };
    }

    const dueDate = new Date(borrowRecord.due_date);
    const today = new Date();
    
    // Difference in days
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      const lateFee = Math.round(diffDays * lateFeeRate * 100) / 100;
      return { daysOverdue: diffDays, lateFee };
    }

    return { daysOverdue: 0, lateFee: 0 };
  }
}
