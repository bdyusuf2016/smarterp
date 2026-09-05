import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Coins, 
  RefreshCw, 
  Copy, 
  Check, 
  Receipt, 
  Percent, 
  Plus, 
  Minus, 
  Trash2, 
  Edit3, 
  Printer, 
  Sparkles, 
  FileText, 
  Globe, 
  Wrench, 
  Layers, 
  Bookmark, 
  Phone, 
  User, 
  FolderPlus,
  Save,
  CheckCircle2,
  Search
} from 'lucide-react';
import { Tenant, UserRole } from '../../types';
import { storageService } from '../../services/storageService';
import { Modal } from '../common/Modal';
import { useConfirm } from '../../context/ConfirmationContext';

interface BillingCalculatorViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
}

export interface BillingTemplateItem {
  id: string;
  name: string;
  rate: number;
  unit: string;
  quantity: number;
}

export interface BillingTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  is_preset?: boolean;
  items: BillingTemplateItem[];
}

interface Denomination {
  note: number;
  count: number;
}

const DEFAULT_TEMPLATES: BillingTemplate[] = [
  {
    id: 'tmpl_photocopy',
    name: 'ফটোকপি ও প্রিন্টিং বিলিং (Photocopy & Printing)',
    category: 'ফটোকপি ও প্রিন্ট',
    description: 'A4/Legal ফটোকপি, কালার প্রিন্ট, ফটো প্রিন্ট, লেমিনেটিং ও বাইন্ডিং হিসাব',
    is_preset: true,
    items: [
      { id: 'item_1', name: 'A4 ফটোকপি (ব্ল্যাক অ্যান্ড হোয়াইট)', rate: 3, unit: 'পৃষ্ঠা', quantity: 0 },
      { id: 'item_2', name: 'লিগ্যাল সাইজ ফটোকপি (B&W)', rate: 4, unit: 'পৃষ্ঠা', quantity: 0 },
      { id: 'item_3', name: 'A4 কালার প্রিন্ট (সাধারণ পেপার)', rate: 10, unit: 'পৃষ্ঠা', quantity: 0 },
      { id: 'item_4', name: 'A4 কালার প্রিন্ট (গ্লসি ফটো পেপার)', rate: 25, unit: 'পৃষ্ঠা', quantity: 0 },
      { id: 'item_5', name: 'পাসপোর্ট সাইজ ফটো প্রিন্ট', rate: 20, unit: 'সেট', quantity: 0 },
      { id: 'item_6', name: 'সার্টিফিকেট / পেপার লেমিনেটিং', rate: 25, unit: 'পিস', quantity: 0 },
      { id: 'item_7', name: 'বই / শিট স্পাইরাল বাইন্ডিং', rate: 35, unit: 'কপি', quantity: 0 },
      { id: 'item_8', name: 'স্ট্যাম্প পেপার প্রিন্ট ও টাইপিং', rate: 50, unit: 'পেজ', quantity: 0 },
    ]
  },
  {
    id: 'tmpl_online_services',
    name: 'অনলাইন নাগরিক সেবা ও ফরম ফিলাপ (Online Services)',
    category: 'অনলাইন ডেস্ক',
    description: 'NID, পাসপোর্ট, চাকরির আবেদন, জন্ম নিবন্ধন ও অনলাইন ট্যাক্স ফি',
    is_preset: true,
    items: [
      { id: 'item_os_1', name: 'NID কার্ড অনলাইন কপি / সংশোধন ফরম', rate: 50, unit: 'আবেদন', quantity: 0 },
      { id: 'item_os_2', name: 'ই-পাসপোর্ট অনলাইন আবেদন ফরম', rate: 100, unit: 'আবেদন', quantity: 0 },
      { id: 'item_os_3', name: 'বিশ্ববিদ্যালয় ভর্তি ও চাকরির ফরম ফিলাপ', rate: 100, unit: 'ফরম', quantity: 0 },
      { id: 'item_os_4', name: 'জন্ম নিবন্ধন অনলাইন আবেদন / যাচাই', rate: 50, unit: 'কপি', quantity: 0 },
      { id: 'item_os_5', name: 'ড্রাইভিং লাইসেন্স ও BRTA ফি স্লিপ', rate: 150, unit: 'সেবা', quantity: 0 },
      { id: 'item_os_6', name: 'বিদ্যুৎ, গ্যাস ও পানি বিল পরিশোধ', rate: 10, unit: 'বিল', quantity: 0 },
      { id: 'item_os_7', name: 'ই-টিন তৈরি ও আয়কর রিটার্ন দাখিল', rate: 200, unit: 'ফাইল', quantity: 0 },
      { id: 'item_os_8', name: 'কম্পিউটার বাংলা ও ইংরেজি টাইপিং', rate: 30, unit: 'পৃষ্ঠা', quantity: 0 },
    ]
  },
  {
    id: 'tmpl_mobile_repair',
    name: 'মোবাইল সার্ভিসিং ও রিপেয়ারিং (Mobile Repairs)',
    category: 'টেলিকম ও সার্ভিস',
    description: 'ডিসপ্লে কম্বো, ব্যাটারি, চার্জিং পোর্ট ও সফটওয়্যার সার্ভিস রেট',
    is_preset: true,
    items: [
      { id: 'item_rep_1', name: 'ডিসপ্লে / টাচ স্ক্রিন কম্বো পরিবর্তন', rate: 1500, unit: 'সেট', quantity: 0 },
      { id: 'item_rep_2', name: 'ব্যাটারি প্রতিস্থাপন (অরিজিনাল)', rate: 650, unit: 'পিস', quantity: 0 },
      { id: 'item_rep_3', name: 'চার্জিং পোর্ট / লজিক বোর্ড রিপেয়ার', rate: 250, unit: 'পিস', quantity: 0 },
      { id: 'item_rep_4', name: 'সফটওয়্যার ফ্ল্যাশ ও FRP আনলক', rate: 300, unit: 'সেট', quantity: 0 },
      { id: 'item_rep_5', name: 'প্রিমিয়াম 9D টেম্পার্ড গ্লাস ফিটিং', rate: 120, unit: 'পিস', quantity: 0 },
      { id: 'item_rep_6', name: 'হেডফোন জ্যাক ও লাউডস্পিকার রিপ্লেস', rate: 350, unit: 'পিস', quantity: 0 },
    ]
  }
];

