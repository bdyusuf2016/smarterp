import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Layers, 
  Plus, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Cpu, 
  Tag,
  ToggleLeft,
  ToggleRight,
  Database,
  Building,
  CheckCircle2,
  Code,
  ShieldAlert,
  Lock,
  Crown
} from 'lucide-react';
import { 
  Tenant, 
  UserRole,
  BusinessCategory, 
  Module, 
  CustomFieldDefinition 
} from '../../types';
import { storageService } from '../../services/storageService';
import { IconRenderer } from '../common/IconRenderer';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface CategoryStudioViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
  onTenantUpdated: (updatedTenant: Tenant) => void;
}

export const CategoryStudioView: React.FC<CategoryStudioViewProps> = ({
  activeTenant,
  activeRole,
  onTenantUpdated
}) => {
  const isPlatformAdmin = activeRole === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'matrix' | 'categories' | 'modules' | 'fields'>('matrix');
  const [focusedCategoryId, setFocusedCategoryId] = useState<string>('cat_telecom');
  const categories = storageService.getCategories();
  const modules = storageService.getModules();
  const customFields = storageService.getCustomFields();

  const focusedCategory = categories.find(c => c.id === focusedCategoryId) || categories[0];
  const focusedFields = customFields.filter(f => f.business_category_id === focusedCategory?.id);

  // Create Category Modal State
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatData, setNewCatData] = useState<Partial<BusinessCategory>>({
    code: '',
    name: '',
    description: '',
    icon: 'Package',
    is_system: false,
    is_active: true,
    configuration: {
      hasInventory: true,
      hasBarcode: true,
      hasSuppliers: true,
      defaultTaxRate: 0
    }
  });

  // Create Custom Field Modal State
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [newFieldData, setNewFieldData] = useState<Partial<CustomFieldDefinition>>({
    business_category_id: focusedCategory?.id || categories[0]?.id || '',
    entity_type: 'product',
    name: '',
    code: '',
    field_type: 'text',
    is_required: false,
    placeholder: '',
    options: []
  });
  const [tempOptionsStr, setTempOptionsStr] = useState('');

  // Handle Module Toggle for active tenant (Platform Admin Exclusive)
  const handleToggleModule = (moduleCode: string) => {
    if (!isPlatformAdmin) {
      alert('অননুমোদিত এক্সেস: শুধুমাত্র সিস্টেম ম্যানেজার / Platform Admin টেন্যান্ট মডিউল অ্যাক্টিভেশন ম্যানেজ করতে পারবেন।');
      return;
    }

    const currentEnabled = activeTenant.enabled_modules || [];
    const isCurrentlyEnabled = currentEnabled.includes(moduleCode);
    
    let updatedModules: string[];
    if (isCurrentlyEnabled) {
      updatedModules = currentEnabled.filter(m => m !== moduleCode);
    } else {
      updatedModules = [...currentEnabled, moduleCode];
    }

    const updatedTenant: Tenant = {
      ...activeTenant,
      enabled_modules: updatedModules,
      updated_at: new Date().toISOString()
    };

    storageService.saveTenant(updatedTenant);
    onTenantUpdated(updatedTenant);
  };

  // Handle Category Toggle for active tenant (Platform Admin Exclusive)
  const handleToggleTenantCategory = (categoryId: string) => {
    if (!isPlatformAdmin) {
      alert('অননুমোদিত এক্সেস: শুধুমাত্র সিস্টেম ম্যানেজার / Platform Admin ক্যাটাগরি ম্যাপিং পরিবর্তন করতে পারবেন।');
      return;
    }

    const currentActiveCats = [...(activeTenant.active_categories || [])];
    const existingIndex = currentActiveCats.findIndex(c => c.business_category_id === categoryId);

    if (existingIndex >= 0) {
      if (currentActiveCats[existingIndex].is_primary) {
        alert('Cannot disable the primary business category for this tenant.');
        return;
      }
      currentActiveCats[existingIndex].is_active = !currentActiveCats[existingIndex].is_active;
    } else {
      currentActiveCats.push({
        id: `tbc_${Date.now()}`,
        tenant_id: activeTenant.id,
        business_category_id: categoryId,
        is_primary: false,
        is_active: true,
        created_at: new Date().toISOString()
      });
    }

    const updatedTenant: Tenant = {
      ...activeTenant,
      active_categories: currentActiveCats,
      updated_at: new Date().toISOString()
    };

    storageService.saveTenant(updatedTenant);
    onTenantUpdated(updatedTenant);
  };

  // Handle Create Category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPlatformAdmin) {
      alert('অননুমোদিত: শুধুমাত্র সিস্টেম ম্যানেজার / Platform Admin নতুন ক্যাটাগরি তৈরি করতে পারবেন।');
      return;
    }
    if (!newCatData.code || !newCatData.name) return;

    const catToSave: BusinessCategory = {
      id: `cat_${newCatData.code.toLowerCase()}_${Date.now().toString().slice(-4)}`,
      code: newCatData.code.toUpperCase(),
      name: newCatData.name,
      description: newCatData.description || '',
      icon: newCatData.icon || 'Package',
      is_system: false,
      is_active: true,
      configuration: newCatData.configuration || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storageService.saveCategory(catToSave);
    setIsAddCatModalOpen(false);
    setNewCatData({
      code: '',
      name: '',
      description: '',
      icon: 'Package',
      is_system: false,
      is_active: true,
      configuration: { hasInventory: true, hasBarcode: true, defaultTaxRate: 0 }
    });
  };

  // Handle Create Custom Field
  const handleCreateCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPlatformAdmin) {
      alert('অননুমোদিত: শুধুমাত্র সিস্টেম ম্যানেজার / Platform Admin কাস্টম ফিল্ড যোগ করতে পারবেন।');
      return;
    }
    if (!newFieldData.name || !newFieldData.code || !newFieldData.business_category_id) return;

    const optionsArray = tempOptionsStr
      ? tempOptionsStr.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const fieldToSave: CustomFieldDefinition = {
      id: `cf_${Date.now()}`,
      business_category_id: newFieldData.business_category_id,
      entity_type: newFieldData.entity_type || 'product',
      name: newFieldData.name,
      code: newFieldData.code.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      field_type: newFieldData.field_type || 'text',
      is_required: Boolean(newFieldData.is_required),
      placeholder: newFieldData.placeholder,
      options: optionsArray
    };

    storageService.saveCustomField(fieldToSave);
    setIsAddFieldModalOpen(false);
    setTempOptionsStr('');
  };

  return (
    <div className="space-y-4 pb-12">
      
      {/* Platform Security Banner */}
      {!isPlatformAdmin ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>নিরাপত্তা বার্তা:</strong> Tenant Module Activation Matrix ম্যানেজ করার ক্ষমতা শুধুমাত্র <strong>সিস্টেম ম্যানেজার / Platform Admin</strong> এর জন্য সংরক্ষিত। আপনি বর্তমানে <strong>{activeRole}</strong> রোলে রিড-অনলি এক্সেসে আছেন।
            </span>
          </div>
          <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded font-bold uppercase shrink-0">Read Only</span>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2 rounded-lg text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>সিস্টেম ম্যানেজার মোড:</strong> আপনার কাছে টেন্যান্ট মডিউল অ্যাক্টিভেশন, ক্যাটাগরি ম্যাপিং ও গ্লোবাল স্কিমা ম্যানেজ করার পূর্ণ প্রশাসনিক অনুমতি রয়েছে।
            </span>
          </div>
          <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-bold uppercase shrink-0">Admin Access</span>
        </div>
      )}

      {/* Studio Header */}
      <div className="bg-[#1a1b1e] text-white p-5 rounded-lg border border-[#343a40] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <SlidersHorizontal className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold tracking-tight text-white">Business Category & Matrix Studio</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
              Global Platform Engine
            </span>
          </div>
          <p className="text-xs text-[#adb5bd] max-w-2xl">
            Generic multi-tenant architecture. Add domain categories, configure feature plugins, and declare dynamic custom field schemas.
          </p>
        </div>

        {/* Tab Controls & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#141517] p-1 rounded border border-[#343a40] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer text-xs ${
                activeTab === 'matrix' ? 'bg-blue-600 text-white shadow-xs' : 'text-[#adb5bd] hover:text-white'
              }`}
            >
              Matrix & Plugins
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer text-xs ${
                activeTab === 'categories' ? 'bg-blue-600 text-white shadow-xs' : 'text-[#adb5bd] hover:text-white'
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('modules')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer text-xs ${
                activeTab === 'modules' ? 'bg-blue-600 text-white shadow-xs' : 'text-[#adb5bd] hover:text-white'
              }`}
            >
              Tenant Modules ({(activeTenant.enabled_modules || []).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fields')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer text-xs ${
                activeTab === 'fields' ? 'bg-blue-600 text-white shadow-xs' : 'text-[#adb5bd] hover:text-white'
              }`}
            >
              Custom Fields ({customFields.length})
            </button>
          </div>

          <button
            type="button"
            disabled={!isPlatformAdmin}
            onClick={() => setIsAddCatModalOpen(true)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-xs ${
              isPlatformAdmin ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
            }`}
            title={!isPlatformAdmin ? 'শুধুমাত্র Platform Admin নতুন ক্যাটাগরি তৈরি করতে পারেন' : '+ New Category'}
          >
            {isPlatformAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>+ New Category</span>
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* 1. MATRIX & PLUGINS VIEW (Exact High Density Layout) */}
      {/* ================================================== */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* CATEGORY & MODULE MATRIX */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-[#dee2e6] shadow-xs flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#dee2e6] bg-[#f8f9fa] flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase text-[#495057] tracking-wider">Business Category Feature Matrix</h2>
                <p className="text-[11px] text-[#868e96] mt-0.5">Feature plugins and capabilities mapped across core business industries.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const dataStr = JSON.stringify(categories, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'dokan_business_categories_schema.json';
                    a.click();
                  }}
                  className="px-3 py-1 text-xs font-semibold bg-white border border-[#dee2e6] rounded hover:bg-gray-50 text-[#212529] transition-colors cursor-pointer"
                >
                  Export Schema
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-[#dee2e6] bg-[#f8f9fa]/50">
              <div className="grid grid-cols-6 gap-4 text-[11px] font-bold uppercase text-[#868e96] tracking-wider">
                <div className="col-span-2 text-[#495057]">Core Modules & Features</div>
                <div className="text-center">Telecom</div>
                <div className="text-center">Grocery</div>
                <div className="text-center">Library</div>
                <div className="text-center">Electronics</div>
              </div>
            </div>

            <div className="divide-y divide-[#f1f3f5] text-xs">
              {/* ROW: SALES */}
              <div className="grid grid-cols-6 gap-4 px-4 py-3 hover:bg-[#f8f9fa] transition-colors items-center">
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-[#1a1b1e]">Sales & Invoicing</div>
                  <div className="text-[10px] text-[#868e96]">Core business transaction module</div>
                </div>
                <div className="text-center"><span className="text-emerald-500 font-bold">✔</span></div>
                <div className="text-center"><span className="text-emerald-500 font-bold">✔</span></div>
                <div className="text-center"><span className="text-emerald-500 font-bold">✔</span></div>
                <div className="text-center"><span className="text-emerald-500 font-bold">✔</span></div>
              </div>

              {/* ROW: IMEI */}
              <div className="grid grid-cols-6 gap-4 px-4 py-3 hover:bg-[#f8f9fa] transition-colors items-center bg-blue-50/20">
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-[#1a1b1e]">IMEI Tracking</div>
                  <div className="text-[10px] text-blue-600 font-medium italic">Optional Feature Plugin</div>
                </div>
                <div className="text-center font-bold text-blue-600">ON</div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center opacity-20">—</div>
              </div>

              {/* ROW: BATCH/EXPIRY */}
              <div className="grid grid-cols-6 gap-4 px-4 py-3 hover:bg-[#f8f9fa] transition-colors items-center">
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-[#1a1b1e]">Batch & Expiry</div>
                  <div className="text-[10px] text-[#868e96]">Perishable item tracking</div>
                </div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center font-bold text-emerald-600">ON</div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center opacity-20">—</div>
              </div>

              {/* ROW: BOOK TRACKING */}
              <div className="grid grid-cols-6 gap-4 px-4 py-3 hover:bg-[#f8f9fa] transition-colors items-center">
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-[#1a1b1e]">Lending & Borrowing</div>
                  <div className="text-[10px] text-[#868e96]">Member loan cycle management</div>
                </div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center font-bold text-purple-600">ON</div>
                <div className="text-center opacity-20">—</div>
              </div>

              {/* ROW: WARRANTY */}
              <div className="grid grid-cols-6 gap-4 px-4 py-3 hover:bg-[#f8f9fa] transition-colors items-center">
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-[#1a1b1e]">Warranty Service</div>
                  <div className="text-[10px] text-[#868e96]">Manufacturer/Vendor claims</div>
                </div>
                <div className="text-center font-bold text-blue-600">ON</div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center font-bold text-orange-600">ON</div>
              </div>

              {/* ROW: WEIGHT */}
              <div className="grid grid-cols-6 gap-4 px-4 py-3 hover:bg-[#f8f9fa] transition-colors items-center">
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-[#1a1b1e]">Weight-based Sales</div>
                  <div className="text-[10px] text-[#868e96]">Unit/Scales integration</div>
                </div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center font-bold text-emerald-600">ON</div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center opacity-20">—</div>
              </div>

              {/* ROW: AIRTIME */}
              <div className="grid grid-cols-6 gap-4 px-4 py-3 hover:bg-[#f8f9fa] transition-colors items-center">
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-[#1a1b1e]">Airtime & Top-up</div>
                  <div className="text-[10px] text-[#868e96]">Virtual utility recharging</div>
                </div>
                <div className="text-center font-bold text-blue-600">ON</div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center opacity-20">—</div>
                <div className="text-center opacity-20">—</div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: CATEGORY PROPERTIES & CUSTOM FIELDS */}
          <div className="flex flex-col gap-5">
            {/* SELECTION CONTEXT */}
            <div className="bg-[#212529] text-white p-5 rounded-lg shadow-sm border border-[#343a40]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Focused Category</div>
                <select
                  value={focusedCategoryId}
                  onChange={e => setFocusedCategoryId(e.target.value)}
                  className="bg-[#141517] text-white border border-[#343a40] text-xs px-2 py-1 rounded"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <h3 className="text-xl font-bold mb-1 tracking-tight">{focusedCategory?.name ? focusedCategory.name.toUpperCase() : 'CATEGORY'}</h3>
              <p className="text-xs text-[#adb5bd] leading-relaxed mb-4">{focusedCategory?.description || 'Category schema'}</p>
              
              <div className="space-y-2">
                 <div className="flex justify-between text-[11px] border-b border-[#343a40] pb-1.5">
                   <span className="text-[#868e96]">Code Identifier</span>
                   <span className="font-mono text-blue-400 font-bold">{focusedCategory?.code || 'N/A'}</span>
                 </div>
                 <div className="flex justify-between text-[11px] border-b border-[#343a40] pb-1.5">
                   <span className="text-[#868e96]">Default Tax Rate</span>
                   <span className="font-mono text-blue-400">{focusedCategory?.configuration?.defaultTaxRate ?? 0}%</span>
                 </div>
                 <div className="flex justify-between text-[11px] border-b border-[#343a40] pb-1.5">
                   <span className="text-[#868e96]">Inventory Enabled</span>
                   <span className="font-mono text-green-400">
                     {focusedCategory?.configuration?.hasInventory ? 'ENABLED' : 'DISABLED'}
                   </span>
                 </div>
                 <div className="flex justify-between text-[11px]">
                   <span className="text-[#868e96]">Barcode Support</span>
                   <span className="font-mono text-green-400">
                     {focusedCategory?.configuration?.hasBarcode ? 'ENABLED' : 'DISABLED'}
                   </span>
                 </div>
              </div>
            </div>

            {/* CUSTOM FIELDS PREVIEW */}
            <div className="bg-white rounded-lg border border-[#dee2e6] shadow-xs flex flex-col p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#495057]">
                  Defined Custom Fields ({focusedFields.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setNewFieldData({ ...newFieldData, business_category_id: focusedCategory.id });
                    setIsAddFieldModalOpen(true);
                  }}
                  className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  + Add Field
                </button>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {focusedFields.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No custom fields for this category yet.</p>
                ) : (
                  focusedFields.map(f => (
                    <div key={f.id} className="p-2.5 bg-[#f8f9fa] border border-[#f1f3f5] rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold text-[#1a1b1e]">{f.name}</span>
                        <span className="text-[9px] bg-gray-200 text-slate-700 px-1 py-0.2 rounded font-mono font-semibold uppercase">
                          {f.field_type}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#868e96] truncate">
                        {f.options ? f.options.join(', ') : `Key: ${f.code} • ${f.entity_type}`}
                      </div>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  onClick={() => {
                    setNewFieldData({ ...newFieldData, business_category_id: focusedCategory.id });
                    setIsAddFieldModalOpen(true);
                  }}
                  className="w-full p-2 bg-[#f8f9fa] border border-[#dee2e6] border-dashed rounded text-center text-[10px] text-[#868e96] hover:text-[#1a1b1e] hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  + Add New Field Definition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 2. BUSINESS CATEGORIES TAB */}
      {/* ================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-[#dee2e6] shadow-xs">
            <div>
              <h2 className="text-xs font-bold uppercase text-[#495057] tracking-wider">Registered Business Categories</h2>
              <p className="text-xs text-[#868e96]">
                Core domain categories with specific JSON configurations and workflow capabilities.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddCatModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Define New Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => {
              const isAttachedToTenant = (activeTenant.active_categories || []).some(
                c => c.business_category_id === cat.id && c.is_active
              );
              const isPrimary = (activeTenant.active_categories || []).some(
                c => c.business_category_id === cat.id && c.is_primary
              );

              return (
                <div 
                  key={cat.id} 
                  className="bg-white p-5 rounded-lg border border-[#dee2e6] shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                          <IconRenderer name={cat.icon} className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#1a1b1e] text-sm">{cat.name}</h3>
                          <span className="font-mono text-[10px] text-[#868e96] uppercase font-bold">{cat.code}</span>
                        </div>
                      </div>

                      {cat.is_system ? (
                        <Badge variant="slate" size="sm">System Built-in</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Custom Category</Badge>
                      )}
                    </div>

                    <p className="text-xs text-[#495057] leading-relaxed">{cat.description}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[#dee2e6] text-xs">
                    {/* JSON Config properties scannable */}
                    <div className="p-2.5 bg-[#f8f9fa] rounded border border-[#dee2e6] font-mono text-[11px] text-[#495057] space-y-1">
                      <div className="flex justify-between">
                        <span>Tax Rate:</span>
                        <strong className="text-[#1a1b1e]">{cat.configuration?.defaultTaxRate ?? 0}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Inventory:</span>
                        <span className="text-emerald-600 font-bold">{cat.configuration?.hasInventory ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Barcode Scanner:</span>
                        <span className="text-blue-600 font-bold">{cat.configuration?.hasBarcode ? 'Yes' : 'No'}</span>
                      </div>
                    </div>

                    {/* Active Tenant Attachment Status */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        {isAttachedToTenant ? (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isPrimary ? 'Primary Category' : 'Active in Tenant'}
                          </span>
                        ) : (
                          <span className="text-xs text-[#868e96]">Inactive for this Tenant</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleTenantCategory(cat.id)}
                        disabled={isPrimary}
                        className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                          isPrimary
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : isAttachedToTenant
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        {isPrimary ? 'Locked Primary' : isAttachedToTenant ? 'Disable' : 'Enable in Tenant'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 3. MODULES & TENANT MATRIX TAB */}
      {/* ================================================== */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-[#dee2e6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold uppercase text-[#495057] tracking-wider">Tenant Module Activation Matrix</h2>
              <p className="text-xs text-[#868e96]">
                Toggle industry modules live. The sidebar and routes immediately dynamically rebuild for <strong className="text-blue-600">{activeTenant.name}</strong>.
              </p>
            </div>
            <Badge variant="primary" size="md">
              {(activeTenant.enabled_modules || []).length} Modules Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map(mod => {
              const isEnabled = (activeTenant.enabled_modules || []).includes(mod.code);

              return (
                <div 
                  key={mod.id} 
                  className={`p-4 rounded-lg border transition-all ${
                    isEnabled 
                      ? 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-500/10' 
                      : 'bg-[#f8f9fa] border-[#dee2e6] opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded shrink-0 ${isEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                        <IconRenderer name={mod.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#1a1b1e] text-sm">{mod.name}</h3>
                          <span className="font-mono text-[10px] font-bold text-[#868e96] uppercase">{mod.code}</span>
                        </div>
                        <p className="text-xs text-[#495057] mt-1 leading-normal">{mod.description}</p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleModule(mod.code)}
                      className={`p-1 rounded transition-colors cursor-pointer shrink-0 ${
                        isEnabled ? 'text-blue-600' : 'text-gray-300'
                      }`}
                      title={isEnabled ? 'Disable Module' : 'Enable Module'}
                    >
                      {isEnabled ? (
                        <ToggleRight className="w-8 h-8" />
                      ) : (
                        <ToggleLeft className="w-8 h-8" />
                      )}
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#dee2e6] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#868e96]">
                      Module Status: <strong className={isEnabled ? 'text-emerald-600' : 'text-[#868e96]'}>{isEnabled ? 'ACTIVE ON TENANT' : 'DISABLED'}</strong>
                    </span>
                    {mod.is_core ? (
                      <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-semibold">Core Platform</span>
                    ) : (
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">Optional Extension</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 4. DYNAMIC CUSTOM FIELDS TAB */}
      {/* ================================================== */}
      {activeTab === 'fields' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-[#dee2e6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold uppercase text-[#495057] tracking-wider">Custom Field Schema Registry</h2>
              <p className="text-xs text-[#868e96]">
                Extend any business category with structured schema fields (IMEI attributes, ISBN, dietary info, specs).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddFieldModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Define Custom Field</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border border-[#dee2e6] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] border-b border-[#dee2e6] text-[#868e96] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Field Name / Code</th>
                  <th className="py-2.5 px-4">Business Category</th>
                  <th className="py-2.5 px-4">Target Entity</th>
                  <th className="py-2.5 px-4">Data Type</th>
                  <th className="py-2.5 px-4">Required</th>
                  <th className="py-2.5 px-4">Options / Config</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f5] text-[#495057]">
                {customFields.map(cf => {
                  const cat = categories.find(c => c.id === cf.business_category_id);

                  return (
                    <tr key={cf.id} className="hover:bg-[#f8f9fa] transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-[#1a1b1e]">{cf.name}</div>
                        <span className="font-mono text-[10px] text-[#868e96]">{cf.code}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge variant="primary">{cat?.name || 'General'}</Badge>
                      </td>
                      <td className="py-2.5 px-4 font-semibold uppercase text-[11px] text-[#495057]">
                        {cf.entity_type}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="bg-gray-100 text-gray-800 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {cf.field_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {cf.is_required ? (
                          <span className="text-rose-600 font-bold">Yes</span>
                        ) : (
                          <span className="text-[#868e96]">Optional</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-[#868e96]">
                        {cf.options ? (
                          <span className="text-[11px]">{cf.options.join(', ')}</span>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Define Business Category */}
      <Modal
        isOpen={isAddCatModalOpen}
        onClose={() => setIsAddCatModalOpen(false)}
        title="Register New Business Category"
        subtitle="Define a new industry model with zero platform code changes"
      >
        <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Category Code *</label>
              <input
                type="text"
                required
                placeholder="PHARMACY, FASHION, HARDWARE"
                value={newCatData.code || ''}
                onChange={e => setNewCatData({ ...newCatData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Category Name *</label>
              <input
                type="text"
                required
                placeholder="Pharmacy & Health, Apparel"
                value={newCatData.name || ''}
                onChange={e => setNewCatData({ ...newCatData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#495057] mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Describe business category scope and default workflows..."
              value={newCatData.description || ''}
              onChange={e => setNewCatData({ ...newCatData, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Icon Identifier</label>
              <select
                value={newCatData.icon || 'Package'}
                onChange={e => setNewCatData({ ...newCatData, icon: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded"
              >
                <option value="Package">Package</option>
                <option value="Smartphone">Smartphone</option>
                <option value="ShoppingBag">ShoppingBag</option>
                <option value="PenTool">PenTool</option>
                <option value="BookOpen">BookOpen</option>
                <option value="Cpu">Cpu</option>
                <option value="Zap">Zap</option>
                <option value="Sparkles">Sparkles</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                value={newCatData.configuration?.defaultTaxRate || 5}
                onChange={e => setNewCatData({
                  ...newCatData,
                  configuration: { ...newCatData.configuration, defaultTaxRate: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#dee2e6]">
            <button
              type="button"
              onClick={() => setIsAddCatModalOpen(false)}
              className="px-4 py-2 text-[#495057] font-semibold hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-xs"
            >
              Register Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Define Custom Field */}
      <Modal
        isOpen={isAddFieldModalOpen}
        onClose={() => setIsAddFieldModalOpen(false)}
        title="Define Dynamic Custom Field"
        subtitle="Extend any business domain model with typed attributes"
      >
        <form onSubmit={handleCreateCustomField} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Business Category *</label>
              <select
                required
                value={newFieldData.business_category_id || ''}
                onChange={e => setNewFieldData({ ...newFieldData, business_category_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#495057] mb-1">Target Entity *</label>
              <select
                required
                value={newFieldData.entity_type || 'product'}
                onChange={e => setNewFieldData({ ...newFieldData, entity_type: e.target.value as CustomFieldDefinition['entity_type'] })}
                className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded"
              >
                <option value="product">Product / SKU</option>
                <option value="customer">Customer / Member</option>
                <option value="sale">Sale Invoice</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Field Label Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Storage Capacity, Organic Certified"
                value={newFieldData.name || ''}
                onChange={e => setNewFieldData({ 
                  ...newFieldData, 
                  name: e.target.value,
                  code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                })}
                className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Field Key Code *</label>
              <input
                type="text"
                required
                placeholder="storage_capacity"
                value={newFieldData.code || ''}
                onChange={e => setNewFieldData({ ...newFieldData, code: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Field Type</label>
              <select
                value={newFieldData.field_type || 'text'}
                onChange={e => setNewFieldData({ ...newFieldData, field_type: e.target.value as CustomFieldDefinition['field_type'] })}
                className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded"
              >
                <option value="text">Text / String</option>
                <option value="number">Integer Number</option>
                <option value="decimal">Decimal Currency/Float</option>
                <option value="select">Dropdown Select</option>
                <option value="boolean">Boolean Checkbox</option>
                <option value="date">Date Picker</option>
                <option value="phone">Phone Number</option>
                <option value="email">Email Address</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#495057] mb-1">Validation</label>
              <label className="flex items-center gap-2 pt-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(newFieldData.is_required)}
                  onChange={e => setNewFieldData({ ...newFieldData, is_required: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-semibold text-[#495057]">Mandatory / Required</span>
              </label>
            </div>
          </div>

          {newFieldData.field_type === 'select' && (
            <div>
              <label className="block font-semibold text-[#495057] mb-1">Dropdown Options (Comma separated)</label>
              <input
                type="text"
                placeholder="Option 1, Option 2, Option 3"
                value={tempOptionsStr}
                onChange={e => setTempOptionsStr(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#dee2e6]">
            <button
              type="button"
              onClick={() => setIsAddFieldModalOpen(false)}
              className="px-4 py-2 text-[#495057] font-semibold hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-xs"
            >
              Save Custom Field Schema
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
