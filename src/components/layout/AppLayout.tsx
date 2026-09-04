import React, { useState, useEffect } from 'react';
import { Tenant, UserRole } from '../../types';
import { storageService } from '../../services/storageService';
import { authService, UserProfile } from '../../services/authService';
import { i18n } from '../../services/i18nService';
import { routerService, ParsedRoute } from '../../services/routerService';
import { RbacEngine } from '../../engine/rbacEngine';
import { RuleEngine } from '../../engine/ruleEngine';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ProfileManagerModal } from './ProfileManagerModal';
import { LoginView } from '../views/LoginView';
import { DashboardView } from '../views/DashboardView';
import { POSView } from '../views/POSView';
import { ProductsView } from '../views/ProductsView';
import { TelecomModulesView } from '../views/TelecomModulesView';
import { GroceryModulesView } from '../views/GroceryModulesView';
import { LibraryModulesView } from '../views/LibraryModulesView';
import { CategoryStudioView } from '../views/CategoryStudioView';
import { CustomersView } from '../views/CustomersView';
import { AccountingView } from '../views/AccountingView';
import { ReportsView } from '../views/ReportsView';
import { AuditView } from '../views/AuditView';
import { RbacMatrixView } from '../views/RbacMatrixView';
import { StaffManagementView } from '../views/StaffManagementView';
import { TenantManagementView } from '../views/TenantManagementView';
import { BarcodeStudioView } from '../views/BarcodeStudioView';
import { BillingCalculatorView } from '../views/BillingCalculatorView';
import { DigitalServicesView } from '../views/DigitalServicesView';
import { GlobalSettingsView } from '../views/GlobalSettingsView';
import { SuppliersView } from '../views/SuppliersView';
import { ShieldAlert, ArrowLeft, LayoutDashboard, ShoppingBag, Package, Users, Menu as MenuIcon, X } from 'lucide-react';
import { supabaseService } from '../../services/supabaseClient';

const fallbackTenant: Tenant = {
  id: '',
  code: 'PLATFORM',
  name: 'সেন্ট্রাল প্ল্যাটফর্ম',
  owner_name: 'Platform Administrator',
  email: 'admin@smarterp.io',
  phone: '',
  currency: 'BDT',
  currency_symbol: '৳',
  address: '',
  active_categories: [],
  enabled_modules: ['SALES', 'PRODUCTS', 'INVENTORY', 'CUSTOMERS', 'ACCOUNTING', 'REPORTS'],
  created_at: new Date().toISOString()
};

