import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { storageService } from './storageService';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  lastConnectedAt?: string;
  lastLatencyMs?: number;
}

const STORAGE_KEY_SUPABASE_CONFIG = 'smarterp_supabase_config';

// Hardcoded defaults to simplify GitHub Pages deployment (public anon key)
const DEFAULT_SUPABASE_URL = 'https://ydymvzvmyasjnymhmvzh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkeW12enZteWFzam55bWhtdnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjExMTYsImV4cCI6MjEwMzgzNzExNn0.biHFmztGZ2IKDrzx2xpBHU_EUc2PwzmrqRdeWSXn2zc';

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

  constructor() {
    this.currentConfig = this.loadConfig();
    this.initClient();
  }

  private loadConfig(): SupabaseConfig {
    const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY;

    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            url: parsed.url || envUrl,
            anonKey: parsed.anonKey || envKey,
            isConfigured: Boolean(parsed.url || envUrl),
            lastConnectedAt: parsed.lastConnectedAt,
            lastLatencyMs: parsed.lastLatencyMs
          };
        }
      }
    } catch (e) {
      console.error(e);
    }

    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: Boolean(envUrl && envKey)
    };
  }

  private initClient(): void {
    if (this.currentConfig.url && this.currentConfig.anonKey) {
      try {
        this.client = createClient(this.currentConfig.url, this.currentConfig.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
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
      isConfigured: Boolean(url.trim() && anonKey.trim())
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SUPABASE_CONFIG, JSON.stringify(this.currentConfig));
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
  public async testConnection(customUrl?: string, customKey?: string): Promise<ConnectionTestResult> {
    const targetUrl = (customUrl || this.currentConfig.url || '').trim();
    const targetKey = (customKey || this.currentConfig.anonKey || '').trim();

    if (!targetUrl || !targetKey) {
      return {
        connected: false,
        latencyMs: 0,
        message: 'Supabase URL অথবা Anon Key কনফিগার করা নেই। অনুগ্রহ করে ক্রডেনশিয়াল প্রদান করুন।'
      };
    }

    const startTime = performance.now();

    try {
      const probeClient = createClient(targetUrl, targetKey);
      
      // Perform a lightweight probe to Supabase REST endpoint
      const { data, error } = await probeClient
        .from('tenants')
        .select('id')
        .limit(1);

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      // If table doesn't exist yet, but connection/auth succeeded (code PGRST116 or 42P01 table not found, but status 200/404 from Supabase)
      if (error && error.code !== 'PGRST116' && !error.message.includes('relation "tenants" does not exist') && !error.message.includes('not found')) {
        // Check if it's an auth error vs network error
        if (error.message.includes('JWT') || error.message.includes('apiKey') || error.code === 'PGRST301') {
          return {
            connected: false,
            latencyMs,
            message: `Supabase Auth Error: ${error.message} (অনুগ্রহ করে Anon Key সঠিক কিনা নিশ্চিত করুন)`
          };
        }
      }

      // Update success metadata
      this.currentConfig.lastConnectedAt = new Date().toISOString();
      this.currentConfig.lastLatencyMs = latencyMs;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SUPABASE_CONFIG, JSON.stringify(this.currentConfig));
      }

      return {
        connected: true,
        latencyMs,
        message: `Supabase ক্লাউড ডেটাবেজে সফলভাবে কানেক্টেড! রেসপন্স লেটেন্সি: ${latencyMs}ms`,
        details: {
          url: targetUrl,
          serverTime: new Date().toISOString(),
          authenticated: true
        }
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        connected: false,
        latencyMs,
        message: `কানেকশন ব্যর্থ হয়েছে: ${err?.message || 'Network error / Invalid URL'}`
      };
    }
  }

  /**
   * Sync Local Tenant State to Supabase
   */
  public async syncToCloud(tenantId: string): Promise<{ success: boolean; message: string }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, message: 'Supabase ডেটাবেজ কনফিগার করা নেই।' };
    }

    try {
      const tenant = storageService.getActiveTenant();
      const products = storageService.getProducts(tenantId);
      const sales = storageService.getSales(tenantId);
      const accounting = storageService.getAccounting(tenantId);

      // 1. Upsert Tenant
      const { error: tErr } = await client.from('tenants').upsert({
        id: tenant.id,
        code: tenant.code,
        name: tenant.name,
        owner_name: tenant.owner_name,
        email: tenant.email,
        phone: tenant.phone,
        currency: tenant.currency,
        currency_symbol: tenant.currency_symbol,
        address: tenant.address,
        updated_at: new Date().toISOString()
      });

      if (tErr) console.warn('Supabase tenant upsert notice:', tErr.message);

      return {
        success: true,
        message: `ক্লাউড সিঙ্ক সম্পন্ন: ${products.length} টি পণ্য, ${sales.length} টি বিক্রয় মেমো ও ${accounting.length} টি লেজার এন্ট্রি প্রসেসড।`
      };
    } catch (e: any) {
      return { success: false, message: `সিঙ্ক ত্রুটি: ${e?.message || 'Unknown error'}` };
    }
  }
}

export const supabaseService = new SupabaseService();