export const BillingCalculatorView: React.FC<BillingCalculatorViewProps> = ({
  activeTenant
}) => {
  const { confirm } = useConfirm();
  const templatesStorageKey = `dokan_v2_calc_templates_${activeTenant.id}`;

  // Templates State
  const [templates, setTemplates] = useState<BillingTemplate[]>(() => {
    try {
      const stored = localStorage.getItem(templatesStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TEMPLATES;
  });

  const saveTemplates = (newTemplates: BillingTemplate[]) => {
    setTemplates(newTemplates);
    try {
      localStorage.setItem(templatesStorageKey, JSON.stringify(newTemplates));
    } catch (e) {
      console.error(e);
    }
  };

  // Active Selected Template & Live Quantities
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'tmpl_photocopy');
  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Active Calculation Line Items (cloned from activeTemplate for calculation)
  const [calcItems, setCalcItems] = useState<BillingTemplateItem[]>(() => {
    return activeTemplate ? activeTemplate.items.map(i => ({ ...i, quantity: 0 })) : [];
  });

  // When active template changes, reset/load calc items
  useEffect(() => {
    if (activeTemplate) {
      setCalcItems(activeTemplate.items.map(i => ({ ...i, quantity: 0 })));
    }
  }, [selectedTemplateId]);

  // Main navigation tab
  const [mainTab, setMainTab] = useState<'template_calc' | 'cash_counter' | 'change_calc'>('template_calc');

  // Cash Denomination State
  const [denominations, setDenominations] = useState<Denomination[]>([
    { note: 1000, count: 0 },
    { note: 500, count: 0 },
    { note: 200, count: 0 },
    { note: 100, count: 0 },
    { note: 50, count: 0 },
    { note: 20, count: 0 },
    { note: 10, count: 0 },
    { note: 5, count: 0 },
    { note: 2, count: 0 },
    { note: 1, count: 0 },
  ]);

  // Quick Change Calculator State
  const [totalBillInput, setTotalBillInput] = useState<string>('750');
  const [receivedCashInput, setReceivedCashInput] = useState<string>('1000');

  // Quick Bill Calculator State
  const [vatPercentInput, setVatPercentInput] = useState<string>('0');
  const [discountAmountInput, setDiscountAmountInput] = useState<string>('0');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Template Builder / Editor Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('কাস্টম বিলিং');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [builderItems, setBuilderItems] = useState<{ id: string; name: string; rate: number; unit: string }[]>([
    { id: 'b_1', name: 'আইটেম ১', rate: 10, unit: 'পিস' },
    { id: 'b_2', name: 'আইটেম ২', rate: 50, unit: 'কপি' }
  ]);

  // Receipt / Memo Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptCustName, setReceiptCustName] = useState('ক্যাশ কাস্টমার');
  const [receiptCustPhone, setReceiptCustPhone] = useState('');

  // -------------------------------------------------------------
  // CALCULATION LOGIC
  // -------------------------------------------------------------
  const handleItemQtyChange = (itemId: string, qty: number) => {
    setCalcItems(calcItems.map(item => 
      item.id === itemId ? { ...item, quantity: Math.max(0, qty) } : item
    ));
  };

  const handleItemRateChange = (itemId: string, rate: number) => {
    setCalcItems(calcItems.map(item => 
      item.id === itemId ? { ...item, rate: Math.max(0, rate) } : item
    ));
  };

  const handleResetCalc = () => {
    setCalcItems(calcItems.map(item => ({ ...item, quantity: 0 })));
    setDiscountAmountInput('0');
    setVatPercentInput('0');
  };

  // Add ad-hoc line item to active calculation
  const handleAddAdHocItem = () => {
    const newItem: BillingTemplateItem = {
      id: `adhoc_${Date.now()}`,
      name: 'নতুন কাস্টম সেবা / চার্জ',
      rate: 50,
      unit: 'পিস',
      quantity: 1
    };
    setCalcItems([...calcItems, newItem]);
  };

  // Subtotal of template calculation
  const templateSubtotal = calcItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const templateVat = (templateSubtotal * (parseFloat(vatPercentInput) || 0)) / 100;
  const templateDiscount = parseFloat(discountAmountInput) || 0;
  const templateGrandTotal = Math.max(0, templateSubtotal + templateVat - templateDiscount);

  // Active non-zero items for receipt
  const billedItems = calcItems.filter(i => i.quantity > 0);

  // Denominations calculation
  const totalDenominationAmount = denominations.reduce((sum, d) => sum + (d.note * (d.count || 0)), 0);
  const totalNotesCount = denominations.reduce((sum, d) => sum + (d.count || 0), 0);

  const handleDenominationChange = (note: number, count: number) => {
    setDenominations(denominations.map(d => 
      d.note === note ? { ...d, count: Math.max(0, count) } : d
    ));
  };

  // Change Calculation
  const billAmount = parseFloat(totalBillInput) || 0;
  const receivedCash = parseFloat(receivedCashInput) || 0;
  const changeAmount = Math.max(0, receivedCash - billAmount);
  const dueAmount = Math.max(0, billAmount - receivedCash);

  const calculateChangeBreakdown = (amount: number) => {
    const notes = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
    let remaining = Math.floor(amount);
    const breakdown: { note: number; count: number }[] = [];

    notes.forEach(n => {
      if (remaining >= n) {
        const count = Math.floor(remaining / n);
        breakdown.push({ note: n, count });
        remaining %= n;
      }
    });
    return breakdown;
  };

  const suggestedChangeNotes = calculateChangeBreakdown(changeAmount);

  // -------------------------------------------------------------
  // TEMPLATE BUILDER ACTIONS
  // -------------------------------------------------------------
  const handleOpenCreateTemplate = () => {
    setEditingTemplateId(null);
    setNewTemplateName('');
    setNewTemplateCategory('কাস্টম সেবা');
    setNewTemplateDesc('');
    setBuilderItems([
      { id: `b_${Date.now()}_1`, name: 'A4 পেজ প্রিন্ট', rate: 5, unit: 'পৃষ্ঠা' },
      { id: `b_${Date.now()}_2`, name: 'ফরম ফিলাপ চার্জ', rate: 50, unit: 'কপি' }
    ]);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tmpl: BillingTemplate) => {
    setEditingTemplateId(tmpl.id);
    setNewTemplateName(tmpl.name);
    setNewTemplateCategory(tmpl.category);
    setNewTemplateDesc(tmpl.description);
    setBuilderItems(tmpl.items.map(i => ({ id: i.id, name: i.name, rate: i.rate, unit: i.unit })));
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const formattedItems: BillingTemplateItem[] = builderItems.map((item, idx) => ({
      id: item.id || `item_${Date.now()}_${idx}`,
      name: item.name.trim() || `আইটেম ${idx + 1}`,
      rate: Number(item.rate) || 0,
      unit: item.unit.trim() || 'পিস',
      quantity: 0
    }));

    if (editingTemplateId) {
      // Update existing
      const updated = templates.map(t => {
        if (t.id === editingTemplateId) {
          return {
            ...t,
            name: newTemplateName.trim(),
            category: newTemplateCategory.trim(),
            description: newTemplateDesc.trim(),
            items: formattedItems
          };
        }
        return t;
      });
      saveTemplates(updated);
    } else {
      // Create new
      const newTmpl: BillingTemplate = {
        id: `tmpl_custom_${Date.now()}`,
        name: newTemplateName.trim(),
        category: newTemplateCategory.trim(),
        description: newTemplateDesc.trim(),
        is_preset: false,
        items: formattedItems
      };
      const updated = [...templates, newTmpl];
      saveTemplates(updated);
      setSelectedTemplateId(newTmpl.id);
    }

    setIsTemplateModalOpen(false);
  };

  const handleDeleteTemplate = async (tmplId: string) => {
    const tmpl = templates.find(t => t.id === tmplId);
    const ok = await confirm({
      title: 'বিলিং টেম্পলেট মুছে ফেলতে চান?',
      message: 'আপনি কি নিশ্চিত যে এই কাস্টম বিলিং টেম্পলেটটি মুছে ফেলতে চান?',
      itemName: tmpl?.name,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      cancelText: 'বাতিল',
      type: 'danger',
      icon: 'trash'
    });
    if (ok) {
      const updated = templates.filter(t => t.id !== tmplId);
      saveTemplates(updated);
      if (selectedTemplateId === tmplId) {
        setSelectedTemplateId(updated[0]?.id || '');
      }
    }
  };

  const handleAddRowInBuilder = () => {
    setBuilderItems([
      ...builderItems,
      { id: `b_${Date.now()}`, name: '', rate: 10, unit: 'পিস' }
    ]);
  };

  const handleRemoveRowInBuilder = (id: string) => {
    if (builderItems.length > 1) {
      setBuilderItems(builderItems.filter(i => i.id !== id));
    }
  };

  const handleCopyTotal = (val: number) => {
    navigator.clipboard.writeText(val.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 select-none font-sans">
      
      {/* ========================================================================= */}
      {/* HEADER BANNER & TEMPLATE ACTIONS                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                বিলিং ও রেট ক্যালকুলেটর (Billing & Rate Calculator)
              </h1>
              <p className="text-[11px] text-slate-500">
                ফটোকপি, ডিজিটাল প্রিন্ট, অনলাইন আবেদন ও কাস্টম টেমপ্লেট বিলিং এবং ক্যাশ ভাংতি ক্যালকুলেটর
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreateTemplate}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ নতুন টেমপ্লেট তৈরি করুন</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setMainTab('template_calc')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            mainTab === 'template_calc'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>টেমপ্লেট বিল ক্যালকুলেটর (ফটোকপি ও কাস্টম রেট)</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('cash_counter')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            mainTab === 'cash_counter'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>নোট গণক ও ক্যাশ ড্রয়ার</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('change_calc')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            mainTab === 'change_calc'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>ক্যাশ ফেরত ও ভাংতি হিসাব</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTERACTIVE TEMPLATE BILL CALCULATOR                                */}
      {/* ========================================================================= */}
      {mainTab === 'template_calc' && (
        <div className="space-y-5">
          
          {/* Template Switcher Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>বিলিং টেমপ্লেট নির্বাচন করুন:</span>
              <span className="text-[11px] text-slate-400 font-normal">মোট {templates.length} টি টেমপ্লেট সক্রিয়</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map(tmpl => {
                const isSelected = tmpl.id === selectedTemplateId;

                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tmpl.category}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditTemplate(tmpl);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                            title="টেমপ্লেট এডিট করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!tmpl.is_preset && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(tmpl.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="টেমপ্লেট মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{tmpl.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{tmpl.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{tmpl.items.length} টি আইটেম রেট</span>
                      {isSelected ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> সক্রিয়
                        </span>
                      ) : (
                        <span className="text-slate-400">সিলেক্ট করুন</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Template Item Calculator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left: Active Line Items Table (8 cols) */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{activeTemplate?.name}</h3>
                  <p className="text-[11px] text-slate-500">পরিমাণ লিখুন বা গুণ করুন, রেট প্রয়োজন অনুযায়ী পরিবর্তনযোগ্য</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddAdHocItem}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ বাড়তি আইটেম</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCalc}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                  >
                    রিসেট
                  </button>
                </div>
              </div>

              {/* Items Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="এই টেমপ্লেটের আইটেম বা রেট দিয়ে খুঁজুন..."
                  value={itemSearchTerm}
                  onChange={e => setItemSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                {itemSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setItemSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {calcItems
                  .filter(item => 
                    item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
                    item.unit.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
                    String(item.rate).includes(itemSearchTerm)
                  )
                  .map(item => {
                    const lineTotal = item.quantity * item.rate;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.quantity > 0 
                            ? 'bg-emerald-50/40 border-emerald-300' 
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {/* Title & Rate */}
                        <div className="flex-1">
                          <div className="font-bold text-xs text-slate-800">{item.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>একক রেট:</span>
                            <div className="inline-flex items-center gap-1 font-mono">
                              <span>৳</span>
                              <input
                                type="number"
                                value={item.rate}
                                onChange={e => handleItemRateChange(item.id, parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900"
                              />
                              <span>/ {item.unit}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controller & Line Total */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleItemQtyChange(item.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={item.quantity === 0 ? '' : item.quantity}
                              placeholder="0"
                              onChange={e => handleItemQtyChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-16 py-1 text-center font-mono font-bold text-xs text-slate-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleItemQtyChange(item.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="w-20 text-right font-mono font-black text-slate-900 text-xs">
                            ৳{lineTotal.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right: Calculation Summary & Bill Actions (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-xl border border-slate-800 space-y-4 sticky top-20">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <span>বিল সামারি (Total Bill)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{billedItems.length} আইটেম সিলেক্টেড</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>সাবটোটাল:</span>
                    <span className="font-mono font-bold text-white text-sm">৳{templateSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">ভ্যাট (%)</label>
                      <input
                        type="number"
                        value={vatPercentInput}
                        onChange={e => setVatPercentInput(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">ছাড় / ডিসকাউন্ট (৳)</label>
                      <input
                        type="number"
                        value={discountAmountInput}
                        onChange={e => setDiscountAmountInput(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Grand Total Big Display */}
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] text-emerald-300 uppercase font-semibold">সর্বমোট প্রদেয় টাকা</div>
                  <div className="text-3xl font-black font-mono text-white mt-0.5">
                    ৳{templateGrandTotal.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsReceiptModalOpen(true)}
                    disabled={templateGrandTotal === 0}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>ক্যাশ মেমো ও রসিদ প্রিন্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyTotal(templateGrandTotal)}
                    disabled={templateGrandTotal === 0}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'মোট টাকা কপি হয়েছে!' : 'মোট টাকা কপি করুন'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CASH DENOMINATION COUNTER                                          */}
      {/* ========================================================================= */}
      {mainTab === 'cash_counter' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">নোট গণনার হিসাব (Cash Denominations)</h3>
                <p className="text-[11px] text-slate-500">প্রতিটি নোটের সংখ্যা লিখুন, ক্যাশ ড্রয়ারের মোট টাকা স্বয়ংক্রিয়ভাবে হিসাব হবে</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDenominations(denominations.map(d => ({ ...d, count: 0 })))}
              className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer"
            >
              ক্লিয়ার করুন
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">নোটের মান</th>
                  <th className="py-2.5 px-3 text-center">সংখ্যা (Pcs)</th>
                  <th className="py-2.5 px-3 text-right">মোট টাকা (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {denominations.map(d => {
                  const sub = d.note * (d.count || 0);

                  return (
                    <tr key={d.note} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-800">
                        <span className={`px-2 py-0.5 rounded-md font-mono text-xs ${
                          d.note >= 500 ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          d.note >= 100 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          ৳{d.note}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={d.count === 0 ? '' : d.count}
                          placeholder="0"
                          onChange={e => handleDenominationChange(d.note, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        />
                      </td>

                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ৳{sub.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-xl flex items-center justify-between shadow-md">
            <div>
              <div className="text-xs text-emerald-200">মোট নোটের সংখ্যা: <b>{totalNotesCount} টি</b></div>
              <div className="text-xs text-emerald-100 font-semibold mt-0.5">ক্যাশ ড্রয়ারের সর্বমোট টাকা</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black font-mono tracking-tight">
                ৳{totalDenominationAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CHANGE CALCULATOR & RETURN                                         */}
      {/* ========================================================================= */}
      {mainTab === 'change_calc' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">ক্যাশ ফেরত ও ভাংতি হিসাব (Change Return)</h3>
              <p className="text-[11px] text-slate-500">গ্রাহকের কাছ থেকে নেওয়া টাকা ও ফেরত দেওয়ার হিসাব</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">মোট বিলের টাকা (৳) *</label>
              <input
                type="number"
                value={totalBillInput}
                onChange={e => setTotalBillInput(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">গ্রাহকের দেওয়া ক্যাশ (৳) *</label>
              <input
                type="number"
                value={receivedCashInput}
                onChange={e => setReceivedCashInput(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            dueAmount > 0 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div>
              <div className="text-xs font-semibold">
                {dueAmount > 0 ? 'বকেয়া / আরও পাওনা:' : 'গ্রাহককে ফেরত দিন (Change Return):'}
              </div>
              <div className="text-2xl font-black font-mono mt-0.5">
                ৳{(dueAmount > 0 ? dueAmount : changeAmount).toFixed(2)}
              </div>
            </div>

            {changeAmount > 0 && (
              <div className="text-right max-w-xs">
                <div className="text-[10px] text-slate-500 font-semibold mb-1">প্রস্তাবিত ভাংতি নোট:</div>
                <div className="flex flex-wrap justify-end gap-1">
                  {suggestedChangeNotes.map(s => (
                    <span key={s.note} className="text-[10px] bg-white border border-emerald-300 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold shadow-2xs">
                      ৳{s.note} × {s.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEMPLATE BUILDER & EDIT MODAL                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title={editingTemplateId ? "বিলিং টেমপ্লেট সম্পাদনা করুন" : "নতুন কাস্টম বিলিং টেমপ্লেট তৈরি করুন"}
        subtitle="যেকোনো সার্ভিস বা ব্যবসার জন্য নির্দিষ্ট রেট কার্ড ও আইটেম লিস্ট তৈরি করুন"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveTemplateForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">টেমপ্লেটের নাম *</label>
              <input
                type="text"
                required
                placeholder="যেমন: ফটোকপি ও প্রিন্টিং বিল"
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি ট্যাগ</label>
              <input
                type="text"
                placeholder="যেমন: ফটোকপি, সার্ভিসিং, স্টেশনারি"
                value={newTemplateCategory}
                onChange={e => setNewTemplateCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">সংক্ষিপ্ত বিবরণ</label>
            <input
              type="text"
              placeholder="এই টেমপ্লেটে কী কী হিসেব করা যাবে..."
              value={newTemplateDesc}
              onChange={e => setNewTemplateDesc(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          {/* Dynamic Builder Items Table */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">টেমপ্লেটের আইটেম ও রেট তালিকা ({builderItems.length} টি)</span>
              <button
                type="button"
                onClick={handleAddRowInBuilder}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ আইটেম যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {builderItems.map((bItem, idx) => (
                <div key={bItem.id || idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      placeholder="আইটেমের নাম (যেমন: A4 ফটোকপি)"
                      value={bItem.name}
                      onChange={e => {
                        const val = e.target.value;
                        setBuilderItems(builderItems.map((it, i) => i === idx ? { ...it, name: val } : it));
                      }}
                      className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 text-xs"
                    />
                  </div>

                  <div className="w-24">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-mono text-xs">৳</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={bItem.rate}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setBuilderItems(builderItems.map((it, i) => i === idx ? { ...it, rate: val } : it));
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="w-20">
                    <input
                      type="text"
                      placeholder="একক (পৃষ্ঠা/পিস)"
                      value={bItem.unit}
                      onChange={e => {
                        const val = e.target.value;
                        setBuilderItems(builderItems.map((it, i) => i === idx ? { ...it, unit: val } : it));
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRowInBuilder(bItem.id)}
                    disabled={builderItems.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(false)}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>টেমপ্লেট সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* CASH MEMO & RECEIPT PRINT MODAL                                           */}
      {/* ========================================================================= */}
      {isReceiptModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsReceiptModalOpen(false)}
          title="ক্যাশ মেমো ও রসিদ (Cash Memo Slip)"
          subtitle={`${activeTemplate?.name} থেকে তৈরি বিল`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">গ্রাহকের নাম</label>
                <input
                  type="text"
                  value={receiptCustName}
                  onChange={e => setReceiptCustName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  placeholder="017xxxxxxxx"
                  value={receiptCustPhone}
                  onChange={e => setReceiptCustPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
            </div>

            {/* Slip Paper Preview */}
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl font-mono space-y-2 text-center">
              <div className="font-extrabold text-sm uppercase">{activeTenant.name}</div>
              <div className="text-[10px] text-slate-500">{activeTenant.address}</div>
              <div className="border-t border-b border-dashed border-slate-400 py-1 my-1 font-bold text-xs">
                CASH MEMO: {activeTemplate?.name}
              </div>

              <div className="text-left space-y-1 text-[11px]">
                <div>গ্রাহক: <b>{receiptCustName}</b> {receiptCustPhone && `(${receiptCustPhone})`}</div>
                <div>তারিখ: {new Date().toLocaleString('bn-BD')}</div>
              </div>

              {/* Items Breakdown Table */}
              <div className="border-t border-dashed border-slate-300 pt-2 text-left">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="py-1">বিবরণ</th>
                      <th className="py-1 text-center">পরিমাণ</th>
                      <th className="py-1 text-right">টাকা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {billedItems.map(item => (
                      <tr key={item.id}>
                        <td className="py-1">{item.name}</td>
                        <td className="py-1 text-center">{item.quantity} {item.unit}</td>
                        <td className="py-1 text-right font-bold">৳{(item.quantity * item.rate).toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2 text-right space-y-0.5 text-[11px]">
                <div>সাবটোটাল: <b>৳{templateSubtotal.toFixed(2)}</b></div>
                {templateVat > 0 && <div>ভ্যাট ({vatPercentInput}%): <b>+৳{templateVat.toFixed(2)}</b></div>}
                {templateDiscount > 0 && <div>ছাড়: <b>-৳{templateDiscount.toFixed(2)}</b></div>}
                <div className="text-sm font-black border-t border-slate-400 pt-1 text-slate-900">
                  সর্বমোট: ৳{templateGrandTotal.toFixed(2)}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-300">
                ধন্যবাদ, আবার আসবেন!
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
