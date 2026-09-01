import { describe, it, expect, beforeEach } from "vitest";
import { NavigationEngine } from "../../src/engine/navigationEngine";
import { RbacEngine } from "../../src/engine/rbacEngine";
import { RuleEngine } from "../../src/engine/ruleEngine";
import { WorkflowEngine } from "../../src/engine/workflowEngine";
import { i18n } from "../../src/services/i18nService";
import { storageService } from "../../src/services/storageService";
import { Tenant, GenericProduct, CartItem, UserRole } from "../../src/types";

describe("SmartERP Core Engines & Localization Suite", () => {
  const mockTenant: Tenant = {
    id: "tenant_test_1",
    code: "TEST-01",
    name: "SmartERP Demo Store",
    owner_name: "Smart Admin",
    email: "admin@smarterp.com",
    phone: "01700-000000",
    currency: "BDT",
    currency_symbol: "৳",
    address: "ঢাকা, বাংলাদেশ",
    subdomain: "demo",
    status: "active",
    active_categories: [
      {
        id: "tbc_1",
        tenant_id: "tenant_test_1",
        business_category_id: "cat_electronics_telecom",
        is_primary: true,
        is_active: true,
        created_at: new Date().toISOString(),
        configuration: {
          requiresIMEI: true,
          supportsRepairs: true,
          supportsRecharge: true,
          defaultTaxRate: 5,
        },
      },
    ],
    enabled_modules: [
      "SALES",
      "PRODUCTS",
      "INVENTORY",
      "CUSTOMERS",
      "ACCOUNTING",
      "REPORTS",
      "IMEI",
      "REPAIRS",
      "RECHARGE",
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleProduct: GenericProduct = {
    id: "prod_test_1",
    tenant_id: "tenant_test_1",
    business_category_id: "cat_electronics_telecom",
    code: "PROD-001",
    sku: "SKU-001",
    name: "Samsung Galaxy A54",
    category_name: "Smartphones",
    purchase_price: 30000,
    selling_price: 35000,
    stock_quantity: 10,
    min_stock_alert: 2,
    unit: "পিস",
    tracking_mode: "TRACKING_QUANTITY",
    is_active: true,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    storageService.saveTenant(mockTenant);
    storageService.setActiveTenantId(mockTenant.id);
    storageService.setActiveRole("ADMIN");
    storageService.saveProduct(sampleProduct);
  });

  describe("0. Cloud sync safety checks", () => {
    it("returns a safe error when the selected tenant for sync does not exist", async () => {
      storageService.setActiveTenantId(mockTenant.id);

      const { success, message } =
        await import("../../src/services/supabaseClient").then(
          ({ supabaseService }) =>
            supabaseService.syncToCloud("missing-tenant-id"),
        );

      expect(success).toBe(false);
      expect(message).toContain("নির্বাচিত টেন্যান্টটি");
    });
  });

  describe("1. RBAC Engine (Role-Based Access Control)", () => {
    it("SUPER_ADMIN should have unrestricted full access to any permission", () => {
      expect(RbacEngine.hasPermission("SUPER_ADMIN", "dashboard.view")).toBe(
        true,
      );
      expect(
        RbacEngine.hasPermission("SUPER_ADMIN", "system.super_admin_matrix"),
      ).toBe(true);
      expect(RbacEngine.hasPermission("SUPER_ADMIN", "any.custom.perm")).toBe(
        true,
      );
    });

    it("CASHIER should have POS sales access but not admin settings or void privileges", () => {
      expect(RbacEngine.hasPermission("CASHIER", "sales.pos_access")).toBe(
        true,
      );
      expect(
        RbacEngine.hasPermission("CASHIER", "system.settings_manage"),
      ).toBe(false);
      expect(RbacEngine.hasPermission("CASHIER", "sales.void_invoice")).toBe(
        false,
      );
    });

    it("ADMIN should have full operational access to store administration", () => {
      expect(RbacEngine.hasPermission("ADMIN", "system.staff_manage")).toBe(
        true,
      );
      expect(RbacEngine.hasPermission("ADMIN", "accounting.view_ledger")).toBe(
        true,
      );
      expect(RbacEngine.hasPermission("ADMIN", "products.delete")).toBe(true);
    });
  });

  describe("2. Navigation Engine", () => {
    it("generates proper navigation items for ADMIN role based on enabled modules", () => {
      const navItems = NavigationEngine.getDynamicNavigation(
        mockTenant,
        "ADMIN",
      );
      const ids = navItems.map((n) => n.id);

      expect(ids).toContain("dashboard");
      expect(ids).toContain("pos_sales");
      expect(ids).toContain("products");
      expect(ids).toContain("accounting");
      expect(ids).toContain("telecom_repairs");
      expect(ids).toContain("telecom_recharge");
      expect(ids).not.toContain("tenant_provisioning"); // Super admin only
    });

    it("includes Super Admin exclusive modules only for SUPER_ADMIN role", () => {
      const superNav = NavigationEngine.getDynamicNavigation(
        mockTenant,
        "SUPER_ADMIN",
      );
      const superIds = superNav.map((n) => n.id);

      expect(superIds).toContain("tenant_provisioning");
      expect(superIds).toContain("category_studio");
      expect(superIds).toContain("rbac_matrix");
    });
  });

  describe("3. Rule Engine", () => {
    it("correctly checks whether core & specialized modules are enabled", () => {
      expect(RuleEngine.isModuleEnabled(mockTenant, "SALES")).toBe(true);
      expect(RuleEngine.isModuleEnabled(mockTenant, "PRODUCTS")).toBe(true);
      expect(RuleEngine.isModuleEnabled(mockTenant, "ACCOUNTING")).toBe(true);
      expect(RuleEngine.isModuleEnabled(mockTenant, "REPAIRS")).toBe(true);
    });

    it("validates cart item tracking requirements properly", () => {
      const genericValidation = RuleEngine.validateCartItemRequirements(
        sampleProduct,
        { quantity: 2 },
      );
      expect(genericValidation.valid).toBe(true);

      const imeiProduct: GenericProduct = {
        ...sampleProduct,
        id: "prod_imei_1",
        tracking_mode: "TRACKING_IMEI",
      };

      const invalidImeiValidation = RuleEngine.validateCartItemRequirements(
        imeiProduct,
        { quantity: 1 },
      );
      expect(invalidImeiValidation.valid).toBe(false);
      expect(invalidImeiValidation.errorMessage).toContain("IMEI");
    });
  });

  describe("4. Workflow Engine & Accounting Pipeline", () => {
    it("processes a complete POS sale transaction and posts double-entry journal vouchers", () => {
      const cartItem: CartItem = {
        product: sampleProduct,
        quantity: 1,
        unit_price: 35000,
        discount: 0,
        total: 35000,
      };

      const result = WorkflowEngine.processSale({
        tenant: mockTenant,
        cartItems: [cartItem],
        paymentMethod: "CASH",
        paidAmount: 35000,
        discountAmount: 0,
        tradeInCredit: 0,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.grand_total).toBeGreaterThan(0);
      expect(result.data?.payment_status).toBe("PAID");
      expect(result.auditTrail.length).toBeGreaterThan(3);

      // Verify double-entry accounting entry
      const entries = storageService.getAccounting(mockTenant.id);
      const saleEntry = entries.find((e) => e.reference_id === result.data?.id);
      expect(saleEntry).toBeDefined();
      expect(saleEntry?.debit_account).toBe(
        "ক্যাশ ড্রয়ার / কাউন্টার ক্যাশ (Cash in Hand)",
      );
      expect(saleEntry?.credit_account).toBe(
        "পণ্য বিক্রয় রাজস্ব (Sales Revenue)",
      );
    });
  });

  describe("5. i18n Localization & Translation Engine", () => {
    it("defaults to Bengali and translates core keys correctly", () => {
      i18n.setLanguage("bn");
      expect(i18n.getLanguage()).toBe("bn");
      expect(i18n.t("nav.pos_sales")).toBe("POS কুইক বিলিং");
      expect(i18n.t("pos.grand_total")).toBe("সর্বমোট প্রদেয় বিল");
      expect(i18n.t("action.save")).toBe("সংরক্ষণ করুন");
    });

    it("switches to English smoothly and returns English terms", () => {
      i18n.setLanguage("en");
      expect(i18n.getLanguage()).toBe("en");
      expect(i18n.t("nav.pos_sales")).toBe("POS Quick Billing");
      expect(i18n.t("pos.grand_total")).toBe("Grand Total");
      expect(i18n.t("action.save")).toBe("Save Changes");
    });

    it("formats Bengali numbers and currency correctly", () => {
      expect(i18n.toBengaliNumber("12345")).toBe("১২৩৪৫");
      expect(i18n.formatCurrency(524.5)).toBe("৳ 524.50");
    });
  });
});
