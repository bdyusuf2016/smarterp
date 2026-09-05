import { describe, it, expect, beforeEach } from 'vitest';
import { authService, UserProfile } from '../../src/services/authService';
import { storageService } from '../../src/services/storageService';
import { SaleTransaction, AccountingEntry, SecurityPinConfig } from '../../src/types';

const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, String(val)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

describe('Security, Auth & Sales Reset Unit Tests', () => {
  beforeEach(() => {
    storageMap.clear();
  });

  describe('1. Phone Number Normalization & Uniqueness as Username', () => {
    it('should normalize Bangladeshi phone numbers by stripping +880 and spaces', () => {
      expect(authService.normalizePhone('+8801712345678')).toBe('01712345678');
      expect(authService.normalizePhone('8801712345678')).toBe('01712345678');
      expect(authService.normalizePhone('01712-345678')).toBe('01712345678');
      expect(authService.normalizePhone(' 01712 345 678 ')).toBe('01712345678');
    });

    it('should prevent duplicate phone numbers across staff', () => {
      const tenantId = 'tenant_test_01';
      storageService.saveTenant({
        id: tenantId,
        code: 'TEST-01',
        name: 'Test Shop',
        owner_name: 'Owner',
        phone: '01900000000',
        email: 'test@dokan.local',
        currency: 'BDT',
        currency_symbol: '৳',
        address: 'Dhaka',
        status: 'active',
        active_categories: [],
        enabled_modules: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      const staff1: UserProfile = {
        id: 'usr_staff_01',
        username: '01712345678',
        name: 'Rahim Ahmed',
        phone: '01712345678',
        email: 'rahim@dokan.local',
        role: 'CASHIER',
        tenantId,
        designation: 'Cashier',
        permissions: [],
        status: 'active'
      };
      authService.saveStaffMember(staff1);

      // Check uniqueness for same phone
      const check1 = authService.isPhoneUnique('01712345678');
      expect(check1.isUnique).toBe(false);

      // Check uniqueness excluding current user (editing existing profile)
      const checkSelf = authService.isPhoneUnique('01712345678', 'usr_staff_01');
      expect(checkSelf.isUnique).toBe(true);

      // Check another phone number
      const check2 = authService.isPhoneUnique('01899999999');
      expect(check2.isUnique).toBe(true);
    });
  });

  describe('2. Single Platform Smart Login & Role Routing', () => {
    it('should map Cashier role to pos_sales and Technician to telecom_repairs', () => {
      const tenant = {
        id: 'shop_001',
        code: 'SHOP-1',
        name: 'City Store',
        owner_name: 'Owner',
        phone: '01700000001',
        email: 'shop@dokan.local',
        currency: 'BDT',
        currency_symbol: '৳',
        address: 'Dhaka',
        status: 'active' as const,
        active_categories: [],
        enabled_modules: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      storageService.saveTenant(tenant);

      const cashier: UserProfile = {
        id: 'usr_cashier_01',
        username: '01799887766',
        name: 'Cashier User',
        phone: '01799887766',
        email: 'c@dokan.local',
        role: 'CASHIER',
        tenantId: tenant.id,
        designation: 'Cashier',
        permissions: [],
        status: 'active'
      };
      authService.saveStaffMember(cashier);

      const loginRes = authService.smartLogin('01799887766');
      expect(loginRes.success).toBe(true);
      expect(loginRes.targetView).toBe('pos_sales');
      expect(loginRes.user?.role).toBe('CASHIER');
    });
  });

  describe('3. Action Security PIN Verification System', () => {
    it('should verify default PIN 1234 and support custom PIN changes', () => {
      const tenantId = 'tenant_pin_01';
      // Default PIN should be 1234
      expect(storageService.verifySecurityPin('1234', tenantId)).toBe(true);
      expect(storageService.verifySecurityPin('9999', tenantId)).toBe(false);

      // Save new PIN
      const customConfig: SecurityPinConfig = {
        enabled: true,
        pin: '5678',
        requireForDelete: true,
        requireForEdit: true,
        requireForReset: true
      };
      storageService.saveSecurityPinConfig(customConfig, tenantId);

      expect(storageService.verifySecurityPin('5678', tenantId)).toBe(true);
      expect(storageService.verifySecurityPin('1234', tenantId)).toBe(false);
      expect(storageService.isPinRequired('delete', tenantId)).toBe(true);
      expect(storageService.isPinRequired('edit', tenantId)).toBe(true);
      expect(storageService.isPinRequired('reset', tenantId)).toBe(true);
    });
  });

  describe('4. Sales Data Reset & Clean Wipe', () => {
    it('should clear sales for the target tenant without affecting other tenants', () => {
      const tenantA = 'tenant_A';
      const tenantB = 'tenant_B';

      const saleA: SaleTransaction = {
        id: 'sale_01',
        invoice_no: 'INV-A-01',
        tenant_id: tenantA,
        business_category_id: 'cat_telecom',
        customer_name: 'Customer A',
        items: [],
        subtotal: 1000,
        tax_amount: 0,
        discount_amount: 0,
        adjustment_amount: 0,
        trade_in_credit: 0,
        grand_total: 1000,
        paid_amount: 1000,
        due_amount: 0,
        payment_method: 'CASH',
        payment_status: 'PAID',
        created_at: new Date().toISOString()
      };

      const saleB: SaleTransaction = {
        id: 'sale_02',
        invoice_no: 'INV-B-01',
        tenant_id: tenantB,
        business_category_id: 'cat_telecom',
        customer_name: 'Customer B',
        items: [],
        subtotal: 2500,
        tax_amount: 0,
        discount_amount: 0,
        adjustment_amount: 0,
        trade_in_credit: 0,
        grand_total: 2500,
        paid_amount: 2500,
        due_amount: 0,
        payment_method: 'CASH',
        payment_status: 'PAID',
        created_at: new Date().toISOString()
      };

      storageService.saveSale(saleA);
      storageService.saveSale(saleB);

      const accEntryA: AccountingEntry = {
        id: 'acc_01',
        tenant_id: tenantA,
        reference_type: 'SALE',
        reference_id: saleA.id,
        title: 'Sale A Accounting',
        debit_account: 'Cash',
        credit_account: 'Revenue',
        amount: 1000,
        created_at: new Date().toISOString()
      };
      storageService.saveAccountingEntry(accEntryA);

      expect(storageService.getSales(tenantA).length).toBe(1);
      expect(storageService.getSales(tenantB).length).toBe(1);

      // Reset Sales for Tenant A
      storageService.clearSales(tenantA);

      // Tenant A should have 0 sales and related accounting entries cleaned
      expect(storageService.getSales(tenantA).length).toBe(0);
      const remainingAcc = storageService.getAccounting(tenantA).filter(a => a.reference_type === 'SALE');
      expect(remainingAcc.length).toBe(0);

      // Tenant B sales should remain completely intact
      expect(storageService.getSales(tenantB).length).toBe(1);
    });
  });
});