export const AppLayout: React.FC = () => {
  const tenants = storageService.getTenants();
  const categories = storageService.getCategories();

  const initialRoute = routerService.parseCurrentRoute();
  const [currentRoute, setCurrentRoute] = useState<ParsedRoute>(initialRoute);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [activeTenant, setActiveTenant] = useState<Tenant>(() => {
    const user = authService.getCurrentUser();
    if (initialRoute.tenantId) {
      const foundParam = tenants.find(t => t.id === initialRoute.tenantId || t.code.toLowerCase() === initialRoute.tenantId?.toLowerCase());
      if (foundParam) return foundParam;
    }
    if (user?.tenantId) {
      const found = tenants.find(t => t.id === user.tenantId);
      if (found) return found;
    }
    return tenants.length > 0 ? tenants[0] : fallbackTenant;
  });

  const [activeViewId, setActiveViewIdState] = useState<string>(() => initialRoute.viewId || 'dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthRoute, setIsAuthRoute] = useState<boolean>(() => initialRoute.isAuthRoute);
  const [currentLang, setCurrentLang] = useState<'bn' | 'en'>(() => i18n.getLanguage());

  // Function to navigate and update URL parameter / routes
  const setActiveViewId = (viewId: string, params: Record<string, string> = {}) => {
    setActiveViewIdState(viewId);
    routerService.navigate(viewId, params);
  };

  useEffect(() => {
    const handleLang = () => setCurrentLang(i18n.getLanguage());
    window.addEventListener('dokan_lang_changed', handleLang);
    return () => window.removeEventListener('dokan_lang_changed', handleLang);
  }, []);

  // Auto-pull existing cloud tenants and data when app launches or opens on any device
  useEffect(() => {
    supabaseService.pullFromCloud().then(res => {
      if (res.success) {
        const fresh = storageService.getTenants();
        const curTenant = storageService.getActiveTenant();
        if ((!curTenant || !curTenant.id) && fresh.length > 0) {
          setActiveTenant(fresh[0]);
          storageService.setActiveTenantId(fresh[0].id);
        }
      }
    }).catch(console.warn);
  }, []);

  // Sync active tenant state live when modified in Tenant Management or Settings
  useEffect(() => {
    const handleTenantUpdated = () => {
      const freshTenants = storageService.getTenants();
      const currentActiveId = storageService.getActiveTenant()?.id || activeTenant.id;
      const found = freshTenants.find(t => t.id === currentActiveId);
      if (found) {
        setActiveTenant(found);
      }
    };
    window.addEventListener('dokan_storage_updated', handleTenantUpdated);
    window.addEventListener('dokan_tenant_changed', handleTenantUpdated);
    return () => {
      window.removeEventListener('dokan_storage_updated', handleTenantUpdated);
      window.removeEventListener('dokan_tenant_changed', handleTenantUpdated);
    };
  }, [activeTenant.id]);

  // Footer & Branding Configuration State
  const [footerConfig, setFooterConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(`dokan_footer_config_${activeTenant.id}`) || localStorage.getItem('dokan_footer_config');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      isEnabled: true,
      brandTitle: 'SmartERP Enterprise',
      versionTag: 'V2.0',
      copyrightText: '© 2026 SmartERP Enterprise. সর্বস্বত্ব সংরক্ষিত।',
      showCurrencyTimezone: true,
      currencyText: 'BDT (৳)',
      timezoneText: 'Asia/Dhaka (GMT+6)',
      showUserBadge: true,
      supportPhone: '+880 1700-000000',
      supportEmail: 'support@smarterp.com'
    };
  });

  useEffect(() => {
    const handleFooterChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent?.detail) {
        setFooterConfig(customEvent.detail);
      } else {
        const stored = localStorage.getItem(`dokan_footer_config_${activeTenant.id}`) || localStorage.getItem('dokan_footer_config');
        if (stored) {
          try {
            setFooterConfig(JSON.parse(stored));
          } catch (err) {
            console.error(err);
          }
        }
      }
    };

    window.addEventListener('dokan_footer_config_changed', handleFooterChange);
    return () => window.removeEventListener('dokan_footer_config_changed', handleFooterChange);
  }, [activeTenant.id]);

  // Initialize theme on app mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dokan_v2_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Dynamic Browser Tab & Page Title Engine per Tenant & View
  useEffect(() => {
    const viewTitleMap: Record<string, { bn: string; en: string }> = {
      dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
      pos_sales: { bn: 'POS কুইক বিলিং', en: 'POS Quick Billing' },
      billing_calc: { bn: 'ক্যাশ ও বিলিং ক্যালকুলেটর', en: 'Billing Calculator' },
      products: { bn: 'পণ্য ও স্টক ইনওয়ার্ড', en: 'Products & Inventory' },
      digital_services: { bn: 'সেবা ও মূল্যহার তালিকা', en: 'Digital Services' },
      barcode_studio: { bn: 'বারকোড স্টিকার প্রিন্ট', en: 'Barcode Studio' },
      telecom_imei: { bn: 'IMEI হ্যান্ডসেট স্টক', en: 'IMEI Registry' },
      telecom_repairs: { bn: 'মোবাইল সার্ভিসিং', en: 'Repairs & Servicing' },
      telecom_recharge: { bn: 'রিচার্জ ও MFS রেজিস্টার', en: 'Recharge & MFS' },
      grocery_batches: { bn: 'ব্যাচ ও মেয়াদ ট্র্যাকিং', en: 'Batch & Expiry' },
      grocery_scale: { bn: 'ডিজিটাল ওয়েট স্কেল', en: 'Weighing Scale' },
      library_circulation: { bn: 'বুকস্টোর সেলস ও সাপ্লাই', en: 'Book Circulation' },
      library_catalog: { bn: 'বই-খাতা ক্যাটালগ', en: 'Book Catalog' },
      customers: { bn: 'কাস্টমার বাকির খাতা', en: 'Customer Ledger' },
      suppliers: { bn: 'সাপ্লায়ার ও ভেন্ডর লেজার', en: 'Suppliers & Vendors' },
      accounting: { bn: 'হিসাব ও ক্যাশ খাতা', en: 'Accounting & Ledger' },
      reports: { bn: 'লাভ-ক্ষতি ও আর্থিক রিপোর্ট', en: 'Financial Reports' },
      staff_management: { bn: 'কর্মচারী ও পারমিশন', en: 'Staff & Roles' },
      global_settings: { bn: 'গ্লোবাল সেটিংস', en: 'Global Settings' },
      category_studio: { bn: 'ক্যাটাগরি স্টুডিও', en: 'Category Studio' },
      rbac_matrix: { bn: 'রোল পারমিশন ম্যাট্রিক্স', en: 'RBAC Matrix' },
      tenant_management: { bn: 'দোকান ও শাখা ব্যবস্থাপনা', en: 'Shop Branches' },
      audit: { bn: 'সিকিউরিটি অডিট লগ', en: 'Security Audit' }
    };

    const isEn = currentLang === 'en';
    const pageName = viewTitleMap[activeViewId] ? (isEn ? viewTitleMap[activeViewId].en : viewTitleMap[activeViewId].bn) : activeViewId;
    const shopName = activeTenant.name || (isEn ? 'Smart Store' : 'স্মার্ট দোকান');
    const branding = activeTenant.system_branding || 'SmartERP';
    const tagline = activeTenant.tagline || '';
    const format = activeTenant.page_title_format || '{{page}} | {{shop}} - {{branding}}';

    const formattedTitle = format
      .replace(/{{page}}/g, pageName)
      .replace(/{{shop}}/g, shopName)
      .replace(/{{shop_name}}/g, shopName)
      .replace(/{{branding}}/g, branding)
      .replace(/{{tagline}}/g, tagline);

    document.title = formattedTitle;
  }, [activeTenant, activeViewId, currentLang]);

  // Sync full URL routing and parameter changes
  useEffect(() => {
    const handleLocation = () => {
      const route = routerService.parseCurrentRoute();
      setCurrentRoute(route);
      setIsAuthRoute(route.isAuthRoute);
      if (route.viewId) {
        setActiveViewIdState(route.viewId);
      }
      if (route.tenantId) {
        const found = tenants.find(t => t.id === route.tenantId || t.code.toLowerCase() === route.tenantId?.toLowerCase());
        if (found && found.id !== activeTenant.id) {
          setActiveTenant(found);
        }
      }
    };

    handleLocation();
    window.addEventListener('hashchange', handleLocation);
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('dokan_route_changed', handleLocation);
    return () => {
      window.removeEventListener('hashchange', handleLocation);
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('dokan_route_changed', handleLocation);
    };
  }, [tenants, activeTenant.id]);

  const handleLoginSuccess = (user: UserProfile, tenantId?: string, targetView?: string) => {
    setCurrentUser(user);
    const freshTenants = storageService.getTenants();
    let resolvedTenant = activeTenant;
    if (tenantId) {
      const t = freshTenants.find(item => item.id === tenantId || item.code?.toLowerCase() === tenantId.toLowerCase());
      if (t) {
        resolvedTenant = t;
        setActiveTenant(t);
      }
    }
    setIsAuthRoute(false);

    // Smart role-based landing page
    const landingView = targetView || (
      user.role === 'CASHIER' 
        ? 'pos_sales' 
        : (user.role === 'TECHNICIAN' || (user.role as string) === 'REPAIR_TECHNICIAN') 
        ? 'telecom_repairs' 
        : 'dashboard'
    );

    if (user.role === 'SUPER_ADMIN') {
      // System Admin stays at clean root level
      setActiveViewId(landingView);
      routerService.navigate(landingView);
    } else if (resolvedTenant && resolvedTenant.id) {
      // Store staff / owners navigate to their tenant URL
      setActiveViewId(landingView, { tenant: resolvedTenant.code });
    } else {
      setActiveViewId(landingView);
    }
  };

  const handleLogout = () => {
    const wasSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
    const lastTenantCode = activeTenant?.code;
    authService.logout();
    setCurrentUser(null);
    setIsAuthRoute(true);
    if (!wasSuperAdmin && lastTenantCode && lastTenantCode !== 'PLATFORM') {
      routerService.navigate('login', { tenant: lastTenantCode });
    } else {
      routerService.navigate('login');
    }
  };

  const handleTenantChange = (tenant: Tenant) => {
    setActiveTenant(tenant);
    if (currentUser) {
      const updated = { ...currentUser, tenantId: tenant.id };
      setCurrentUser(updated);
      authService.saveCurrentUser(updated);
    }
  };

  const handleTenantUpdated = (updatedTenant: Tenant) => {
    setActiveTenant(updatedTenant);
    storageService.saveTenant(updatedTenant);
  };

  const handleOpenCategoryStudio = () => {
    setActiveViewId('category_studio');
  };

  const handleOpenRbacMatrix = () => {
    setActiveViewId('rbac_matrix');
  };

  // If user is not logged in or is on the login/system-admin route, show LoginView
  if (!currentUser || isAuthRoute) {
    return (
      <LoginView
        tenants={tenants}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const activeRole: UserRole = currentUser.role || 'CASHIER';

  // View Guard Check: verify that user's role has permission for requested view
  const renderUnauthorized = (requiredPerm: string, viewName: string) => {
    const isEn = currentLang === 'en';
    return (
      <div className="bg-white dark:bg-[#1a1d26] rounded-xl border border-rose-200 dark:border-rose-900 p-8 text-center max-w-xl mx-auto mt-12 shadow-xs">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{isEn ? 'Access Denied' : 'এক্সেস অনুমতি নেই'}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          {isEn ? 'Your current role' : 'আপনার বর্তমান রোল'} <b className="text-slate-700 dark:text-slate-200">({activeRole})</b> {isEn ? 'cannot access' : 'দিয়ে'} <b>"{viewName}"</b> {isEn ? 'module.' : 'মডিউলে প্রবেশ করার অনুমতি নেই।'}
        </p>
        <div className="inline-block bg-slate-50 dark:bg-[#0c0e14] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono mb-5">
          Required: {requiredPerm}
        </div>
        <div>
          <button
            type="button"
            onClick={() => setActiveViewId('dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isEn ? 'Back to Dashboard' : 'ড্যাশবোর্ডে ফিরে যান'}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderModuleDisabled = (moduleName: string) => {
    const isEn = currentLang === 'en';
    return (
      <div className="bg-white dark:bg-[#1a1d26] rounded-xl border border-amber-200 dark:border-amber-900 p-8 text-center max-w-xl mx-auto mt-12 shadow-xs">
        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{isEn ? 'Module Disabled' : 'মডিউলটি বন্ধ রয়েছে'}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          {isEn ? 'The' : 'আপনার এই দোকানে'} <b>"{moduleName}"</b> {isEn ? 'module has been turned off by System Admin for this store.' : 'মডিউলটি সিস্টেম অ্যাডমিন কর্তৃক নিষ্ক্রিয় রাখা হয়েছে।'}
        </p>
        <div>
          <button
            type="button"
            onClick={() => setActiveViewId('dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isEn ? 'Back to Dashboard' : 'ড্যাশবোর্ডে ফিরে যান'}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderActiveView = () => {
    switch (activeViewId) {
      case 'dashboard':
        return <DashboardView activeTenant={activeTenant} activeRole={activeRole} onNavigate={setActiveViewId} />;
      
      case 'pos_sales':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'SALES')) {
          return renderModuleDisabled('POS সেলস (POS Sales)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'sales.pos_access')) {
          return renderUnauthorized('sales.pos_access', 'POS কুইক বিলিং');
        }
        return <POSView activeTenant={activeTenant} activeRole={activeRole} />;
      
      case 'billing_calc':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'SALES')) {
          return renderModuleDisabled('ক্যাশ ও বিলিং ক্যালকুলেটর (Billing Calculator)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'tools.billing_calc')) {
          return renderUnauthorized('tools.billing_calc', 'ক্যাশ ও বিলিং ক্যালকুলেটর');
        }
        return <BillingCalculatorView activeTenant={activeTenant} activeRole={activeRole} />;

      case 'products':
      case 'products_catalog':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'PRODUCTS')) {
          return renderModuleDisabled('প্রোডাক্ট ও স্টক (Products)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'products.view')) {
          return renderUnauthorized('products.view', 'প্রোডাক্ট ও স্টক');
        }
        return <ProductsView activeTenant={activeTenant} activeRole={activeRole} />;
      
      case 'barcode_studio':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'BARCODE_PRINT') && !RuleEngine.isModuleEnabled(activeTenant, 'BARCODE')) {
          return renderModuleDisabled('বারকোড স্টিকার প্রিন্ট (Barcode Studio)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'barcode.print')) {
          return renderUnauthorized('barcode.print', 'বারকোড স্টিকার প্রিন্ট');
        }
        return <BarcodeStudioView activeTenant={activeTenant} activeRole={activeRole} />;
      
      case 'digital_services':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'DIGITAL_SERVICES')) {
          return renderModuleDisabled('ফটোকপি ও অনলাইন সেবা (Digital Services)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'services.digital_desk')) {
          return renderUnauthorized('services.digital_desk', 'সেবা ও মূল্যহার তালিকা');
        }
        return (
          <DigitalServicesView
            activeTenant={activeTenant}
            activeRole={activeRole}
            onNavigateToPOS={() => setActiveViewId('pos_sales')}
          />
        );
      
      case 'telecom_imei':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'IMEI')) {
          return renderModuleDisabled('IMEI হ্যান্ডসেট স্টক (IMEI Module)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'telecom.imei_stock')) {
          return renderUnauthorized('telecom.imei_stock', 'IMEI হ্যান্ডসেট স্টক');
        }
        return <TelecomModulesView activeTenant={activeTenant} activeRole={activeRole} activeTab="imei" />;
      
      case 'telecom_repairs':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'REPAIRS')) {
          return renderModuleDisabled('মোবাইল সার্ভিসিং (Repairs Module)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'telecom.repairs_manage')) {
          return renderUnauthorized('telecom.repairs_manage', 'মোবাইল সার্ভিসিং');
        }
        return <TelecomModulesView activeTenant={activeTenant} activeRole={activeRole} activeTab="repairs" />;
      
      case 'telecom_recharge':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'RECHARGE')) {
          return renderModuleDisabled('মোবাইল রিচার্জ ও MFS (Recharge Module)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'telecom.recharge_mfs')) {
          return renderUnauthorized('telecom.recharge_mfs', 'মোবাইল রিচার্জ ও MFS');
        }
        return <TelecomModulesView activeTenant={activeTenant} activeRole={activeRole} activeTab="recharge" />;
      
      case 'grocery_batches':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'BATCH_EXPIRY')) {
          return renderModuleDisabled('ব্যাচ ও মেয়াদ ট্র্যাকিং (Batch & Expiry)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'grocery.batch_expiry')) {
          return renderUnauthorized('grocery.batch_expiry', 'ব্যাচ ও মেয়াদ ট্র্যাকিং');
        }
        return <GroceryModulesView activeTenant={activeTenant} activeRole={activeRole} activeTab="batches" />;
      
      case 'grocery_scale':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'WEIGH_SCALE')) {
          return renderModuleDisabled('ডিজিটাল ওয়েট স্কেল (Weigh Scale)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'grocery.weigh_scale')) {
          return renderUnauthorized('grocery.weigh_scale', 'ডিজিটাল ওয়েট স্কেল');
        }
        return <GroceryModulesView activeTenant={activeTenant} activeRole={activeRole} activeTab="scale" />;
      
      case 'library_circulation':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'CIRCULATION')) {
          return renderModuleDisabled('বুকস্টোর সেলস ও সাপ্লাই (Circulation & Sales)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'stationery.stock_sales')) {
          return renderUnauthorized('stationery.stock_sales', 'বুকস্টোর সেলস ও সাপ্লাই');
        }
        return <LibraryModulesView activeTenant={activeTenant} activeRole={activeRole} activeTab="circulation" />;
      
      case 'library_catalog':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'BOOK_CATALOG')) {
          return renderModuleDisabled('বই-খাতা ও প্রকাশনী ক্যাটালগ (Book Catalog)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'stationery.book_catalog')) {
          return renderUnauthorized('stationery.book_catalog', 'বই-খাতা ও প্রকাশনী ক্যাটালগ');
        }
        return <LibraryModulesView activeTenant={activeTenant} activeRole={activeRole} activeTab="catalog" />;
      
      case 'category_studio':
      case 'modules_settings':
        if (activeRole !== 'SUPER_ADMIN') {
          return renderUnauthorized('system.category_studio', 'বিজনেস ক্যাটাগরি স্টুডিও');
        }
        return <CategoryStudioView activeTenant={activeTenant} activeRole={activeRole} onTenantUpdated={handleTenantUpdated} />;
      
      case 'customers':
      case 'customers_crm':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'CUSTOMERS')) {
          return renderModuleDisabled('কাস্টমার বাকির খাতা (Customer CRM)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'customers.view')) {
          return renderUnauthorized('customers.view', 'কাস্টমার বাকির খাতা');
        }
        return <CustomersView activeTenant={activeTenant} activeRole={activeRole} />;
      
      case 'suppliers':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'PURCHASE')) {
          return renderModuleDisabled('সাপ্লায়ার ও বিল পেমেন্ট (Supplier & Purchase)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'suppliers.view')) {
          return renderUnauthorized('suppliers.view', 'সাপ্লায়ার ও বিল পেমেন্ট');
        }
        return <SuppliersView activeTenant={activeTenant} activeRole={activeRole} />;
      
      case 'accounting':
      case 'accounting_ledger':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'ACCOUNTING')) {
          return renderModuleDisabled('হিসাব ও ক্যাশ খাতা (Accounting)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'accounting.view_ledger')) {
          return renderUnauthorized('accounting.view_ledger', 'হিসাব ও ক্যাশ খাতা');
        }
        return <AccountingView activeTenant={activeTenant} activeRole={activeRole} />;
      
      case 'reports':
        if (!RuleEngine.isModuleEnabled(activeTenant, 'REPORTS')) {
          return renderModuleDisabled('রিপোর্ট ও অ্যানালিটিক্স (Reports)');
        }
        if (!RbacEngine.hasPermission(activeRole, 'reports.view_analytics')) {
          return renderUnauthorized('reports.view_analytics', 'রিপোর্ট ও অ্যানালিটিক্স');
        }
        return <ReportsView activeTenant={activeTenant} activeRole={activeRole} />;
      
      case 'staff_management':
        if (!RbacEngine.hasPermission(activeRole, 'system.staff_manage')) {
          return renderUnauthorized('system.staff_manage', 'কর্মচারী ও পারমিশন কন্ট্রোল');
        }
        return <StaffManagementView activeTenant={activeTenant} activeRole={activeRole} />;

      case 'global_settings':
      case 'settings':
        if (!RbacEngine.hasPermission(activeRole, 'system.settings_manage')) {
          return renderUnauthorized('system.settings_manage', 'গ্লোবাল সেটিংস');
        }
        return (
          <GlobalSettingsView
            activeTenant={activeTenant}
            activeRole={activeRole}
            onTenantUpdated={handleTenantUpdated}
          />
        );

      case 'audit':
        if (!RbacEngine.hasPermission(activeRole, 'system.audit_view')) {
          return renderUnauthorized('system.audit_view', 'সিকিউরিটি অডিট লগ');
        }
        return <AuditView activeTenant={activeTenant} activeRole={activeRole} />;
      
      case 'tenant_provisioning':
      case 'tenant_management':
        if (activeRole !== 'SUPER_ADMIN') {
          return renderUnauthorized('system.super_admin_matrix', 'দোকান ও ডোমেন প্রভিশনিং');
        }
        return (
          <TenantManagementView
            activeRole={activeRole}
            onSelectTenant={(t) => {
              handleTenantChange(t);
              setActiveViewId('dashboard');
            }}
          />
        );

      case 'rbac_matrix':
        if (activeRole !== 'SUPER_ADMIN') {
          return renderUnauthorized('system.super_admin_matrix', 'রোল ও পারমিশন ম্যাট্রিক্স');
        }
        return <RbacMatrixView activeRole={activeRole} />;
      
      default:
        return <DashboardView activeTenant={activeTenant} activeRole={activeRole} onNavigate={setActiveViewId} />;
    }
  };

  const isEn = currentLang === 'en';

  return (
    <div className="h-screen w-full bg-[#f1f3f5] dark:bg-[#0c0e14] text-[#212529] dark:text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* Clean Dynamic Header */}
      <Header
        activeTenant={activeTenant}
        onTenantChange={handleTenantChange}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        categories={categories}
        onOpenCategoryStudio={handleOpenCategoryStudio}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenRbacMatrix={handleOpenRbacMatrix}
        onOpenStaffManagement={() => setActiveViewId('staff_management')}
        onOpenTenantProvisioning={() => setActiveViewId('tenant_provisioning')}
        onOpenGlobalSettings={() => setActiveViewId('global_settings')}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Dynamic RBAC/Tenant Sidebar (Desktop) */}
        <div className="hidden md:flex shrink-0 h-full">
          <Sidebar
            activeTenant={activeTenant}
            activeRole={activeRole}
            currentUser={currentUser}
            activeViewId={activeViewId}
            onSelectView={setActiveViewId}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onLogout={handleLogout}
          />
        </div>

        {/* Mobile Slide-Over Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setIsMobileMenuOpen(false)} 
            />
            {/* Drawer Body */}
            <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
              <Sidebar
                activeTenant={activeTenant}
                activeRole={activeRole}
                currentUser={currentUser}
                activeViewId={activeViewId}
                onSelectView={(vid) => {
                  setActiveViewId(vid);
                  setIsMobileMenuOpen(false);
                }}
                onOpenProfile={() => {
                  setIsProfileModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                onLogout={handleLogout}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Content Canvas (With bottom padding for phone bottom dock) */}
        <main 
          key={`${activeViewId}_${currentLang}`} 
          className="flex-1 overflow-y-auto p-2.5 sm:p-5 pb-20 md:pb-5 min-w-0 bg-[#f1f3f5] dark:bg-[#0c0e14]"
        >
          <div className="max-w-full mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Dock Bar (< md screens) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 dark:bg-[#101319]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#222734] px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setActiveViewId('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeViewId === 'dashboard'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{isEn ? 'Dashboard' : 'হোম'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewId('pos_sales')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeViewId === 'pos_sales'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{isEn ? 'POS' : 'সেলস'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewId('products')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeViewId === 'products' || activeViewId === 'products_catalog'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{isEn ? 'Stock' : 'স্টক'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewId('customers')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeViewId === 'customers' || activeViewId === 'customers_crm'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isEn ? 'CRM' : 'কাস্টমার'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
        >
          <MenuIcon className="w-4 h-4" />
          <span>{isEn ? 'More' : 'মেনু'}</span>
        </button>
      </nav>

      {/* Profile Manager Modal */}
      <ProfileManagerModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        activeTenant={activeTenant}
        onProfileUpdated={setCurrentUser}
        onLogout={handleLogout}
      />

      {/* Clean Dynamic Dokan Manager Enterprise Footer (Desktop) */}
      {footerConfig.isEnabled && (
        <footer className="hidden md:flex shrink-0 bg-white dark:bg-[#101319] border-t border-slate-200 dark:border-[#222734] px-4 sm:px-6 py-2 items-center justify-between gap-2 select-none text-[11px] text-slate-500 shadow-xs z-20">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-slate-800 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{footerConfig.brandTitle || 'SmartERP Enterprise'}</span>
              <span className="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-mono text-[10px] rounded font-semibold border border-indigo-200 dark:border-indigo-800">
                {footerConfig.versionTag || 'V2.0'}
              </span>
            </div>

            {footerConfig.showCurrencyTimezone && (
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                <span>{footerConfig.currencyText || 'BDT (৳)'}</span>
                <span>•</span>
                <span>{footerConfig.timezoneText || 'Asia/Dhaka'}</span>
                {footerConfig.supportPhone && (
                  <>
                    <span>•</span>
                    <span className="text-slate-600 dark:text-slate-400">📞 {footerConfig.supportPhone}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {footerConfig.showUserBadge && currentUser && (
              <span className="font-mono text-[10px] text-slate-500">
                লগইন: <b className="text-slate-800 font-semibold">{currentUser.name}</b> <span className="text-indigo-600">({currentUser.role})</span>
              </span>
            )}
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-[10px] text-slate-500 font-medium">
              {footerConfig.copyrightText || '© 2026 SmartERP. All rights reserved.'}
            </span>
          </div>
        </footer>
      )}
    </div>
  );
};
