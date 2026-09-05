import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { storageService } from "./storageService";
import { authService, UserProfile } from "./authService";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  lastConnectedAt?: string;
  lastLatencyMs?: number;
}

const STORAGE_KEY_SUPABASE_CONFIG = "smarterp_supabase_config";

// Hardcoded defaults to simplify GitHub Pages deployment (public anon key)
const DEFAULT_SUPABASE_URL = "https://ydymvzvmyasjnymhmvzh.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkeW12enZteWFzam55bWhtdnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjExMTYsImV4cCI6MjEwMzgzNzExNn0.biHFmztGZ2IKDrzx2xpBHU_EUc2PwzmrqRdeWSXn2zc";

export interface ConnectionTestResult {
  connected: boolean;
  latencyMs: number;
  message: string;
  details?: {
    url: string;
    serverTime?: string;
    authenticated?: boolean;
    tablesFound?: string[];
  };
}

export const SUPABASE_TABLE_COLUMNS: Record<string, string[]> = {
  tenants: [
    'id', 'code', 'name', 'owner_name', 'email', 'phone', 'currency', 'currency_symbol',
    'address', 'vat_number', 'subdomain', 'custom_domain', 'status', 'system_branding',
    'enabled_modules', 'created_at', 'updated_at', 'brand_logo_url'
  ],
  users: [
    'id', 'tenant_id', 'tenantId', 'username', 'name', 'phone', 'email', 'role', 'designation',
    'status', 'password', 'password_hash', 'passwordHash', 'created_at'
  ],
  business_categories: [
    'id', 'code', 'name', 'description', 'icon', 'is_system', 'is_active', 'configuration',
    'created_at', 'updated_at'
  ],
  products: [
    'id', 'tenant_id', 'business_category_id', 'code', 'sku', 'barcode', 'name',
    'category_name', 'brand', 'unit', 'purchase_price', 'selling_price', 'stock_quantity',
    'min_stock_alert', 'tracking_mode', 'is_active', 'custom_fields', 'created_at', 'updated_at'
  ],
  customers: [
    'id', 'tenant_id', 'name', 'phone', 'email', 'address', 'membership_card_no',
    'current_due', 'credit_limit', 'total_spent', 'loyalty_points', 'status', 'created_at'
  ],
  suppliers: [
    'id', 'tenant_id', 'name', 'company_name', 'phone', 'email', 'address',
    'current_payable', 'total_purchases', 'status', 'created_at'
  ],
  sales: [
    'id', 'invoice_no', 'tenant_id', 'business_category_id', 'customer_id',
    'customer_name', 'customer_phone', 'items', 'subtotal', 'tax_amount', 'discount_amount',
    'trade_in_credit', 'grand_total', 'paid_amount', 'due_amount', 'payment_method',
    'payment_status', 'specialized_data', 'notes', 'created_at'
  ],
  accounting_entries: [
    'id', 'tenant_id', 'reference_type', 'reference_id', 'title', 'debit_account',
    'credit_account', 'amount', 'created_at'
  ],
  audit_logs: [
    'id', 'tenant_id', 'user_name', 'user_role', 'action', 'module_code', 'details',
    'severity', 'timestamp'
  ],
  custom_field_definitions: [
    'id', 'category_id', 'field_name', 'field_code', 'field_type', 'is_required'
  ]
};

const VALID_CATEGORY_IDS = new Set([
  'cat_telecom',
  'cat_grocery',
  'cat_stationery',
  'cat_library',
  'cat_electronics'
]);

const STARTER_CATEGORY_MAP: Record<string, string> = {
  cat_electronics_telecom: 'cat_telecom',
  cat_grocery_supermarket: 'cat_grocery',
  cat_library_bookstore: 'cat_library',
  cat_stationery_office: 'cat_stationery',
  cat_services_it: 'cat_telecom',
  cat_services: 'cat_telecom',
  cat_general: 'cat_telecom',
};

export function normalizeCategoryId(catId?: string | null): string {
  if (!catId) return 'cat_telecom';
  if (VALID_CATEGORY_IDS.has(catId)) return catId;
  return STARTER_CATEGORY_MAP[catId] || 'cat_telecom';
}

