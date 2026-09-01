import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  PieChart, 
  Printer,
  FileText,
  Calendar,
  Filter,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Clock,
  Search,
  DollarSign,
  CreditCard,
  Layers,
  ShoppingBag,
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink
} from 'lucide-react';
import { Tenant, UserRole, SaleTransaction, AccountingEntry, GenericProduct, RechargeRecord, CustomerMember } from '../../types';
import { storageService } from '../../services/storageService';
import { i18n } from '../../services/i18nService';
import { Modal } from '../common/Modal';
import { printReportDocument } from '../../shared/utils/printReceipt';

interface ReportsViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
}

type DateFilterRange = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'all' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({ activeTenant }) => {
  const [activeTab, setActiveTab] = useState<'statement' | 'expenses' | 'sales' | 'inventory' | 'dues'>('statement');
  const [dateFilter, setDateFilter] = useState<DateFilterRange>('today');
  const [customFromDate, setCustomFromDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customToDate, setCustomToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<'bn' | 'en'>(() => i18n.getLanguage());

  useEffect(() => {
    const handleLang = () => setLang(i18n.getLanguage());
    window.addEventListener('dokan_lang_changed', handleLang);
    return () => window.removeEventListener('dokan_lang_changed', handleLang);
  }, []);

  const isEn = lang === 'en';

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Dynamic currency symbol configured from settings
  const currencySymbol = activeTenant?.currency_symbol || activeTenant?.currency || '৳';

  // Reload state
  const [sales, setSales] = useState<SaleTransaction[]>(() => storageService.getSales(activeTenant.id));
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>(() => storageService.getAccounting(activeTenant.id));
  const [products, setProducts] = useState<GenericProduct[]>(() => storageService.getProducts(activeTenant.id));
  const [recharges, setRecharges] = useState<RechargeRecord[]>(() => storageService.getRecharges(activeTenant.id));
  const [customers, setCustomers] = useState<CustomerMember[]>(() => storageService.getCustomers(activeTenant.id));

  // Modal State for Quick Expense Addition
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('দোকান ভাড়া');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0);
  const [newExpensePaymentMethod, setNewExpensePaymentMethod] = useState('ক্যাশ ড্রয়ার / নগদ');
  const [newExpenseDate, setNewExpenseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Reset pagination on filter or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateFilter, searchQuery, pageSize, customFromDate, customToDate]);

  const reloadData = () => {
    setSales(storageService.getSales(activeTenant.id));
    setAccountingEntries(storageService.getAccounting(activeTenant.id));
    setProducts(storageService.getProducts(activeTenant.id));
    setRecharges(storageService.getRecharges(activeTenant.id));
    setCustomers(storageService.getCustomers(activeTenant.id));
  };

  // Helper: Date filter matching
  const isDateInRange = (dateStr: string): boolean => {
    const d = new Date(dateStr);
    const now = new Date();

    if (dateFilter === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (dateFilter === 'yesterday') {
      const yest = new Date();
      yest.setDate(now.getDate() - 1);
      return d.toDateString() === yest.toDateString();
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo && d <= now;
    }
    if (dateFilter === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'last_month') {
      const lastMonth = new Date();
      lastMonth.setMonth(now.getMonth() - 1);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }
    if (dateFilter === 'custom') {
      const from = new Date(customFromDate + 'T00:00:00');
      const to = new Date(customToDate + 'T23:59:59');
      return d >= from && d <= to;
    }
    return true; // 'all'
  };

  // 1. Filter Sales
  const filteredSales = sales.filter(s => isDateInRange(s.created_at));

  // 2. Filter Operating Expenses (from accountingEntries where reference_type === 'EXPENSE')
  const filteredExpenses = accountingEntries.filter(e => 
    e.reference_type === 'EXPENSE' && isDateInRange(e.created_at)
  );

  // 3. Filter Recharge & Service Commissions
  const filteredRecharges = recharges.filter(r => isDateInRange(r.created_at));

  // ==========================================
  // FINANCIAL CALCULATIONS (GAAP STANDARD P&L)
  // ==========================================

  // 1. Gross Sales & Discounts
  const grossSalesAmount = filteredSales.reduce((sum, s) => sum + s.subtotal, 0);
  const totalDiscounts = filteredSales.reduce((sum, s) => sum + (s.discount_amount || 0), 0);
  const netSalesRevenue = filteredSales.reduce((sum, s) => sum + s.grand_total, 0);

  // 2. Cost of Goods Sold (COGS)
  const totalCOGS = filteredSales.reduce((cogsSum, sale) => {
    const saleItemsCost = sale.items.reduce((itemSum, item) => {
      const matchedProduct = products.find(p => p.id === item.product.id);
      const unitPurchasePrice = matchedProduct?.purchase_price ?? (item.unit_price * 0.7);
      return itemSum + (unitPurchasePrice * item.quantity);
    }, 0);
    return cogsSum + saleItemsCost;
  }, 0);

  // 3. Gross Profit Margin
  const grossProfitMargin = netSalesRevenue - totalCOGS;
  const grossProfitPercent = netSalesRevenue > 0 ? (grossProfitMargin / netSalesRevenue) * 100 : 0;

  // 4. Other Incomes (MFS / Digital Services Commission)
  const totalRechargeCommissions = filteredRecharges.reduce((sum, r) => sum + (r.commission_earned || 0), 0);

  // 5. Total Operating Expenses (Shop Rent, Utility, Salaries, Tea/Snacks etc.)
  const totalOperatingExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 6. Net Profit or Loss
  const netProfitOrLoss = grossProfitMargin + totalRechargeCommissions - totalOperatingExpenses;
  const netProfitMarginPercent = netSalesRevenue > 0 ? (netProfitOrLoss / netSalesRevenue) * 100 : 0;

  // 7. Balance Sheet Assets (Inventory Valuation & Receivables)
  const totalStockPurchaseValue = products.reduce((sum, p) => sum + ((p.purchase_price || 0) * (p.stock_quantity || 0)), 0);
  const totalStockRetailValue = products.reduce((sum, p) => sum + ((p.selling_price || 0) * (p.stock_quantity || 0)), 0);
  const totalCustomerDues = customers.reduce((sum, c) => sum + (c.current_due || 0), 0);

  // Label text for date ranges
  const monthNames = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  const currentMonthName = monthNames[new Date().getMonth()];
  const prevMonthName = monthNames[(new Date().getMonth() + 11) % 12];

  const filterLabels: Record<DateFilterRange, string> = {
    today: 'আজকের হিসাব',
    yesterday: 'গতকালের হিসাব',
    week: 'বিগত ৭ দিনের হিসাব',
    month: `চলতি মাস (${currentMonthName})`,
    last_month: `পূর্ববর্তী মাস (${prevMonthName})`,
    all: 'সার্বিক সর্বকালের হিসাব',
    custom: `কাস্টম সময়কাল (${customFromDate} হতে ${customToDate})`
  };

  // Add Expense Handler
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseAmount || newExpenseAmount <= 0) return;

    const newEntry: AccountingEntry = {
      id: `exp_${Date.now()}`,
      tenant_id: activeTenant.id,
      reference_type: 'EXPENSE',
      reference_id: `VCH-${Date.now().toString().slice(-5)}`,
      title: newExpenseTitle.trim() || newExpenseCategory,
      debit_account: `Expenses:${newExpenseCategory}`,
      credit_account: newExpensePaymentMethod,
      amount: newExpenseAmount,
      created_at: new Date(newExpenseDate).toISOString(),
    };

    storageService.saveAccountingEntry(newEntry);
    setIsAddExpenseOpen(false);
    setNewExpenseAmount(0);
    setNewExpenseTitle('');
    reloadData();
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('আপনি কি এই খরচের এন্ট্রিটি মুছে ফেলতে চান?')) {
      storageService.deleteAccountingEntry(id);
      reloadData();
    }
  };

  // ==========================================
  // EXPORT TO CSV / EXCEL HANDLERS
  // ==========================================
  const triggerCSVDownload = (csvContent: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExpensesCSV = (items: AccountingEntry[]) => {
    let csv = 'SL,Voucher No,Expense Title,Debit Account,Payment Account,Amount,Date & Time\n';
    items.forEach((exp, idx) => {
      csv += `${idx + 1},"${exp.reference_id}","${exp.title.replace(/"/g, '""')}","${exp.debit_account}","${exp.credit_account}",${exp.amount.toFixed(2)},"${new Date(exp.created_at).toLocaleString('en-GB')}"\n`;
    });
    triggerCSVDownload(csv, `SmartERP_Expenses_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportSalesCSV = (items: SaleTransaction[]) => {
    let csv = 'SL,Invoice No,Customer Name,Customer Phone,Items Count,Payment Method,Discount,Grand Total,Paid Amount,Due Amount,Date & Time\n';
    items.forEach((s, idx) => {
      csv += `${idx + 1},"${s.invoice_no}","${(s.customer_name || 'General Customer').replace(/"/g, '""')}","${s.customer_phone || ''}",${s.items?.length || 0},"${s.payment_method}",${(s.discount_amount || 0).toFixed(2)},${s.grand_total.toFixed(2)},${s.paid_amount.toFixed(2)},${(s.due_amount || 0).toFixed(2)},"${new Date(s.created_at).toLocaleString('en-GB')}"\n`;
    });
    triggerCSVDownload(csv, `SmartERP_Sales_Register_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportInventoryCSV = (items: GenericProduct[]) => {
    let csv = 'SL,Product Code,Product Name,Category,Current Stock,Unit,Purchase Price,Selling Price,Total Cost Value,Total Selling Value\n';
    items.forEach((p, idx) => {
      const costVal = (p.purchase_price || 0) * (p.stock_quantity || 0);
      const sellVal = (p.selling_price || 0) * (p.stock_quantity || 0);
      csv += `${idx + 1},"${p.code}","${p.name.replace(/"/g, '""')}","${p.category_name || 'General'}",${p.stock_quantity},"${p.unit || 'Pcs'}",${(p.purchase_price || 0).toFixed(2)},${(p.selling_price || 0).toFixed(2)},${costVal.toFixed(2)},${sellVal.toFixed(2)}\n`;
    });
    triggerCSVDownload(csv, `SmartERP_Stock_Valuation_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportDuesCSV = (items: CustomerMember[]) => {
    let csv = 'SL,Customer Name,Phone,Address,Total Spent,Current Due\n';
    items.forEach((c, idx) => {
      csv += `${idx + 1},"${c.name.replace(/"/g, '""')}","${c.phone}","${(c.address || '').replace(/"/g, '""')}",${(c.total_spent || 0).toFixed(2)},${(c.current_due || 0).toFixed(2)}\n`;
    });
    triggerCSVDownload(csv, `SmartERP_Customer_Dues_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Print P&L Statement (Portrait GAAP layout)
  const handlePrintStatement = () => {
    printReportDocument({
      shopName: activeTenant.name,
      shopAddress: activeTenant.address || 'বাংলাদেশ',
      shopPhone: activeTenant.phone || '',
      vatRegNo: activeTenant.bin_number || activeTenant.vat_number || 'BIN-9081293849',
      reportTitle: `আর্থিক লাভ-ক্ষতি ও পরিচালন বিবরণী (P&L Financial Statement)`,
      periodText: filterLabels[dateFilter],
      orientation: 'portrait',
      kpis: [
        { label: 'মোট বিক্রয় রাজস্ব', value: `${currencySymbol} ${netSalesRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#0f172a', subtext: `${filteredSales.length} টি সফল ইনভয়েস` },
        { label: 'পণ্যের ক্রয়মূল্য (COGS)', value: `${currencySymbol} ${totalCOGS.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#d97706', subtext: 'বিক্রিত পণ্যের ক্রয় ব্যয়' },
        { label: 'মোট গ্রস লাভ', value: `${currencySymbol} ${grossProfitMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#059669', subtext: `মার্জিন: ${grossProfitPercent.toFixed(1)}%` },
        { label: 'দোকানের মোট খরচ', value: `${currencySymbol} ${totalOperatingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#dc2626', subtext: `${filteredExpenses.length} টি ভাউচার` },
        { label: 'চূড়ান্ত নিট লাভ', value: `${currencySymbol} ${netProfitOrLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: netProfitOrLoss >= 0 ? '#059669' : '#dc2626', subtext: `নিট রেট: ${netProfitMarginPercent.toFixed(1)}%` },
      ],
      columns: ['আর্থিক বিবরণী বিবরণ (Financial Head)', 'হিসাব প্রকার', `পরিমাণ (${currencySymbol})`],
      columnAlignments: ['left', 'center', 'right'],
      rows: [
        ['১. মোট বিক্রয় (Gross Sales Revenue)', 'রাজস্ব / বিক্রয় আয়', `${currencySymbol} ${grossSalesAmount.toFixed(2)}`],
        ['২. বাদ: ডিসকাউন্ট ও ছাড় (Less: Discounts)', 'কর্তন / ছাড়', `- ${currencySymbol} ${totalDiscounts.toFixed(2)}`],
        ['৩. নিট বিক্রয় রাজস্ব (Net Sales Revenue)', 'নিট রাজস্ব', `${currencySymbol} ${netSalesRevenue.toFixed(2)}`],
        ['৪. বাদ: বিক্রিত পণ্যের ক্রয়মূল্য (Less: COGS)', 'পণ্য ক্রয় ব্যয়', `- ${currencySymbol} ${totalCOGS.toFixed(2)}`],
        ['৫. মোট গ্রস লাভ মার্জিন (Gross Profit Margin)', 'গ্রস লাভ', `${currencySymbol} ${grossProfitMargin.toFixed(2)} (${grossProfitPercent.toFixed(1)}%)`],
        ['৬. যোগ: MFS, রিচার্জ ও সেবা কমিশন (Add: Other Income)', 'কমিশন আয়', `+ ${currencySymbol} ${totalRechargeCommissions.toFixed(2)}`],
        ['৭. বাদ: দোকানের মোট পরিচালন ব্যয় (Less: Operating Expenses)', 'দোকানের খরচ', `- ${currencySymbol} ${totalOperatingExpenses.toFixed(2)}`],
        ['৮. চূড়ান্ত নিট পরিচালন লাভ / ক্ষতি (Net Operating Profit/Loss)', netProfitOrLoss >= 0 ? '✓ নিট লাভ' : '✕ নিট ক্ষতি', `${currencySymbol} ${netProfitOrLoss.toFixed(2)}`],
      ],
      summaryRow: ['সর্বমোট নিট লাভ / ক্ষতি (Net Operating Balance)', netProfitOrLoss >= 0 ? 'লাভে পরিচালিত' : 'ক্ষতিতে পরিচালিত', `${currencySymbol} ${netProfitOrLoss.toFixed(2)}`],
    });
  };

  // Print Expenses Ledger
  const handlePrintExpenses = () => {
    printReportDocument({
      shopName: activeTenant.name,
      shopAddress: activeTenant.address || 'বাংলাদেশ',
      shopPhone: activeTenant.phone || '',
      reportTitle: `দোকানের খরচ খাতা ও পরিচালন ব্যয় রিপোর্ট (Expense Ledger)`,
      periodText: filterLabels[dateFilter],
      orientation: 'portrait',
      kpis: [
        { label: 'মোট খরচের পরিমাণ', value: `${currencySymbol} ${totalOperatingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#dc2626' },
        { label: 'মোট ভাউচার সংখ্যা', value: `${filteredExpenses.length} টি`, color: '#0f172a' },
      ],
      columns: ['ভাউচার #', 'খরচের খাত / শিরোনাম', 'পেমেন্ট মাধ্যম', 'তারিখ', `টাকার পরিমাণ (${currencySymbol})`],
      columnAlignments: ['left', 'left', 'center', 'center', 'right'],
      rows: filteredExpenses.map(e => [
        e.reference_id,
        e.title,
        e.credit_account,
        new Date(e.created_at).toLocaleDateString('en-GB'),
        `${currencySymbol} ${e.amount.toFixed(2)}`
      ]),
      summaryRow: ['মোট ব্যয় (Total Expenses)', '-', '-', `${filteredExpenses.length} টি এন্ট্রি`, `${currencySymbol} ${totalOperatingExpenses.toFixed(2)}`]
    });
  };

  // Print Sales Invoices Report (Landscape Layout)
  const handlePrintSales = () => {
    printReportDocument({
      shopName: activeTenant.name,
      shopAddress: activeTenant.address || 'বাংলাদেশ',
      shopPhone: activeTenant.phone || '',
      reportTitle: `বিক্রয় ও ইনভয়েস স্টেটমেন্ট রিপোর্ট (Sales Register)`,
      periodText: filterLabels[dateFilter],
      orientation: 'landscape',
      kpis: [
        { label: 'মোট বিক্রয়', value: `${currencySymbol} ${netSalesRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#0f172a' },
        { label: 'মোট ইনভয়েস', value: `${filteredSales.length} টি`, color: '#2563eb' },
        { label: 'মোট ছাড়', value: `${currencySymbol} ${totalDiscounts.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#dc2626' },
      ],
      columns: ['ইনভয়েস নং', 'গ্রাহকের নাম', 'পণ্য সংখ্যা', 'পেমেন্ট মাধ্যম', 'ডিসকাউন্ট', `মোট বিল (${currencySymbol})`, 'পরিশোধ', 'বকেয়া', 'তারিখ'],
      columnAlignments: ['left', 'left', 'center', 'center', 'right', 'right', 'right', 'right', 'center'],
      rows: filteredSales.map(s => [
        s.invoice_no,
        s.customer_name || 'সাধারণ ক্রেতা',
        `${s.items?.length || 0} টি`,
        s.payment_method,
        `${currencySymbol} ${(s.discount_amount || 0).toFixed(2)}`,
        `${currencySymbol} ${s.grand_total.toFixed(2)}`,
        `${currencySymbol} ${s.paid_amount.toFixed(2)}`,
        s.due_amount > 0 ? `${currencySymbol} ${s.due_amount.toFixed(2)}` : `${currencySymbol} 0.00`,
        new Date(s.created_at).toLocaleDateString('en-GB')
      ]),
      summaryRow: ['মোট হিসাব (Grand Total)', '-', `${filteredSales.reduce((sum, s) => sum + (s.items?.length || 0), 0)} পণ্য`, '-', `${currencySymbol} ${totalDiscounts.toFixed(2)}`, `${currencySymbol} ${netSalesRevenue.toFixed(2)}`, `${currencySymbol} ${filteredSales.reduce((sum, s) => sum + s.paid_amount, 0).toFixed(2)}`, `${currencySymbol} ${filteredSales.reduce((sum, s) => sum + s.due_amount, 0).toFixed(2)}`, '-']
    });
  };

  // Print Inventory Valuation Report
  const handlePrintInventory = () => {
    printReportDocument({
      shopName: activeTenant.name,
      shopAddress: activeTenant.address || 'বাংলাদেশ',
      shopPhone: activeTenant.phone || '',
      reportTitle: `ইনভেন্টরি স্টক ও সম্পদ মূল্যায়ন রিপোর্ট (Inventory Valuation)`,
      periodText: 'বর্তমান রিয়েল-টাইম স্টক',
      orientation: 'landscape',
      kpis: [
        { label: 'মোট স্টক ক্রয় সম্পদ', value: `${currencySymbol} ${totalStockPurchaseValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#d97706' },
        { label: 'সম্ভাব্য মোট বিক্রয়মূল্য', value: `${currencySymbol} ${totalStockRetailValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#059669' },
        { label: 'সম্ভাব্য গ্রস লাভ', value: `${currencySymbol} ${(totalStockRetailValue - totalStockPurchaseValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#2563eb' },
      ],
      columns: ['পণ্যের কোড', 'পণ্যের নাম', 'ক্যাটাগরি', 'বর্তমান স্টক', 'ক্রয়মূল্য (Unit)', 'বিক্রয়মূল্য (Unit)', `মোট ক্রয় সম্পদ (${currencySymbol})`, `সম্ভাব্য বিক্রয় সম্পদ (${currencySymbol})`],
      columnAlignments: ['left', 'left', 'left', 'center', 'right', 'right', 'right', 'right'],
      rows: products.map(p => [
        p.code,
        p.name,
        p.category_name || 'সাধারণ',
        `${p.stock_quantity} ${p.unit}`,
        `${currencySymbol} ${p.purchase_price.toFixed(2)}`,
        `${currencySymbol} ${p.selling_price.toFixed(2)}`,
        `${currencySymbol} ${((p.purchase_price || 0) * (p.stock_quantity || 0)).toFixed(2)}`,
        `${currencySymbol} ${((p.selling_price || 0) * (p.stock_quantity || 0)).toFixed(2)}`
      ]),
      summaryRow: ['সর্বমোট স্টক সম্পদ', '-', `${products.length} আইটেম`, `${products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0)} ইউনিট`, '-', '-', `${currencySymbol} ${totalStockPurchaseValue.toFixed(2)}`, `${currencySymbol} ${totalStockRetailValue.toFixed(2)}`]
    });
  };

  // Print Customer Dues Report
  const handlePrintDues = () => {
    const dueCustomers = customers.filter(c => (c.current_due || 0) > 0);
    printReportDocument({
      shopName: activeTenant.name,
      shopAddress: activeTenant.address || 'বাংলাদেশ',
      shopPhone: activeTenant.phone || '',
      reportTitle: `গ্রাহক দেনাদার ও বাকি খাতা রিপোর্ট (Accounts Receivable Ledger)`,
      periodText: 'বর্তমান বকেয়া স্থিতি',
      orientation: 'portrait',
      kpis: [
        { label: 'সর্বমোট বকেয়া পাওনা', value: `${currencySymbol} ${totalCustomerDues.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#dc2626' },
        { label: 'বকেয়া গ্রাহক সংখ্যা', value: `${dueCustomers.length} জন`, color: '#0f172a' },
      ],
      columns: ['গ্রাহকের নাম', 'মোবাইল নম্বর', 'ঠিকানা', `বর্তমান বকেয়া পাওনা (${currencySymbol})`],
      columnAlignments: ['left', 'left', 'left', 'right'],
      rows: dueCustomers.map(c => [
        c.name,
        c.phone,
        c.address || 'N/A',
        `${currencySymbol} ${(c.current_due || 0).toFixed(2)}`
      ]),
      summaryRow: ['সর্বমোট বকেয়া বাকি (Total Receivables)', '-', `${dueCustomers.length} জন গ্রাহক`, `${currencySymbol} ${totalCustomerDues.toFixed(2)}`]
    });
  };

  // Generic Pagination Controls Component
  const renderPaginationFooter = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIdx = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const endIdx = Math.min(currentPage * pageSize, totalItems);

    return (
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span>প্রতি পেজে:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              <option value={5}>৫</option>
              <option value={10}>১০</option>
              <option value={20}>২০</option>
              <option value={50}>৫০</option>
              <option value={100}>১০০</option>
            </select>
          </div>

          <span className="font-medium text-slate-500">
            {totalItems > 0 ? (
              <>
                প্রদর্শন: <b className="text-slate-800 font-mono">{startIdx} - {endIdx}</b> (সর্বমোট <b className="text-indigo-600 font-mono">{totalItems}</b> টি রেকর্ড)
              </>
            ) : (
              '০ টি রেকর্ড'
            )}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="প্রথম পেজ"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="পূর্ববর্তী পেজ"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3 && currentPage < totalPages - 1) {
                  pageNum = currentPage - 2 + i;
                } else if (currentPage >= totalPages - 1) {
                  pageNum = totalPages - 4 + i;
                }
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="পরবর্তী পেজ"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="সর্বশেষ পেজ"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-12 text-xs animate-in fade-in duration-200">
      
      {/* Header & Date Range Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>লাভ-ক্ষতি ও আর্থিক বিবরণী ড্যাশবোর্ড (Financial Statement V1)</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            দোকানের মোট বিক্রয়, পণ্যের ক্রয়মূল্য (COGS), গ্রস মার্জিন, খরচ খাতা ও নিট লাভের সম্পূর্ণ বিবরণী ({currencySymbol})
          </p>
        </div>

        {/* Date Filters & Print */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-semibold text-xs">
            {(['today', 'yesterday', 'week', 'month', 'last_month', 'all', 'custom'] as DateFilterRange[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setDateFilter(r)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                  dateFilter === r 
                    ? 'bg-white text-indigo-700 font-bold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'today' && 'আজ'}
                {r === 'yesterday' && 'গতকাল'}
                {r === 'week' && 'সপ্তাহ'}
                {r === 'month' && `${currentMonthName}`}
                {r === 'last_month' && `${prevMonthName}`}
                {r === 'all' && 'সার্বিক'}
                {r === 'custom' && 'কাস্টম'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrintStatement}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            title="আর্থিক বিবরণী প্রিন্ট করুন"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট (Print Statement)</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {dateFilter === 'custom' && (
        <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200 flex flex-wrap items-center gap-3">
          <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>কাস্টম তারিখ নির্বাচন:</span>
          </span>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-700">হতে:</label>
            <input
              type="date"
              value={customFromDate}
              onChange={e => setCustomFromDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-indigo-300 rounded-lg text-xs font-mono font-bold text-indigo-950"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-700">পর্যন্ত:</label>
            <input
              type="date"
              value={customToDate}
              onChange={e => setCustomToDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-indigo-300 rounded-lg text-xs font-mono font-bold text-indigo-950"
            />
          </div>
        </div>
      )}

      {/* Top 6 Executive Financial KPI Cards (Clickable to switch tabs) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        
        {/* 1. Gross Sales */}
        <div 
          onClick={() => setActiveTab('sales')}
          className={`p-3.5 rounded-xl border-2 shadow-xs transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'bg-blue-50/50 border-blue-600 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">মোট বিক্রয়</span>
            <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {currencySymbol}{netSalesRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5 flex items-center justify-between">
            <span>{filteredSales.length} টি ইনভয়েস</span>
            <span className="text-[9px]">তালিকা &gt;</span>
          </div>
        </div>

        {/* 2. COGS */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className={`p-3.5 rounded-xl border-2 shadow-xs transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-amber-50/50 border-amber-600 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">পণ্যের ক্রয়মূল্য (COGS)</span>
            <Layers className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {currencySymbol}{totalCOGS.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5 flex items-center justify-between">
            <span>বিক্রিত পণ্যের আসল দাম</span>
            <span className="text-[9px]">স্টক &gt;</span>
          </div>
        </div>

        {/* 3. Gross Margin */}
        <div 
          onClick={() => setActiveTab('statement')}
          className={`p-3.5 rounded-xl border-2 shadow-xs transition-all cursor-pointer ${
            activeTab === 'statement'
              ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">গ্রস লাভ মার্জিন</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-700">
            {currencySymbol}{grossProfitMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">মার্জিন: {grossProfitPercent.toFixed(1)}%</div>
        </div>

        {/* 4. MFS / Services Incomes */}
        <div 
          onClick={() => setActiveTab('statement')}
          className={`p-3.5 rounded-xl border-2 shadow-xs transition-all cursor-pointer ${
            activeTab === 'statement'
              ? 'bg-purple-50/50 border-purple-600 ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">কমিশন আয়</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold font-mono text-purple-700">
            +{currencySymbol}{totalRechargeCommissions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">রিচার্জ ও MFS কমিশন</div>
        </div>

        {/* 5. Expenses */}
        <div 
          onClick={() => setActiveTab('expenses')}
          className={`p-3.5 rounded-xl border-2 shadow-xs transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-rose-50/50 border-rose-600 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">দোকানের মোট খরচ</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold font-mono text-rose-700">
            -{currencySymbol}{totalOperatingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5 flex items-center justify-between">
            <span>{filteredExpenses.length} টি খরচ ভাউচার</span>
            <span className="text-[9px]">খরচ খাতা &gt;</span>
          </div>
        </div>

        {/* 6. Net Profit/Loss */}
        <div 
          onClick={() => setActiveTab('statement')}
          className={`p-3.5 rounded-xl border-2 shadow-xs transition-all cursor-pointer ${
            netProfitOrLoss >= 0 
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20' 
              : 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">চূড়ান্ত নিট লাভ</span>
            <DollarSign className={`w-3.5 h-3.5 ${netProfitOrLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} />
          </div>
          <div className={`text-lg font-bold font-mono ${netProfitOrLoss >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
            {currencySymbol}{netProfitOrLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className={`text-[10px] font-bold mt-0.5 ${netProfitOrLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {netProfitOrLoss >= 0 ? `✓ নিট লাভ (${netProfitMarginPercent.toFixed(1)}%)` : `✕ নিট ক্ষতি`}
          </div>
        </div>

      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('statement')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'statement' 
              ? 'bg-white text-indigo-700 font-bold shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>১. আর্থিক লাভ-ক্ষতি বিবরণী (P&L Statement)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'expenses' 
              ? 'bg-white text-indigo-700 font-bold shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          <span>২. দোকানের খরচ খাতা ({filteredExpenses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'sales' 
              ? 'bg-white text-indigo-700 font-bold shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
          <span>৩. বিক্রয় ও ইনভয়েস হিস্ট্রি ({filteredSales.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'inventory' 
              ? 'bg-white text-indigo-700 font-bold shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>৪. স্টক ভ্যালুয়েশন ও ক্যাটালগ ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dues')}
          className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'dues' 
              ? 'bg-white text-indigo-700 font-bold shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-600" />
          <span>৫. কাস্টমার বাকি খাতা ({currencySymbol}{totalCustomerDues.toLocaleString()})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FINANCIAL STATEMENT (P&L BREAKDOWN)                                */}
      {/* ========================================================================= */}
      {activeTab === 'statement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Detailed Statement Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>আর্থিক লাভ-ক্ষতি হিসাব বিবরণী (Financial Statement)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  নির্ধারিত সময়কাল: <b className="text-indigo-700">{filterLabels[dateFilter]}</b>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintStatement}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>প্রিন্ট স্টেটমেন্ট</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Row 1: Gross Sales */}
              <div className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <span className="font-bold text-slate-900 block">১. মোট বিক্রয় মূল্য (Gross Sales)</span>
                  <span className="text-[10px] text-slate-500">সকল পণ্যের মুদ্রিত বিক্রয় মূল্য</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">{currencySymbol}{grossSalesAmount.toFixed(2)}</span>
              </div>

              {/* Row 2: Discounts */}
              <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 bg-rose-50/20">
                <div>
                  <span className="font-bold text-rose-800 block">২. বাদ: ডিসকাউন্ট ও ছাড় (Less: Discounts)</span>
                  <span className="text-[10px] text-slate-500">বিক্রয়ের সময় কাস্টমারকে প্রদত্ত ছাড়</span>
                </div>
                <span className="font-mono font-bold text-rose-700">- {currencySymbol}{totalDiscounts.toFixed(2)}</span>
              </div>

              {/* Row 3: Net Revenue */}
              <div className="p-3.5 flex items-center justify-between bg-slate-50/80 font-bold border-t border-b border-slate-200">
                <span className="text-slate-900">৩. নিট বিক্রয় রাজস্ব (Net Sales Revenue)</span>
                <span className="font-mono text-indigo-700 text-sm">{currencySymbol}{netSalesRevenue.toFixed(2)}</span>
              </div>

              {/* Row 4: COGS */}
              <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 bg-amber-50/20">
                <div>
                  <span className="font-bold text-amber-900 block">৪. বাদ: বিক্রিত পণ্যের ক্রয়মূল্য (Less: COGS)</span>
                  <span className="text-[10px] text-slate-500">বিক্রিত পণ্যের মোট ক্রয়মূল্য বা আসল খরচ</span>
                </div>
                <span className="font-mono font-bold text-amber-800">- {currencySymbol}{totalCOGS.toFixed(2)}</span>
              </div>

              {/* Row 5: Gross Margin */}
              <div className="p-3.5 flex items-center justify-between bg-emerald-50/40 font-bold border-t border-b border-emerald-200">
                <div>
                  <span className="text-emerald-950 block">৫. মোট গ্রস লাভ মার্জিন (Gross Profit Margin)</span>
                  <span className="text-[10px] text-emerald-700 font-normal">গ্রস প্রফিট রেট: {grossProfitPercent.toFixed(1)}%</span>
                </div>
                <span className="font-mono text-emerald-800 text-base">{currencySymbol}{grossProfitMargin.toFixed(2)}</span>
              </div>

              {/* Row 6: Other Income */}
              <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 bg-purple-50/20">
                <div>
                  <span className="font-bold text-purple-900 block">৬. যোগ: MFS ও রিচার্জ কমিশন (Add: Other Income)</span>
                  <span className="text-[10px] text-slate-500">ফ্লেক্সিলোড, বিকাশ, নগদ ও ডিজিটাল সেবা কমিশন</span>
                </div>
                <span className="font-mono font-bold text-purple-700">+ {currencySymbol}{totalRechargeCommissions.toFixed(2)}</span>
              </div>

              {/* Row 7: Operating Expenses */}
              <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 bg-rose-50/20">
                <div>
                  <span className="font-bold text-rose-900 block">৭. বাদ: দোকানের মোট খরচ (Less: Operating Expenses)</span>
                  <span className="text-[10px] text-slate-500">ভাড়া, বিদ্যুৎ বিল, কর্মচারীর বেতন, চা-নাশতা ইত্যাদি</span>
                </div>
                <span className="font-mono font-bold text-rose-700">- {currencySymbol}{totalOperatingExpenses.toFixed(2)}</span>
              </div>

              {/* Row 8: Final Net Profit */}
              <div className={`p-4 flex items-center justify-between font-bold text-sm ${
                netProfitOrLoss >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                <div>
                  <span className="block text-sm">৮. চূড়ান্ত নিট লাভ / ক্ষতি (Net Operating Margin)</span>
                  <span className="text-[11px] opacity-90 font-normal">
                    {netProfitOrLoss >= 0 ? 'দোকান বর্তমানে লাভজনক অবস্থানে রয়েছে' : 'খরচ আয়ের তুলনায় বেশি হয়েছে'}
                  </span>
                </div>
                <span className="font-mono text-lg tracking-tight">{currencySymbol}{netProfitOrLoss.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quick Expense & Balance Summary Widget */}
          <div className="space-y-4">
            {/* Quick Add Expense Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <span>কুইক খরচ এন্ট্রি (Fast Expense)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                >
                  + নতুন খরচ
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredExpenses.slice(0, 5).map(e => (
                  <div key={e.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-slate-800 block">{e.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(e.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-rose-700">-{currencySymbol}{e.amount}</span>
                  </div>
                ))}

                {filteredExpenses.length === 0 && (
                  <div className="p-4 text-center text-slate-400 text-[11px]">
                    এই সময়ে কোনো খরচের এন্ট্রি নেই।
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Asset Worth Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
              <span className="font-bold text-slate-900 block pb-1 border-b border-slate-100">
                দোকানের মজুদ পণ্যের মোট মূল্য (Inventory Valuation)
              </span>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">মজুদ পণ্যের ক্রয়মূল্য (Asset Cost):</span>
                <span className="font-mono font-bold text-slate-900">{currencySymbol}{totalStockPurchaseValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">প্রত্যাশিত বিক্রয়মূল্য (Retail Value):</span>
                <span className="font-mono font-bold text-emerald-700">{currencySymbol}{totalStockRetailValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
                <span className="text-slate-800 font-bold">সম্ভাব্য মোট স্টক লাভ:</span>
                <span className="font-mono font-bold text-indigo-700">{currencySymbol}{(totalStockRetailValue - totalStockPurchaseValue).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXPENSES LEDGER (SEARCH, PRINT, EXPORT, PAGINATION)                */}
      {/* ========================================================================= */}
      {activeTab === 'expenses' && (() => {
        const filtered = filteredExpenses.filter(e =>
          e.reference_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.debit_account.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.credit_account.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const paginatedExpenses = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        return (
          <div className="space-y-3.5">
            
            {/* Toolbar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ভাউচার নং, শিরোনাম বা খাত দিয়ে সার্চ..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handlePrintExpenses}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="খরচ রিপোর্ট প্রিন্ট করুন"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>প্রিন্ট রিপোর্ট</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportExpensesCSV(filtered)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="এক্সেল বা CSV ফাইলে ডাউনলোড"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>এক্সপোর্ট (CSV)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ নতুন খরচ এন্ট্রি</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5 w-12 text-center">SL</th>
                    <th className="py-3 px-3.5">ভাউচার নং</th>
                    <th className="py-3 px-3.5">খরচের খাত / শিরোনাম</th>
                    <th className="py-3 px-3.5">পেমেন্ট অ্যাকাউন্ট</th>
                    <th className="py-3 px-3.5 text-right">টাকার পরিমাণ ({currencySymbol})</th>
                    <th className="py-3 px-3.5 text-right">তারিখ ও সময়</th>
                    <th className="py-3 px-3.5 text-center w-16">মুছুন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedExpenses.map((exp, idx) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-indigo-600">{exp.reference_id}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">{exp.title}</td>
                      <td className="py-3 px-3.5 text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">{exp.credit_account}</span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-700">
                        -{currencySymbol}{exp.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3.5 text-right text-[11px] text-slate-500 font-mono">
                        {new Date(exp.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        কোনো খরচের রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {renderPaginationFooter(filtered.length)}
            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 3: SALES & INVOICES REPORT (SEARCH, PRINT, EXPORT, PAGINATION)        */}
      {/* ========================================================================= */}
      {activeTab === 'sales' && (() => {
        const filtered = filteredSales.filter(s =>
          s.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.customer_phone && s.customer_phone.includes(searchQuery)) ||
          s.payment_method.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const paginatedSales = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        return (
          <div className="space-y-3.5">
            
            {/* Toolbar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ইনভয়েস নং, ক্রেতার নাম বা ফোন দিয়ে সার্চ..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handlePrintSales}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="বিক্রয় রেজিস্টার প্রিন্ট (A4)"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>রেজিস্টার প্রিন্ট</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportSalesCSV(filtered)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="এক্সেল বা CSV ফাইলে ডাউনলোড"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>এক্সপোর্ট (CSV)</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5 w-12 text-center">SL</th>
                    <th className="py-3 px-3.5">ইনভয়েস #</th>
                    <th className="py-3 px-3.5">কাস্টমার নাম ও ফোন</th>
                    <th className="py-3 px-3.5 text-center">পণ্য সংখ্যা</th>
                    <th className="py-3 px-3.5">পেমেন্ট মেথড</th>
                    <th className="py-3 px-3.5 text-right">ডিসকাউন্ট</th>
                    <th className="py-3 px-3.5 text-right">মোট বিল ({currencySymbol})</th>
                    <th className="py-3 px-3.5 text-right">পরিশোধ</th>
                    <th className="py-3 px-3.5 text-right">বকেয়া</th>
                    <th className="py-3 px-3.5 text-right">তারিখ ও সময়</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSales.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-indigo-600">{s.invoice_no}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        {s.customer_name || 'সাধারণ ক্রেতা'}
                        {s.customer_phone && <span className="text-[10px] text-slate-400 font-mono block">{s.customer_phone}</span>}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-slate-700">{s.items?.length || 0} টি</td>
                      <td className="py-3 px-3.5"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">{s.payment_method}</span></td>
                      <td className="py-3 px-3.5 text-right text-rose-600 font-mono">{currencySymbol}{s.discount_amount || 0}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">{currencySymbol}{s.grand_total.toFixed(2)}</td>
                      <td className="py-3 px-3.5 text-right font-mono text-emerald-700">{currencySymbol}{s.paid_amount.toFixed(2)}</td>
                      <td className="py-3 px-3.5 text-right font-mono text-rose-700">{s.due_amount > 0 ? `${currencySymbol}${s.due_amount.toFixed(2)}` : '০'}</td>
                      <td className="py-3 px-3.5 text-right text-[11px] text-slate-500 font-mono">
                        {new Date(s.created_at).toLocaleDateString('en-GB')} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {renderPaginationFooter(filtered.length)}
            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 4: STOCK VALUATION (SEARCH, PRINT, EXPORT, PAGINATION)                */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (() => {
        const filtered = products.filter(p =>
          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        const paginatedProducts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        return (
          <div className="space-y-3.5">
            
            {/* Toolbar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="পণ্যের নাম, কোড বা ক্যাটাগরি সার্চ..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handlePrintInventory}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="স্টক ভ্যালুয়েশন প্রিন্ট (A4)"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>স্টক প্রিন্ট</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportInventoryCSV(filtered)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="এক্সেল বা CSV ফাইলে ডাউনলোড"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>এক্সপোর্ট (CSV)</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5 w-12 text-center">SL</th>
                    <th className="py-3 px-3.5">পণ্যের নাম ও কোড</th>
                    <th className="py-3 px-3.5">ক্যাটেগরি</th>
                    <th className="py-3 px-3.5 text-center">বর্তমান স্টক</th>
                    <th className="py-3 px-3.5 text-right">ক্রয়মূল্য (Unit)</th>
                    <th className="py-3 px-3.5 text-right">বিক্রয়মূল্য (Unit)</th>
                    <th className="py-3 px-3.5 text-right">মোট ক্রয় সম্পদ ({currencySymbol})</th>
                    <th className="py-3 px-3.5 text-right">সম্ভাব্য বিক্রয় মূল্য ({currencySymbol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">{p.name} ({p.code})</td>
                      <td className="py-3 px-3.5 text-slate-600">{p.category_name}</td>
                      <td className="py-3 px-3.5 text-center font-bold text-indigo-700">{p.stock_quantity} {p.unit}</td>
                      <td className="py-3 px-3.5 text-right font-mono">{currencySymbol}{p.purchase_price}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">{currencySymbol}{p.selling_price}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-800">
                        {currencySymbol}{((p.purchase_price || 0) * (p.stock_quantity || 0)).toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-800">
                        {currencySymbol}{((p.selling_price || 0) * (p.stock_quantity || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        কোনো পণ্য পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {renderPaginationFooter(filtered.length)}
            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 5: CUSTOMER DUES (SEARCH, PRINT, EXPORT, PAGINATION)                  */}
      {/* ========================================================================= */}
      {activeTab === 'dues' && (() => {
        const filtered = customers
          .filter(c => (c.current_due || 0) > 0)
          .filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery) ||
            (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
          );

        const paginatedDues = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        return (
          <div className="space-y-3.5">
            
            {/* Toolbar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="কাস্টমার নাম, ফোন বা ঠিকানা দিয়ে সার্চ..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handlePrintDues}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="বাকি খাতা প্রিন্ট (A4)"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>বাকি খাতা প্রিন্ট</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportDuesCSV(filtered)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="এক্সেল বা CSV ফাইলে ডাউনলোড"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>এক্সপোর্ট (CSV)</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5 w-12 text-center">SL</th>
                    <th className="py-3 px-3.5">কাস্টমার নাম</th>
                    <th className="py-3 px-3.5">মোবাইল নম্বর</th>
                    <th className="py-3 px-3.5">ঠিকানা</th>
                    <th className="py-3 px-3.5 text-right">বকেয়া বাকি (Due {currencySymbol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDues.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-3.5 font-mono text-slate-700">{c.phone}</td>
                      <td className="py-3 px-3.5 text-slate-500">{c.address || 'N/A'}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-700">{currencySymbol}{(c.current_due || 0).toLocaleString()}</td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        কোনো কাস্টমারের কাছে বকেয়া বাকি নেই।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {renderPaginationFooter(filtered.length)}
            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: ADD EXPENSE                                                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="নতুন খরচ ভাউচার এন্ট্রি (Add Operating Expense)"
        subtitle="দোকানের নিয়মিত খরচ লিপিবদ্ধ করুন ও ক্যাশ ব্যালেন্স আপডেট করুন"
      >
        <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">খরচের খাত / ক্যাটাগরি *</label>
              <select
                value={newExpenseCategory}
                onChange={e => setNewExpenseCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                <option value="দোকান ভাড়া">দোকান ভাড়া (Shop Rent)</option>
                <option value="বিদ্যুৎ ও ইউটিলিটি বিল">বিদ্যুৎ ও ইউটিলিটি বিল (Electricity)</option>
                <option value="কর্মচারীর বেতন">কর্মচারীর বেতন (Staff Salary)</option>
                <option value="চা-নাশতা ও আপ্যায়ন">চা-নাশতা ও আপ্যায়ন (Tea/Snacks)</option>
                <option value="যাতায়াত ও পরিবহন">যাতায়াত ও পরিবহন (Transport)</option>
                <option value="ইন্টারনেট ও ডোমেন বিল">ইন্টারনেট ও ডোমেন বিল (Internet)</option>
                <option value="প্যাকেজিং ও স্টেশনারি">প্যাকেজিং ও স্টেশনারি (Packaging)</option>
                <option value="মেরামত ও সংস্কার">মেরামত ও সংস্কার (Maintenance)</option>
                <option value="বিজ্ঞাপন ও প্রচার">বিজ্ঞাপন ও প্রচার (Marketing)</option>
                <option value="অন্যান্য সাধারণ খরচ">অন্যান্য সাধারণ খরচ (Miscellaneous)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">টাকার পরিমাণ ({currencySymbol}) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="যেমন: ৫০০"
                value={newExpenseAmount || ''}
                onChange={e => setNewExpenseAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-rose-700 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম (Payment From)</label>
              <select
                value={newExpensePaymentMethod}
                onChange={e => setNewExpensePaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
              >
                <option value="ক্যাশ ড্রয়ার / নগদ">ক্যাশ ড্রয়ার / নগদ (Counter Cash)</option>
                <option value="বিকাশ (bKash)">বিকাশ (bKash MFS)</option>
                <option value="নগদ (Nagad)">নগদ (Nagad MFS)</option>
                <option value="ব্যাংক অ্যাকাউন্ট">ব্যাংক অ্যাকাউন্ট (Bank Account)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">তারিখ</label>
              <input
                type="date"
                value={newExpenseDate}
                onChange={e => setNewExpenseDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">বিবরণ / শিরোনাম (ঐচ্ছিক)</label>
            <input
              type="text"
              placeholder="যেমন: জানুয়ারি মাসের দোকান ভাড়া বাবদ..."
              value={newExpenseTitle}
              onChange={e => setNewExpenseTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-lg cursor-pointer transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer shadow-sm transition-colors"
            >
              খরচ সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
