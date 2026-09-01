import React, { useState } from 'react';
import { 
  Printer, 
  Globe, 
  Plus, 
  Search, 
  Trash2,
  Edit3,
  Save,
  Tag,
  Coins,
  Layers,
  Sparkles,
  CheckCircle2,
  ShoppingCart
} from 'lucide-react';
import { Tenant, UserRole } from '../../types';
import { Modal } from '../common/Modal';

interface DigitalServicesViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
  onNavigateToPOS?: () => void;
}

export interface PhotocopyRateItem {
  id: string;
  title: string;
  rate: number;
  unit: string;
  category: 'PHOTOCOPY_PRINT' | 'PHOTO_LAMINATION' | 'TYPING_DOCS';
  description: string;
  is_active: boolean;
}

export interface OnlineServiceItem {
  id: string;
  title: string;
  category: 'ONLINE_APPLICATION' | 'NID_PASSPORT' | 'UTILITY_BILL' | 'TYPING_DOCS';
  rate: number;
  description: string;
  is_active: boolean;
}

export const DEFAULT_PHOTOCOPY_RATES: PhotocopyRateItem[] = [
  { id: 'rate_pc_1', title: 'A4 সাইজ B&W ফটোকপি', rate: 3, unit: 'পৃষ্ঠা', category: 'PHOTOCOPY_PRINT', description: 'একক বা উভয় পৃষ্ঠা সাধারণ 70/80 GSM পেপার', is_active: true },
  { id: 'rate_pc_2', title: 'লিগ্যাল সাইজ ফটোকপি (Legal B&W)', rate: 4, unit: 'পৃষ্ঠা', category: 'PHOTOCOPY_PRINT', description: 'দলিল, কোর্ট পেপার ও লিগ্যাল সাইজ ফটোকপি', is_active: true },
  { id: 'rate_pc_3', title: 'A4 সাইজ কালার প্রিন্ট (Color Print)', rate: 10, unit: 'পৃষ্ঠা', category: 'PHOTOCOPY_PRINT', description: 'সাধারণ পেপারে রঙিন ডকুমেন্টস প্রিন্টিং', is_active: true },
  { id: 'rate_pc_4', title: 'গ্লসি ফটো পেপার প্রিন্ট (A4 Glossy)', rate: 25, unit: 'পৃষ্ঠা', category: 'PHOTO_LAMINATION', description: 'হাই-কোয়ালিটি গ্লসি পেপার রঙিন প্রিন্ট', is_active: true },
  { id: 'rate_pc_5', title: 'পাসপোর্ট সাইজ ফটো প্রিন্ট (৪ কপি)', rate: 20, unit: 'সেট', category: 'PHOTO_LAMINATION', description: 'ল্যাব কোয়ালিটি কালার পাসপোর্ট ছবি', is_active: true },
  { id: 'rate_pc_6', title: 'সার্টিফিকেট / পেপার লেমিনেটিং', rate: 25, unit: 'পিস', category: 'PHOTO_LAMINATION', description: '100 Micron ওয়াটারপ্রুফ প্লাস্টিক লেমিনেশন', is_active: true },
  { id: 'rate_pc_7', title: 'বই / শিট স্পাইরাল বাইন্ডিং', rate: 35, unit: 'কপি', category: 'PHOTOCOPY_PRINT', description: 'রিং বাইন্ডিং ও ট্রান্সপারেন্ট কভার শিট', is_active: true },
  { id: 'rate_pc_8', title: 'স্ট্যাম্প পেপার প্রিন্ট ও টাইপিং', rate: 50, unit: 'পেজ', category: 'TYPING_DOCS', description: 'হলফনামা, চুক্তিপত্র ও এফিডেভিট টাইপিং', is_active: true },
];