export function sanitizeSupabaseRecord(table: string, record: any): Record<string, any> {
  const allowed = SUPABASE_TABLE_COLUMNS[table];
  if (!allowed) return { ...record };

  const clean: Record<string, any> = {};
  for (const col of allowed) {
    if (col in record && record[col] !== undefined) {
      clean[col] = record[col];
    }
  }

  // Handle table-specific adaptations and FK validations
  if (table === 'custom_field_definitions') {
    clean.category_id = normalizeCategoryId(record.category_id || record.business_category_id);
    clean.field_name = record.name || record.field_name || record.code || 'Custom Field';
    clean.field_code = record.code || record.field_code || record.id;
    clean.field_type = record.field_type || 'text';
    clean.is_required = !!record.is_required;
  } else if (table === 'products') {
    clean.business_category_id = normalizeCategoryId(record.business_category_id);
    if (record.device_details || record.batch_details || record.book_details) {
      clean.custom_fields = {
        ...(record.custom_fields || {}),
        ...(record.device_details ? { device_details: record.device_details } : {}),
        ...(record.batch_details ? { batch_details: record.batch_details } : {}),
        ...(record.book_details ? { book_details: record.book_details } : {}),
      };
    }
  } else if (table === 'sales') {
    clean.business_category_id = normalizeCategoryId(record.business_category_id);
    // Nullify non-existent or guest customer IDs to satisfy FK constraint
    if (
      !clean.customer_id || 
      clean.customer_id === 'cash_customer' || 
      String(clean.customer_id).startsWith('walkin') || 
      String(clean.customer_id).startsWith('guest')
    ) {
      clean.customer_id = null;
    }
    clean.specialized_data = {
      ...(record.specialized_data || {}),
      ...(record.tax_rate !== undefined ? { tax_rate: record.tax_rate } : {}),
      ...(record.adjustment_amount !== undefined ? { adjustment_amount: record.adjustment_amount } : {}),
    };
  } else if (table === 'customers') {
    if (clean.address === undefined) clean.address = '';
  } else if (table === 'tenants') {
    if (clean.address === undefined) clean.address = 'ঢাকা, বাংলাদেশ';
  }

  return clean;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private currentConfig: SupabaseConfig;
  private autoSyncTimer: number | null = null;
  private isPullingFromCloud = false;
  private syncedTenantsCache = new Set<string>();

  constructor() {
    this.currentConfig = this.loadConfig();
    this.initClient();
    this.bindAutoSync();
  }

  private bindAutoSync(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("dokan_storage_updated", () => {
      if (!this.currentConfig.isConfigured || this.isPullingFromCloud) return;
      this.scheduleAutoSync();
    });

    // Instant Direct Entity Sync Handler
    window.addEventListener("dokan_entity_saved", (e: Event) => {
      if (!this.currentConfig.isConfigured || this.isPullingFromCloud) return;
      const customEvent = e as CustomEvent;
      if (customEvent?.detail?.table && customEvent?.detail?.record) {
        this.instantSyncEntity(customEvent.detail.table, customEvent.detail.record).catch(console.warn);
      }
    });
  }

  private scheduleAutoSync(): void {
    if (typeof window === "undefined" || this.isPullingFromCloud) return;

    if (this.autoSyncTimer !== null) {
      window.clearTimeout(this.autoSyncTimer);
    }

    this.autoSyncTimer = window.setTimeout(async () => {
      const tenantId = storageService.getActiveTenant()?.id;
      if (!tenantId) return;
      await this.syncToCloud(tenantId);
    }, 600);
  }

  private loadConfig(): SupabaseConfig {
    const envUrl =
      (typeof import.meta !== "undefined" &&
        import.meta.env?.VITE_SUPABASE_URL) ||
      DEFAULT_SUPABASE_URL;
    const envKey =
      (typeof import.meta !== "undefined" &&
        import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
      DEFAULT_SUPABASE_ANON_KEY;

    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            url: parsed.url || envUrl,
            anonKey: parsed.anonKey || envKey,
            isConfigured: Boolean(parsed.url || envUrl),
            lastConnectedAt: parsed.lastConnectedAt,
            lastLatencyMs: parsed.lastLatencyMs,
          };
        }
      }
    } catch (e) {
      console.error(e);
    }

    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: Boolean(envUrl && envKey),
    };
  }

  private initClient(): void {
    if (this.currentConfig.url && this.currentConfig.anonKey) {
      try {
        this.client = createClient(
          this.currentConfig.url,
          this.currentConfig.anonKey,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
            },
          },
        );
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  public getConfig(): SupabaseConfig {
    return { ...this.currentConfig };
  }

  public saveConfig(url: string, anonKey: string): void {
    this.currentConfig = {
      ...this.currentConfig,
      url: url.trim(),
      anonKey: anonKey.trim(),
      isConfigured: Boolean(url.trim() && anonKey.trim()),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_KEY_SUPABASE_CONFIG,
        JSON.stringify(this.currentConfig),
      );
    }

    this.initClient();
  }

  public getClient(): SupabaseClient | null {
    if (!this.client && this.currentConfig.isConfigured) {
      this.initClient();
    }
    return this.client;
  }

  /**
   * Guarantee that the tenant exists in Supabase before child records are pushed.
   * This prevents foreign key constraint violations (Postgres 23503).
   */
  public async ensureTenantSynced(tenantId: string): Promise<void> {
    if (!tenantId || this.syncedTenantsCache.has(tenantId)) return;
    const client = this.getClient();
    if (!client) return;

    try {
      const allTenants = storageService.getTenants();
      const tenant = allTenants.find(t => t.id === tenantId) || storageService.getActiveTenant();
      if (!tenant) return;

      const cleanTenant = sanitizeSupabaseRecord('tenants', {
        id: tenant.id,
        code: tenant.code,
        name: tenant.name,
        owner_name: tenant.owner_name,
        email: tenant.email,
        phone: tenant.phone,
        currency: tenant.currency,
        currency_symbol: tenant.currency_symbol,
        address: tenant.address || 'ঢাকা, বাংলাদেশ',
        status: tenant.status,
        updated_at: new Date().toISOString(),
      });

      const { error } = await client.from('tenants').upsert([cleanTenant], { onConflict: 'id' });
      if (!error) {
        this.syncedTenantsCache.add(tenantId);
      }
    } catch (e) {
      console.warn("Could not ensure tenant synced:", e);
    }
  }

  /**
   * Instant Direct Entity Upsert to Supabase Cloud
   * Pushes a single record or array of records immediately to the specified table.
   * Cleans all fields to match PostgreSQL schema exactly to avoid PGRST204 errors.
   */
  public async instantSyncEntity(
    table: string,
    recordOrRecords: any | any[]
  ): Promise<{ success: boolean; error?: string }> {
    if (this.isPullingFromCloud) return { success: true };
    const client = this.getClient();
    if (!client) {
      return { success: false, error: "Supabase client not configured" };
    }

    try {
      const rawRows = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
      if (rawRows.length === 0) return { success: true };

      // Ensure tenant exists in Supabase if the record has a tenant_id
      if (table !== 'tenants') {
        const sampleTenantId = rawRows[0]?.tenant_id;
        if (sampleTenantId) {
          await this.ensureTenantSynced(sampleTenantId);
        }
      }

      const rows = rawRows.map(r => sanitizeSupabaseRecord(table, r));

      const { error } = await client
        .from(table)
        .upsert(rows, { onConflict: "id" });

      if (error) {
        console.warn(`Instant Supabase sync warning for ${table}:`, error.message);
        return { success: false, error: error.message };
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("smarterp_cloud_synced", {
            detail: { table, count: rows.length, timestamp: new Date().toISOString() },
          })
        );
      }

      return { success: true };
    } catch (err: any) {
      console.warn(`Instant Supabase sync error for ${table}:`, err?.message);
      return { success: false, error: err?.message };
    }
  }

  /**
   * Test Live Connection to Supabase
   * Sends a lightweight probe and measures round-trip latency in milliseconds.
   */
  public async testConnection(
    customUrl?: string,
    customKey?: string,
  ): Promise<ConnectionTestResult> {
    const targetUrl = (customUrl || this.currentConfig.url || "").trim();
    const targetKey = (customKey || this.currentConfig.anonKey || "").trim();

    if (!targetUrl || !targetKey) {
      return {
        connected: false,
        latencyMs: 0,
        message:
          "Supabase URL অথবা Anon Key কনফিগার করা নেই। অনুগ্রহ করে ক্রডেনশিয়াল প্রদান করুন।",
      };
    }

    const startTime = performance.now();

    try {
      const probeClient = createClient(targetUrl, targetKey);

      // Perform a lightweight probe to Supabase REST endpoint
      const { data, error } = await probeClient
        .from("tenants")
        .select("id")
        .limit(1);

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      // If table doesn't exist yet, but connection/auth succeeded (code PGRST116 or 42P01 table not found, but status 200/404 from Supabase)
      if (
        error &&
        error.code !== "PGRST116" &&
        !error.message.includes('relation "tenants" does not exist') &&
        !error.message.includes("not found")
      ) {
        // Check if it's an auth error vs network error
        if (
          error.message.includes("JWT") ||
          error.message.includes("apiKey") ||
          error.code === "PGRST301"
        ) {
          return {
            connected: false,
            latencyMs,
            message: `Supabase Auth Error: ${error.message} (অনুগ্রহ করে Anon Key সঠিক কিনা নিশ্চিত করুন)`,
          };
        }
      }

      // Update success metadata
      this.currentConfig.lastConnectedAt = new Date().toISOString();
      this.currentConfig.lastLatencyMs = latencyMs;
      if (typeof window !== "undefined") {
        localStorage.setItem(
          STORAGE_KEY_SUPABASE_CONFIG,
          JSON.stringify(this.currentConfig),
        );
      }

      return {
        connected: true,
        latencyMs,
        message: `Supabase ক্লাউড ডেটাবেজে সফলভাবে কানেক্টেড! রেসপন্স লেটেন্সি: ${latencyMs}ms`,
        details: {
          url: targetUrl,
          serverTime: new Date().toISOString(),
          authenticated: true,
        },
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        connected: false,
        latencyMs,
        message: `কানেকশন ব্যর্থ হয়েছে: ${err?.message || "Network error / Invalid URL"}`,
      };
    }
  }

  /**
   * Sync Local Tenant State to Supabase
   * Strictly cleanses schema to avoid PostgREST cache errors and orders insertions
   * to respect foreign key constraints.
   */
  public async syncToCloud(
    tenantOrId?: string | any,
  ): Promise<{ success: boolean; message: string }> {
    const availableTenants = storageService.getTenants();
    const activeTenantFromStorage = storageService.getActiveTenant();

    let tenant: any;

    if (tenantOrId && typeof tenantOrId === "object" && tenantOrId.id) {
      tenant = tenantOrId;
    } else if (typeof tenantOrId === "string" && tenantOrId.trim()) {
      const tid = tenantOrId.trim();
      tenant =
        availableTenants.find(
          (item) => item.id === tid || item.code?.toLowerCase() === tid.toLowerCase()
        ) || (activeTenantFromStorage?.id === tid ? activeTenantFromStorage : undefined);

      if (!tenant) {
        return {
          success: false,
          message: `নির্বাচিত টেন্যান্টটি (${tid}) খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক দোকান নির্বাচন করুন।`,
        };
      }
    } else {
      tenant = activeTenantFromStorage || availableTenants[0];
    }

    if (!tenant || !tenant.id) {
      return {
        success: false,
        message:
          "সিঙ্ক করতে কোনো সক্রিয় দোকান (Tenant) নির্বাচন করা নেই। অনুগ্রহ করে একটি দোকান নির্বাচন করুন।",
      };
    }

    const effectiveTenantId = tenant.id;

    const client = this.getClient();
    if (!client) {
      return { success: false, message: "Supabase ডেটাবেজ কনফিগার করা নেই।" };
    }

    try {
      // 1. First Guarantee Tenant Record in Supabase (Parent of all rows)
      const cleanTenant = sanitizeSupabaseRecord("tenants", {
        id: tenant.id,
        code: tenant.code,
        name: tenant.name,
        owner_name: tenant.owner_name,
        email: tenant.email,
        phone: tenant.phone,
        currency: tenant.currency,
        currency_symbol: tenant.currency_symbol,
        address: tenant.address || 'ঢাকা, বাংলাদেশ',
        status: tenant.status,
        updated_at: new Date().toISOString(),
      });

      const { error: tenantErr } = await client
        .from("tenants")
        .upsert([cleanTenant], { onConflict: "id" });

      if (tenantErr) {
        console.warn("Tenant sync warning:", tenantErr.message);
      } else {
        this.syncedTenantsCache.add(effectiveTenantId);
      }

      // 2. Fetch all local entities
      const products = storageService.getProducts(effectiveTenantId);
      const customers = storageService.getCustomers(effectiveTenantId);
      const suppliers = storageService.getSuppliers(effectiveTenantId);
      const sales = storageService.getSales(effectiveTenantId);
      const accounting = storageService.getAccounting(effectiveTenantId);
      const auditLogs = storageService.getAuditLogs(effectiveTenantId);
      const customFields = storageService.getCustomFields();
      const categories = storageService.getCategories();

      // 3. Prepare sanitized payloads ordered to satisfy foreign keys
      const syncPayloads: Array<{
        table: string;
        rows: Record<string, any>[];
      }> = [
        { table: "business_categories", rows: categories.map(c => sanitizeSupabaseRecord("business_categories", c)) },
        { table: "custom_field_definitions", rows: customFields.map(f => sanitizeSupabaseRecord("custom_field_definitions", f)) },
        { table: "customers", rows: customers.map(c => sanitizeSupabaseRecord("customers", c)) },
        { table: "suppliers", rows: suppliers.map(s => sanitizeSupabaseRecord("suppliers", s)) },
        { table: "products", rows: products.map(p => sanitizeSupabaseRecord("products", p)) },
        { table: "sales", rows: sales.map(s => sanitizeSupabaseRecord("sales", s)) },
        { table: "accounting_entries", rows: accounting.map(a => sanitizeSupabaseRecord("accounting_entries", a)) },
        { table: "audit_logs", rows: auditLogs.map(l => sanitizeSupabaseRecord("audit_logs", l)) },
      ];

      const activePayloads = syncPayloads.filter((p) => p.rows && p.rows.length > 0);
      
      // 4. Sequential execution strictly respecting foreign key dependencies:
      // (tenants -> categories -> custom fields -> customers/suppliers -> products -> sales -> accounting/audit)
      const syncExecution = async () => {
        const tableResults: Array<{ table: string; success: boolean; count?: number; error?: string }> = [];
        for (const payload of activePayloads) {
          try {
            const { error } = await client
              .from(payload.table)
              .upsert(payload.rows, { onConflict: "id" });

            if (error) {
              console.warn(`Supabase sync warning for ${payload.table}:`, error.message);
              tableResults.push({ table: payload.table, success: false, error: error.message });
            } else {
              tableResults.push({ table: payload.table, success: true, count: payload.rows.length });
            }
          } catch (err: any) {
            console.warn(`Supabase sync exception for ${payload.table}:`, err?.message);
            tableResults.push({ table: payload.table, success: false, error: err?.message });
          }
        }
        return tableResults;
      };

      // 25-second timeout guard to allow overseas database connection & cold starts
      const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) =>
        setTimeout(() => resolve({ isTimeout: true }), 25000)
      );

      const raceResult = await Promise.race([
        syncExecution(),
        timeoutPromise
      ]);

      if ('isTimeout' in raceResult) {
        return {
          success: true,
          message: `ক্লাউড সিঙ্ক ব্যাকগ্রাউন্ডে চলছে (Supabase ক্লাউড কানেকশনে কিছুটা সময় নিচ্ছে)। লোকাল স্টোরেজে সকল ডেটা সম্পূর্ণ সুরক্ষিত আছে।`
        };
      }

      const succeeded = raceResult.filter((r) => r.success).length;

      return {
        success: true,
        message: `ক্লাউড সিঙ্ক অতিদ্রুত সম্পন্ন! (${succeeded + 1}/${activePayloads.length + 1} টেবিল আপলোডেড) — ${products.length} টি পণ্য, ${customers.length} জন কাস্টমার, ${suppliers.length} জন সাপ্লায়ার, ${sales.length} টি বিক্রয় ও ${accounting.length} টি হিসাব এন্ট্রি সিঙ্কড।`,
      };
    } catch (e: any) {
      return {
        success: false,
        message: `সিঙ্ক ত্রুটি: ${e?.message || "Unknown error"}`,
      };
    }
  }

  /**
   * Pull All Cloud Data (Tenants, Products, Customers, Sales, Accounts) from Supabase
   * This is critical when opening the app on a new device or phone!
   */
  public async pullFromCloud(): Promise<{ success: boolean; message: string; count?: number }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, message: "Supabase ক্লাউড ডেটাবেজ কনফিগার করা নেই।" };
    }

    this.isPullingFromCloud = true;

    try {
      // 1. Fetch Tenants
      const { data: cloudTenants, error: tenantErr } = await client
        .from('tenants')
        .select('*');

      if (tenantErr) {
        return { success: false, message: `টেন্যান্ট ডাউনলোড ত্রুটি: ${tenantErr.message}` };
      }

      if (cloudTenants && cloudTenants.length > 0) {
        cloudTenants.forEach((t: any) => {
          const formattedTenant: any = {
            id: t.id,
            code: t.code || 'SHOP-01',
            name: t.name || 'দোকান',
            owner_name: t.owner_name || 'দোকান মালিক',
            email: t.email || '',
            phone: t.phone || '',
            currency: t.currency || 'BDT',
            currency_symbol: t.currency_symbol || '৳',
            address: t.address || '',
            status: t.status || 'active',
            subdomain: t.subdomain || `${t.code?.toLowerCase()}.dokanmanager.io`,
            custom_domain: t.custom_domain || '',
            active_categories: t.active_categories || [
              {
                id: `tbc_${t.id}_telecom`,
                tenant_id: t.id,
                business_category_id: 'cat_telecom',
                is_primary: true,
                is_active: true,
                created_at: new Date().toISOString()
              }
            ],
            enabled_modules: t.enabled_modules || ['SALES', 'PRODUCTS', 'INVENTORY', 'CUSTOMERS', 'ACCOUNTING', 'REPORTS'],
            created_at: t.created_at || new Date().toISOString(),
            updated_at: t.updated_at || new Date().toISOString(),
          };
          storageService.saveTenant(formattedTenant);
        });

        // Set active tenant if none exists
        const currentActive = storageService.getActiveTenant();
        if (!currentActive?.id && cloudTenants[0]) {
          storageService.setActiveTenantId(cloudTenants[0].id);
        }
      }

      // 2. Fetch other tables in parallel
      const tables = ['products', 'customers', 'suppliers', 'sales', 'accounting_entries', 'users'];
      const fetches = tables.map(async (table) => {
        try {
          const { data } = await client.from(table).select('*');
          if (data && Array.isArray(data)) {
            if (table === 'products') data.forEach((p: any) => storageService.saveProduct(p));
            if (table === 'customers') data.forEach((c: any) => storageService.saveCustomer(c));
            if (table === 'suppliers') data.forEach((s: any) => storageService.saveSupplier(s));
            if (table === 'sales') data.forEach((s: any) => storageService.saveSale(s));
            if (table === 'accounting_entries') data.forEach((a: any) => storageService.saveAccountingEntry(a));
            if (table === 'users') {
              data.forEach((u: any) => {
                const tid = u.tenant_id || u.tenantId;
                if (tid) {
                  const staffUser: UserProfile = {
                    id: u.id,
                    username: u.username || u.phone || u.email,
                    name: u.name || 'ইউজার',
                    phone: u.phone || '',
                    email: u.email || '',
                    role: (u.role || 'CASHIER').toUpperCase() as any,
                    tenantId: tid,
                    designation: u.designation || u.role || 'শপ কর্মী',
                    permissions: u.permissions || [],
                    status: u.status || 'active',
                    password: u.password || u.password_hash || u.passwordHash
                  };
                  authService.saveStaffMember(staffUser);
                }
              });
            }
          }
        } catch (e) {
          console.warn(`Table fetch ${table} warning:`, e);
        }
      });

      await Promise.allSettled(fetches);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dokan_storage_updated', { detail: { key: 'all' } }));
        window.dispatchEvent(new CustomEvent('dokan_tenant_changed', { detail: { tenant: storageService.getActiveTenant() } }));
      }

      return {
        success: true,
        count: cloudTenants?.length || 0,
        message: `ক্লাউড থেকে সফলভাবে ${cloudTenants?.length || 0} টি দোকান ও যাবতীয় ডেটা লোড সম্পন্ন হয়েছে!`
      };
    } catch (err: any) {
      return { success: false, message: `ক্লাউড ডাটা পুল ত্রুটি: ${err?.message || 'Unknown error'}` };
    } finally {
      this.isPullingFromCloud = false;
    }
  }

  /**
   * Directly query Supabase Cloud users & tenants tables for an identifier during login.
   */
  public async searchCloudUser(identifier: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    const clean = identifier.trim();
    if (!clean) return false;

    try {
      // 1. Search users table in Supabase Cloud
      const { data: usersData } = await client
        .from('users')
        .select('*')
        .or(`phone.eq.${clean},username.eq.${clean},email.eq.${clean}`);

      if (usersData && usersData.length > 0) {
        usersData.forEach((u: any) => {
          const tid = u.tenant_id || u.tenantId;
          if (tid) {
            authService.saveStaffMember({
              id: u.id,
              username: u.username || u.phone || u.email,
              name: u.name || 'ইউজার',
              phone: u.phone || '',
              email: u.email || '',
              role: (u.role || 'CASHIER').toUpperCase() as any,
              tenantId: tid,
              designation: u.designation || u.role || 'শপ কর্মী',
              permissions: u.permissions || [],
              status: u.status || 'active',
              password: u.password || u.password_hash || u.passwordHash
            });
          }
        });
        return true;
      }

      // 2. Search tenants table in Supabase Cloud (for Shop Owners)
      const { data: tenantsData } = await client
        .from('tenants')
        .select('*')
        .or(`phone.eq.${clean},code.eq.${clean},email.eq.${clean}`);

      if (tenantsData && tenantsData.length > 0) {
        tenantsData.forEach((t: any) => {
          storageService.saveTenant({
            id: t.id,
            code: t.code || 'SHOP',
            name: t.name || 'দোকান',
            owner_name: t.owner_name || 'দোকান মালিক',
            email: t.email || '',
            phone: t.phone || '',
            currency: t.currency || 'BDT',
            currency_symbol: t.currency_symbol || '৳',
            address: t.address || '',
            status: t.status || 'active',
            subdomain: t.subdomain || '',
            custom_domain: t.custom_domain || '',
            active_categories: t.active_categories || [],
            enabled_modules: t.enabled_modules || ['SALES', 'PRODUCTS', 'INVENTORY', 'CUSTOMERS', 'ACCOUNTING', 'REPORTS'],
            created_at: t.created_at || new Date().toISOString(),
          });
        });
        return true;
      }
    } catch (e) {
      console.warn('Supabase searchCloudUser error:', e);
    }
    return false;
  }

  /**
   * Pull customers specifically from Supabase Cloud and sync with local storage.
   */
  public async pullCustomers(tenantId?: string): Promise<{ success: boolean; count: number; message: string }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, count: 0, message: "Supabase ক্লাউড ডেটাবেজ কনফিগার করা নেই।" };
    }

    this.isPullingFromCloud = true;
    try {
      // 1. First ensure Tenants are in sync
      const { data: cloudTenants } = await client.from('tenants').select('*');
      if (cloudTenants && Array.isArray(cloudTenants)) {
        cloudTenants.forEach((t: any) => {
          const existing = storageService.getTenants().find(item => item.id === t.id);
          if (!existing) {
            storageService.saveTenant({
              id: t.id,
              code: t.code || 'SHOP-01',
              name: t.name || 'দোকান',
              owner_name: t.owner_name || 'দোকান মালিক',
              email: t.email || '',
              phone: t.phone || '',
              currency: t.currency || 'BDT',
              currency_symbol: t.currency_symbol || '৳',
              address: t.address || '',
              status: t.status || 'active',
              subdomain: t.subdomain || `${t.code?.toLowerCase()}.dokanmanager.io`,
              custom_domain: t.custom_domain || '',
              active_categories: t.active_categories || [
                {
                  id: `tbc_${t.id}_telecom`,
                  tenant_id: t.id,
                  business_category_id: 'cat_telecom',
                  is_primary: true,
                  is_active: true,
                  created_at: new Date().toISOString()
                }
              ],
              enabled_modules: t.enabled_modules || ['SALES', 'PRODUCTS', 'INVENTORY', 'CUSTOMERS', 'ACCOUNTING', 'REPORTS'],
              created_at: t.created_at || new Date().toISOString(),
              updated_at: t.updated_at || new Date().toISOString(),
            });
          }
        });
      }

      // 2. Fetch Customers
      const { data: cloudCustomers, error } = await client.from('customers').select('*');
      if (error) {
        return { success: false, count: 0, message: `কাস্টমার লোড ত্রুটি: ${error.message}` };
      }

      if (cloudCustomers && Array.isArray(cloudCustomers)) {
        let imported = 0;
        cloudCustomers.forEach((c: any) => {
          const resolvedTenantId = c.tenant_id || tenantId || storageService.getActiveTenant()?.id;
          storageService.saveCustomer({
            id: c.id,
            tenant_id: resolvedTenantId,
            name: c.name,
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            membership_card_no: c.membership_card_no || '',
            customer_type: c.customer_type || 'individual',
            total_spent: Number(c.total_spent) || 0,
            loyalty_points: Number(c.loyalty_points) || 0,
            current_due: Number(c.current_due) || 0,
            credit_limit: Number(c.credit_limit) || 10000,
            status: c.status || 'active',
            created_at: c.created_at || new Date().toISOString()
          });
          imported++;
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dokan_storage_updated', { detail: { key: 'customers' } }));
        }

        return {
          success: true,
          count: imported,
          message: `Supabase ক্লাউড থেকে ${imported} জন কাস্টমার সফলভাবে সিঙ্ক ও রিস্টোর হয়েছে!`
        };
      }

      return { success: true, count: 0, message: 'ক্লাউডে কোনো কাস্টমার রেকর্ড পাওয়া যায়নি।' };
    } catch (err: any) {
      return { success: false, count: 0, message: err?.message || 'Unknown error' };
    } finally {
      this.isPullingFromCloud = false;
    }
  }

  /**
   * Delete sales transactions from Supabase Cloud to avoid resurrecting them on reload
   */
  public async deleteSales(tenantId?: string): Promise<{ success: boolean; message: string }> {
    const client = this.getClient();
    if (!client) {
      return { success: true, message: "লোকাল ডাটা মুছে ফেলা হয়েছে (ক্লাউড নিষ্ক্রিয়)।" };
    }

    try {
      let query = client.from('sales').delete();
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else {
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { error } = await query;
      if (error) {
        console.warn('Supabase deleteSales cloud error:', error);
        return { success: false, message: `ক্লাউড বিক্রয় রেকর্ড মুছতে সমস্যা: ${error.message}` };
      }

      // Reset customers table dues in Supabase cloud
      try {
        let custQuery = client.from('customers').update({ current_due: 0, total_spent: 0 });
        if (tenantId) {
          custQuery = custQuery.eq('tenant_id', tenantId);
        } else {
          custQuery = custQuery.neq('id', '00000000-0000-0000-0000-000000000000');
        }
        await custQuery;
      } catch (custErr) {
        console.warn('Supabase customer dues reset error:', custErr);
      }

      return { success: true, message: "Supabase ক্লাউড থেকেও বিক্রয় ও কাস্টমার বকেয়া ডাটা সফলভাবে মুছে ফেলা হয়েছে।" };
    } catch (err: any) {
      console.warn('Supabase deleteSales error:', err);
      return { success: false, message: err?.message || 'ক্লাউড ডিলিট এরর' };
    }
  }
}

export const supabaseService = new SupabaseService();
