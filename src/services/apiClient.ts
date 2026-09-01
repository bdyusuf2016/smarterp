/**
 * Dokan Manager V2 — Production Frontend API Client
 * Connects frontend UI components to backend REST API endpoints (/api/v1/*)
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    totalCount?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiClient {
  private baseUrl = '/api/v1';
  private token: string | null = localStorage.getItem('dokan_token');

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('dokan_token', token);
    } else {
      localStorage.removeItem('dokan_token');
    }
  }

  public getToken(): string | null {
    return this.token || localStorage.getItem('dokan_token');
  }

  private async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const json = await res.json();
      return json as ApiResponse<T>;
    } catch (err: any) {
      return {
        success: false,
        data: null as any,
        error: {
          code: 'NETWORK_ERROR',
          message: err?.message || 'Failed to communicate with Dokan Manager V2 backend API',
        },
      };
    }
  }

  // ==========================================
  // AUTH
  // ==========================================
  public auth = {
    login: (phoneOrEmail: string, password: string) =>
      this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phoneOrEmail, password }),
      }),
    me: () => this.request('/auth/me'),
    logout: () => this.request('/auth/logout', { method: 'POST' }),
  };

  // ==========================================
  // TENANTS & BRANCHES
  // ==========================================
  public tenants = {
    getCurrent: () => this.request('/tenants/current'),
    getBranches: () => this.request('/tenants/branches'),
    getSettings: () => this.request('/tenants/settings'),
    provision: (payload: any) =>
      this.request('/tenants/provision', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  };

  // ==========================================
  // PRODUCTS & POS SCANNER
  // ==========================================
  public products = {
    list: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/products${query}`);
    },
    getById: (id: string) => this.request(`/products/${id}`),
    create: (payload: any) =>
      this.request('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    scan: (code: string) => this.request(`/products/scan/${encodeURIComponent(code)}`),
  };

  // ==========================================
  // INVENTORY
  // ==========================================
  public inventory = {
    getStock: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/inventory/stock${query}`);
    },
    adjustStock: (payload: any) =>
      this.request('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    transferStock: (payload: any) =>
      this.request('/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  };

  // ==========================================
  // CUSTOMERS & DUE COLLECTIONS
  // ==========================================
  public customers = {
    list: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/customers${query}`);
    },
    getById: (id: string) => this.request(`/customers/${id}`),
    create: (payload: any) =>
      this.request('/customers', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    collectDue: (customerId: string, payload: any) =>
      this.request(`/customers/${customerId}/collect-due`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  };

  // ==========================================
  // SUPPLIERS & PAYMENTS
  // ==========================================
  public suppliers = {
    list: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/suppliers${query}`);
    },
    getById: (id: string) => this.request(`/suppliers/${id}`),
    create: (payload: any) =>
      this.request('/suppliers', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    pay: (supplierId: string, payload: any) =>
      this.request(`/suppliers/${supplierId}/pay`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  };

  // ==========================================
  // PURCHASES
  // ==========================================
  public purchases = {
    list: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/purchases${query}`);
    },
    create: (payload: any) =>
      this.request('/purchases', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    return: (payload: any) =>
      this.request('/purchases/returns', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  };

  // ==========================================
  // SALES & POS CHECKOUT
  // ==========================================
  public sales = {
    list: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/sales${query}`);
    },
    getById: (id: string) => this.request(`/sales/${id}`),
    checkout: (payload: any) =>
      this.request('/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    return: (payload: any) =>
      this.request('/sales/returns', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getParkedCarts: () => this.request('/sales/parked-carts'),
    parkCart: (payload: any) =>
      this.request('/sales/parked-carts', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    deleteParkedCart: (id: string) =>
      this.request(`/sales/parked-carts/${id}`, { method: 'DELETE' }),
  };

  // ==========================================
  // INDUSTRY PLUGINS
  // ==========================================
  public telecom = {
    getDevices: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/telecom/devices${query}`);
    },
    registerDevice: (payload: any) =>
      this.request('/telecom/devices', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    findByImei: (imei: string) => this.request(`/telecom/devices/imei/${encodeURIComponent(imei)}`),
    getRepairs: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/telecom/repairs${query}`);
    },
    createRepair: (payload: any) =>
      this.request('/telecom/repairs', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateRepairStatus: (id: string, status: string, notes?: string) =>
      this.request(`/telecom/repairs/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
    getTradeIns: () => this.request('/telecom/trade-ins'),
    createTradeIn: (payload: any) =>
      this.request('/telecom/trade-ins', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getRecharges: () => this.request('/telecom/recharges'),
    recordRecharge: (payload: any) =>
      this.request('/telecom/recharges', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  };

  public grocery = {
    getBatches: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/grocery/batches${query}`);
    },
    createBatch: (payload: any) =>
      this.request('/grocery/batches', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    parseScaleBarcode: (barcode: string) =>
      this.request(`/grocery/weigh-scale/parse/${encodeURIComponent(barcode)}`),
  };

  public library = {
    createTitle: (payload: any) =>
      this.request('/library/titles', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    registerCopy: (payload: any) =>
      this.request('/library/copies', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    createMember: (payload: any) =>
      this.request('/library/members', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    issueBook: (payload: any) =>
      this.request('/library/borrows/issue', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    returnBook: (payload: any) =>
      this.request('/library/borrows/return', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  };

  // ==========================================
  // ACCOUNTING & DAILY CLOSING
  // ==========================================
  public accounting = {
    getAccounts: (type?: string) => {
      const query = type ? `?type=${type}` : '';
      return this.request(`/accounting/accounts${query}`);
    },
    createAccount: (payload: any) =>
      this.request('/accounting/accounts', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    createJournalEntry: (payload: any) =>
      this.request('/accounting/journal-entries', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getExpenses: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/accounting/expenses${query}`);
    },
    createExpense: (payload: any) =>
      this.request('/accounting/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getDailyStatus: (date?: string) => {
      const query = date ? `?businessDate=${date}` : '';
      return this.request(`/accounting/daily-closing/status${query}`);
    },
    openDay: (businessDate: string, openingCash: number) =>
      this.request('/accounting/daily-closing/open', {
        method: 'POST',
        body: JSON.stringify({ businessDate, openingCash }),
      }),
    closeDay: (businessDate: string, actualCash: number, notes?: string) =>
      this.request('/accounting/daily-closing/close', {
        method: 'POST',
        body: JSON.stringify({ businessDate, actualCash, notes }),
      }),
    getTrialBalance: () => this.request('/accounting/reports/trial-balance'),
    getIncomeStatement: () => this.request('/accounting/reports/income-statement'),
  };

  // ==========================================
  // REPORTS & DASHBOARDS
  // ==========================================
  public reports = {
    getDashboardSummary: () => this.request('/reports/dashboard/summary'),
    getSalesAnalytics: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/reports/sales-analytics${query}`);
    },
    getInventoryValuation: () => this.request('/reports/inventory-valuation'),
    getAuditLogs: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return this.request(`/reports/audit-logs${query}`);
    },
  };
}

export const apiClient = new ApiClient();
