import React, { useState } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  BookCheck, 
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  Trash2,
  Building2,
  Scale,
  Wallet,
  Landmark,
  Smartphone,
  FileSpreadsheet,
  Calendar,
  Filter,
  Check
} from 'lucide-react';
import { Tenant, UserRole, AccountingEntry } from '../../types';
import { storageService } from '../../services/storageService';
import { Modal } from '../common/Modal';
import { printReportDocument } from '../../shared/utils/printReceipt';
import { useConfirm } from '../../context/ConfirmationContext';

interface AccountingViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
}

// Chart of Accounts Structure (COA)
interface AccountHead {
  code: string;
  name: string;
  category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  type: 'DEBIT' | 'CREDIT'; // Normal Balance
  description: string;
}

const DEFAULT_CHART_OF_ACCOUNTS: AccountHead[] = [
  // 1. Assets (সম্পদ)
  { code: '1001', name: 'ক্যাশ ড্রয়ার / কাউন্টার ক্যাশ (Cash in Hand)', category: 'ASSET', type: 'DEBIT', description: 'দোকানের ক্যাশ ড্রয়ারে থাকা নগদ অর্থ' },
  { code: '1002', name: 'ব্যাংক হিসাব (Bank Account)', category: 'ASSET', type: 'DEBIT', description: 'দোকানের বাণিজ্যিক ব্যাংক অ্যাকাউন্টের স্থিতি' },
  { code: '1003', name: 'বিকাশ ও MFS ওয়ালেট (Mobile Financial Services)', category: 'ASSET', type: 'DEBIT', description: 'বিকাশ, নগদ ও রকেট ওয়ালেটের ক্যাশ স্থিতি' },
  { code: '1004', name: 'গ্রাহক দেনাদার / বাকি পাওনা (Accounts Receivable)', category: 'ASSET', type: 'DEBIT', description: 'গ্রাহকদের নিকট মোট বকেয়া পাওনা' },
  { code: '1005', name: 'মজুদ পণ্য সম্পদ (Merchandise Inventory)', category: 'ASSET', type: 'DEBIT', description: 'দোকানে মজুদ পণ্যের মোট ক্রয়মূল্য' },
  
  // 2. Liabilities (দায়)
  { code: '2001', name: 'সাপ্লায়ার পাওনাদার / প্রদেয় বিল (Accounts Payable)', category: 'LIABILITY', type: 'CREDIT', description: 'পণ্য সরবরাহকারী ডিস্ট্রিবিউটরদের বকেয়া দেনা' },
  { code: '2002', name: 'ভ্যাট ও কর প্রদেয় (VAT & Tax Payable)', category: 'LIABILITY', type: 'CREDIT', description: 'সরকারি ভ্যাট ও রাজস্ব প্রদেয়' },
  { code: '2003', name: 'কর্মচারীর বেতন বকেয়া (Accrued Salaries)', category: 'LIABILITY', type: 'CREDIT', description: 'পরিশোধযোগ্য বকেয়া বেতন ও বোনাস' },

  // 3. Equity (মালিকানা স্বত্ব / মূলধন)
  { code: '3001', name: 'মালিকের প্রারম্ভিক মূলধন (Owner Equity/Capital)', category: 'EQUITY', type: 'CREDIT', description: 'দোকানে মালিকের বিনিয়োগকৃত মূলধন' },
  { code: '3002', name: 'মালিকের ব্যক্তিগত উত্তোলন (Owner Drawings)', category: 'EQUITY', type: 'DEBIT', description: 'দোকানের তহবিল থেকে ব্যক্তিগত খরচ' },
  { code: '3003', name: 'রিটেইন্ড আর্নিংস / পুঞ্জীভূত মুনাফা (Retained Earnings)', category: 'EQUITY', type: 'CREDIT', description: 'পূর্ববর্তী বছরের সঞ্চিত নিট লাভ' },

  // 4. Revenue (রাজস্ব / বিক্রয় আয়)
  { code: '4001', name: 'পণ্য বিক্রয় রাজস্ব (Sales Revenue)', category: 'REVENUE', type: 'CREDIT', description: 'খুচরা ও পাইকারি পণ্য বিক্রয় থেকে অর্জিত আয়' },
  { code: '4002', name: 'মোবাইল রিচার্জ ও MFS কমিশন (Service Commission)', category: 'REVENUE', type: 'CREDIT', description: 'ফ্লেক্সিলোড ও বিকাশ/নগদ লেনদেন কমিশন' },
  { code: '4003', name: 'সার্ভিসিং ও রিপেয়ারিং আয় (Repair Service Income)', category: 'REVENUE', type: 'CREDIT', description: 'মোবাইল মেরামত ও কারিগরি সেবা আয়' },

  // 5. Operating Expenses (পরিচালন ব্যয়)
  { code: '5001', name: 'বিক্রিত পণ্যের ক্রয়মূল্য (Cost of Goods Sold - COGS)', category: 'EXPENSE', type: 'DEBIT', description: 'বিক্রিত পণ্যের মোট ক্রয় ব্যয়' },
  { code: '5002', name: 'দোকান ভাড়া (Shop Rent Expense)', category: 'EXPENSE', type: 'DEBIT', description: 'দোকান ও গুদামের মাসিক ভাড়া' },
  { code: '5003', name: 'বিদ্যুৎ ও ইউটিলিটি বিল (Electricity & Utility Bills)', category: 'EXPENSE', type: 'DEBIT', description: 'বিদ্যুৎ, ইন্টারনেট ও পানি বিল' },
  { code: '5004', name: 'কর্মচারীর বেতন ও ভাতা (Staff Salaries & Wages)', category: 'EXPENSE', type: 'DEBIT', description: 'স্টাফদের মাসিক বেতন ও বোনাস' },
  { code: '5005', name: 'আপ্যায়ন ও বিবিধ খরচ (Entertainment & General)', category: 'EXPENSE', type: 'DEBIT', description: 'চা-নাস্তা ও সাধারণ দোকান খরচ' },
  { code: '5006', name: 'পরিবহন ও যাতায়াত (Transport & Conveyance)', category: 'EXPENSE', type: 'DEBIT', description: 'মালামাল আনা-নেওয়া ও পরিবহন ভাড়া' }
];

