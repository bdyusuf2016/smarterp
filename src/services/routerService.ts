/**
 * SmartERP Enterprise Routing & URL Parameter Service
 * Handles Hash & Path routing, query parameters, deep links, and navigation history.
 */

export interface ParsedRoute {
  viewId: string;
  path: string;
  params: Record<string, string>;
  tenantId?: string;
  isAuthRoute: boolean;
  authPortal?: 'shop' | 'system_admin';
}

// Canonical Route Map: View ID <-> URL Route Paths
export const VIEW_TO_PATH: Record<string, string> = {
  dashboard: '/dashboard',
  pos_sales: '/pos',
  products: '/products',
  products_catalog: '/products',
  digital_services: '/digital-services',
  barcode_studio: '/barcode-studio',
  billing_calc: '/billing-calculator',
  telecom_imei: '/telecom/imei',
  telecom_repairs: '/telecom/repairs',
  telecom_recharge: '/telecom/recharge',
  grocery_batches: '/grocery/batches',
  grocery_scale: '/grocery/scale',
  library_circulation: '/stationery/circulation',
  library_catalog: '/stationery/catalog',
  customers: '/customers',
  suppliers: '/suppliers',
  accounting: '/accounting',
  reports: '/reports',
  staff_management: '/staff',
  global_settings: '/settings',
  category_studio: '/category-studio',
  modules_settings: '/category-studio',
  rbac_matrix: '/rbac-matrix',
  tenant_management: '/tenants',
  tenant_provisioning: '/tenants',
  audit_logs: '/audit',
  login: '/login',
  system_admin: '/system-admin'
};

export const PATH_TO_VIEW: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/home': 'dashboard',
  '/pos': 'pos_sales',
  '/pos-sales': 'pos_sales',
  '/sales': 'pos_sales',
  '/billing': 'pos_sales',
  '/products': 'products',
  '/stock': 'products',
  '/inventory': 'products',
  '/digital-services': 'digital_services',
  '/services': 'digital_services',
  '/rate-card': 'digital_services',
  '/barcode-studio': 'barcode_studio',
  '/barcode': 'barcode_studio',
  '/barcodes': 'barcode_studio',
  '/billing-calculator': 'billing_calc',
  '/calculator': 'billing_calc',
  '/telecom/imei': 'telecom_imei',
  '/imei': 'telecom_imei',
  '/telecom/repairs': 'telecom_repairs',
  '/repairs': 'telecom_repairs',
  '/telecom/recharge': 'telecom_recharge',
  '/recharge': 'telecom_recharge',
  '/mfs': 'telecom_recharge',
  '/grocery/batches': 'grocery_batches',
  '/batches': 'grocery_batches',
  '/expiry': 'grocery_batches',
  '/grocery/scale': 'grocery_scale',
  '/scale': 'grocery_scale',
  '/stationery/circulation': 'library_circulation',
  '/circulation': 'library_circulation',
  '/stationery/catalog': 'library_catalog',
  '/stationery': 'library_catalog',
  '/books': 'library_catalog',
  '/customers': 'customers',
  '/crm': 'customers',
  '/due': 'customers',
  '/suppliers': 'suppliers',
  '/vendors': 'suppliers',
  '/purchase': 'suppliers',
  '/accounting': 'accounting',
  '/accounts': 'accounting',
  '/cashbook': 'accounting',
  '/ledger': 'accounting',
  '/reports': 'reports',
  '/analytics': 'reports',
  '/profit-loss': 'reports',
  '/staff': 'staff_management',
  '/employees': 'staff_management',
  '/users': 'staff_management',
  '/settings': 'global_settings',
  '/configuration': 'global_settings',
  '/category-studio': 'category_studio',
  '/categories': 'category_studio',
  '/rbac-matrix': 'rbac_matrix',
  '/permissions': 'rbac_matrix',
  '/tenants': 'tenant_provisioning',
  '/tenant_provisioning': 'tenant_provisioning',
  '/tenant-provisioning': 'tenant_provisioning',
  '/provisioning': 'tenant_provisioning',
  '/shops': 'tenant_provisioning',
  '/branches': 'tenant_provisioning',
  '/tenant_management': 'tenant_provisioning',
  '/audit': 'audit_logs',
  '/audit-logs': 'audit_logs',
  '/logs': 'audit_logs',
  '/login': 'login',
  '/system-admin': 'system_admin',
  '/admin': 'system_admin'
};