export const DEFAULT_ONLINE_SERVICES: OnlineServiceItem[] = [
  { id: 'rate_os_1', title: 'NID কার্ড অনলাইন কপি / সংশোধন', category: 'NID_PASSPORT', rate: 50, description: 'জাতীয় পরিচয়পত্র ডাউনলোড, রি-ইস্যু ও তথ্য সংশোধন ফরম', is_active: true },
  { id: 'rate_os_2', title: 'ই-পাসপোর্ট অনলাইন আবেদন ফরম', category: 'NID_PASSPORT', rate: 100, description: 'নতুন পাসপোর্ট আবেদন, রিনিউ ও পেমেন্ট চালান তৈরি', is_active: true },
  { id: 'rate_os_3', title: 'অনলাইন ভর্তি ও চাকরির আবেদন', category: 'ONLINE_APPLICATION', rate: 100, description: 'বিশ্ববিদ্যালয়/স্কুল ভর্তি এবং সরকারি/বেসরকারি চাকরির ফরম ফিলাপ', is_active: true },
  { id: 'rate_os_4', title: 'জন্ম নিবন্ধন অনলাইন আবেদন / যাচাই', category: 'ONLINE_APPLICATION', rate: 50, description: 'নতুন জন্ম সনদ আবেদন, সংশোধন ও ইংরেজি ভার্সন', is_active: true },
  { id: 'rate_os_5', title: 'ড্রাইভিং লাইসেন্স ও BRTA ফি প্রদান', category: 'ONLINE_APPLICATION', rate: 150, description: 'লার্নার লাইসেন্স আবেদন ও ফি পেমেন্ট স্লিপ', is_active: true },
  { id: 'rate_os_6', title: 'ই-ট্যাক্স রিটার্ন দাখিল (E-TIN / Return)', category: 'ONLINE_APPLICATION', rate: 200, description: 'অনলাইন আয়কর রিটার্ন জমা ও একনলেজমেন্ট রসিদ', is_active: true },
  { id: 'rate_os_7', title: 'বিদ্যুৎ, গ্যাস ও পানি বিল পরিশোধ', category: 'UTILITY_BILL', rate: 10, description: 'পল্লী বিদ্যুৎ, ডেসকো, নেসকো, তিতাস ও ওয়াসা বিল কালেকশন', is_active: true },
  { id: 'rate_os_8', title: 'কম্পিউটার টাইপিং ও সিভি তৈরি', category: 'TYPING_DOCS', rate: 30, description: 'বাংলা ও ইংরেজি ডকুমেন্ট কম্পোজ, সিভি তৈরি ও প্রিন্ট', is_active: true },
  { id: 'rate_os_9', title: 'খতিয়ান / পরচা ও ই-নামজারি আবেদন', category: 'ONLINE_APPLICATION', rate: 150, description: 'ভূমি মন্ত্রণালয় আরএস/সিএস পরচা ও নামজারি চালান', is_active: true },
];