export const AccountingView: React.FC<AccountingViewProps> = ({ activeTenant }) => {
  const { confirm } = useConfirm();
  const [entries, setEntries] = useState<AccountingEntry[]>(() => storageService.getAccounting(activeTenant.id));
  const [sales, setSales] = useState(() => storageService.getSales(activeTenant.id));
  const [activeTab, setActiveTab] = useState<'journal' | 'coa' | 'trial_balance'>('journal');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const reloadData = () => {
    setEntries(storageService.getAccounting(activeTenant.id));
    setSales(storageService.getSales(activeTenant.id));
  };

  // Modal: New Journal Voucher
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherData, setVoucherData] = useState({
    reference_id: `JRN-${Date.now().toString().slice(-4)}`,
    title: '',
    debit_account: DEFAULT_CHART_OF_ACCOUNTS[0].name,
    credit_account: DEFAULT_CHART_OF_ACCOUNTS[11].name,
    amount: 0,
    created_at: new Date().toISOString().split('T')[0]
  });

  // Calculate Account Head Balances for Trial Balance
  const calculateAccountBalances = () => {
    const balances: Record<string, { debit: number; credit: number }> = {};
    
    // Initialize
    DEFAULT_CHART_OF_ACCOUNTS.forEach(a => {
      balances[a.name] = { debit: 0, credit: 0 };
    });

    entries.forEach(e => {
      // Record Debit
      if (!balances[e.debit_account]) {
        balances[e.debit_account] = { debit: 0, credit: 0 };
      }
      balances[e.debit_account].debit += e.amount;

      // Record Credit
      if (!balances[e.credit_account]) {
        balances[e.credit_account] = { debit: 0, credit: 0 };
      }
      balances[e.credit_account].credit += e.amount;
    });

    return balances;
  };

  const accountBalances = calculateAccountBalances();

  // Financial Metrics
  const totalDebits = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalCredits = entries.reduce((sum, e) => sum + e.amount, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  // Approximate Cash, Bank & MFS Balances
  const cashDebits = entries.filter(e => e.debit_account.includes('ক্যাশ') || e.debit_account.includes('Cash')).reduce((s, e) => s + e.amount, 0);
  const cashCredits = entries.filter(e => e.credit_account.includes('ক্যাশ') || e.credit_account.includes('Cash')).reduce((s, e) => s + e.amount, 0);
  const netCashBalance = cashDebits - cashCredits;

  const bankDebits = entries.filter(e => e.debit_account.includes('ব্যাংক') || e.debit_account.includes('Bank')).reduce((s, e) => s + e.amount, 0);
  const bankCredits = entries.filter(e => e.credit_account.includes('ব্যাংক') || e.credit_account.includes('Bank')).reduce((s, e) => s + e.amount, 0);
  const netBankBalance = bankDebits - bankCredits;

  const mfsDebits = entries.filter(e => e.debit_account.includes('বিকাশ') || e.debit_account.includes('MFS')).reduce((s, e) => s + e.amount, 0);
  const mfsCredits = entries.filter(e => e.credit_account.includes('বিকাশ') || e.credit_account.includes('MFS')).reduce((s, e) => s + e.amount, 0);
  const netMfsBalance = mfsDebits - mfsCredits;

  // Handle Save New Journal Voucher
  const handleSaveJournalVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherData.title.trim() || voucherData.amount <= 0) {
      alert('সঠিক বিবরণ ও টাকার পরিমাণ দিন!');
      return;
    }
    if (voucherData.debit_account === voucherData.credit_account) {
      alert('ডেবিট এবং ক্রেডিট অ্যাকাউন্ট একই হতে পারে না!');
      return;
    }

    const newEntry: AccountingEntry = {
      id: `acc_jrn_${Date.now()}`,
      tenant_id: activeTenant.id,
      reference_type: 'JOURNAL',
      reference_id: voucherData.reference_id || `JRN-${Date.now().toString().slice(-4)}`,
      title: voucherData.title.trim(),
      debit_account: voucherData.debit_account,
      credit_account: voucherData.credit_account,
      amount: voucherData.amount,
      created_at: voucherData.created_at ? new Date(voucherData.created_at).toISOString() : new Date().toISOString()
    };

    storageService.saveAccountingEntry(newEntry);
    reloadData();
    setIsVoucherModalOpen(false);
    setVoucherData({
      reference_id: `JRN-${Date.now().toString().slice(-4)}`,
      title: '',
      debit_account: DEFAULT_CHART_OF_ACCOUNTS[0].name,
      credit_account: DEFAULT_CHART_OF_ACCOUNTS[11].name,
      amount: 0,
      created_at: new Date().toISOString().split('T')[0]
    });
  };

  // Handle Delete Entry
  const handleDeleteEntry = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    const ok = await confirm({
      title: 'জার্নাল এন্ট্রি মুছে ফেলতে চান?',
      message: 'আপনি কি নিশ্চিত যে এই জার্নাল ভাউচার এন্ট্রিটি হিসাব খাতা থেকে মুছে ফেলতে চান?',
      itemName: entry ? `${entry.title} (৳${entry.amount})` : undefined,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      cancelText: 'বাতিল',
      type: 'danger',
      icon: 'trash'
    });
    if (ok) {
      storageService.deleteAccountingEntry(id);
      reloadData();
    }
  };

  // Print General Ledger Report
  const handlePrintLedger = () => {
    printReportDocument({
      shopName: activeTenant.name,
      shopAddress: activeTenant.address || 'বাংলাদেশ',
      shopPhone: activeTenant.phone || '',
      reportTitle: `সাধারণ খতিয়ান জার্নাল রিপোর্ট (General Ledger Statement)`,
      periodText: 'সকল জার্নাল ও হিসাব এন্ট্রি',
      orientation: 'landscape',
      kpis: [
        { label: 'মোট ডেবিট পোস্টিং', value: `৳ ${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#059669', subtext: 'Total Debit Posted' },
        { label: 'মোট ক্রেডিট পোস্টিং', value: `৳ ${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#0f172a', subtext: 'Total Credit Posted' },
        { label: 'লেজার ব্যালেন্স স্ট্যাটাস', value: isBalanced ? '✓ সমতা বজায় আছে' : '✕ অমিল', color: isBalanced ? '#059669' : '#dc2626', subtext: `${entries.length} টি ভাউচার` },
      ],
      columns: ['ভাউচার / রেফারেন্স #', 'লেনদেনের শিরোনাম ও বিবরণ', 'ডেবিট হিসাব খাত (Dr.)', 'ক্রেডিট হিসাব খাত (Cr.)', 'তারিখ ও সময়', 'ডেবিট পরিমাণ (৳)', 'ক্রেডিট পরিমাণ (৳)'],
      columnAlignments: ['left', 'left', 'left', 'left', 'center', 'right', 'right'],
      rows: entries.map(ent => [
        ent.reference_id,
        ent.title,
        ent.debit_account,
        ent.credit_account,
        new Date(ent.created_at).toLocaleDateString('en-GB'),
        `৳ ${ent.amount.toFixed(2)}`,
        `৳ ${ent.amount.toFixed(2)}`
      ]),
      summaryRow: ['সর্বমোট পোস্টিং সমতা (Trial Health)', '-', '-', '-', `${entries.length} টি ভাউচার`, `৳ ${totalDebits.toFixed(2)}`, `৳ ${totalCredits.toFixed(2)}`]
    });
  };

  // Print Trial Balance
  const handlePrintTrialBalance = () => {
    const activeHeads = Object.keys(accountBalances).filter(
      k => accountBalances[k].debit > 0 || accountBalances[k].credit > 0
    );

    printReportDocument({
      shopName: activeTenant.name,
      shopAddress: activeTenant.address || 'বাংলাদেশ',
      shopPhone: activeTenant.phone || '',
      reportTitle: `রেওয়ামিল বিবরণী রিপোর্ট (Trial Balance Statement)`,
      periodText: 'রিয়েল-টাইম সমাপনী ব্যালেন্স',
      orientation: 'portrait',
      kpis: [
        { label: 'মোট ডেবিট ব্যালেন্স', value: `৳ ${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#059669' },
        { label: 'মোট ক্রেডিট ব্যালেন্স', value: `৳ ${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#0f172a' },
      ],
      columns: ['হিসাব খাতের নাম (Account Head)', 'মোট ডেবিট (৳)', 'মোট ক্রেডিট (৳)', 'অবশিষ্ট ব্যালেন্স (৳)'],
      columnAlignments: ['left', 'right', 'right', 'right'],
      rows: activeHeads.map(name => {
        const bal = accountBalances[name];
        const net = bal.debit - bal.credit;
        return [
          name,
          `৳ ${bal.debit.toFixed(2)}`,
          `৳ ${bal.credit.toFixed(2)}`,
          net >= 0 ? `৳ ${net.toFixed(2)} (Dr)` : `৳ ${Math.abs(net).toFixed(2)} (Cr)`
        ];
      }),
      summaryRow: ['সর্বমোট রেওয়ামিল যোগফল (Balanced Balance)', `৳ ${totalDebits.toFixed(2)}`, `৳ ${totalCredits.toFixed(2)}`, isBalanced ? '✓ ১০০% সমতা' : '✕ পার্থক্য']
    });
  };

  return (
    <div className="space-y-4 pb-12 text-xs">
      {/* Header & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <span>দ্বৈত দাখিলা ও সাধারণ খতিয়ান (Double-Entry General Ledger)</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            আন্তর্জাতিক GAAP/IFRS স্ট্যান্ডার্ড অনুযায়ী স্বয়ংক্রিয় ডেবিট-ক্রেডিট হিসাব, খতিয়ান বুক ও রেওয়ামিল
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrintLedger}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all text-xs"
            title="খতিয়ান বুক প্রিন্ট করুন"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>খতিয়ান প্রিন্ট</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVoucherModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন জার্নাল ভাউচার</span>
          </button>
        </div>
      </div>

      {/* Financial Health & Balance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">ক্যাশ ড্রয়ার স্থিতি (Cash on Hand)</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            ৳{Math.max(0, netCashBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">কাউন্টার ক্যাশ নেট ব্যালেন্স</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">ব্যাংক একাউন্ট স্থিতি (Bank)</span>
            <Landmark className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700">
            ৳{Math.max(0, netBankBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5">বাণিজ্যিক ব্যাংক হিসাব ব্যালেন্স</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">MFS ও ডিজিটাল ওয়ালেট</span>
            <Smartphone className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-700">
            ৳{Math.max(0, netMfsBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-purple-600 mt-0.5">বিকাশ, নগদ ও রকেট ওয়ালেট</div>
        </div>

        <div className={`p-3.5 rounded-xl border shadow-xs ${isBalanced ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isBalanced ? 'text-emerald-800' : 'text-rose-800'}`}>
              ডেবিট-ক্রেডিট সমতা (Health)
            </span>
            <Scale className={`w-4 h-4 ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div className={`text-xl font-bold font-mono ${isBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
            {isBalanced ? '✓ সমতা বজায় আছে' : '✕ অসঙ্গতি'}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5 font-mono">
            Dr: ৳{totalDebits.toLocaleString()} | Cr: ৳{totalCredits.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl font-semibold text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'journal' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>১. সাধারণ খতিয়ান ও জার্নাল বুক ({entries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coa')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'coa' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>২. চার্ট অব একাউন্টস (Chart of Accounts - {DEFAULT_CHART_OF_ACCOUNTS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trial_balance')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'trial_balance' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-emerald-600" />
          <span>৩. রেওয়ামিল ও সমতা যাচাই (Trial Balance)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GENERAL LEDGER JOURNAL ENTRIES                                     */}
      {/* ========================================================================= */}
      {activeTab === 'journal' && (
        <div className="space-y-3">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ভাউচার নং, বিবরণ বা হিসাব খাত দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value="ALL">সকল ভাউচার টাইপ</option>
                <option value="SALE">বিক্রয় ভাউচার (SALE)</option>
                <option value="PURCHASE">ক্রয় ও সাপ্লায়ার চালান (PURCHASE)</option>
                <option value="EXPENSE">পরিচালন খরচ (EXPENSE)</option>
                <option value="JOURNAL">ম্যানুয়াল জার্নাল (JOURNAL)</option>
                <option value="RECHARGE_COMMISSION">কমিশন আয় (COMMISSION)</option>
              </select>
            </div>
          </div>

          {/* Journal Entries Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">তারিখ ও সময়</th>
                    <th className="py-3 px-3.5">ভাউচার / রেফারেন্স #</th>
                    <th className="py-3 px-3.5">লেনদেনের শিরোনাম ও বিবরণ</th>
                    <th className="py-3 px-3.5">ডেবিট হিসাব খাত (Dr.)</th>
                    <th className="py-3 px-3.5">ক্রেডিট হিসাব খাত (Cr.)</th>
                    <th className="py-3 px-3.5 text-right">ডেবিট (৳)</th>
                    <th className="py-3 px-3.5 text-right">ক্রেডিট (৳)</th>
                    <th className="py-3 px-3.5 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries
                    .filter(ent => {
                      const matchSearch = 
                        ent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        ent.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        ent.debit_account.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        ent.credit_account.toLowerCase().includes(searchTerm.toLowerCase());

                      const matchType = filterType === 'ALL' || ent.reference_type === filterType;
                      return matchSearch && matchType;
                    })
                    .map(ent => (
                      <tr key={ent.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(ent.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>

                        <td className="py-3 px-3.5 font-mono font-bold text-indigo-600 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-indigo-50 rounded border border-indigo-100">
                            {ent.reference_id}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900">{ent.title}</div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            টাইপ: {ent.reference_type}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 font-semibold text-emerald-800">
                          {ent.debit_account}
                        </td>

                        <td className="py-3 px-3.5 font-semibold text-slate-700">
                          {ent.credit_account}
                        </td>

                        <td className="py-3 px-3.5 font-mono font-bold text-emerald-700 text-right">
                          ৳{ent.amount.toFixed(2)}
                        </td>

                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900 text-right">
                          ৳{ent.amount.toFixed(2)}
                        </td>

                        <td className="py-3 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(ent.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        কোনো অ্যাকাউন্টিং এন্ট্রি পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CHART OF ACCOUNTS (COA)                                            */}
      {/* ========================================================================= */}
      {activeTab === 'coa' && (
        <div className="space-y-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
            <span className="font-bold text-slate-900 text-sm">
              দোকানের চার্ট অব অ্যাকাউন্টস (Standard Chart of Accounts)
            </span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full font-bold text-xs border border-indigo-200">
              ৫-টি প্রধান হিসাব শ্রেণি
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">অ্যাকাউন্ট কোড</th>
                  <th className="py-3 px-3.5">হিসাব খাতের নাম (Account Head)</th>
                  <th className="py-3 px-3.5">হিসাব শ্রেণি (Category)</th>
                  <th className="py-3 px-3.5">স্বাভাবিক ব্যালেন্স প্রকৃতি</th>
                  <th className="py-3 px-3.5">বিবরণ ও উদ্দেশ্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DEFAULT_CHART_OF_ACCOUNTS.map(acc => (
                  <tr key={acc.code} className="hover:bg-slate-50">
                    <td className="py-3 px-3.5 font-mono font-bold text-indigo-600">{acc.code}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{acc.name}</td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        acc.category === 'ASSET' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        acc.category === 'LIABILITY' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                        acc.category === 'EQUITY' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                        acc.category === 'REVENUE' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {acc.category}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono font-semibold text-slate-700">
                      {acc.type === 'DEBIT' ? 'Dr (ডেবিট)' : 'Cr (ক্রেডিট)'}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500">{acc.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRIAL BALANCE & RECONCILIATION                                     */}
      {/* ========================================================================= */}
      {activeTab === 'trial_balance' && (
        <div className="space-y-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="font-bold text-slate-900 text-sm block">
                রেওয়ামিল বিবরণী (Trial Balance Statement)
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                সকল ডেবিট ও ক্রেডিট হিসাব খাতের যোগফল ও সমতা পরীক্ষা
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrintTrialBalance}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>রেওয়ামিল প্রিন্ট (A4)</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">হিসাব খাতের নাম (Account Head)</th>
                  <th className="py-3 px-3.5 text-right">মোট ডেবিট পোস্টিং (৳)</th>
                  <th className="py-3 px-3.5 text-right">মোট ক্রেডিট পোস্টিং (৳)</th>
                  <th className="py-3 px-3.5 text-right">অবশিষ্ট জের / ব্যালেন্স (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(accountBalances)
                  .filter(name => accountBalances[name].debit > 0 || accountBalances[name].credit > 0)
                  .map(name => {
                    const bal = accountBalances[name];
                    const net = bal.debit - bal.credit;
                    return (
                      <tr key={name} className="hover:bg-slate-50">
                        <td className="py-3 px-3.5 font-bold text-slate-900">{name}</td>
                        <td className="py-3 px-3.5 font-mono text-right text-emerald-800">৳{bal.debit.toFixed(2)}</td>
                        <td className="py-3 px-3.5 font-mono text-right text-slate-800">৳{bal.credit.toFixed(2)}</td>
                        <td className="py-3 px-3.5 font-mono font-bold text-right text-indigo-700">
                          {net >= 0 ? `৳${net.toFixed(2)} (Dr)` : `৳${Math.abs(net).toFixed(2)} (Cr)`}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                <tr>
                  <td className="py-3 px-3.5">সর্বমোট রেওয়ামিল যোগফল</td>
                  <td className="py-3 px-3.5 font-mono text-right text-emerald-800 text-sm">৳{totalDebits.toFixed(2)}</td>
                  <td className="py-3 px-3.5 font-mono text-right text-slate-900 text-sm">৳{totalCredits.toFixed(2)}</td>
                  <td className="py-3 px-3.5 text-right">
                    {isBalanced ? (
                      <span className="text-emerald-700 font-bold">✓ ১০০% সমতা বজায় আছে</span>
                    ) : (
                      <span className="text-rose-700 font-bold">✕ অসম ব্যালেন্স</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW JOURNAL VOUCHER ENTRY                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        title="নতুন দ্বৈত দাখিলা জার্নাল ভাউচার (New Journal Voucher)"
        subtitle="সরাসরি ডেবিট ও ক্রেডিট হিসাব খাতে পোস্টিং করুন"
      >
        <form onSubmit={handleSaveJournalVoucher} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ভাউচার নম্বর *</label>
              <input
                type="text"
                required
                value={voucherData.reference_id}
                onChange={e => setVoucherData({ ...voucherData, reference_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ভাউচারের তারিখ *</label>
              <input
                type="date"
                required
                value={voucherData.created_at}
                onChange={e => setVoucherData({ ...voucherData, created_at: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">লেনদেনের বিবরণ / শিরোনাম *</label>
            <input
              type="text"
              required
              placeholder="যেমন: ব্যাংক থেকে ক্যাশে তহবিল উত্তোলন বা মূলধন সমন্বয়"
              value={voucherData.title}
              onChange={e => setVoucherData({ ...voucherData, title: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-emerald-800 mb-1">ডেবিট হিসাব খাত (Debit Account Dr.) *</label>
              <select
                value={voucherData.debit_account}
                onChange={e => setVoucherData({ ...voucherData, debit_account: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-semibold text-slate-900"
              >
                {DEFAULT_CHART_OF_ACCOUNTS.map(a => (
                  <option key={a.code} value={a.name}>[{a.category}] {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">ক্রেডিট হিসাব খাত (Credit Account Cr.) *</label>
              <select
                value={voucherData.credit_account}
                onChange={e => setVoucherData({ ...voucherData, credit_account: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
              >
                {DEFAULT_CHART_OF_ACCOUNTS.map(a => (
                  <option key={a.code} value={a.name}>[{a.category}] {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">টাকার পরিমাণ (৳ / BDT) *</label>
            <input
              type="number"
              required
              min="1"
              placeholder="1000"
              value={voucherData.amount || ''}
              onChange={e => setVoucherData({ ...voucherData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>জার্নাল ভাউচার পোস্ট করুন</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
