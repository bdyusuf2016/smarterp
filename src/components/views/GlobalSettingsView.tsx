import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Moon, 
  Sun, 
  Globe, 
  Building2, 
  CreditCard, 
  Layers, 
  Printer, 
  Database, 
  Save, 
  Download, 
  Upload, 
  CheckCircle2, 
  Sliders, 
  Shield, 
  Plus, 
  Trash2, 
  Sparkles, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  HelpCircle,
  FileText,
  Smartphone,
  QrCode,
  Edit3,
  X,
  Wallet,
  Banknote,
  AlertTriangle,
  Percent,
  Lock,
  RefreshCw,
  Cloud,
  Activity,
  Key,
  Copy,
  Check
} from 'lucide-react';
import { Tenant, UserRole, BusinessCategory, CustomFieldDefinition, CustomFieldType } from '../../types';
import { storageService } from '../../services/storageService';
import { i18n } from '../../services/i18nService';
import { supabaseService, ConnectionTestResult } from '../../services/supabaseClient';

interface GlobalSettingsViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
  onTenantUpdated?: (updatedTenant: Tenant) => void;
}

export const GlobalSettingsView: React.FC<GlobalSettingsViewProps> = ({
  activeTenant,
  activeRole,
  onTenantUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'shop' | 'payment' | 'categories' | 'pos' | 'footer' | 'supabase' | 'backup'>('theme');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Supabase Cloud DB Settings
  const [supabaseUrl, setSupabaseUrl] = useState(() => supabaseService.getConfig().url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => supabaseService.getConfig().anonKey);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // 1. Theme & Localization Settings
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('dokan_v2_theme') as 'light' | 'dark') || 'light';
  });
  const [language, setLanguage] = useState<'bn' | 'en'>(() => {
    return (localStorage.getItem('dokan_v2_lang') as 'bn' | 'en') || 'bn';
  });
  const [layoutDensity, setLayoutDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Footer & Enterprise Branding Settings
  const footerSettingsKey = `dokan_footer_config_${activeTenant.id}`;
  const [footerConfig, setFooterConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(footerSettingsKey) || localStorage.getItem('dokan_footer_config');
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
      supportEmail: 'support@smarterp.com',
      customNotice: 'SmartERP Enterprise Core System • Multi-Tenant Secured'
    };
  });

  // 2. Shop Profile Settings
  const [shopName, setShopName] = useState(activeTenant.name || '');
  const [shopCode, setShopCode] = useState(activeTenant.code || '');
  const [ownerName, setOwnerName] = useState(activeTenant.owner_name || '');
  const [phone, setPhone] = useState(activeTenant.phone || '');
  const [email, setEmail] = useState(activeTenant.email || '');
  const [address, setAddress] = useState(activeTenant.address || '');
  const [currencySymbol, setCurrencySymbol] = useState(activeTenant.currency_symbol || '৳');
  const [vatRegNo, setVatRegNo] = useState('BIN-123456789-001');
  const [invoiceHeaderNote, setInvoiceHeaderNote] = useState('বিসমিল্লাহির রাহমানির রাহিম');
  const [invoiceFooterNote, setInvoiceFooterNote] = useState('বিক্রিত পণ্য ৭ দিনের মধ্যে ক্যাশ মেমো সহ পরিবর্তনযোগ্য। ধন্যবাদ, আবার আসবেন!');

  // 3. Payment Methods Settings
  const paymentSettingsKey = `dokan_v2_payment_settings_${activeTenant.id}`;
  const [paymentConfig, setPaymentConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(paymentSettingsKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      enableCash: true,
      cashOpeningBalance: 0,
      enableChangeCalculation: true,
      autoOpenCashDrawer: true,

      enableBkash: true,
      bkashNumber: '01700000000',
      bkashType: 'Merchant',
      bkashTrxFeePercent: 0,
      bkashRequireTrxId: true,
      bkashQrCodeUrl: '',

      enableNagad: true,
      nagadNumber: '01800000000',
      nagadType: 'Personal',
      nagadTrxFeePercent: 0,
      nagadRequireTrxId: true,

      enableRocket: true,
      rocketNumber: '01900000000',
      rocketType: 'Merchant',

      enableUpay: false,
      upayNumber: '',

      enableCard: true,
      cardTerminalName: 'City Bank POS',
      cardMdrPercent: 1.5,
      supportedCards: ['Visa', 'Mastercard', 'Nexus', 'Amex'],

      enableDueCredit: true,
      maxDueLimit: 50000,
      duePaymentDays: 30,
      blockSaleIfDueOverLimit: true,
      requireCustomerPhoneForDue: true,

      enableSplitPayment: true,
      roundOffTotal: true
    };
  });

  // 4. POS & Printing Preferences
  const posSettingsKey = `dokan_v2_pos_settings_${activeTenant.id}`;
  const [posConfig, setPosConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(posSettingsKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      defaultPaperSize: '80mm',
      defaultVatPercent: 0,
      minStockAlertLimit: 5,
      autoPrintOnCheckout: true,
      enableSoundEffects: true,
      barcodeFastScanMode: true
    };
  });

  // 5. Category & Custom Properties
  const categories = storageService.getCategories();
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(() => {
    return storageService.getCustomFields();
  });

  // Custom Property State
  const [editingCustomField, setEditingCustomField] = useState<CustomFieldDefinition | null>(null);
  const [newPropName, setNewPropName] = useState('');
  const [newPropCode, setNewPropCode] = useState('');
  const [newPropCategory, setNewPropCategory] = useState(categories[0]?.id || 'cat_stationery');
  const [newPropType, setNewPropType] = useState<CustomFieldType>('text');
  const [newPropRequired, setNewPropRequired] = useState(false);

  // Apply Theme Mode in real-time
  useEffect(() => {
    localStorage.setItem('dokan_v2_theme', themeMode);
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('dokan_theme_changed', { detail: { theme: themeMode } }));
  }, [themeMode]);

  // Apply Language in real-time
  useEffect(() => {
    i18n.setLanguage(language);
  }, [language]);

  const showSuccess = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Save Shop Profile
  const handleSaveShopProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTenant: Tenant = {
      ...activeTenant,
      name: shopName.trim() || activeTenant.name,
      code: shopCode.trim() || activeTenant.code,
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      currency_symbol: currencySymbol.trim() || '৳'
    };

    storageService.saveTenant(updatedTenant);
    if (onTenantUpdated) onTenantUpdated(updatedTenant);
    showSuccess('দোকান ও ব্যবসা প্রোফাইল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };

  // Save Payment Settings
  const handleSavePaymentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(paymentSettingsKey, JSON.stringify(paymentConfig));
    showSuccess('পেমেন্ট মেথড ও অ্যাকাউন্ট সেটিংস সংরক্ষিত হয়েছে!');
  };

  // Save POS & Printing Preferences
  const handleSavePosConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(posSettingsKey, JSON.stringify(posConfig));
    showSuccess('POS ও প্রিন্টিং ডিফল্ট সেটিংস সংরক্ষিত হয়েছে!');
  };

  // Save Footer & Branding Settings
  const handleSaveFooterConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(footerSettingsKey, JSON.stringify(footerConfig));
    localStorage.setItem('dokan_footer_config', JSON.stringify(footerConfig));
    window.dispatchEvent(new CustomEvent('dokan_footer_config_changed', { detail: footerConfig }));
    showSuccess('ফুটার ও এন্টারপ্রাইজ ব্র্যান্ডিং সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };

  // Start Editing Custom Field
  const handleStartEditCustomField = (field: CustomFieldDefinition) => {
    setEditingCustomField(field);
    setNewPropName(field.name);
    setNewPropCode(field.code);
    setNewPropCategory(field.business_category_id || categories[0]?.id || 'cat_stationery');
    setNewPropType(field.field_type);
    setNewPropRequired(field.is_required || false);
  };

  // Cancel Editing Custom Field
  const handleCancelEditCustomField = () => {
    setEditingCustomField(null);
    setNewPropName('');
    setNewPropCode('');
    setNewPropRequired(false);
  };

  // Create or Update Custom Property
  const handleSaveCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;

    if (editingCustomField) {
      const updatedField: CustomFieldDefinition = {
        ...editingCustomField,
        name: newPropName.trim(),
        code: newPropCode.trim() || editingCustomField.code,
        business_category_id: newPropCategory,
        field_type: newPropType,
        is_required: newPropRequired
      };

      storageService.saveCustomField(updatedField);
      setCustomFields(storageService.getCustomFields());
      setEditingCustomField(null);
      setNewPropName('');
      setNewPropCode('');
      setNewPropRequired(false);
      showSuccess(`কাস্টম প্রোপার্টি "${updatedField.name}" সফলভাবে আপডেট করা হয়েছে!`);
    } else {
      const code = newPropCode.trim() || newPropName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const newField: CustomFieldDefinition = {
        id: `cf_${Date.now()}`,
        entity_type: 'product',
        business_category_id: newPropCategory,
        name: newPropName.trim(),
        code,
        field_type: newPropType,
        is_required: newPropRequired
      };

      storageService.saveCustomField(newField);
      setCustomFields(storageService.getCustomFields());
      setNewPropName('');
      setNewPropCode('');
      setNewPropRequired(false);
      showSuccess(`নতুন ডাইনামিক ফিল্ড "${newField.name}" সফলভাবে যুক্ত হয়েছে!`);
    }
  };

  // Delete Custom Property
  const handleDeleteCustomField = (fieldId: string) => {
    if (editingCustomField?.id === fieldId) {
      handleCancelEditCustomField();
    }
    storageService.deleteCustomField(fieldId);
    setCustomFields(storageService.getCustomFields());
    showSuccess('কাস্টম প্রোপার্টি ফিল্ড মুছে ফেলা হয়েছে!');
  };

  // Full Store Data Backup Download
  const handleDownloadBackup = () => {
    const fullBackup = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      tenant: activeTenant,
      products: storageService.getProducts(activeTenant.id),
      sales: storageService.getSales(activeTenant.id),
      customers: storageService.getCustomers(activeTenant.id),
      suppliers: storageService.getSuppliers(activeTenant.id),
      customFields: storageService.getCustomFields(),
      paymentSettings: paymentConfig,
      posSettings: posConfig
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DokanManager_Backup_${activeTenant.code || 'shop'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('দোকানের সম্পূর্ণ ডাটা ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!');
  };

  // Restore Backup File
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.products && Array.isArray(data.products)) {
          data.products.forEach((p: any) => storageService.saveProduct(p));
        }
        if (data.customers && Array.isArray(data.customers)) {
          data.customers.forEach((c: any) => storageService.saveCustomer(c));
        }
        showSuccess('ব্যাকআপ ফাইল থেকে সফলভাবে ডাটা রিস্টোর সম্পন্ন হয়েছে!');
      } catch (err) {
        alert('ভুল ফরম্যাটের ব্যাকআপ ফাইল! অনুগ্রহ করে সঠিক JSON ফাইল আপলোড করুন।');
      }
    };
    reader.readAsText(file);
  };



  // Supabase Actions
  const handleTestSupabaseConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await supabaseService.testConnection(supabaseUrl, supabaseAnonKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        connected: false,
        latencyMs: 0,
        message: err?.message || 'কানেকশন ব্যর্থ হয়েছে'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    supabaseService.saveConfig(supabaseUrl, supabaseAnonKey);
    setSaveSuccessMessage('Supabase ক্লাউড ডেটাবেজ কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    try {
      const res = await supabaseService.syncToCloud(activeTenant.id);
      if (res.success) {
        setSaveSuccessMessage(res.message);
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(`সিঙ্ক ত্রুটি: ${e?.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    }
  };

  const handleCopySchema = () => {
    const schemaSql = `-- SmartERP Supabase SQL Schema
-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  currency VARCHAR(16) DEFAULT 'BDT',
  currency_symbol VARCHAR(8) DEFAULT '৳',
  address TEXT DEFAULT 'ঢাকা, বাংলাদেশ',
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(64) NOT NULL,
  sku VARCHAR(64) NOT NULL,
  barcode VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  category_name VARCHAR(128) NOT NULL,
  unit VARCHAR(32) DEFAULT 'পিস',
  purchase_price NUMERIC(15, 2) DEFAULT 0.00,
  selling_price NUMERIC(15, 2) NOT NULL,
  stock_quantity NUMERIC(15, 2) DEFAULT 0,
  tracking_mode VARCHAR(64) DEFAULT 'TRACKING_QUANTITY',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(64) PRIMARY KEY,
  invoice_no VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  grand_total NUMERIC(15, 2) NOT NULL,
  paid_amount NUMERIC(15, 2) DEFAULT 0.00,
  due_amount NUMERIC(15, 2) DEFAULT 0.00,
  payment_method VARCHAR(32) DEFAULT 'CASH',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounting_entries (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  reference_type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  debit_account VARCHAR(128) NOT NULL,
  credit_account VARCHAR(128) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;
    navigator.clipboard.writeText(schemaSql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  // Settings Navigation Tabs
  const settingsTabs = [
    { id: 'theme', label: 'থিম ও ইউজার ইন্টারফেস', icon: Sun },
    { id: 'shop', label: 'দোকান ও ব্যবসা প্রোফাইল', icon: Building2 },
    { id: 'payment', label: 'পেমেন্ট মেথড ও অ্যাকাউন্টস', icon: CreditCard },
    { id: 'categories', label: 'ক্যাটাগরি ও কাস্টম প্রোপার্টিজ', icon: Sliders },
    { id: 'pos', label: 'POS ও প্রিন্ট ডিফল্টস', icon: Printer },
    { id: 'footer', label: 'ফুটার ও ব্র্যান্ডিং সেটিংস', icon: Sparkles },
    { id: 'supabase', label: 'ক্লাউড ডেটাবেজ ও Supabase', icon: Cloud },
    { id: 'backup', label: 'ডাটা ব্যাকআপ ও সিস্টেম', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>গ্লোবাল অ্যাডমিন সেটিংস (Global System Settings)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            থিম, ভাষা, দোকান প্রোফাইল, পেমেন্ট চ্যানেল, ক্যাটাগরি, ফুটার, Supabase ক্লাউড ডেটাবেজ ও ব্যাকআপ নিয়ন্ত্রণ করুন
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            {themeMode === 'light' ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{themeMode === 'light' ? 'ডার্ক মোড' : 'লাইট মোড'}</span>
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-indigo-200 cursor-pointer transition-all"
          >
            <Globe className="w-4 h-4" />
            <span>{language === 'bn' ? 'বাংলা (BN)' : 'English (EN)'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        {settingsTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: THEME & UI LOCALIZATION                                            */}
      {/* ========================================================================= */}
      {activeTab === 'theme' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Appearance Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sun className="w-4 h-4 text-indigo-600" />
              <span>ভিজ্যুয়াল থিম নির্বাচন (Color Appearance)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Light Theme Card */}
              <div
                onClick={() => setThemeMode('light')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  themeMode === 'light' ? 'border-indigo-600 bg-indigo-50/40 shadow-xs' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-full h-16 bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between mb-2">
                  <div className="w-12 h-2 bg-indigo-600 rounded" />
                  <div className="w-full h-2 bg-slate-100 rounded" />
                </div>
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>লাইট থিম (Clean Light)</span>
                  {themeMode === 'light' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">উজ্জ্বল ও স্ট্যান্ডার্ড সাদা ব্যাকগ্রাউন্ড</p>
              </div>

              {/* Dark Theme Card */}
              <div
                onClick={() => setThemeMode('dark')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  themeMode === 'dark' ? 'border-indigo-600 bg-slate-900 text-white shadow-xs' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-full h-16 bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-col justify-between mb-2">
                  <div className="w-12 h-2 bg-indigo-500 rounded" />
                  <div className="w-full h-2 bg-slate-800 rounded" />
                </div>
                <div className="font-bold flex items-center justify-between">
                  <span>ডার্ক থিম (Sleek Dark)</span>
                  {themeMode === 'dark' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">চোখের জন্য আরামদায়ক ডার্ক মোড</p>
              </div>
            </div>
          </div>

          {/* Localization & Layout Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>সিস্টেম ভাষা ও লেআউট ডেনসিটি</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">সফটওয়্যার ভাষা (Software Language):</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    language === 'bn' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  বাংলা (Bengali - ডিফল্ট)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    language === 'en' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  English (International)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">লেআউট কমপ্যাক্টনেস (Layout Density):</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLayoutDensity('comfortable')}
                  className={`p-2.5 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                    layoutDensity === 'comfortable' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  স্বাভাবিক (Comfortable)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutDensity('compact')}
                  className={`p-2.5 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                    layoutDensity === 'compact' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  কমপ্যাক্ট (Compact POS)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SHOP & BUSINESS PROFILE                                            */}
      {/* ========================================================================= */}
      {activeTab === 'shop' && (
        <form onSubmit={handleSaveShopProfile} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>দোকান পরিচিতি ও রসিদ হেডার-ফুটার তথ্য</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">দোকানের নাম (Shop Name) *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">দোকান কোড / Tenant Code *</label>
              <input
                type="text"
                required
                value={shopCode}
                onChange={e => setShopCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">মালিকের নাম (Proprietor Name)</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর (Contact Phone)</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ইমেইল ঠিকানা (Email)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">মুদ্রা প্রতীক (Currency Symbol)</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={e => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">দোকানের সম্পূর্ণ ঠিকানা (Address)</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="দোকান নং, মার্কেট/রোড, থানা, জেলা"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ক্যাশ মেমো হেডার নোট (Invoice Header)</label>
              <input
                type="text"
                value={invoiceHeaderNote}
                onChange={e => setInvoiceHeaderNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ক্যাশ মেমো ফুটার নির্দেশিকা (Invoice Footer)</label>
              <input
                type="text"
                value={invoiceFooterNote}
                onChange={e => setInvoiceFooterNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>দোকান সেটিংস সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ADVANCED PAYMENT METHODS & POS GATEWAYS                            */}
      {/* ========================================================================= */}
      {activeTab === 'payment' && (
        <form onSubmit={handleSavePaymentConfig} className="space-y-5 text-xs">
          {/* Header Card with Quick Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>পেমেন্ট মেথড ও অ্যাকাউন্ট কনফিগারেশন (POS Payment Gateways)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ক্যাশ, এমএফএস (বিকাশ, নগদ, রকেট), ব্যাংক কার্ড ও কাস্টমার বাকির খাতার পলিসি নিয়ন্ত্রণ করুন
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full font-bold text-xs border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {[paymentConfig.enableCash, paymentConfig.enableBkash, paymentConfig.enableNagad, paymentConfig.enableRocket, paymentConfig.enableCard, paymentConfig.enableDueCredit].filter(Boolean).length} টি মেথড সক্রিয়
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. CASH ON COUNTER */}
            <div className={`p-4 rounded-xl border transition-all ${paymentConfig.enableCash ? 'bg-white border-emerald-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">১. কাউন্টার ক্যাশ (Cash on Counter)</h4>
                    <span className="text-[10px] text-slate-400">নগদ টাকা গ্রহণ ও ক্যাশ ড্রয়ার</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableCash}
                    onChange={e => setPaymentConfig({ ...paymentConfig, enableCash: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {paymentConfig.enableCash && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">প্রারম্ভিক ক্যাশ ড্রয়ার (Opening Float ৳)</label>
                      <input
                        type="number"
                        value={paymentConfig.cashOpeningBalance || 0}
                        onChange={e => setPaymentConfig({ ...paymentConfig, cashOpeningBalance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">ক্যাশ ড্রয়ার অটো-ওপেন</label>
                      <select
                        value={paymentConfig.autoOpenCashDrawer ? 'YES' : 'NO'}
                        onChange={e => setPaymentConfig({ ...paymentConfig, autoOpenCashDrawer: e.target.value === 'YES' })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                      >
                        <option value="YES">সক্রিয় (Auto Open)</option>
                        <option value="NO">নিষ্ক্রিয়</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig.enableChangeCalculation ?? true}
                      onChange={e => setPaymentConfig({ ...paymentConfig, enableChangeCalculation: e.target.checked })}
                      className="w-3.5 h-3.5 text-emerald-600 rounded"
                    />
                    <span>কাস্টমার প্রদত্ত টাকা থেকে ফেরত হিসাব স্বয়ংক্রিয় গণনা (Change Return Calc)</span>
                  </label>
                </div>
              )}
            </div>

            {/* 2. BKASH MFS GATEWAY */}
            <div className={`p-4 rounded-xl border transition-all ${paymentConfig.enableBkash ? 'bg-white border-pink-200 shadow-xs ring-1 ring-pink-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-pink-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center font-bold text-xs">
                    bK
                  </div>
                  <div>
                    <h4 className="font-bold text-pink-950">২. বিকাশ পেমেন্ট (bKash Gateway)</h4>
                    <span className="text-[10px] text-pink-600 font-semibold">মার্চেন্ট কিউআর ও পার্সোনাল MFS</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableBkash}
                    onChange={e => setPaymentConfig({ ...paymentConfig, enableBkash: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              {paymentConfig.enableBkash && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">বিকাশ মোবাইল নম্বর *</label>
                      <input
                        type="text"
                        placeholder="017XXXXXXXX"
                        value={paymentConfig.bkashNumber}
                        onChange={e => setPaymentConfig({ ...paymentConfig, bkashNumber: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-pink-50/40 border border-pink-300 rounded-lg font-mono font-bold text-pink-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">অ্যাকাউন্ট টাইপ</label>
                      <select
                        value={paymentConfig.bkashType}
                        onChange={e => setPaymentConfig({ ...paymentConfig, bkashType: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-pink-300 rounded-lg font-bold text-pink-900"
                      >
                        <option value="Merchant">মার্চেন্ট কিউআর (Merchant QR)</option>
                        <option value="Personal">পার্সোনাল (Send Money)</option>
                        <option value="Agent">এজেন্ট ক্যাশআউট (Agent)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">ট্রানজেকশন ফি (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0%"
                        value={paymentConfig.bkashTrxFeePercent || 0}
                        onChange={e => setPaymentConfig({ ...paymentConfig, bkashTrxFeePercent: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">TrxID এন্ট্রি</label>
                      <select
                        value={paymentConfig.bkashRequireTrxId ? 'REQUIRED' : 'OPTIONAL'}
                        onChange={e => setPaymentConfig({ ...paymentConfig, bkashRequireTrxId: e.target.value === 'REQUIRED' })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                      >
                        <option value="REQUIRED">বাধ্যতামূলক (Required)</option>
                        <option value="OPTIONAL">ঐচ্ছিক (Optional)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. NAGAD MFS GATEWAY */}
            <div className={`p-4 rounded-xl border transition-all ${paymentConfig.enableNagad ? 'bg-white border-amber-200 shadow-xs ring-1 ring-amber-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    নগদ
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-950">৩. নগদ পেমেন্ট (Nagad Gateway)</h4>
                    <span className="text-[10px] text-amber-600 font-semibold">ডাকবিভাগ ডিজিটাল ওয়ালেট</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableNagad}
                    onChange={e => setPaymentConfig({ ...paymentConfig, enableNagad: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {paymentConfig.enableNagad && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">নগদ মোবাইল নম্বর *</label>
                      <input
                        type="text"
                        placeholder="018XXXXXXXX"
                        value={paymentConfig.nagadNumber}
                        onChange={e => setPaymentConfig({ ...paymentConfig, nagadNumber: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-amber-50/40 border border-amber-300 rounded-lg font-mono font-bold text-amber-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">অ্যাকাউন্ট টাইপ</label>
                      <select
                        value={paymentConfig.nagadType}
                        onChange={e => setPaymentConfig({ ...paymentConfig, nagadType: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-amber-900"
                      >
                        <option value="Merchant">মার্চেন্ট কিউআর (Merchant QR)</option>
                        <option value="Personal">পার্সোনাল (Send Money)</option>
                        <option value="Agent">উদ্যোক্তা ক্যাশআউট (Uddokta)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">ট্রানজেকশন ফি (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0%"
                        value={paymentConfig.nagadTrxFeePercent || 0}
                        onChange={e => setPaymentConfig({ ...paymentConfig, nagadTrxFeePercent: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">TrxID এন্ট্রি</label>
                      <select
                        value={paymentConfig.nagadRequireTrxId ? 'REQUIRED' : 'OPTIONAL'}
                        onChange={e => setPaymentConfig({ ...paymentConfig, nagadRequireTrxId: e.target.value === 'REQUIRED' })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                      >
                        <option value="REQUIRED">বাধ্যতামূলক (Required)</option>
                        <option value="OPTIONAL">ঐচ্ছিক (Optional)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. ROCKET & UPAY MFS */}
            <div className={`p-4 rounded-xl border transition-all ${paymentConfig.enableRocket ? 'bg-white border-purple-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                    R
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-950">৪. রকেট ও অন্যান্য MFS (DBBL Rocket)</h4>
                    <span className="text-[10px] text-purple-600 font-semibold">১২-ডিজিট রকেট অ্যাকাউন্ট ও উপায়</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableRocket}
                    onChange={e => setPaymentConfig({ ...paymentConfig, enableRocket: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-700"></div>
                </label>
              </div>

              {paymentConfig.enableRocket && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">রকেট অ্যাকাউন্ট নম্বর (১২ ডিজিট)</label>
                      <input
                        type="text"
                        placeholder="019XXXXXXXX-X"
                        value={paymentConfig.rocketNumber}
                        onChange={e => setPaymentConfig({ ...paymentConfig, rocketNumber: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg font-mono font-bold text-purple-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">রকেট ধরন</label>
                      <select
                        value={paymentConfig.rocketType || 'Merchant'}
                        onChange={e => setPaymentConfig({ ...paymentConfig, rocketType: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg font-bold"
                      >
                        <option value="Merchant">মার্চেন্ট (Merchant QR)</option>
                        <option value="Personal">পার্সোনাল</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. BANK CARD & POS TERMINAL */}
            <div className={`p-4 rounded-xl border transition-all ${paymentConfig.enableCard ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950">৫. ব্যাংক কার্ড ও POS মেশিন (Bank POS)</h4>
                    <span className="text-[10px] text-blue-600 font-semibold">Visa, MasterCard, DBBL Nexus, Amex</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableCard}
                    onChange={e => setPaymentConfig({ ...paymentConfig, enableCard: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {paymentConfig.enableCard && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">ব্যাংক কার্ড টার্মিনাল নাম *</label>
                      <input
                        type="text"
                        placeholder="যেমন: City Bank POS, BRAC Bank, NexusPay"
                        value={paymentConfig.cardTerminalName}
                        onChange={e => setPaymentConfig({ ...paymentConfig, cardTerminalName: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg font-bold text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">কার্ড সোয়াইপ চার্জ (MDR %)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="1.5%"
                        value={paymentConfig.cardMdrPercent || 0}
                        onChange={e => setPaymentConfig({ ...paymentConfig, cardMdrPercent: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold text-[10px] border border-blue-200">💳 Visa</span>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-800 rounded font-bold text-[10px] border border-rose-200">💳 MasterCard</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-[10px] border border-emerald-200">💳 DBBL Nexus</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded font-bold text-[10px] border border-indigo-200">💳 Amex</span>
                  </div>
                </div>
              )}
            </div>

            {/* 6. CUSTOMER CREDIT / DUE LEDGER */}
            <div className={`p-4 rounded-xl border transition-all ${paymentConfig.enableDueCredit ? 'bg-white border-rose-200 shadow-xs ring-1 ring-rose-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-950">৬. কাস্টমার বাকি ও দেনা খাতা (Credit Due Policy)</h4>
                    <span className="text-[10px] text-rose-600 font-semibold">গ্রাহক বাকি লিমিট ও রিমাইন্ডার কন্ট্রোল</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.enableDueCredit}
                    onChange={e => setPaymentConfig({ ...paymentConfig, enableDueCredit: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {paymentConfig.enableDueCredit && (
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">সর্বোচ্চ বকেয়া লিমিট (Max Credit ৳)</label>
                      <input
                        type="number"
                        value={paymentConfig.maxDueLimit}
                        onChange={e => setPaymentConfig({ ...paymentConfig, maxDueLimit: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-rose-50/40 border border-rose-300 rounded-lg font-mono font-bold text-rose-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">বাকি পরিশোধের সর্বোচ্চ দিন (Term)</label>
                      <input
                        type="number"
                        value={paymentConfig.duePaymentDays || 30}
                        onChange={e => setPaymentConfig({ ...paymentConfig, duePaymentDays: parseInt(e.target.value) || 30 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.blockSaleIfDueOverLimit ?? true}
                        onChange={e => setPaymentConfig({ ...paymentConfig, blockSaleIfDueOverLimit: e.target.checked })}
                        className="w-3.5 h-3.5 text-rose-600 rounded"
                      />
                      <span>লিমিট অতিক্রম করলে স্বয়ংক্রিয়ভাবে নতুন বাকি বিক্রয় ব্লক করুন (Strict Check)</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.requireCustomerPhoneForDue ?? true}
                        onChange={e => setPaymentConfig({ ...paymentConfig, requireCustomerPhoneForDue: e.target.checked })}
                        className="w-3.5 h-3.5 text-rose-600 rounded"
                      />
                      <span>কাস্টমার মোবাইল নম্বর ছাড়া বাকি বিক্রয় নিষিদ্ধ (Customer Verification)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ADVANCED MULTI-PAYMENT & ROUNDING BAR */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
            <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>উন্নত পেমেন্ট ট্রানজেকশন সেটিংস (Advanced Split & Rounding)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-indigo-200 cursor-pointer shadow-2xs">
                <input
                  type="checkbox"
                  checked={paymentConfig.enableSplitPayment ?? true}
                  onChange={e => setPaymentConfig({ ...paymentConfig, enableSplitPayment: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">স্প্লিট / মাল্টি-পেমেন্ট সক্রিয় (Split Payment)</span>
                  <span className="text-[10px] text-slate-500">একই বিলে আংশিক ক্যাশ + আংশিক বিকাশ/কার্ড নেওয়ার সুবিধা</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-indigo-200 cursor-pointer shadow-2xs">
                <input
                  type="checkbox"
                  checked={paymentConfig.roundOffTotal ?? true}
                  onChange={e => setPaymentConfig({ ...paymentConfig, roundOffTotal: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">মোট বিলে দশমিক রাউন্ডিং (Cash Rounding)</span>
                  <span className="text-[10px] text-slate-500">ভাঙতি পয়সা নিকটতম পূর্ণ ১ টাকায় রূপান্তর</span>
                </div>
              </label>
            </div>
          </div>

          {/* LIVE POS CHECKOUT SIMULATION PREVIEW */}
          <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs text-slate-200">POS কাউন্টার চেকআউট লাইভ প্রিভিউ (Live Payment Buttons)</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                ক্যাশিয়ার যেমন দেখতে পাবে
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {paymentConfig.enableCash && (
                <div className="p-2.5 bg-emerald-900/60 border border-emerald-500/40 rounded-lg flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold block text-white text-xs">নগদ ক্যাশ</span>
                    <span className="text-[9px] text-emerald-300 font-mono">Cash ৳</span>
                  </div>
                </div>
              )}

              {paymentConfig.enableBkash && (
                <div className="p-2.5 bg-pink-900/60 border border-pink-500/40 rounded-lg flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-pink-600 flex items-center justify-center font-bold text-[9px] text-white">bK</div>
                  <div>
                    <span className="font-bold block text-white text-xs">বিকাশ ({paymentConfig.bkashType})</span>
                    <span className="text-[9px] text-pink-300 font-mono">{paymentConfig.bkashNumber || '017...'}</span>
                  </div>
                </div>
              )}

              {paymentConfig.enableNagad && (
                <div className="p-2.5 bg-amber-900/60 border border-amber-500/40 rounded-lg flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-600 flex items-center justify-center font-bold text-[9px] text-white">ন</div>
                  <div>
                    <span className="font-bold block text-white text-xs">নগদ ({paymentConfig.nagadType})</span>
                    <span className="text-[9px] text-amber-300 font-mono">{paymentConfig.nagadNumber || '018...'}</span>
                  </div>
                </div>
              )}

              {paymentConfig.enableRocket && (
                <div className="p-2.5 bg-purple-900/60 border border-purple-500/40 rounded-lg flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-700 flex items-center justify-center font-bold text-[9px] text-white">R</div>
                  <div>
                    <span className="font-bold block text-white text-xs">রকেট DBBL</span>
                    <span className="text-[9px] text-purple-300 font-mono">{paymentConfig.rocketNumber || '019...'}</span>
                  </div>
                </div>
              )}

              {paymentConfig.enableCard && (
                <div className="p-2.5 bg-blue-900/60 border border-blue-500/40 rounded-lg flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="font-bold block text-white text-xs">{paymentConfig.cardTerminalName || 'Bank Card'}</span>
                    <span className="text-[9px] text-blue-300 font-mono">MDR: {paymentConfig.cardMdrPercent}%</span>
                  </div>
                </div>
              )}

              {paymentConfig.enableDueCredit && (
                <div className="p-2.5 bg-rose-900/60 border border-rose-500/40 rounded-lg flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" />
                  <div>
                    <span className="font-bold block text-white text-xs">বাকি / খাতা</span>
                    <span className="text-[9px] text-rose-300 font-mono">Max: ৳{paymentConfig.maxDueLimit}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>পেমেন্ট গেটওয়ে সেটিংস সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CATEGORY & DYNAMIC PROPERTIES                                      */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-5">
          {/* Add / Edit Custom Field Form */}
          <form 
            onSubmit={handleSaveCustomField} 
            className={`p-5 rounded-xl border shadow-xs space-y-4 text-xs transition-all ${
              editingCustomField 
                ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/30' 
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>
                  {editingCustomField 
                    ? `কাস্টম প্রোপার্টি সম্পাদনা: "${editingCustomField.name}"` 
                    : 'নতুন কাস্টম প্রোপার্টিজ ফিল্ড যুক্ত করুন (Dynamic Product Properties)'}
                </span>
              </h3>
              {editingCustomField && (
                <button
                  type="button"
                  onClick={handleCancelEditCustomField}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>সম্পাদনা বাতিল</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ফিল্ডের নাম (বাংলা/ইংরেজি) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: লেখক / প্রকাশনী / পৃষ্ঠা সংখ্যা"
                  value={newPropName}
                  onChange={e => setNewPropName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ক্যাটেগরি নির্বাচন</label>
                <select
                  value={newPropCategory}
                  onChange={e => setNewPropCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ফিল্ড টাইপ (Data Type)</label>
                <select
                  value={newPropType}
                  onChange={e => setNewPropType(e.target.value as CustomFieldType)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="text">টেক্সট (Text)</option>
                  <option value="number">সংখ্যা (Number)</option>
                  <option value="date">তারিখ (Date)</option>
                  <option value="boolean">হ্যাঁ / না (Boolean)</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className={`w-full py-2 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all ${
                    editingCustomField
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {editingCustomField ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✓ আপডেট সংরক্ষণ</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>+ ফিল্ড তৈরি করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPropRequired}
                  onChange={e => setNewPropRequired(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span>পণ্য এন্ট্রির সময় এই প্রোপার্টি পূরণ করা বাধ্যতামূলক (Required Field)</span>
              </label>
            </div>
          </form>

          {/* Existing Dynamic Properties List with Edit and Delete Action */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
              <span>বর্তমান সক্রিয় কাস্টম প্রোপার্টিজ তালিকা ({customFields.length} টি)</span>
              <span className="text-[11px] text-slate-500 font-normal">
                পেন্সিল আইকনে ক্লিক করে যেকোনো প্রোপার্টি সরাসরি এডিট করুন
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {customFields.length === 0 ? (
                <div className="p-8 text-center text-slate-400">কোনো কাস্টম ফিল্ড তৈরি করা হয়নি।</div>
              ) : (
                customFields.map(field => {
                  const cat = categories.find(c => c.id === field.business_category_id);
                  const isCurrentlyEditing = editingCustomField?.id === field.id;

                  return (
                    <div 
                      key={field.id} 
                      className={`p-3.5 flex items-center justify-between transition-colors ${
                        isCurrentlyEditing ? 'bg-amber-50/80 border-l-4 border-l-amber-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{field.name}</span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                            {field.code}
                          </span>
                          {field.is_required && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                              আবশ্যক
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ক্যাটেগরি: <b>{cat?.name || 'সকল ক্যাটেগরি'}</b> • ডাটা টাইপ: <b>{field.field_type}</b>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditCustomField(field)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 font-bold text-xs ${
                            isCurrentlyEditing 
                              ? 'bg-amber-500 text-white' 
                              : 'text-indigo-600 hover:bg-indigo-50 bg-indigo-50/50'
                          }`}
                          title="প্রোপার্টি এডিট করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">এডিট</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomField(field.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: POS & PRINT PREFERENCES                                            */}
      {/* ========================================================================= */}
      {activeTab === 'pos' && (
        <form onSubmit={handleSavePosConfig} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>POS বিলিং ও প্রিন্টার ডিফল্ট কনফিগারেশন</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ডিফল্ট ক্যাশ মেমো ফরম্যাট</label>
              <select
                value={posConfig.defaultPaperSize}
                onChange={e => setPosConfig({ ...posConfig, defaultPaperSize: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="80mm">80mm স্ট্যান্ডার্ড থার্মাল রোল (Standard POS)</option>
                <option value="58mm">58mm মিনি থার্মাল রোল (Mini POS)</option>
                <option value="A4">A4 ফুল পেজ ভাউচার (Laser / Inkjet)</option>
                <option value="A5">A5 হাফ পেজ মেমো</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ডিফল্ট ভ্যাট / ট্যাক্স হার (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={posConfig.defaultVatPercent}
                onChange={e => setPosConfig({ ...posConfig, defaultVatPercent: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">লো-স্টক এলার্ট সীমা (Min Stock Alert)</label>
              <input
                type="number"
                min="1"
                value={posConfig.minStockAlertLimit}
                onChange={e => setPosConfig({ ...posConfig, minStockAlertLimit: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-amber-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={posConfig.autoPrintOnCheckout}
                onChange={e => setPosConfig({ ...posConfig, autoPrintOnCheckout: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>বিল সম্পন্ন হওয়ার সাথে সাথে স্বয়ংক্রিয় রসিদ প্রিন্ট উইন্ডো খুলবে</span>
            </label>

            <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={posConfig.barcodeFastScanMode}
                onChange={e => setPosConfig({ ...posConfig, barcodeFastScanMode: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>বারকোড স্ক্যানার ফাস্ট মোড (স্ক্যান করলেই সরাসরি কার্টে যোগ হবে)</span>
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>POS ডিফল্ট সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: FOOTER & ENTERPRISE BRANDING CUSTOMIZATION                         */}
      {/* ========================================================================= */}
      {activeTab === 'footer' && (
        <form onSubmit={handleSaveFooterConfig} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>ফুটার ও এন্টারপ্রাইজ ব্র্যান্ডিং সেটিংস (Footer & Branding Configuration)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                সফটওয়্যারের প্রতিটি পেজের নিচের মার্জিনের ভেতরের ফুটার টেক্সট, ভার্সন ট্যাগ, কপিরাইট ও সাপোর্ট তথ্য কাস্টমাইজ করুন
              </p>
            </div>

            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={footerConfig.isEnabled}
                onChange={e => setFooterConfig({ ...footerConfig, isEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>ফুটার প্রদর্শন সক্রিয় রাখুন (Enable Footer)</span>
            </label>
          </div>

          {/* Core Brand & Copyright Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">এন্টারপ্রাইজ ব্র্যান্ড / নাম *</label>
              <input
                type="text"
                required
                value={footerConfig.brandTitle}
                onChange={e => setFooterConfig({ ...footerConfig, brandTitle: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                placeholder="যেমন: দোকান ম্যানেজার ERP Enterprise"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ভার্সন ট্যাগ (Version Tag) *</label>
              <input
                type="text"
                required
                value={footerConfig.versionTag}
                onChange={e => setFooterConfig({ ...footerConfig, versionTag: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700"
                placeholder="যেমন: V2.0 Enterprise"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">কপিরাইট ও নোটিশ টেক্সট *</label>
              <input
                type="text"
                required
                value={footerConfig.copyrightText}
                onChange={e => setFooterConfig({ ...footerConfig, copyrightText: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                placeholder="যেমন: © 2026 SmartERP. All rights reserved."
              />
            </div>
          </div>

          {/* Contact, Currency and Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">মুদ্রা ট্যাগ (Currency Display)</label>
              <input
                type="text"
                value={footerConfig.currencyText}
                onChange={e => setFooterConfig({ ...footerConfig, currencyText: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                placeholder="BDT (৳)"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">সিস্টেম টাইমজোন (Timezone)</label>
              <input
                type="text"
                value={footerConfig.timezoneText}
                onChange={e => setFooterConfig({ ...footerConfig, timezoneText: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                placeholder="Asia/Dhaka (GMT+6)"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">সাপোর্ট ফোন / হেল্পলাইন</label>
              <input
                type="tel"
                value={footerConfig.supportPhone}
                onChange={e => setFooterConfig({ ...footerConfig, supportPhone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                placeholder="+880 1700-000000"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">সাপোর্ট ইমেইল</label>
              <input
                type="email"
                value={footerConfig.supportEmail}
                onChange={e => setFooterConfig({ ...footerConfig, supportEmail: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                placeholder="support@smarterp.com"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={footerConfig.showCurrencyTimezone}
                onChange={e => setFooterConfig({ ...footerConfig, showCurrencyTimezone: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>মুদ্রা, টাইমজোন ও হেল্পলাইন ফুটারে প্রদর্শন করুন</span>
            </label>

            <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={footerConfig.showUserBadge}
                onChange={e => setFooterConfig({ ...footerConfig, showUserBadge: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>বর্তমান লগইনকৃত ইউজার ও ভূমিকা (Role Badge) দেখান</span>
            </label>
          </div>

          {/* Real-time Live Preview Card */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="font-bold text-slate-800 text-xs block">
              লাইভ প্রিভিউ (Live Footer Preview):
            </span>
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl overflow-hidden shadow-inner">
              {footerConfig.isEnabled ? (
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] text-slate-600">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{footerConfig.brandTitle || 'SmartERP Enterprise'}</span>
                      <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-mono text-[10px] rounded font-semibold border border-indigo-200">
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
                            <span>📞 {footerConfig.supportPhone}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {footerConfig.showUserBadge && (
                      <span className="font-mono text-[10px] text-slate-500">
                        লগইন: <b className="text-slate-800 font-semibold">{ownerName || 'Admin'}</b> <span className="text-indigo-600">(SUPER_ADMIN)</span>
                      </span>
                    )}
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {footerConfig.copyrightText || '© 2026 SmartERP'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs font-semibold">
                  (ফুটার ডিসপ্লে বর্তমানে নিষ্ক্রিয় রয়েছে)
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>ফুটার ও ব্র্যান্ডিং সেটিংস সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB: SUPABASE CLOUD DATABASE CONFIGURATION & LIVE TEST                     */}
      {/* ========================================================================= */}
      {activeTab === 'supabase' && (
        <div className="space-y-5">
          {/* Top Info & Live Status Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl border border-emerald-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base tracking-tight">Supabase ক্লাউড ডেটাবেজ ইন্টিগ্রেশন</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[10px] font-bold rounded-full">
                  PostgreSQL 15+
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Supabase ক্লাউড ডেটাবেজে সরাসরি সংযোগ স্থাপন করে আপনার দোকানের স্টক, সেলস, কাস্টমার বাকি ও হিসাব খাতার তথ্য রিয়েল-টাইমে ক্লাউডে সুরক্ষিত রাখুন।
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestSupabaseConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                <span>{isTesting ? 'কানেকশন টেস্ট হচ্ছে...' : '🔌 টেস্ট কানেকশন (Ping)'}</span>
              </button>
            </div>
          </div>

          {/* Test Result Banner */}
          {testResult && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in ${
              testResult.connected 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              {testResult.connected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {testResult.connected ? '🟢 ক্লাউড ডেটাবেজ কানেকশন সফল!' : '🔴 কানেকশন ব্যর্থ হয়েছে'}
                </div>
                <div className="text-xs">{testResult.message}</div>
                {testResult.connected && (
                  <div className="font-mono text-[11px] text-emerald-700">
                    Latency: <b>{testResult.latencyMs}ms</b> • Server Time: {testResult.details?.serverTime}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Supabase API Credentials Card */}
            <form onSubmit={handleSaveSupabaseConfig} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>Supabase API Credentials</span>
              </h4>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Supabase Project URL</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project-ref.supabase.co"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">Supabase ড্যাশবোর্ড {'>'} Project Settings {'>'} API {'>'} Project URL</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Supabase Anon Key (Public)</label>
                  <button
                    type="button"
                    onClick={() => setShowAnonKey(!showAnonKey)}
                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    {showAnonKey ? 'হাইড করুন' : 'দেখান'}
                  </button>
                </div>
                <input
                  type={showAnonKey ? 'text' : 'password'}
                  value={supabaseAnonKey}
                  onChange={e => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">Project Settings {'>'} API {'>'} Project API Keys {'>'} anon public</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>কনফিগারেশন সংরক্ষণ করুন</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncToCloud}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-emerald-400" />}
                  <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : '🚀 ক্লাউডে সিঙ্ক করুন'}</span>
                </button>
              </div>
            </form>

            {/* SQL Schema & Migration Info Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Supabase SQL Table Schema</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema ? 'কপি হয়েছে!' : 'SQL কোড কপি'}</span>
                </button>
              </h4>

              <p className="text-slate-500 text-[11px] leading-relaxed">
                Supabase ড্যাশবোর্ডে গিয়ে <b>SQL Editor</b> ট্যাবে আপনার ডেটাবেজ টেবিলগুলো (Tenants, Products, Sales, Accounting, Devices, Batches) এক ক্লিকে তৈরি করতে পারেন।
              </p>

              <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[10px] h-40 overflow-y-auto space-y-1">
                <div className="text-emerald-400">-- SmartERP PostgreSQL Table Schema</div>
                <div>CREATE TABLE IF NOT EXISTS tenants (...);</div>
                <div>CREATE TABLE IF NOT EXISTS products (...);</div>
                <div>CREATE TABLE IF NOT EXISTS sales (...);</div>
                <div>CREATE TABLE IF NOT EXISTS accounting_entries (...);</div>
                <div>CREATE TABLE IF NOT EXISTS device_items (...);</div>
                <div>CREATE TABLE IF NOT EXISTS product_batches (...);</div>
                <div>CREATE TABLE IF NOT EXISTS customers (...);</div>
                <div>CREATE TABLE IF NOT EXISTS suppliers (...);</div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 space-y-1 font-medium">
                <div>💡 <b>নির্দেশনা</b>: সম্পূর্ণ স্কিমাটি প্রজেক্টের রুট ফোল্ডারে <code>supabase-schema.sql</code> নামে সংরক্ষিত আছে।</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: DATA BACKUP & SYSTEM MAINTENANCE                                   */}
      {/* ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Backup Download Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Download className="w-4 h-4 text-indigo-600" />
              <span>সম্পূর্ণ ডাটা ব্যাকআপ ডাউনলোড (Backup JSON)</span>
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              দোকানের সমস্ত স্টক ইনভেন্টরি, সেলস হিসাব, কাস্টমার বাকির খাতা ও সেটিংস এক ক্লিকে অফলাইনে সুরক্ষিত ব্যাকআপ ফাইল হিসেবে ডাউনলোড করে রাখুন।
            </p>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ফুল ব্যাকআপ ডাউনলোড করুন (.JSON)</span>
            </button>
          </div>

          {/* Restore Backup Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>ডাটা রিস্টোর করুন (Restore From File)</span>
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              পূর্বে ডাউনলোড করা কোনো JSON ব্যাকআপ ফাইল নির্বাচন করে সমস্ত তথ্য পুনরায় রিস্টোর করতে পারেন।
            </p>

            <label className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>ব্যাকআপ ফাইল আপলোড করুন</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

    </div>
  );
};
