/**
 * SmartERP Enterprise — Local PostgreSQL & Real Server Database Service
 * Provides frontend control, monitoring, and synchronization with the local/server PostgreSQL database.
 */

export interface PostgresDbStatus {
  connected: boolean;
  latencyMs: number;
  database?: string;
  serverTime?: string;
  version?: string;
  tableCount?: number;
  tables?: string[];
  counts?: {
    tenants?: number;
    products?: number;
    customers?: number;
    suppliers?: number;
    sales?: number;
    users?: number;
    categories?: number;
  };
  config?: {
    databaseUrl?: string;
    nodeEnv?: string;
    port?: number;
  };
  error?: string;
  isBackendReachable: boolean;
  lastCheckedAt: string;
}

class LocalPostgresService {
  private status: PostgresDbStatus = {
    connected: false,
    latencyMs: 0,
    isBackendReachable: false,
    lastCheckedAt: new Date().toISOString(),
  };

  private listeners: Array<(status: PostgresDbStatus) => void> = [];
  private pollInterval: number | null = null;

  constructor() {
    // Initial check when app starts
    if (typeof window !== 'undefined') {
      setTimeout(() => this.checkStatus(), 800);
      this.startPolling();
    }
  }

  public subscribe(callback: (status: PostgresDbStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.status);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.status);
      } catch (e) {
        console.error('Db status subscriber error', e);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dokan_db_status_updated', { detail: this.status })
      );
    }
  }

  public getStatus(): PostgresDbStatus {
    return { ...this.status };
  }

  public startPolling(intervalMs = 25000): void {
    if (this.pollInterval !== null) return;
    this.pollInterval = window.setInterval(() => {
      this.checkStatus();
    }, intervalMs);
  }

  public stopPolling(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Check live status of local/server PostgreSQL via the backend API
   */
  public async checkStatus(): Promise<PostgresDbStatus> {
    const startTime = performance.now();
    try {
      const res = await fetch('/api/v1/system/db/status', {
        headers: { Accept: 'application/json' },
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok && res.status >= 500) {
        const json = await res.json().catch(() => ({}));
        this.status = {
          connected: false,
          latencyMs,
          isBackendReachable: true,
          error: json?.error?.message || 'Database connection error',
          lastCheckedAt: new Date().toISOString(),
        };
        this.notify();
        return this.status;
      }

      const json = await res.json();

      if (json && json.success) {
        this.status = {
          ...json.data,
          isBackendReachable: true,
          lastCheckedAt: new Date().toISOString(),
        };
      } else {
        this.status = {
          connected: false,
          latencyMs,
          isBackendReachable: true,
          error: json?.error?.message || 'Could not verify database connection',
          lastCheckedAt: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      this.status = {
        connected: false,
        latencyMs: 0,
        isBackendReachable: false,
        error: 'Backend API সার্ভার বন্ধ রয়েছে (Run: npm run dev:server অথবা npm run dev)',
        lastCheckedAt: new Date().toISOString(),
      };
    }

    this.notify();
    return this.status;
  }

  private formatFetchError(err: any, defaultPrefix: string): string {
    const msg = String(err?.message || '');
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed') || err?.name === 'TypeError') {
      return `${defaultPrefix}: ব্যাকএন্ড API সার্ভার (Port 5000) বন্ধ রয়েছে। দয়া করে টার্মিনালে "npm run dev" কমান্ডটি চালু করুন।`;
    }
    return `${defaultPrefix}: ${msg || 'অজানা ত্রুটি'}`;
  }

  private async parseApiResponse(res: Response, defaultPrefix: string): Promise<{ success: boolean; message: string; data?: any }> {
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let errMsg = '';
      try {
        const parsed = JSON.parse(text);
        errMsg = parsed.message || parsed.error?.message;
      } catch {
        if (res.status === 502 || res.status === 504 || res.status === 500) {
          errMsg = 'ব্যাকএন্ড সার্ভার (Port 5000) এ পৌঁছানো যায়নি। টার্মিনালে "npm run dev" চালু আছে কিনা দেখুন।';
        } else {
          errMsg = `সার্ভার রেসপন্স ত্রুটি (HTTP ${res.status})`;
        }
      }
      return {
        success: false,
        message: `${defaultPrefix}: ${errMsg}`,
      };
    }

    try {
      const json = await res.json();
      return {
        success: Boolean(json.success),
        message: json.message || (json.error?.message ?? 'অপারেশন সফল হয়েছে'),
        data: json.data,
      };
    } catch {
      return {
        success: false,
        message: `${defaultPrefix}: সার্ভার রেসপন্স পার্স করা যায়নি।`,
      };
    }
  }

  /**
   * Test a specific PostgreSQL connection string
   */
  public async testConnection(connectionString?: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const res = await fetch('/api/v1/system/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString }),
      });

      const parsed = await this.parseApiResponse(res, 'কানেকশন টেস্ট ব্যর্থ');
      await this.checkStatus();
      return parsed;
    } catch (err: any) {
      return {
        success: false,
        message: this.formatFetchError(err, 'ব্যাকএন্ডে পৌঁছানো যাচ্ছে না'),
      };
    }
  }

  /**
   * Run Database Migrations (creates/updates all PostgreSQL tables)
   */
  public async runMigrations(): Promise<{
    success: boolean;
    message: string;
    tablesCreated?: number;
  }> {
    try {
      const res = await fetch('/api/v1/system/db/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const parsed = await this.parseApiResponse(res, 'মাইগ্রেশন কমান্ড সম্পন্ন করা যায়নি');
      await this.checkStatus();

      return {
        success: parsed.success,
        message: parsed.message,
        tablesCreated: parsed.data?.tablesCreated,
      };
    } catch (err: any) {
      return {
        success: false,
        message: this.formatFetchError(err, 'মাইগ্রেশন কমান্ড সম্পন্ন করা যায়নি'),
      };
    }
  }

  /**
   * Seed Initial System & Demo Data
   */
  public async seedDatabase(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const res = await fetch('/api/v1/system/db/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const parsed = await this.parseApiResponse(res, 'সিড প্রক্রিয়া ব্যর্থ হয়েছে');
      await this.checkStatus();

      return {
        success: parsed.success,
        message: parsed.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: this.formatFetchError(err, 'সিড প্রক্রিয়া ব্যর্থ হয়েছে'),
      };
    }
  }

  /**
   * Sync browser state into PostgreSQL
   */
  public async syncBrowserToPostgres(payload: {
    tenants?: any[];
    products?: any[];
    customers?: any[];
    suppliers?: any[];
    sales?: any[];
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await fetch('/api/v1/system/db/sync-from-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const parsed = await this.parseApiResponse(res, 'সিঙ্কিং সম্পন্ন করা যায়নি');
      await this.checkStatus();

      return parsed;
    } catch (err: any) {
      return {
        success: false,
        message: this.formatFetchError(err, 'সিঙ্কিং সম্পন্ন করা যায়নি'),
      };
    }
  }

  /**
   * Export PostgreSQL records to browser format
   */
  public async exportPostgresToBrowser(): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      const res = await fetch('/api/v1/system/db/export-to-storage');
      const parsed = await this.parseApiResponse(res, 'ডেটা ফেচ করা যায়নি');
      return parsed;
    } catch (err: any) {
      return {
        success: false,
        message: this.formatFetchError(err, 'ডেটা ফেচ করা যায়নি'),
      };
    }
  }
}

export const localPostgresService = new LocalPostgresService();
