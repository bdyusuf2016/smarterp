import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Globe, 
  ShieldCheck, 
  Layers, 
  UserPlus, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  KeyRound, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Lock,
  PackagePlus,
  Cloud,
  RefreshCw,
  Download
} from 'lucide-react';
import { Tenant, UserRole, BusinessCategory, Module } from '../../types';
import { storageService } from '../../services/storageService';
import { authService, UserProfile } from '../../services/authService';
import { supabaseService } from '../../services/supabaseClient';
import { RbacEngine } from '../../engine/rbacEngine';
import { CatalogInitEngine } from '../../engine/catalogInitEngine';
import { IconRenderer } from '../common/IconRenderer';
import { PinVerificationModal } from '../common/PinVerificationModal';
import { useConfirm } from '../../context/ConfirmationContext';

interface TenantManagementViewProps {
  activeRole: UserRole;
  onSelectTenant: (tenant: Tenant) => void;
}

export const TenantManagementView: React.FC<TenantManagementViewProps> = ({
  activeRole,
  onSelectTenant
}) => {
  const { confirm } = useConfirm();
  const [tenants, setTenants] = useState<Tenant[]>(() => storageService.getTenants());
  const categories = storageService.getCategories();
  const modules = storageService.getModules();

  const [searchTerm, setSearchTerm] = useState('');
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isPulling, setIsPulling] = useState(false);

  // Wizard Form State
  const [shopName, setShopName] = useState('');
  const [shopCode, setShopCode] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('password123');
  const [address, setAddress] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('৳');
  const [tinNumber, setTinNumber] = useState('');
  const [binNumber, setBinNumber] = useState('');

  const loadTenants = () => {
    const list = storageService.getTenants();
    setTenants(list);
  };

  const handlePullFromCloud = async (silent = false) => {
    setIsPulling(true);
    try {
      const res = await supabaseService.pullFromCloud();
      loadTenants();
      if (!silent || (res.count && res.count > 0)) {
        showNotification(res.message, res.success ? 'success' : 'error');
      }
    } catch (err: any) {
      if (!silent) {
        showNotification(err?.message || 'ক্লাউড থেকে ডাটা আনা যায়নি', 'error');
      }
    } finally {
      setIsPulling(false);
    }
  };

  // Auto-pull existing tenants from Supabase when opening on a new device/phone
  React.useEffect(() => {
    if (tenants.length === 0) {
      handlePullFromCloud(true);
    }
  }, []);
  
  // Domain Setup
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  // Category & Module Matrix Selection
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['cat_telecom']);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string>('cat_telecom');
  const [enabledModules, setEnabledModules] = useState<string[]>([
    'SALES', 'PRODUCTS', 'INVENTORY', 'CUSTOMERS', 'ACCOUNTING', 'REPORTS', 'IMEI', 'REPAIRS', 'RECHARGE'
  ]);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenNewModal = () => {
    setEditingTenant(null);
    setShopName('');
    setShopCode(`DOKAN-0${tenants.length + 1}`);
    setOwnerName('');
    setOwnerPhone('');
    setOwnerEmail('');
    setOwnerPassword('password123');
    setAddress('ঢাকা, বাংলাদেশ');
    setCurrencySymbol('৳');
    setTinNumber('');
    setBinNumber('');
    setSubdomain('');
    setCustomDomain('');
    setSelectedCategories(['cat_telecom']);
    setPrimaryCategoryId('cat_telecom');
    setEnabledModules([
      'SALES', 'PRODUCTS', 'INVENTORY', 'CUSTOMERS', 'ACCOUNTING', 'REPORTS', 'IMEI', 'REPAIRS', 'RECHARGE'
    ]);
    setIsProvisionModalOpen(true);
  };

  const handleOpenEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setShopName(t.name);
    setShopCode(t.code);
    setOwnerName(t.owner_name);
    setOwnerPhone(t.phone);
    setOwnerEmail(t.email);
    setOwnerPassword('••••••••');
    setAddress(t.address);
    setCurrencySymbol(t.currency_symbol || '৳');
    setTinNumber(t.tin_number || '');
    setBinNumber(t.bin_number || t.vat_number || '');
    setSubdomain(t.subdomain || '');
    setCustomDomain(t.custom_domain || '');
    setSelectedCategories(t.active_categories.map(c => c.business_category_id));
    setPrimaryCategoryId(t.active_categories.find(c => c.is_primary)?.business_category_id || t.active_categories[0]?.business_category_id || 'cat_telecom');
    setEnabledModules(t.enabled_modules || ['SALES', 'PRODUCTS', 'INVENTORY', 'CUSTOMERS', 'ACCOUNTING', 'REPORTS']);
    setIsProvisionModalOpen(true);
  };

  const handleToggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length === 1) {
        showNotification('কমপক্ষে একটি বিজনেস ক্যাটাগরি নির্বাচিত থাকতে হবে', 'error');
        return;
      }
      const updated = selectedCategories.filter(id => id !== catId);
      setSelectedCategories(updated);
      if (primaryCategoryId === catId) {
        setPrimaryCategoryId(updated[0]);
      }
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleToggleModule = (moduleCode: string) => {
    if (enabledModules.includes(moduleCode)) {
      setEnabledModules(enabledModules.filter(m => m !== moduleCode));
    } else {
      setEnabledModules([...enabledModules, moduleCode]);
    }
  };

  // Security PIN Verification Modal State
  const [pinModalConfig, setPinModalConfig] = useState<{
    isOpen: boolean;
    actionType: 'delete' | 'edit';
    title?: string;
    subtitle?: string;
    itemName?: string;
    onSuccess: () => void;
  }>({
    isOpen: false,
    actionType: 'delete',
    onSuccess: () => {}
  });

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopName.trim() || !shopCode.trim() || !ownerPhone.trim()) {
      showNotification('দোকানের নাম, কোড এবং মালিকের মোবাইল নম্বর আবশ্যক', 'error');
      return;
    }

    const cleanOwnerPhone = authService.normalizePhone(ownerPhone);
    if (!cleanOwnerPhone || cleanOwnerPhone.length < 10) {
      showNotification('অনুগ্রহ করে দোকান মালিকের সঠিক মোবাইল নম্বর লিখুন (যেমন: 017xxxxxxxx)', 'error');
      return;
    }

    // Enforce Unique Phone as Username across platform
    const uniqueCheck = authService.isPhoneUnique(
      cleanOwnerPhone,
      editingTenant ? `usr_owner_${editingTenant.id}` : undefined
    );
    if (!uniqueCheck.isUnique) {
      showNotification(
        uniqueCheck.message || `এই মোবাইল নম্বরটি (${cleanOwnerPhone}) ইতিমধ্যে অন্য একজন ব্যবহারকারীর ইউজারনেম হিসেবে নিবন্ধিত আছে।`,
        'error'
      );
      return;
    }

    const tenantId = editingTenant ? editingTenant.id : `tenant_${Date.now()}`;
    const cleanSubdomain = subdomain ? (subdomain.includes('.') ? subdomain : `${subdomain}.dokanmanager.io`) : `${shopCode.toLowerCase()}.dokanmanager.io`;

    const activeCatObjects = selectedCategories.map((catId, idx) => ({
      id: `tbc_${tenantId}_${catId}`,
      tenant_id: tenantId,
      business_category_id: catId,
      is_primary: catId === primaryCategoryId,
      is_active: true,
      created_at: new Date().toISOString()
    }));

    const newTenant: Tenant = {
      id: tenantId,
      code: shopCode.toUpperCase().trim(),
      name: shopName.trim(),
      owner_name: ownerName.trim() || 'দোকান মালিক',
      email: ownerEmail.trim() || `${cleanOwnerPhone}@dokan.local`,
      phone: cleanOwnerPhone,
      currency: 'BDT',
      currency_symbol: currencySymbol || '৳',
      address: address.trim() || 'বাংলাদেশ',
      tin_number: tinNumber.trim(),
      bin_number: binNumber.trim(),
      vat_number: binNumber.trim(),
      subdomain: cleanSubdomain,
      custom_domain: customDomain.trim(),
      status: 'active',
      active_categories: activeCatObjects,
      enabled_modules: enabledModules,
      created_at: editingTenant ? editingTenant.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save Tenant
    storageService.saveTenant(newTenant);

    // Auto-initialize Starter Product Catalog matching the shop's active categories
    if (!editingTenant) {
      const initResult = CatalogInitEngine.initializeTenantCatalog(newTenant);
      console.log(`Auto-initialized ${initResult.importedCount} products for ${newTenant.name}`);
    }

    // Auto-provision initial Owner Account for this tenant with phone as unique username
    const ownerUser: UserProfile = {
      id: `usr_owner_${tenantId}`,
      username: cleanOwnerPhone,
      name: ownerName.trim() || `${shopName} মালিক`,
      phone: cleanOwnerPhone,
      email: ownerEmail.trim() || `${cleanOwnerPhone}@dokan.local`,
      role: 'ADMIN',
      tenantId: tenantId,
      designation: 'দোকান স্বত্বাধিকারী (Shop Owner)',
      permissions: RbacEngine.getRolePermissions('ADMIN'),
      status: 'active',
      lastLogin: new Date().toISOString()
    };
    authService.saveStaffMember(ownerUser);

    loadTenants();
    setIsProvisionModalOpen(false);
    showNotification(
      editingTenant
        ? `দোকান "${shopName}" সফলভাবে আপডেট করা হয়েছে!`
        : `নতুন দোকান "${shopName}" সফলভাবে প্রভিশন করা হয়েছে এবং ক্যাটাগরি অনুসারে মাস্টার ক্যাটালগ তৈরি হয়েছে!`
    );
  };

  const handleInitCatalog = (t: Tenant) => {
    const result = CatalogInitEngine.initializeTenantCatalog(t, { overwrite: true });
    showNotification(`"${t.name}" দোকানে ${result.importedCount} টি মাস্টার পণ্য স্বয়ংক্রিয়ভাবে ইমপোর্ট করা হয়েছে!`);
  };

  const confirmDeleteTenant = (t: Tenant) => {
    storageService.deleteTenant(t.id);
    loadTenants();
    showNotification(`দোকান "${t.name}" সফলভাবে মুছে ফেলা হয়েছে`);
  };

  const handleDeleteTenant = async (t: Tenant) => {
    if (storageService.isPinRequired('delete')) {
      setPinModalConfig({
        isOpen: true,
        actionType: 'delete',
        title: 'দোকান মুছে ফেলতে সিকিউরিটি পিন',
        subtitle: `দোকান "${t.name}" (${t.code}) এবং এর সমস্ত ডাটা মুছে ফেলার জন্য পিন দিন`,
        itemName: t.name,
        onSuccess: () => confirmDeleteTenant(t)
      });
    } else {
      const ok = await confirm({
        title: 'দোকান ও সকল ডেটা মুছে ফেলতে চান?',
        message: `আপনি কি নিশ্চিত যে দোকান "${t.name}" (${t.code}) এবং এর অন্তর্ভুক্ত সমস্ত পণ্য, স্টক, সেলস ও হিস্ট্রি স্থায়ীভাবে মুছে ফেলতে চান?`,
        itemName: `${t.name} (${t.code})`,
        confirmText: 'হ্যাঁ, সম্পূর্ণ মুছে ফেলুন',
        cancelText: 'বাতিল',
        type: 'danger',
        icon: 'trash',
        warningNote: 'সতর্কতা: এই দোকানের সমস্ত স্থানীয় ও ক্লাউড ডেটা মুছে যাবে এবং এটি পরবর্তীতে পুনরুদ্ধার করা অসম্ভব!'
      });
      if (ok) {
        confirmDeleteTenant(t);
      }
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 select-none pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            System Platform Owner • Md. Yusuf Ali
          </div>
          <h1 className="text-2xl font-extrabold text-white">টেন্যান্ট প্রভিশনিং ও ডোমেন স্টুডিও</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            এখান থেকে নতুন দোকান তৈরি করুন, কাস্টম সাব-ডোমেন/ডোমেন সেট করুন এবং দোকানের জন্য প্রয়োজনীয় মডিউল ও পারমিশন কনফিগার করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handlePullFromCloud(false)}
            disabled={isPulling}
            className="px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-400/40 shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Supabase ক্লাউড থেকে এক্সিস্টিং দোকান ও তথ্য সিঙ্ক করুন"
          >
            {isPulling ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Cloud className="w-4 h-4 text-emerald-200" />
            )}
            <span>{isPulling ? 'ক্লাউড থেকে আনা হচ্ছে...' : '☁️ ক্লাউড থেকে লোড'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewModal}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন দোকান</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in ${
          notification.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold">নিবন্ধিত মোট দোকান (Tenants)</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{tenants.length} টি</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">সবগুলো ক্লাউড রেডি</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold">উপলব্ধ বিজনেস ক্যাটাগরি</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{categories.length} টি</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">টেলিকম, গ্রোসারি, বই-খাতা ইত্যাদি</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold">সক্রিয় প্ল্যাটফর্ম মডিউল</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{modules.length} টি</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">পূর্ণ ডায়নামিক কনফিগারেশন</div>
        </div>
      </div>

      {/* Tenant Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="দোকানের নাম, কোড বা মালিকের ফোন দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          মোট রেজাল্ট: <b>{filteredTenants.length}</b> টি দোকান
        </span>
      </div>

      {/* Tenants Table / Empty State */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredTenants.length === 0 ? (
          <div className="p-10 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto border border-blue-200 shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">কোনো দোকান লোড করা নেই</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                আপনার পূর্বে তৈরি করা এক্সিস্টিং দোকানগুলো Supabase ক্লাউড থেকে নামাতে নিচের বাটনে চাপুন।
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handlePullFromCloud(false)}
                disabled={isPulling}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isPulling ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>{isPulling ? 'লোড হচ্ছে...' : '☁️ ক্লাউড থেকে এক্সিস্টিং দোকান আনুন'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewModal}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border border-slate-300 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন দোকান তৈরি</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Mobile Card List (Screen < md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredTenants.map(t => (
                <div key={t.id} className="p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                        <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-bold text-slate-700">{t.code}</span>
                          <span>•</span>
                          <span>{t.address || 'বাংলাদেশ'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md shrink-0">
                      {t.enabled_modules?.length || 0} মডিউল
                    </span>
                  </div>

                  {/* Domain & Owner Info */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">ডোমেন:</span>
                      <span className="font-mono text-blue-600 font-bold flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-500" />
                        {t.subdomain || `${t.code.toLowerCase()}.dokanmanager.io`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">মালিক / ফোন:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <span>{t.owner_name}</span>
                        <span className="font-mono text-slate-500">({t.phone})</span>
                      </span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1">
                    {t.active_categories.map(ac => {
                      const cat = categories.find(c => c.id === ac.business_category_id);
                      if (!cat) return null;
                      return (
                        <span
                          key={ac.id}
                          className={`text-[9.5px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${
                            ac.is_primary ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <IconRenderer name={cat.icon} className="w-3 h-3" />
                          <span>{cat.name}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Touch Action Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTenant(t);
                        showNotification(`দোকান "${t.name}" সক্রিয় করা হয়েছে`);
                      }}
                      className="col-span-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>প্রবেশ করুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInitCatalog(t)}
                      className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                      title="ক্যাটালগ অটো-ইনিশিয়েট"
                    >
                      <PackagePlus className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(t)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                        title="এডিট"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTenant(t)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (Screen >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">দোকানের তথ্য</th>
                    <th className="py-3.5 px-4">ডোমেন / সাবডোমেন</th>
                    <th className="py-3.5 px-4">বিজনেস ক্যাটাগরি</th>
                    <th className="py-3.5 px-4">মালিক ও লগইন আইডি</th>
                    <th className="py-3.5 px-4">মডিউল সংখ্যা</th>
                    <th className="py-3.5 px-4 text-right">একশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTenants.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-bold text-slate-700">{t.code}</span>
                              <span>•</span>
                              <span>{t.address}</span>
                            </div>
                            {(t.bin_number || t.tin_number || t.vat_number) && (
                              <div className="flex items-center gap-1 text-[9.5px] text-slate-500 font-mono mt-0.5">
                                {(t.bin_number || t.vat_number) && <span className="bg-blue-50 text-blue-700 px-1 rounded border border-blue-200">BIN: {t.bin_number || t.vat_number}</span>}
                                {t.tin_number && <span className="bg-emerald-50 text-emerald-700 px-1 rounded border border-emerald-200">TIN: {t.tin_number}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-blue-600 font-mono text-xs font-semibold">
                            <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{t.subdomain || `${t.code.toLowerCase()}.dokanmanager.io`}</span>
                          </div>
                          {t.custom_domain && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              Custom: <b>{t.custom_domain}</b>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {t.active_categories.map(ac => {
                            const cat = categories.find(c => c.id === ac.business_category_id);
                            if (!cat) return null;
                            return (
                              <span
                                key={ac.id}
                                className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${
                                  ac.is_primary ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                <IconRenderer name={cat.icon} className="w-3 h-3" />
                                <span>{cat.name}</span>
                                {ac.is_primary && <span className="text-[8px] uppercase font-bold text-blue-600">(Primary)</span>}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{t.owner_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{t.phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg">
                          {t.enabled_modules?.length || 0} টি মডিউল
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTenant(t);
                              showNotification(`দোকান "${t.name}" সক্রিয় করা হয়েছে`);
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="এই দোকানে প্রবেশ করুন"
                          >
                            <span>প্রবেশ</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInitCatalog(t)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="ক্যাটাগরি অনুযায়ী মাস্টার ক্যাটালগ অটো-ইনিশিয়ালাইজ করুন"
                          >
                            <PackagePlus className="w-4 h-4 text-emerald-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(t)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="দোকান কনফিগারেশন সম্পাদনা"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTenant(t)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="দোকান মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* PROVISIONING WIZARD MODAL */}
      {/* ================================================== */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingTenant ? `দোকান কনফিগারেশন: ${editingTenant.name}` : 'নতুন দোকান ও টেন্যান্ট প্রভিশনিং'}
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    দোকানের প্রোফাইল, সাবডোমেন, মডিউল পারমিশন এবং মালিকের লগইন অ্যাকাউন্ট সেট করুন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveTenant} className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* SECTION 1: BUSINESS & PROFILE */}
              <div>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>১. দোকানের সাধারণ প্রোফাইল (Business Profile)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">দোকানের নাম *</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                      placeholder="যেমন: আল-মদিনা টেলিকম ও এক্সেসরিজ"
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">দোকান / টেন্যান্ট কোড *</label>
                    <input
                      type="text"
                      value={shopCode}
                      onChange={e => setShopCode(e.target.value)}
                      placeholder="MDK-01"
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ঠিকানা / লোকেশন</label>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="যেমন: মিরপুর-১০, ঢাকা"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">মুদ্রা প্রতীক (Currency)</label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={e => setCurrencySymbol(e.target.value)}
                      placeholder="৳"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">TIN নম্বর (Tax Identification No)</label>
                    <input
                      type="text"
                      value={tinNumber}
                      onChange={e => setTinNumber(e.target.value)}
                      placeholder="TIN-894729182"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">BIN নম্বর (Business Identification No / ভ্যাট)</label>
                    <input
                      type="text"
                      value={binNumber}
                      onChange={e => setBinNumber(e.target.value)}
                      placeholder="BIN-001928471-001"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: DOMAIN & ROUTING SETUP */}
              <div>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>২. ডোমেন ও ক্লাউড সাব-ডোমেন সেটআপ (Domain Setup)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ক্লাউড সাব-ডোমেন</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={subdomain}
                        onChange={e => setSubdomain(e.target.value)}
                        placeholder="almadina.dokanmanager.io"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">কাস্টম ডোমেন (যদি থাকে)</label>
                    <input
                      type="text"
                      value={customDomain}
                      onChange={e => setCustomDomain(e.target.value)}
                      placeholder="pos.almadinatelecom.com"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: BUSINESS CATEGORIES & MODULE PERMISSIONS */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                    <span>৩. বিজনেস ক্যাটাগরি ও সক্রিয় মডিউলসমূহ (Module Permissions)</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">বিজনেস ক্যাটাগরি নির্বাচন করুন:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {categories.map(cat => {
                      const isSelected = selectedCategories.includes(cat.id);
                      const isPrimary = primaryCategoryId === cat.id;

                      return (
                        <div
                          key={cat.id}
                          className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 opacity-70'
                          }`}
                          onClick={() => handleToggleCategory(cat.id)}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <IconRenderer name={cat.icon} className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-800">{cat.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{cat.code}</div>
                            </div>
                          </div>

                          {isSelected && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrimaryCategoryId(cat.id);
                              }}
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border transition-colors ${
                                isPrimary
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {isPrimary ? 'Primary' : 'Make Primary'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modules list */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">দোকানের জন্য অনুমোদিত মডিউলসমূহ:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {modules.map(mod => {
                      const isChecked = enabledModules.includes(mod.code);

                      return (
                        <label
                          key={mod.id}
                          className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                            isChecked ? 'border-purple-300 bg-purple-50/70 text-purple-900 font-semibold' : 'border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleModule(mod.code)}
                            className="w-3.5 h-3.5 text-purple-600 rounded"
                          />
                          <span className="truncate">{mod.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 4: INITIAL SHOP OWNER ACCOUNT */}
              <div>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>৪. দোকান মালিকের প্রাথমিক লগইন অ্যাকাউন্ট (Shop Owner User)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">মালিকের নাম *</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      placeholder="যেমন: মো: রহিম উদ্দিন"
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">লগইন মোবাইল নম্বর *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={ownerPhone}
                        onChange={e => setOwnerPhone(e.target.value)}
                        placeholder="018xxxxxxxx"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">লগইন পাসওয়ার্ড *</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={ownerPassword}
                        onChange={e => setOwnerPassword(e.target.value)}
                        placeholder="পাসওয়ার্ড লিখুন..."
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit / Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTenant ? 'দোকান আপডেট করুন' : 'দোকান প্রভিশন ও প্রস্তুত করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security PIN Verification Modal */}
      <PinVerificationModal
        isOpen={pinModalConfig.isOpen}
        onClose={() => setPinModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSuccess={pinModalConfig.onSuccess}
        actionType={pinModalConfig.actionType}
        title={pinModalConfig.title}
        subtitle={pinModalConfig.subtitle}
        itemName={pinModalConfig.itemName}
      />
    </div>
  );
};