export const DigitalServicesView: React.FC<DigitalServicesViewProps> = ({
  activeTenant,
  onNavigateToPOS
}) => {
  const storagePhotocopyRatesKey = `dokan_v2_photocopy_rates_${activeTenant.id}`;
  const storageOnlineServicesKey = `dokan_v2_online_services_${activeTenant.id}`;

  // Photocopy Rates State
  const [photocopyRates, setPhotocopyRates] = useState<PhotocopyRateItem[]>(() => {
    try {
      const stored = localStorage.getItem(storagePhotocopyRatesKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PHOTOCOPY_RATES;
  });

  const savePhotocopyRates = (updated: PhotocopyRateItem[]) => {
    setPhotocopyRates(updated);
    try {
      localStorage.setItem(storagePhotocopyRatesKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Online Services Rates State
  const [onlineServices, setOnlineServices] = useState<OnlineServiceItem[]>(() => {
    try {
      const stored = localStorage.getItem(storageOnlineServicesKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ONLINE_SERVICES;
  });

  const saveOnlineServices = (updated: OnlineServiceItem[]) => {
    setOnlineServices(updated);
    try {
      localStorage.setItem(storageOnlineServicesKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Unified Service Catalog list
  const allServices = [
    ...photocopyRates.map(p => ({
      id: p.id,
      code: `PC-${p.id.slice(-4).toUpperCase()}`,
      title: p.title,
      type: 'PHOTOCOPY' as const,
      category: p.category,
      categoryLabel: p.category === 'PHOTO_LAMINATION' ? 'ফটো ও লেমিনেশন' : p.category === 'TYPING_DOCS' ? 'টাইপিং ও কম্পোজ' : 'ফটোকপি ও প্রিন্ট',
      unit: p.unit,
      rate: p.rate,
      description: p.description,
      is_active: p.is_active !== false
    })),
    ...onlineServices.map(o => ({
      id: o.id,
      code: `OS-${o.id.slice(-4).toUpperCase()}`,
      title: o.title,
      type: 'ONLINE' as const,
      category: o.category,
      categoryLabel: o.category === 'NID_PASSPORT' ? 'NID ও পাসপোর্ট' : o.category === 'UTILITY_BILL' ? 'বিল পেমেন্ট' : 'অনলাইন আবেদন',
      unit: 'সেবা',
      rate: o.rate,
      description: o.description,
      is_active: o.is_active !== false
    }))
  ];

  const filteredServices = allServices.filter(s => {
    const matchesSearch = 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(s.rate).includes(searchTerm);
    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'PHOTOCOPY' | 'ONLINE'>('PHOTOCOPY');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'PHOTOCOPY_PRINT' | 'PHOTO_LAMINATION' | 'NID_PASSPORT' | 'ONLINE_APPLICATION' | 'UTILITY_BILL' | 'TYPING_DOCS'>('PHOTOCOPY_PRINT');
  const [formRate, setFormRate] = useState<number>(5);
  const [formUnit, setFormUnit] = useState('পৃষ্ঠা');
  const [formDesc, setFormDesc] = useState('');

  const handleOpenAdd = (type: 'PHOTOCOPY' | 'ONLINE') => {
    setModalType(type);
    setEditingId(null);
    setFormTitle('');
    if (type === 'PHOTOCOPY') {
      setFormCategory('PHOTOCOPY_PRINT');
      setFormRate(5);
      setFormUnit('পৃষ্ঠা');
    } else {
      setFormCategory('ONLINE_APPLICATION');
      setFormRate(100);
      setFormUnit('আবেদন');
    }
    setFormDesc('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: typeof allServices[0]) => {
    setModalType(item.type);
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormRate(item.rate);
    setFormUnit(item.unit);
    setFormDesc(item.description);
    setIsModalOpen(true);
  };

  const handleDelete = (item: typeof allServices[0]) => {
    if (window.confirm(`আপনি কি "${item.title}" সেবার রেটটি মুছে ফেলতে চান?`)) {
      if (item.type === 'PHOTOCOPY') {
        savePhotocopyRates(photocopyRates.filter(r => r.id !== item.id));
      } else {
        saveOnlineServices(onlineServices.filter(s => s.id !== item.id));
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (modalType === 'PHOTOCOPY') {
      if (editingId) {
        const updated = photocopyRates.map(r => r.id === editingId ? {
          ...r,
          title: formTitle.trim(),
          category: (formCategory as PhotocopyRateItem['category']) || 'PHOTOCOPY_PRINT',
          rate: Number(formRate) || 0,
          unit: formUnit.trim() || 'পৃষ্ঠা',
          description: formDesc.trim()
        } : r);
        savePhotocopyRates(updated);
      } else {
        const newItem: PhotocopyRateItem = {
          id: `rate_pc_${Date.now()}`,
          title: formTitle.trim(),
          category: (formCategory as PhotocopyRateItem['category']) || 'PHOTOCOPY_PRINT',
          rate: Number(formRate) || 0,
          unit: formUnit.trim() || 'পৃষ্ঠা',
          description: formDesc.trim(),
          is_active: true
        };
        savePhotocopyRates([...photocopyRates, newItem]);
      }
    } else {
      if (editingId) {
        const updated = onlineServices.map(s => s.id === editingId ? {
          ...s,
          title: formTitle.trim(),
          category: (formCategory as OnlineServiceItem['category']) || 'ONLINE_APPLICATION',
          rate: Number(formRate) || 0,
          description: formDesc.trim()
        } : s);
        saveOnlineServices(updated);
      } else {
        const newItem: OnlineServiceItem = {
          id: `rate_os_${Date.now()}`,
          title: formTitle.trim(),
          category: (formCategory as OnlineServiceItem['category']) || 'ONLINE_APPLICATION',
          rate: Number(formRate) || 0,
          description: formDesc.trim(),
          is_active: true
        };
        saveOnlineServices([...onlineServices, newItem]);
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 pb-12 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                ডিজিটাল সেবা ও মূল্যহার তালিকা (Service Catalog & Rate Cards)
              </h1>
              <p className="text-[11px] text-slate-500">
                ফটোকপি, কালার প্রিন্টিং, লেমিনেটিং ও অনলাইন নাগরিক সেবার মূল্য তালিকা (স্টকের মতো কাস্টমাইজ করুন, সরাসরি POS কুইক বিলিং-এ যুক্ত হবে)
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAdd('PHOTOCOPY')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>+ নতুন ফটোকপি/প্রিন্ট রেট</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('ONLINE')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
          >
            <Globe className="w-4 h-4" />
            <span>+ নতুন অনলাইন সেবা ফি</span>
          </button>
        </div>
      </div>

      {/* Info notice bar */}
      <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            এখানে সংরক্ষিত সকল ফটোকপি রেট ও অনলাইন নাগরিক সেবা স্বয়ংক্রিয়ভাবে <b>"POS কুইক বিলিং"</b> ক্যাটালগে চলে যাবে। কাস্টমারকে সাধারণ পণ্যের সাথে একই মেমোতে বিল করা যাবে।
          </span>
        </div>

        {onNavigateToPOS && (
          <button
            type="button"
            onClick={onNavigateToPOS}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>POS কুইক বিলিং-এ যান</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="সেবার নাম, কোড, পেপার সাইজ বা রেট দিয়ে খুঁজুন (যেমন: A4, কালার, ছবি, NID, পাসপোর্ট, বিদ্যুৎ বিল)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: `সকল সেবা (${allServices.length})` },
            { id: 'PHOTOCOPY_PRINT', label: `ফটোকপি ও প্রিন্ট (${allServices.filter(s => s.category === 'PHOTOCOPY_PRINT').length})` },
            { id: 'PHOTO_LAMINATION', label: `ফটো ও লেমিনেশন (${allServices.filter(s => s.category === 'PHOTO_LAMINATION').length})` },
            { id: 'NID_PASSPORT', label: `NID ও পাসপোর্ট (${allServices.filter(s => s.category === 'NID_PASSPORT').length})` },
            { id: 'ONLINE_APPLICATION', label: `অনলাইন আবেদন (${allServices.filter(s => s.category === 'ONLINE_APPLICATION').length})` },
            { id: 'UTILITY_BILL', label: `বিল পেমেন্ট (${allServices.filter(s => s.category === 'UTILITY_BILL').length})` },
            { id: 'TYPING_DOCS', label: `টাইপিং ও কম্পোজ (${allServices.filter(s => s.category === 'TYPING_DOCS').length})` },
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredServices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Tag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">কোনো সেবা রেকর্ড পাওয়া যায়নি</p>
            <p className="text-[11px] text-slate-400 mt-0.5">নতুন সেবা রেট যোগ করতে উপরের বাটনে চাপুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">কোড</th>
                  <th className="py-3 px-4">সেবার নাম</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4">সংক্ষিপ্ত বিবরণ</th>
                  <th className="py-3 px-4 text-center">পরিমাপের একক</th>
                  <th className="py-3 px-4 text-right">নির্ধারিত রেট (৳)</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredServices.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 text-[11px]">
                      {item.code}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.title}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        item.type === 'PHOTOCOPY' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {item.categoryLabel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                      {item.description || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                      {item.unit}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                      ৳{item.rate.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        সক্রিয় (POS Sync)
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT MODAL                                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "সেবা ও মূল্যহার সম্পাদনা করুন (Edit Rate)" : "নতুন সেবা ও মূল্যহার যোগ করুন (Add Service Rate)"}
        subtitle={modalType === 'PHOTOCOPY' ? "ফটোকপি ও প্রিন্টিং আইটেম ও রেট কনফিগারেশন" : "অনলাইন নাগরিক সেবা ও ফি নির্ধারণ"}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">সেবার নাম / বিবরণ *</label>
            <input
              type="text"
              required
              placeholder="যেমন: A4 ফটোকপি (B&W) বা ই-পাসপোর্ট ফরম ফিলাপ"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">নির্ধারিত রেট / ফি (৳) *</label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={formRate}
                onChange={e => setFormRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm text-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">পরিমাপের একক (Unit) *</label>
              <input
                type="text"
                required
                placeholder="পৃষ্ঠা / কপি / পিস / সেট / আবেদন"
                value={formUnit}
                onChange={e => setFormUnit(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি</label>
            <select
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as typeof formCategory)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
            >
              <option value="PHOTOCOPY_PRINT">ফটোকপি ও প্রিন্ট (Photocopy & Print)</option>
              <option value="PHOTO_LAMINATION">ফটো ও লেমিনেশন (Photo & Lamination)</option>
              <option value="NID_PASSPORT">NID ও পাসপোর্ট সেবা</option>
              <option value="ONLINE_APPLICATION">অনলাইন আবেদন / ফরম ফিলাপ</option>
              <option value="UTILITY_BILL">ইউটিলিটি বিল পেমেন্ট</option>
              <option value="TYPING_DOCS">টাইপিং ও কম্পোজ</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">সংক্ষিপ্ত বিবরণ / নোট</label>
            <textarea
              rows={2}
              placeholder="কাগজের জিএসএম (GSM) বা সেবার বিশেষ নির্দেশিকা..."
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
