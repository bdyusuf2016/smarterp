import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Printer, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Receipt,
  ArrowDownRight,
  TrendingDown,
  Tag,
  Check
} from 'lucide-react';
import { Tenant, UserRole, Supplier, AccountingEntry } from '../../types';
import { storageService } from '../../services/storageService';
import { Modal } from '../common/Modal';
import { printReportDocument } from '../../shared/utils/printReceipt';

interface SuppliersViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ activeTenant }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => storageService.getSuppliers(activeTenant.id));
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>(() => storageService.getAccounting(activeTenant.id));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState<'all' | 'due' | 'clear'>('all');

  const reloadData = () => {
    setSuppliers(storageService.getSuppliers(activeTenant.id));
    setAccountingEntries(storageService.getAccounting(activeTenant.id));
  };

  // Modals State
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierFormData, setSupplierFormData] = useState<Partial<Supplier>>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    balance_payable: 0,
    category_tags: []
  });

  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('ক্যাশ ড্রয়ার / নগদ');
  const [payRef, setPayRef] = useState('');
  const [payNote, setPayNote] = useState('');

  // Purchase Bill Modal State
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [selectedSupplierForBill, setSelectedSupplierForBill] = useState<Supplier | null>(null);
  const [billInvoiceNo, setBillInvoiceNo] = useState('');
  const [billTotalAmount, setBillTotalAmount] = useState<number>(0);
  const [billPaidAmount, setBillPaidAmount] = useState<number>(0);
  const [billNote, setBillNote] = useState('');

  // Ledger History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedSupplierHistory, setSelectedSupplierHistory] = useState<Supplier | null>(null);

  // Financial Metrics
  const totalBalancePayable = suppliers.reduce((sum, s) => sum + (s.balance_payable || 0), 0);
  const dueSuppliersCount = suppliers.filter(s => (s.balance_payable || 0) > 0).length;
  const purchasePaymentEntries = accountingEntries.filter(a => a.reference_type === 'PURCHASE');
  const totalPaidToSuppliers = purchasePaymentEntries
    .filter(a => a.title.includes('পরিশোধ'))
    .reduce((sum, a) => sum + a.amount, 0);

  // Handlers: Save Supplier
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormData.name?.trim()) return;

    const supplier: Supplier = {
      id: editingSupplier?.id || `sup_${Date.now()}`,
      tenant_id: activeTenant.id,
      name: supplierFormData.name.trim(),
      contact_person: supplierFormData.contact_person?.trim() || '',
      phone: supplierFormData.phone?.trim() || '',
      email: supplierFormData.email?.trim() || '',
      address: supplierFormData.address?.trim() || '',
      balance_payable: Number(supplierFormData.balance_payable) || 0,
      category_tags: supplierFormData.category_tags || ['সাধারণ সাপ্লায়ার']
    };

    storageService.saveSupplier(supplier);
    reloadData();
    setIsAddSupplierOpen(false);
    setEditingSupplier(null);
    setSupplierFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      balance_payable: 0,
      category_tags: []
    });
  };

  // Handlers: Delete Supplier
  const handleDeleteSupplier = (id: string) => {
    if (window.confirm('আপনি কি এই সাপ্লায়ারের সম্পূর্ণ তথ্য মুছে ফেলতে চান?')) {
      storageService.deleteSupplier(id);
      reloadData();
    }
  };

  // Handlers: Record Payment
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPay || payAmount <= 0) {
      alert('পরিশোধের পরিমাণ সঠিক দিন!');
      return;
    }

    storageService.recordSupplierPayment(
      activeTenant.id,
      selectedSupplierForPay.id,
      payAmount,
      payMethod,
      payRef,
      payNote
    );

    reloadData();
    setIsPaymentOpen(false);
    setSelectedSupplierForPay(null);
    setPayAmount(0);
    setPayRef('');
    setPayNote('');
  };

  // Handlers: Record Purchase Bill
  const handleConfirmPurchaseBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForBill || billTotalAmount <= 0) {
      alert('চালানের মোট বিলের পরিমাণ দিন!');
      return;
    }

    storageService.recordSupplierPurchase(
      activeTenant.id,
      selectedSupplierForBill.id,
      billInvoiceNo || `PUR-${Date.now().toString().slice(-5)}`,
      billTotalAmount,
      billPaidAmount,
      billNote
    );

    reloadData();
    setIsBillOpen(false);
    setSelectedSupplierForBill(null);
    setBillInvoiceNo('');
    setBillTotalAmount(0);
    setBillPaidAmount(0);
    setBillNote('');
  };

  // Print Supplier Statement / Ledger
  const handlePrintSupplierStatement = (sup: Supplier) => {
    const history = accountingEntries.filter(
      a => a.reference_type === 'PURCHASE' && a.title.includes(sup.name)
    );

    printReportDocument({
      shopName: activeTenant.name,
      shopAddress: activeTenant.address || 'বাংলাদেশ',
      shopPhone: activeTenant.phone || '',
      reportTitle: `সাপ্লায়ার দেনা-পাওনা খতিয়ান (Supplier Ledger Statement)`,
      periodText: 'সম্পূর্ণ লেনদেন ইতিহাস',
      orientation: 'portrait',
      kpis: [
        { label: 'সাপ্লায়ার / প্রতিষ্ঠান', value: sup.name, color: '#0f172a' },
        { label: 'যোগাযোগের নম্বর', value: sup.phone || 'N/A', color: '#2563eb' },
        { label: 'বর্তমান বকেয়া দেনা', value: `৳ ${(sup.balance_payable || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#dc2626' },
      ],
      columns: ['ট্র্যাকিং / রেফারেন্স', 'লেনদেনের বিবরণ', 'হিসাব খাত', 'তারিখ', 'টাকার পরিমাণ (৳)'],
      columnAlignments: ['left', 'left', 'left', 'center', 'right'],
      rows: history.map(h => [
        h.reference_id,
        h.title,
        h.credit_account,
        new Date(h.created_at).toLocaleDateString('en-GB'),
        `৳ ${h.amount.toFixed(2)}`
      ]),
      summaryRow: ['বর্তমান অবশিষ্ট বকেয়া প্রদেয়', '-', '-', '-', `৳ ${(sup.balance_payable || 0).toFixed(2)}`]
    });
  };

  return (
    <div className="space-y-4 pb-12 text-xs">
      {/* Header & KPI Summary */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            <span>সাপ্লায়ার বিল পেমেন্ট ও পাওনাদার খাতা (Supplier Payables Ledger)</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            পণ্য সরবরাহকারী ডিস্ট্রিবিউটর, পাইকারি ভেন্ডরদের ক্রয় চালান, বিল পেমেন্ট ও বকেয়া ব্যবস্থাপনা
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingSupplier(null);
            setSupplierFormData({
              name: '',
              contact_person: '',
              phone: '',
              email: '',
              address: '',
              balance_payable: 0,
              category_tags: ['ডিস্ট্রিবিউটর']
            });
            setIsAddSupplierOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন সাপ্লায়ার যুক্ত করুন</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">মোট সক্রিয় সাপ্লায়ার</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">{suppliers.length} টি</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ডিস্ট্রিবিউটর ও পাইকারি ভেন্ডর</div>
        </div>

        <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">মোট বকেয়া দেনা (Payable)</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-700">
            ৳{totalBalancePayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-rose-600 font-bold mt-0.5">{dueSuppliersCount} জন সাপ্লায়ারের বকেয়া পাওনা</div>
        </div>

        <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">মোট পরিশোধিত বিল</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">
            ৳{totalPaidToSuppliers.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">সাপ্লায়ারদের বিল পরিশোধ খতিয়ান</div>
        </div>

        <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">মোট চালান লেনদেন</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700">{purchasePaymentEntries.length} টি</div>
          <div className="text-[10px] text-blue-600 mt-0.5">ক্রয় চালান ও পরিশোধ ভাউচার</div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="সাপ্লায়ারের নাম, যোগাযোগের ব্যক্তি বা ফোন নম্বর দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-semibold text-xs">
          <button
            type="button"
            onClick={() => setFilterDueOnly('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterDueOnly === 'all' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সকল সাপ্লায়ার ({suppliers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterDueOnly('due')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterDueOnly === 'due' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            বকেয়া দেনাদার ({dueSuppliersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterDueOnly('clear')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterDueOnly === 'clear' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            পরিশোধিত / ক্লিয়ার
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5">সাপ্লায়ার / কোম্পানির নাম</th>
                <th className="py-3 px-3.5">যোগাযোগের ব্যক্তি ও ফোন</th>
                <th className="py-3 px-3.5">ঠিকানা</th>
                <th className="py-3 px-3.5">ক্যাটেগরি ট্যাগ</th>
                <th className="py-3 px-3.5 text-right">বর্তমান বকেয়া দেনা (৳)</th>
                <th className="py-3 px-3.5 text-right">অ্যাকশন ও লেনদেন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers
                .filter(s => {
                  const matchSearch = 
                    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.phone?.includes(searchTerm) ||
                    s.address?.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  const matchFilter = 
                    filterDueOnly === 'all' || 
                    (filterDueOnly === 'due' && (s.balance_payable || 0) > 0) ||
                    (filterDueOnly === 'clear' && (s.balance_payable || 0) <= 0);

                  return matchSearch && matchFilter;
                })
                .map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{sup.name}</span>
                      </div>
                      {sup.email && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5" />
                          <span>{sup.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-800">{sup.contact_person || 'অফিস'}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{sup.phone || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate">
                      {sup.address || 'বাংলাদেশ'}
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(sup.category_tags || ['সাধারণ']).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono font-bold">
                      {(sup.balance_payable || 0) > 0 ? (
                        <span className="text-rose-700 text-sm">৳{sup.balance_payable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      ) : (
                        <span className="text-emerald-700 text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">✓ পরিশোধিত</span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Pay Bill Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupplierForPay(sup);
                            setPayAmount(sup.balance_payable || 0);
                            setIsPaymentOpen(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer transition-all flex items-center gap-1"
                          title="বিল পরিশোধ করুন"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>বিল পরিশোধ</span>
                        </button>

                        {/* Add Purchase Bill */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupplierForBill(sup);
                            setBillInvoiceNo(`INV-P-${Date.now().toString().slice(-4)}`);
                            setIsBillOpen(true);
                          }}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] cursor-pointer transition-all flex items-center gap-1"
                          title="নতুন পণ্য চালান এন্ট্রি"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>+ চালান</span>
                        </button>

                        {/* Print Statement */}
                        <button
                          type="button"
                          onClick={() => handlePrintSupplierStatement(sup)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                          title="সাপ্লায়ার খতিয়ান প্রিন্ট"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSupplier(sup);
                            setSupplierFormData({
                              name: sup.name,
                              contact_person: sup.contact_person,
                              phone: sup.phone,
                              email: sup.email,
                              address: sup.address,
                              balance_payable: sup.balance_payable,
                              category_tags: sup.category_tags
                            });
                            setIsAddSupplierOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                          title="এডিট করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(sup.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    কোনো সাপ্লায়ারের তথ্য নেই। "+ নতুন সাপ্লায়ার যুক্ত করুন" বাটনে ক্লিক করে ভেন্ডর যোগ করুন।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SUPPLIER                                                */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        title={editingSupplier ? 'সাপ্লায়ার তথ্য পরিবর্তন / এডিট' : 'নতুন সাপ্লায়ার / ভেন্ডর রেজিস্ট্রেশন'}
        subtitle="পণ্য সরবরাহকারী প্রতিষ্ঠানের নাম, যোগাযোগের ঠিকানা ও প্রাথমিক বকেয়া"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">সাপ্লায়ার / কোম্পানির নাম *</label>
              <input
                type="text"
                required
                placeholder="যেমন: ইউনিক ডিস্ট্রিবিউশন লিঃ"
                value={supplierFormData.name || ''}
                onChange={e => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">যোগাযোগের প্রতিনিধি / ব্যক্তি</label>
              <input
                type="text"
                placeholder="যেমন: মোঃ রাশেদ চৌধুরী"
                value={supplierFormData.contact_person || ''}
                onChange={e => setSupplierFormData({ ...supplierFormData, contact_person: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
              <input
                type="tel"
                placeholder="017XXXXXXXX"
                value={supplierFormData.phone || ''}
                onChange={e => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ইমেইল ঠিকানা (ঐচ্ছিক)</label>
              <input
                type="email"
                placeholder="sales@company.com"
                value={supplierFormData.email || ''}
                onChange={e => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">অফিস / গুদাম ঠিকানা</label>
            <input
              type="text"
              placeholder="যেমন: মতিঝিল বা গুলশান, ঢাকা"
              value={supplierFormData.address || ''}
              onChange={e => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">পূর্বের প্রারম্ভিক বকেয়া পাওনা (৳)</label>
              <input
                type="number"
                value={supplierFormData.balance_payable || 0}
                onChange={e => setSupplierFormData({ ...supplierFormData, balance_payable: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-rose-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ক্যাটেগরি ট্যাগ (কমা দিয়ে লিখুন)</label>
              <input
                type="text"
                placeholder="যেমন: মোবাইল ডিস্ট্রিবিউটর, স্টেশনারি"
                value={supplierFormData.category_tags?.join(', ') || ''}
                onChange={e => setSupplierFormData({ 
                  ...supplierFormData, 
                  category_tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddSupplierOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>সাপ্লায়ার সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: PAY SUPPLIER BILL                                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title="সাপ্লায়ার বিল পরিশোধ (Pay Supplier Bill)"
        subtitle={`সাপ্লায়ার: ${selectedSupplierForPay?.name || ''} • বর্তমান বকেয়া: ৳${(selectedSupplierForPay?.balance_payable || 0).toLocaleString()}`}
      >
        <form onSubmit={handleConfirmPayment} className="space-y-3.5 text-xs">
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex justify-between items-center">
            <span className="font-bold text-rose-950">বর্তমান মোট বকেয়া প্রদেয়:</span>
            <span className="font-mono font-bold text-rose-800 text-base">
              ৳{(selectedSupplierForPay?.balance_payable || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">পরিশোধের পরিমাণ (৳) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="1000"
                value={payAmount || ''}
                onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-700 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম *</label>
              <select
                value={payMethod}
                onChange={e => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                <option value="ক্যাশ ড্রয়ার / কাউন্টার ক্যাশ">ক্যাশ ড্রয়ার / কাউন্টার ক্যাশ</option>
                <option value="ব্যাংক একাউন্ট ট্রান্সফার">ব্যাংক একাউন্ট ট্রান্সফার</option>
                <option value="বিকাশ (bKash Business)">বিকাশ (bKash Business)</option>
                <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                <option value="চেক পেমেন্ট (Bank Cheque)">চেক পেমেন্ট (Bank Cheque)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">চেক নং / TrxID / ভাউচার রেফারেন্স (ঐচ্ছিক)</label>
            <input
              type="text"
              placeholder="যেমন: CHQ-892102 বা বিকাশ TrxID"
              value={payRef}
              onChange={e => setPayRef(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">মন্তব্য / নোট</label>
            <input
              type="text"
              placeholder="যেমন: মে মাসের চালানের অগ্রিম বা বকেয়া পরিশোধ"
              value={payNote}
              onChange={e => setPayNote(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPaymentOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>পেমেন্ট নিশ্চিত ও হিসাব আপডেট</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RECORD PURCHASE BILL                                               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isBillOpen}
        onClose={() => setIsBillOpen(false)}
        title="নতুন পণ্য ক্রয় চালান এন্ট্রি (Purchase Invoice)"
        subtitle={`সাপ্লায়ার: ${selectedSupplierForBill?.name || ''} • গুদামে নতুন মালামাল গ্রহণ`}
      >
        <form onSubmit={handleConfirmPurchaseBill} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">চালান / ইনভয়েস নম্বর *</label>
              <input
                type="text"
                required
                placeholder="যেমন: INV-98210"
                value={billInvoiceNo}
                onChange={e => setBillInvoiceNo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">চালানের মোট বিল (৳) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="50000"
                value={billTotalAmount || ''}
                onChange={e => setBillTotalAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">তাৎক্ষণিক পরিশোধিত টাকা (৳)</label>
              <input
                type="number"
                value={billPaidAmount || 0}
                onChange={e => setBillPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">নতুন যুক্ত হওয়া বকেয়া (৳)</label>
              <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg font-mono font-bold text-rose-800 text-sm">
                ৳{Math.max(0, billTotalAmount - billPaidAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">চালানের বিস্তারিত বিবরণ</label>
            <input
              type="text"
              placeholder="যেমন: স্যামসাং ২৫টি হ্যান্ডসেট বা চাল ও ডাল ২০ বস্তা চালান"
              value={billNote}
              onChange={e => setBillNote(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBillOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>চালান সংরক্ষণ ও বকেয়া যোগ</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
