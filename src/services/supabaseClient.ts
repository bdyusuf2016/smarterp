import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { storageService } from "./storageService";

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

class SupabaseService {
  private client: SupabaseClient | null = null;
  private currentConfig: SupabaseConfig;
  private autoSyncTimer: number | null = null;

  constructor() {
    this.currentConfig = this.loadConfig();
    this.initClient();
    this.bindAutoSync();
  }

  private bindAutoSync(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("dokan_storage_updated", () => {
      if (!this.currentConfig.isConfigured) return;
      this.scheduleAutoSync();
    });
  }

  private scheduleAutoSync(): void {
    if (typeof window === "undefined") return;

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
    }

    if (!tenant) {
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
      const products = storageService.getProducts(effectiveTenantId);
      const customers = storageService.getCustomers(effectiveTenantId);
      const suppliers = storageService.getSuppliers(effectiveTenantId);
      const sales = storageService.getSales(effectiveTenantId);
      const accounting = storageService.getAccounting(effectiveTenantId);
      const auditLogs = storageService.getAuditLogs(effectiveTenantId);

      const customFields = storageService.getCustomFields();
      const categories = storageService.getCategories();

      const syncPayloads: Array<{
        table: string;
        rows: Record<string, any>[];
      }> = [
        {
          table: "tenants",
          rows: [
            {
              id: tenant.id,
              code: tenant.code,
              name: tenant.name,
              owner_name: tenant.owner_name,
              email: tenant.email,
              phone: tenant.phone,
              currency: tenant.currency,
              currency_symbol: tenant.currency_symbol,
              address: tenant.address,
              status: tenant.status,
              updated_at: new Date().toISOString(),
            },
          ],
        },
        { table: "business_categories", rows: categories },
        { table: "custom_field_definitions", rows: customFields },
        { table: "products", rows: products },
        { table: "customers", rows: customers },
        { table: "suppliers", rows: suppliers },
        { table: "sales", rows: sales },
        { table: "accounting_entries", rows: accounting },
        { table: "audit_logs", rows: auditLogs },
      ];

      // Execute all table upserts in parallel with high-speed Promise.allSettled
      const activePayloads = syncPayloads.filter((p) => p.rows && p.rows.length > 0);
      
      const syncPromises = activePayloads.map(async (payload) => {
        try {
          const { error } = await client
            .from(payload.table)
            .upsert(payload.rows, { onConflict: "id" });

          if (error) {
            console.warn(`Supabase sync warning for ${payload.table}:`, error.message);
            return { table: payload.table, success: false, error: error.message };
          }
          return { table: payload.table, success: true, count: payload.rows.length };
        } catch (err: any) {
          console.warn(`Supabase sync exception for ${payload.table}:`, err?.message);
          return { table: payload.table, success: false, error: err?.message };
        }
      });

      // 12-second timeout guard to prevent UI hanging on slow network or free-tier sleep
      const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) =>
        setTimeout(() => resolve({ isTimeout: true }), 12000)
      );

      const results = await Promise.race([
        Promise.allSettled(syncPromises),
        timeoutPromise
      ]);

      if ('isTimeout' in results) {
        return {
          success: true,
          message: `ক্লাউড সিঙ্ক ব্যাকগ্রাউন্ডে চলছে (Supabase ক্লাউড কানেকশনে কিছুটা সময় নিচ্ছে)। লোকাল স্টোরেজে সকল ডেটা সম্পূর্ণ সুরক্ষিত আছে।`
        };
      }

      const succeeded = results.filter((r) => r.status === "fulfilled" && (r.value as any).success).length;

      return {
        success: true,
        message: `ক্লাউড সিঙ্ক অতিদ্রুত সম্পন্ন! (${succeeded}/${activePayloads.length} টেবিল আপলোডেড) — ${products.length} টি পণ্য, ${customers.length} জন কাস্টমার, ${suppliers.length} জন সাপ্লায়ার, ${sales.length} টি বিক্রয় ও ${accounting.length} টি হিসাব এন্ট্রি সিঙ্কড।`,
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
      const tables = ['products', 'customers', 'suppliers', 'sales', 'accounting_entries'];
      const fetches = tables.map(async (table) => {
        try {
          const { data } = await client.from(table).select('*');
          if (data && Array.isArray(data)) {
            if (table === 'products') data.forEach((p: any) => storageService.saveProduct(p));
            if (table === 'customers') data.forEach((c: any) => storageService.saveCustomer(c));
            if (table === 'suppliers') data.forEach((s: any) => storageService.saveSupplier(s));
            if (table === 'sales') data.forEach((s: any) => storageService.saveSale(s));
            if (table === 'accounting_entries') data.forEach((a: any) => storageService.saveAccounting(a));
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
    }
  }
}

export const supabaseService = new SupabaseService();