class RouterService {
  /**
   * Parse the current browser URL (Hash or Pathname + Query Params)
   */
  public parseCurrentRoute(): ParsedRoute {
    const rawHash = window.location.hash || '';
    const rawPath = window.location.pathname || '';
    const rawSearch = window.location.search || '';

    // Handle Hash-based routing e.g. #/pos?tab=sell or #system-admin
    let routeString = '';
    let queryString = '';

    if (rawHash.startsWith('#/')) {
      const parts = rawHash.slice(1).split('?');
      routeString = parts[0] || '/';
      queryString = parts[1] || '';
    } else if (rawHash.startsWith('#')) {
      const parts = rawHash.slice(1).split('?');
      routeString = '/' + (parts[0] || '');
      queryString = parts[1] || '';
    } else {
      routeString = rawPath.length > 1 ? rawPath : '/dashboard';
      queryString = rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch;
    }

    // Check for clean path tenant pattern e.g. /shop/:tenantCode or /t/:tenantCode
    let pathTenant: string | undefined = undefined;
    const shopPrefixMatch = routeString.match(/^\/(?:shop|t|dokan)\/([^/?#]+)(?:\/(.*))?$/i);
    if (shopPrefixMatch) {
      pathTenant = shopPrefixMatch[1];
      routeString = '/' + (shopPrefixMatch[2] || 'dashboard');
    }

    // Subdomain detection (e.g. store1.smarterp.io)
    let subdomainTenant: string | undefined = undefined;
    if (typeof window !== 'undefined' && window.location.hostname) {
      const hostname = window.location.hostname.toLowerCase();
      if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('0.0.0.0')) {
        const parts = hostname.split('.');
        if (parts.length >= 3 && parts[0] !== 'admin' && parts[0] !== 'www' && parts[0] !== 'api') {
          subdomainTenant = parts[0];
        }
      }
    }

    // Parse URL Search Params
    const urlParams = new URLSearchParams(queryString);
    const params: Record<string, string> = {};
    urlParams.forEach((val, key) => {
      params[key] = val;
    });

    // Extract optional explicit 'view' query param
    const explicitView = params['view'] || params['tab'] || params['page'];

    // Check if auth route
    const isAuth = 
      routeString.includes('system-admin') || 
      routeString.includes('login') || 
      routeString.includes('admin') ||
      explicitView === 'login' || 
      explicitView === 'system_admin';

    const authPortal: 'shop' | 'system_admin' = 
      (routeString.includes('system-admin') || explicitView === 'system_admin') 
        ? 'system_admin' 
        : 'shop';

    // Normalize path to clean view ID
    let normalizedPath = routeString.toLowerCase().replace(/\/+$/, '') || '/';
    let viewId = explicitView || PATH_TO_VIEW[normalizedPath] || 'dashboard';

    const detectedTenantId = 
      params['tenant'] || 
      params['tenantId'] || 
      params['branch'] || 
      params['shop'] || 
      pathTenant || 
      subdomainTenant;

    return {
      viewId,
      path: normalizedPath,
      params,
      tenantId: detectedTenantId,
      isAuthRoute: isAuth,
      authPortal
    };
  }

  /**
   * Navigate to a view and update the URL cleanly
   */
  public navigate(
    viewId: string, 
    params: Record<string, string | number | boolean | undefined | null> = {}, 
    replace = false
  ): void {
    const path = VIEW_TO_PATH[viewId] || `/${viewId}`;
    
    // Construct Query String if any params provided
    const queryParts: string[] = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
      }
    });

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const newHash = `#${path}${queryString}`;

    if (window.location.hash !== newHash) {
      if (replace) {
        window.history.replaceState(null, '', newHash);
      } else {
        window.location.hash = newHash;
      }
    }

    // Dispatch global custom event for reactive UI updates
    window.dispatchEvent(new CustomEvent('dokan_route_changed', {
      detail: {
        viewId,
        path,
        params,
        fullUrl: window.location.href
      }
    }));
  }

  /**
   * Update Query Parameters without resetting the current View Route
   */
  public setQueryParams(newParams: Record<string, string | number | boolean | undefined | null>): void {
    const current = this.parseCurrentRoute();
    const mergedParams = { ...current.params, ...newParams };
    
    // Clean up empty params
    Object.keys(mergedParams).forEach(k => {
      if (mergedParams[k] === undefined || mergedParams[k] === null || mergedParams[k] === '') {
        delete mergedParams[k];
      }
    });

    this.navigate(current.viewId, mergedParams, true);
  }

  /**
   * Get formatted route URL for link buttons / hrefs
   */
  public getUrl(viewId: string, params: Record<string, string | number | boolean> = {}): string {
    const path = VIEW_TO_PATH[viewId] || `/${viewId}`;
    const queryParts: string[] = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
      }
    });
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return `#${path}${queryString}`;
  }
}

export const routerService = new RouterService();
