import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  Smartphone, 
  Layers, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Receipt, 
  Barcode, 
  Sliders, 
  Calendar, 
  Wallet, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  FileSpreadsheet,
  Search,
  X,
  Printer,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileText,
  ExternalLink,
  PlusCircle,
  BookMarked
} from 'lucide-react';
import { Tenant, UserRole, SaleTransaction } from '../../types';
import { storageService } from '../../services/storageService';
import { i18n } from '../../services/i18nService';
import { RuleEngine } from '../../engine/ruleEngine';
import { Badge } from '../common/Badge';
import { printPosReceipt } from '../../shared/utils/printReceipt';

interface DashboardViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
  onNavigate: (viewId: string) => void;
}

type DrilldownType = 'today_sales' | 'month_sales' | 'profit_breakdown' | 'customer_dues' | 'stock_valuation' | 'low_stock' | null;

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeTenant: initialTenant,
  activeRole,
  onNavigate
}) => {
  const [activeTenant, setActiveTenant] = useState<Tenant>(initialTenant);
  const [activeInlineTab, setActiveInlineTab] = useState<DrilldownType>('today_sales');
  const [drilldownSearch, setDrilldownSearch] = useState('');
  const [lang, setLang] = useState<'bn' | 'en'>(() => i18n.getLanguage());

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const inlineTableRef = useRef<HTMLDivElement | null>(null);

  // Sync language changes
  useEffect(() => {
    const handleLang = () => setLang(i18n.getLanguage());
    window.addEventListener('dokan_lang_changed', handleLang);
    return () => window.removeEventListener('dokan_lang_changed', handleLang);
  }, []);

  const isEn = lang === 'en';

  // Sync active tenant if prop changes or on settings change event
  useEffect(() => {
    setActiveTenant(initialTenant);
  }, [initialTenant]);

  useEffect(() => {
    const handleTenantChange = (e: Event) => {
      const customEvent = e as CustomEvent<Tenant>;
      if (customEvent.detail && customEvent.detail.id === initialTenant.id) {
        setActiveTenant(customEvent.detail);
      } else {
        const tenants = storageService.getTenants();
        const found = tenants.find(t => t.id === initialTenant.id);
        if (found) setActiveTenant(found);
      }
    };
    window.addEventListener('dokan_tenant_changed', handleTenantChange);
    window.addEventListener('storage', handleTenantChange);
    return () => {
      window.removeEventListener('dokan_tenant_changed', handleTenantChange);
      window.removeEventListener('storage', handleTenantChange);
    };
  }, [initialTenant.id]);

  // Reset pagination when search query, active tab, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [drilldownSearch, activeInlineTab, pageSize]);

  // Dynamic currency symbol configured from settings
  const currencySymbol = activeTenant?.currency_symbol || activeTenant?.currency || '৳';

  const products = storageService.getProducts(activeTenant.id);
  const sales = storageService.getSales(activeTenant.id);
  const customers = storageService.getCustomers(activeTenant.id);
  const auditLogs = storageService.getAuditLogs(activeTenant.id).slice(0, 5);

  // Industry specific datasets
  const devices = storageService.getDevices();
  const availableDevices = devices.filter(d => d.status === 'available');
  const repairs = storageService.getRepairs(activeTenant.id);
  const pendingRepairs = repairs.filter(r => r.status === 'received' || r.status === 'in_progress' || r.status === 'waiting_parts');
  const batches = storageService.getBatches();
  const expiringBatches = batches.filter(b => b.status === 'expiring_soon' || b.status === 'expired');
  const borrowRecords = storageService.getBorrowRecords(activeTenant.id);
  const activeBorrows = borrowRecords.filter(b => b.status === 'borrowed' || b.status === 'overdue');

  // Dates & Aggregates
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Sales Today
  const todaySales = sales.filter(s => s.created_at.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.grand_total, 0);

  // Total Lifetime & Monthly Revenue
  const currentMonthSales = sales.filter(s => {
    const d = new Date(s.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthRevenue = currentMonthSales.reduce((sum, s) => sum + s.grand_total, 0);

  // Stock Inventory Valuation
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const totalStockPurchaseValue = products.reduce((sum, p) => sum + (p.stock_quantity * (p.purchase_price || 0)), 0);
  const totalStockSellingValue = products.reduce((sum, p) => sum + (p.stock_quantity * (p.selling_price || 0)), 0);
  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_alert);

  // Total Customer Due
  const totalDueAmount = customers.reduce((sum, c) => sum + (c.current_due || 0), 0);
  const dueCustomersCount = customers.filter(c => (c.current_due || 0) > 0).length;

  // Estimated Profit (Selling - Purchase for all completed sales)
  const productProfitMap = sales.reduce((acc, s) => {
    s.items.forEach(it => {
      const pId = it.product.id;
      const prod = products.find(p => p.id === pId);
      const unitCost = prod ? (prod.purchase_price || 0) : (it.unit_price * 0.7);
      const totalCost = unitCost * it.quantity;
      const totalRev = it.total;
      const netProfit = totalRev - totalCost;

      if (!acc[pId]) {
        acc[pId] = {
          id: pId,
          name: it.product.name,
          category: it.product.category_name,
          qtySold: 0,
          totalCost: 0,
          totalRevenue: 0,
          netProfit: 0,
          currentStock: it.product.stock_quantity,
        };
      }
      acc[pId].qtySold += it.quantity;
      acc[pId].totalCost += totalCost;
      acc[pId].totalRevenue += totalRev;
      acc[pId].netProfit += netProfit;
    });
    return acc;
  }, {} as Record<string, { id: string; name: string; category: string; qtySold: number; totalCost: number; totalRevenue: number; netProfit: number; currentStock: number }>);

  const profitList = Object.values(productProfitMap).sort((a, b) => b.netProfit - a.netProfit);
  const totalEstimatedProfit = profitList.reduce((sum, p) => sum + p.netProfit, 0);

  // 7-Day Sales Trend Calculation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().split('T')[0];
    const daySales = sales.filter(s => s.created_at.startsWith(dStr));
    const dayTotal = daySales.reduce((sum, s) => sum + s.grand_total, 0);
    const dayName = isEn 
      ? d.toLocaleDateString('en-US', { weekday: 'short' })
      : d.toLocaleDateString('bn-BD', { weekday: 'short' });
    return {
      date: dStr,
      label: dayName,
      total: dayTotal,
      count: daySales.length,
    };
  });

  const maxDayTotal = Math.max(...last7Days.map(d => d.total), 1000);

  // Payment Method Breakdown
  const paymentBreakdown = sales.reduce((acc, s) => {
    const method = s.payment_method || 'CASH';
    acc[method] = (acc[method] || 0) + s.grand_total;
    return acc;
  }, {} as Record<string, number>);

  const totalPaymentSum = Object.values(paymentBreakdown).reduce((a, b) => a + b, 0) || 1;

  // Top Selling Products Leaderboard
  const topSellingProducts = profitList.slice(0, 5);

  // Enabled modules
  const hasTelecom = RuleEngine.isModuleEnabled(activeTenant, 'IMEI') || RuleEngine.isModuleEnabled(activeTenant, 'REPAIRS');
  const hasGrocery = RuleEngine.isModuleEnabled(activeTenant, 'BATCH') || RuleEngine.isModuleEnabled(activeTenant, 'EXPIRY');
  const hasLibrary = RuleEngine.isModuleEnabled(activeTenant, 'BOOKS') || RuleEngine.isModuleEnabled(activeTenant, 'BORROWING');

  // Handle Card Click
  const handleCardClick = (type: DrilldownType) => {
    if (activeInlineTab === type) {
      setActiveInlineTab(type);
    } else {
      setActiveInlineTab(type);
      setDrilldownSearch('');
    }
    setTimeout(() => {
      inlineTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Helper for single invoice receipt print
  const handlePrintSale = (sale: SaleTransaction) => {
    let templateSettings: any = {};
    try {
      templateSettings = JSON.parse(
        localStorage.getItem(`dokan_v2_template_config_${activeTenant.id}`) ||
        localStorage.getItem('dokan_v2_template_config') ||
        '{}'
      );
    } catch {}

    printPosReceipt({
      shopName: activeTenant.name || 'SmartERP Enterprise',
      shopAddress: activeTenant.address || 'Dhaka, Bangladesh',
      shopPhone: activeTenant.phone || '01700-000000',
      shopEmail: activeTenant.email || '',
      tinNo: activeTenant.tin_number || '',
      binNo: activeTenant.bin_number || activeTenant.vat_number || 'BIN-123456789',
      vatRegNo: activeTenant.bin_number || activeTenant.vat_number || 'BIN-123456789',
      headerNote: templateSettings.headerNote || (isEn ? 'Welcome to our store' : 'বিসমিল্লাহির রাহমানির রাহিম'),
      footerNote: templateSettings.footerNote || (isEn ? 'Goods once sold can be exchanged within 7 days with cash memo. Thank you!' : 'বিক্রিত পণ্য ৭ দিনের মধ্যে ক্যাশ মেমো সহ পরিবর্তনযোগ্য। ধন্যবাদ, আবার আসবেন!'),
      termsNote: templateSettings.termsConditions || '',
      templateStyle: templateSettings.templateStyle || 'modern',
      primaryColor: templateSettings.primaryColor || '#0284c7',
      showLogo: templateSettings.showLogo ?? true,
      showQr: templateSettings.showQrCode ?? true,
      showWatermark: templateSettings.showWatermark ?? true,
      showSignatures: templateSettings.showSignatures ?? true,
      showTinBin: templateSettings.showTinBin ?? true,
      invoiceNo: sale.invoice_no,
      date: new Date(sale.created_at).toLocaleDateString('en-GB'),
      customerName: sale.customer_name || (isEn ? 'Walk-in Customer' : 'সাধারণ কাস্টমার'),
      customerPhone: sale.customer_phone || '',
      items: sale.items.map(it => ({
        name: it.product.name,
        quantity: it.quantity,
        unitPrice: it.unit_price,
        total: it.total,
        imei: it.selected_imei,
        warranty: it.warranty_months ? `${it.warranty_months} ${isEn ? 'Mo' : 'মাস'}` : undefined,
      })),
      subtotal: sale.subtotal,
      tax: sale.tax_amount,
      taxRate: sale.tax_rate,
      discount: sale.discount_amount,
      grandTotal: sale.grand_total,
      paidAmount: sale.paid_amount,
      dueAmount: sale.due_amount,
      paymentMethod: sale.payment_method,
      paperFormat: templateSettings.defaultPaperSize || '80mm',
      softwareBranding: templateSettings.showSoftwareBranding ? (activeTenant.system_branding || 'SmartERP Enterprise Platform V2.0') : '',
    });
  };

  // EXPORT TO CSV HANDLER
  const handleExportCSV = () => {
    let filename = `SmartERP_Report_${new Date().toISOString().split('T')[0]}.csv`;
    let csvContent = '';

    if (activeInlineTab === 'today_sales' || activeInlineTab === 'month_sales') {
      const sourceSales = activeInlineTab === 'today_sales' ? todaySales : currentMonthSales;
      const filtered = sourceSales.filter(s => 
        s.invoice_no.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        s.customer_name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        (s.customer_phone && s.customer_phone.includes(drilldownSearch)) ||
        s.payment_method.toLowerCase().includes(drilldownSearch.toLowerCase())
      );
      filename = activeInlineTab === 'today_sales' ? `SmartERP_Today_Sales_${todayStr}.csv` : `SmartERP_Monthly_Sales_${todayStr.slice(0, 7)}.csv`;
      
      csvContent = 'SL,Invoice No,Date & Time,Customer Name,Customer Phone,Items Count,Payment Method,Grand Total,Paid Amount,Due Amount,Payment Status\n';
      filtered.forEach((s, idx) => {
        const row = [
          idx + 1,
          `"${s.invoice_no}"`,
          `"${new Date(s.created_at).toLocaleString('en-GB')}"`,
          `"${s.customer_name.replace(/"/g, '""')}"`,
          `"${s.customer_phone || ''}"`,
          s.items.length,
          `"${s.payment_method}"`,
          s.grand_total.toFixed(2),
          s.paid_amount.toFixed(2),
          s.due_amount.toFixed(2),
          `"${s.payment_status}"`
        ];
        csvContent += row.join(',') + '\n';
      });
    } else if (activeInlineTab === 'profit_breakdown') {
      const filtered = profitList.filter(p =>
        p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(drilldownSearch.toLowerCase())
      );
      filename = `SmartERP_Profit_Margin_Report_${todayStr}.csv`;
      csvContent = 'SL,Product Name,Category,Qty Sold,Total Cost,Total Revenue,Net Profit,Margin Percentage\n';
      filtered.forEach((p, idx) => {
        const margin = p.totalRevenue > 0 ? ((p.netProfit / p.totalRevenue) * 100).toFixed(1) : '0';
        const row = [
          idx + 1,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.category || 'General'}"`,
          p.qtySold,
          p.totalCost.toFixed(2),
          p.totalRevenue.toFixed(2),
          p.netProfit.toFixed(2),
          `"${margin}%"`
        ];
        csvContent += row.join(',') + '\n';
      });
    } else if (activeInlineTab === 'customer_dues') {
      const filtered = customers
        .filter(c => (c.current_due || 0) > 0)
        .filter(c =>
          c.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
          c.phone.includes(drilldownSearch) ||
          (c.address && c.address.toLowerCase().includes(drilldownSearch.toLowerCase()))
        );
      filename = `SmartERP_Customer_Dues_Ledger_${todayStr}.csv`;
      csvContent = 'SL,Customer Name,Phone,Address,Total Spent,Current Due\n';
      filtered.forEach((c, idx) => {
        const row = [
          idx + 1,
          `"${c.name.replace(/"/g, '""')}"`,
          `"${c.phone}"`,
          `"${(c.address || '').replace(/"/g, '""')}"`,
          (c.total_spent || 0).toFixed(2),
          c.current_due.toFixed(2)
        ];
        csvContent += row.join(',') + '\n';
      });
    } else if (activeInlineTab === 'stock_valuation') {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        (p.barcode && p.barcode.includes(drilldownSearch)) ||
        p.category_name.toLowerCase().includes(drilldownSearch.toLowerCase())
      );
      filename = `SmartERP_Inventory_Stock_Valuation_${todayStr}.csv`;
      csvContent = 'SL,Product Code,Product Name,Category,Stock Qty,Unit,Purchase Price,Selling Price,Total Cost Value,Total Selling Value\n';
      filtered.forEach((p, idx) => {
        const costVal = p.stock_quantity * (p.purchase_price || 0);
        const sellVal = p.stock_quantity * (p.selling_price || 0);
        const row = [
          idx + 1,
          `"${p.code}"`,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.category_name}"`,
          p.stock_quantity,
          `"${p.unit || 'Pcs'}"`,
          (p.purchase_price || 0).toFixed(2),
          (p.selling_price || 0).toFixed(2),
          costVal.toFixed(2),
          sellVal.toFixed(2)
        ];
        csvContent += row.join(',') + '\n';
      });
    } else if (activeInlineTab === 'low_stock') {
      const filtered = lowStockProducts.filter(p =>
        p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        p.category_name.toLowerCase().includes(drilldownSearch.toLowerCase())
      );
      filename = `SmartERP_Low_Stock_Alerts_${todayStr}.csv`;
      csvContent = 'SL,Product Code,Product Name,Category,Current Stock,Min Alert Level,Shortage Qty,Purchase Price\n';
      filtered.forEach((p, idx) => {
        const shortage = Math.max(0, p.min_stock_alert - p.stock_quantity);
        const row = [
          idx + 1,
          `"${p.code}"`,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.category_name}"`,
          p.stock_quantity,
          p.min_stock_alert,
          shortage,
          (p.purchase_price || 0).toFixed(2)
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PRINT FULL TABLE REPORT HANDLER
  const handlePrintTableReport = () => {
    let reportTitle = isEn ? 'SmartERP Business Report' : 'SmartERP ব্যবসায়িক রিপোর্ট';
    let tableHeadersHtml = '';
    let tableRowsHtml = '';

    if (activeInlineTab === 'today_sales' || activeInlineTab === 'month_sales') {
      const sourceSales = activeInlineTab === 'today_sales' ? todaySales : currentMonthSales;
      const filtered = sourceSales.filter(s => 
        s.invoice_no.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        s.customer_name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        (s.customer_phone && s.customer_phone.includes(drilldownSearch)) ||
        s.payment_method.toLowerCase().includes(drilldownSearch.toLowerCase())
      );
      reportTitle = activeInlineTab === 'today_sales' 
        ? (isEn ? "Today's Sales & Invoices Report" : 'আজকের বিক্রয় ও ইনভয়েস রিপোর্ট')
        : (isEn ? 'Monthly Sales Register Report' : 'চলতি মাসের বিক্রয় বিবরণী রিপোর্ট');
      
      tableHeadersHtml = isEn
        ? '<th>SL</th><th>Invoice No</th><th>Date & Time</th><th>Customer</th><th>Items</th><th>Payment Method</th><th>Grand Total</th><th>Paid</th><th>Due</th><th>Status</th>'
        : '<th>SL</th><th>ইনভয়েস নং</th><th>তারিখ ও সময়</th><th>কাস্টমার</th><th>আইটেম</th><th>পেমেন্ট মেথড</th><th>মোট বিল</th><th>আদায়</th><th>বকেয়া</th><th>স্ট্যাটাস</th>';
      
      tableRowsHtml = filtered.map((s, idx) => `
        <tr>
          <td style="text-align:center">${idx + 1}</td>
          <td><b>${s.invoice_no}</b></td>
          <td>${new Date(s.created_at).toLocaleDateString('en-GB')} ${new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td>${s.customer_name} ${s.customer_phone ? `(${s.customer_phone})` : ''}</td>
          <td style="text-align:center">${s.items.length}</td>
          <td>${s.payment_method}</td>
          <td style="text-align:right"><b>${currencySymbol}${s.grand_total.toFixed(2)}</b></td>
          <td style="text-align:right">${currencySymbol}${s.paid_amount.toFixed(2)}</td>
          <td style="text-align:right">${s.due_amount > 0 ? `${currencySymbol}${s.due_amount.toFixed(2)}` : '-'}</td>
          <td style="text-align:center">${s.payment_status}</td>
        </tr>
      `).join('');
    } else if (activeInlineTab === 'profit_breakdown') {
      const filtered = profitList.filter(p =>
        p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(drilldownSearch.toLowerCase())
      );
      reportTitle = isEn ? 'Product Profit & Margin Analytics Report' : 'পণ্যভিত্তিক নিট লাভ ও মার্জিন বিশ্লেষণ রিপোর্ট';
      tableHeadersHtml = isEn
        ? '<th>SL</th><th>Product Name</th><th>Category</th><th>Qty Sold</th><th>Cost Total</th><th>Revenue Total</th><th>Net Profit</th><th>Margin (%)</th>'
        : '<th>SL</th><th>পণ্যের নাম</th><th>ক্যাটাগরি</th><th>বিক্রিত পরিমাণ</th><th>মোট ক্রয় দর</th><th>মোট বিক্রয় মূল্য</th><th>নিট লাভ</th><th>মার্জিন (%)</th>';
      
      tableRowsHtml = filtered.map((p, idx) => {
        const margin = p.totalRevenue > 0 ? ((p.netProfit / p.totalRevenue) * 100).toFixed(1) : '0';
        return `
          <tr>
            <td style="text-align:center">${idx + 1}</td>
            <td><b>${p.name}</b></td>
            <td>${p.category || 'General'}</td>
            <td style="text-align:center">${p.qtySold}</td>
            <td style="text-align:right">${currencySymbol}${p.totalCost.toFixed(2)}</td>
            <td style="text-align:right">${currencySymbol}${p.totalRevenue.toFixed(2)}</td>
            <td style="text-align:right"><b>${currencySymbol}${p.netProfit.toFixed(2)}</b></td>
            <td style="text-align:right">${margin}%</td>
          </tr>
        `;
      }).join('');
    } else if (activeInlineTab === 'customer_dues') {
      const filtered = customers
        .filter(c => (c.current_due || 0) > 0)
        .filter(c =>
          c.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
          c.phone.includes(drilldownSearch) ||
          (c.address && c.address.toLowerCase().includes(drilldownSearch.toLowerCase()))
        );
      reportTitle = isEn ? 'Customer Due Ledger Report' : 'কাস্টমার বকেয়া খাতা ও দেনা-পাওনা রিপোর্ট';
      tableHeadersHtml = isEn
        ? '<th>SL</th><th>Customer Name</th><th>Phone Number</th><th>Address</th><th>Total Spent</th><th>Current Due</th>'
        : '<th>SL</th><th>কাস্টমার নাম</th><th>মোবাইল নম্বর</th><th>ঠিকানা</th><th>মোট কেনাকাটা</th><th>বর্তমান বকেয়া</th>';
      
      tableRowsHtml = filtered.map((c, idx) => `
        <tr>
          <td style="text-align:center">${idx + 1}</td>
          <td><b>${c.name}</b></td>
          <td>${c.phone}</td>
          <td>${c.address || '-'}</td>
          <td style="text-align:right">${currencySymbol}${(c.total_spent || 0).toFixed(2)}</td>
          <td style="text-align:right; color: #b91c1c;"><b>${currencySymbol}${c.current_due.toFixed(2)}</b></td>
        </tr>
      `).join('');
    } else if (activeInlineTab === 'stock_valuation') {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        (p.barcode && p.barcode.includes(drilldownSearch)) ||
        p.category_name.toLowerCase().includes(drilldownSearch.toLowerCase())
      );
      reportTitle = isEn ? 'Inventory Stock Valuation Report' : 'স্টক পণ্যের মূল্যায়ন ও ইনভেন্টরি রিপোর্ট';
      tableHeadersHtml = isEn
        ? '<th>SL</th><th>Code</th><th>Product Name</th><th>Category</th><th>Stock Qty</th><th>Unit Cost</th><th>Unit Price</th><th>Total Cost</th><th>Total Value</th>'
        : '<th>SL</th><th>পণ্য কোড</th><th>পণ্যের নাম</th><th>ক্যাটাগরি</th><th>স্টক পরিমাণ</th><th>একক ক্রয় দর</th><th>একক বিক্রয় দর</th><th>মোট ক্রয় মান</th><th>মোট বিক্রয় মান</th>';
      
      tableRowsHtml = filtered.map((p, idx) => {
        const costVal = p.stock_quantity * (p.purchase_price || 0);
        const sellVal = p.stock_quantity * (p.selling_price || 0);
        return `
          <tr>
            <td style="text-align:center">${idx + 1}</td>
            <td><b>${p.code}</b></td>
            <td>${p.name}</td>
            <td>${p.category_name}</td>
            <td style="text-align:center">${p.stock_quantity} ${p.unit || ''}</td>
            <td style="text-align:right">${currencySymbol}${(p.purchase_price || 0).toFixed(2)}</td>
            <td style="text-align:right">${currencySymbol}${(p.selling_price || 0).toFixed(2)}</td>
            <td style="text-align:right">${currencySymbol}${costVal.toFixed(2)}</td>
            <td style="text-align:right"><b>${currencySymbol}${sellVal.toFixed(2)}</b></td>
          </tr>
        `;
      }).join('');
    } else if (activeInlineTab === 'low_stock') {
      const filtered = lowStockProducts.filter(p =>
        p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        p.category_name.toLowerCase().includes(drilldownSearch.toLowerCase())
      );
      reportTitle = isEn ? 'Low Stock & Reorder Alert Report' : 'লো-স্টক ও রি-অর্ডার সতর্কতা রিপোর্ট';
      tableHeadersHtml = isEn
        ? '<th>SL</th><th>Code</th><th>Product Name</th><th>Category</th><th>Current Stock</th><th>Alert Level</th><th>Shortage</th><th>Cost Price</th>'
        : '<th>SL</th><th>পণ্য কোড</th><th>পণ্যের নাম</th><th>ক্যাটাগরি</th><th>বর্তমান স্টক</th><th>অ্যালার্ট সীমা</th><th>ঘাটতি</th><th>ক্রয় মূল্য</th>';
      
      tableRowsHtml = filtered.map((p, idx) => {
        const shortage = Math.max(0, p.min_stock_alert - p.stock_quantity);
        return `
          <tr>
            <td style="text-align:center">${idx + 1}</td>
            <td><b>${p.code}</b></td>
            <td>${p.name}</td>
            <td>${p.category_name}</td>
            <td style="text-align:center; color:#b91c1c"><b>${p.stock_quantity} ${p.unit || ''}</b></td>
            <td style="text-align:center">${p.min_stock_alert}</td>
            <td style="text-align:center; color:#d97706"><b>+${shortage}</b></td>
            <td style="text-align:right">${currencySymbol}${(p.purchase_price || 0).toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle} - ${activeTenant.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 20px; color: #1e293b; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .header h1 { margin: 0 0 4px; font-size: 20px; color: #0f172a; }
          .header p { margin: 2px 0; color: #64748b; font-size: 11px; }
          .title-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; background: #f8fafc; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; }
          .title-bar h2 { margin: 0; font-size: 14px; color: #1e293b; }
          .title-bar span { font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #f1f5f9; color: #334155; font-size: 11px; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11.5px; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          @media print {
            body { margin: 0.5cm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${activeTenant.name || 'SmartERP Enterprise'}</h1>
          <p>${activeTenant.address || ''} • Phone: ${activeTenant.phone || ''}</p>
          ${activeTenant.tin_number ? `<p>TIN: ${activeTenant.tin_number} | BIN: ${activeTenant.bin_number || activeTenant.vat_number || ''}</p>` : ''}
        </div>
        <div class="title-bar">
          <h2>${reportTitle}</h2>
          <span>Print Date: ${new Date().toLocaleString('en-GB')}</span>
        </div>
        <table>
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
        <div class="footer">
          Generated automatically by SmartERP System • Multi-Tenant Enterprise Core
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 300);
    }
  };

  return (
    <div className="space-y-5 pb-12 max-w-[1700px] mx-auto animate-in fade-in duration-200">
      
      {/* 1. HERO STORE PROFILE & QUICK ACTION COMMAND BAR */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-7 rounded-3xl border border-indigo-800/40 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-900/50 shrink-0 border border-white/20">
                {activeTenant?.name ? activeTenant.name.slice(0, 1) : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {activeTenant?.name || 'SmartERP Enterprise'}
                  </h1>
                  <span className="px-3 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 rounded-full text-xs font-mono font-bold backdrop-blur-md">
                    {activeTenant?.code || 'MAIN'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full text-[11px] font-semibold backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {isEn ? `Active Store (${currencySymbol})` : `সক্রিয় অনলাইন শপ (${currencySymbol})`}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2.5 flex-wrap">
                  {activeTenant?.address && <span>📍 {activeTenant.address}</span>}
                  {activeTenant?.phone && <span>• 📞 {activeTenant.phone}</span>}
                  {activeTenant?.tin_number && (
                    <span className="font-mono text-indigo-200 bg-white/5 px-2 py-0.5 rounded border border-white/10">TIN: {activeTenant.tin_number}</span>
                  )}
                  {activeTenant?.bin_number && (
                    <span className="font-mono text-emerald-200 bg-white/5 px-2 py-0.5 rounded border border-white/10">BIN: {activeTenant.bin_number}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Launch Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 pt-2 xl:pt-0 w-full xl:w-auto">
            <button
              type="button"
              onClick={() => onNavigate('pos_sales')}
              className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl shadow-emerald-950/40 transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.98] border border-emerald-400/30"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="truncate">{isEn ? 'POS Billing' : 'POS ক্যাশ কাউন্টার'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border border-blue-400/30 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl shadow-indigo-950/40 backdrop-blur-md transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4 text-blue-200 shrink-0" />
              <span className="truncate">{isEn ? '+ Add Stock' : '+ নতুন পণ্য স্টক'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white border border-rose-400/30 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl shadow-rose-950/40 backdrop-blur-md transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
            >
              <BookMarked className="w-4 h-4 text-rose-200 shrink-0" />
              <span className="truncate">{isEn ? 'Due (CRM)' : 'বাকি খাতা (CRM)'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 backdrop-blur-md transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="truncate">{isEn ? 'P&L Reports' : 'লাভ-ক্ষতি ও রিপোর্ট'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORE FINANCIAL & OPERATIONAL KPIS */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 truncate">
            <span>📊</span>
            <span>{isEn ? 'Business Metric Cards' : 'বিজনেস মেট্রিক্স কার্ড'}</span>
          </span>
          <span className="text-[9.5px] sm:text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 flex items-center gap-1.5 shadow-2xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
            {isEn ? 'Tap to view table' : 'ক্লিক করে টেবিল দেখুন'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3.5">
          
          {/* Card 1: Today's Sales */}
          <div 
            onClick={() => handleCardClick('today_sales')}
            className={`p-3 sm:p-4 rounded-2xl border-2 transition-all group cursor-pointer active:scale-[0.98] ${
              activeInlineTab === 'today_sales'
                ? 'bg-emerald-50/70 border-emerald-600 shadow-lg ring-4 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 truncate">{isEn ? "Today's Sales" : 'আজকের বিক্রি'}</span>
              <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeInlineTab === 'today_sales' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-black text-slate-900 font-mono tracking-tight group-hover:text-emerald-700 transition-colors">
              {currencySymbol}{todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-emerald-600 font-semibold mt-1.5 sm:mt-2 pt-1 sm:pt-1.5 border-t border-slate-100">
              <span className="flex items-center gap-1 truncate">
                <TrendingUp className="w-3 h-3 shrink-0" />
                <span>{todaySales.length} {isEn ? 'Inv' : 'ইনভয়েস'}</span>
              </span>
              <span className={`text-[9px] sm:text-[9.5px] font-bold shrink-0 ${activeInlineTab === 'today_sales' ? 'text-emerald-700 underline' : 'text-slate-400 group-hover:text-emerald-600'}`}>
                {activeInlineTab === 'today_sales' ? '▼' : '▼'}
              </span>
            </div>
          </div>

          {/* Card 2: Current Month Sales */}
          <div 
            onClick={() => handleCardClick('month_sales')}
            className={`p-3 sm:p-4 rounded-2xl border-2 transition-all group cursor-pointer active:scale-[0.98] ${
              activeInlineTab === 'month_sales'
                ? 'bg-indigo-50/70 border-indigo-600 shadow-lg ring-4 ring-indigo-500/20'
                : 'bg-white border-slate-200 hover:border-indigo-500 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 truncate">{isEn ? 'Monthly Sales' : 'মাসের বিক্রি'}</span>
              <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeInlineTab === 'month_sales' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-black text-slate-900 font-mono tracking-tight group-hover:text-indigo-700 transition-colors">
              {currencySymbol}{monthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-indigo-600 font-semibold mt-1.5 sm:mt-2 pt-1 sm:pt-1.5 border-t border-slate-100">
              <span className="truncate">{currentMonthSales.length} {isEn ? 'Sales' : 'টি বিক্রি'}</span>
              <span className={`text-[9px] sm:text-[9.5px] font-bold shrink-0 ${activeInlineTab === 'month_sales' ? 'text-indigo-700 underline' : 'text-slate-400 group-hover:text-indigo-600'}`}>
                {activeInlineTab === 'month_sales' ? '▼' : '▼'}
              </span>
            </div>
          </div>

          {/* Card 3: Estimated Net Profit */}
          <div 
            onClick={() => handleCardClick('profit_breakdown')}
            className={`p-3 sm:p-4 rounded-2xl border-2 transition-all group cursor-pointer active:scale-[0.98] ${
              activeInlineTab === 'profit_breakdown'
                ? 'bg-teal-50/70 border-teal-600 shadow-lg ring-4 ring-teal-500/20'
                : 'bg-white border-slate-200 hover:border-teal-500 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 truncate">{isEn ? 'Est. Profit' : 'আনুমানিক লাভ'}</span>
              <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeInlineTab === 'profit_breakdown' ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white'}`}>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-black text-teal-700 font-mono tracking-tight group-hover:text-teal-800 transition-colors">
              {currencySymbol}{totalEstimatedProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-teal-600 font-semibold mt-1.5 sm:mt-2 pt-1 sm:pt-1.5 border-t border-slate-100">
              <span className="flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>{isEn ? 'Margin' : 'মার্জিন'}</span>
              </span>
              <span className={`text-[9px] sm:text-[9.5px] font-bold shrink-0 ${activeInlineTab === 'profit_breakdown' ? 'text-teal-700 underline' : 'text-slate-400 group-hover:text-teal-600'}`}>
                {activeInlineTab === 'profit_breakdown' ? '▼' : '▼'}
              </span>
            </div>
          </div>

          {/* Card 4: Customer Due Book */}
          <div 
            onClick={() => handleCardClick('customer_dues')}
            className={`p-3 sm:p-4 rounded-2xl border-2 transition-all group cursor-pointer active:scale-[0.98] ${
              activeInlineTab === 'customer_dues'
                ? 'bg-rose-50/70 border-rose-600 shadow-lg ring-4 ring-rose-500/20'
                : 'bg-white border-slate-200 hover:border-rose-500 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 truncate">{isEn ? 'Due (CRM)' : 'মোট বাকি'}</span>
              <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeInlineTab === 'customer_dues' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'}`}>
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-black text-rose-600 font-mono tracking-tight group-hover:text-rose-700 transition-colors">
              {currencySymbol}{totalDueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-rose-600 font-medium mt-1.5 sm:mt-2 pt-1 sm:pt-1.5 border-t border-slate-100">
              <span className="truncate">{dueCustomersCount} {isEn ? 'Cust' : 'জন বাকি'}</span>
              <span className={`text-[9px] sm:text-[9.5px] font-bold shrink-0 ${activeInlineTab === 'customer_dues' ? 'text-rose-700 underline' : 'text-slate-400 group-hover:text-rose-600'}`}>
                {activeInlineTab === 'customer_dues' ? '▼' : '▼'}
              </span>
            </div>
          </div>

          {/* Card 5: Inventory Valuation */}
          <div 
            onClick={() => handleCardClick('stock_valuation')}
            className={`p-3 sm:p-4 rounded-2xl border-2 transition-all group cursor-pointer active:scale-[0.98] ${
              activeInlineTab === 'stock_valuation'
                ? 'bg-blue-50/70 border-blue-600 shadow-lg ring-4 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 truncate">{isEn ? 'Stock Val' : 'স্টক মূল্য'}</span>
              <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeInlineTab === 'stock_valuation' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-black text-slate-900 font-mono tracking-tight group-hover:text-blue-700 transition-colors">
              {currencySymbol}{totalStockSellingValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-blue-600 font-medium mt-1.5 sm:mt-2 pt-1 sm:pt-1.5 border-t border-slate-100">
              <span className="truncate">{totalStockUnits.toLocaleString()} {isEn ? 'Items' : 'পিস'}</span>
              <span className={`text-[9px] sm:text-[9.5px] font-bold shrink-0 ${activeInlineTab === 'stock_valuation' ? 'text-blue-700 underline' : 'text-slate-400 group-hover:text-blue-600'}`}>
                {activeInlineTab === 'stock_valuation' ? '▼' : '▼'}
              </span>
            </div>
          </div>

          {/* Card 6: Low Stock Alert */}
          <div 
            onClick={() => handleCardClick('low_stock')}
            className={`p-3 sm:p-4 rounded-2xl border-2 transition-all group cursor-pointer active:scale-[0.98] ${
              activeInlineTab === 'low_stock'
                ? 'bg-amber-50/70 border-amber-600 shadow-lg ring-4 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 truncate">{isEn ? 'Low Stock' : 'লো-স্টক'}</span>
              <div className={`p-1.5 sm:p-2 rounded-xl transition-all ${activeInlineTab === 'low_stock' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'}`}>
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-black text-amber-700 font-mono tracking-tight group-hover:text-amber-800 transition-colors">
              {lowStockProducts.length} <span className="text-xs font-semibold text-slate-500">{isEn ? 'SKUs' : 'টি পণ্য'}</span>
            </div>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-amber-600 font-medium mt-1.5 sm:mt-2 pt-1 sm:pt-1.5 border-t border-slate-100">
              <span className="truncate">{lowStockProducts.reduce((s, p) => s + Math.max(0, p.min_stock_alert - p.stock_quantity), 0)} {isEn ? 'Short' : 'ঘাটতি'}</span>
              <span className={`text-[9px] sm:text-[9.5px] font-bold shrink-0 ${activeInlineTab === 'low_stock' ? 'text-amber-700 underline' : 'text-slate-400 group-hover:text-amber-600'}`}>
                {activeInlineTab === 'low_stock' ? '▼' : '▼'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DIRECT INLINE DETAILED TABLE SECTION */}
      {activeInlineTab && (
        <div ref={inlineTableRef} className="bg-white rounded-3xl border-2 border-indigo-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* Inline Section Header & Quick Switch Tabs */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shrink-0 border border-white/20">
                {activeInlineTab === 'today_sales' && <Coins className="w-5 h-5 text-emerald-300" />}
                {activeInlineTab === 'month_sales' && <Calendar className="w-5 h-5 text-indigo-300" />}
                {activeInlineTab === 'profit_breakdown' && <Sparkles className="w-5 h-5 text-teal-300" />}
                {activeInlineTab === 'customer_dues' && <Users className="w-5 h-5 text-rose-300" />}
                {activeInlineTab === 'stock_valuation' && <Package className="w-5 h-5 text-blue-300" />}
                {activeInlineTab === 'low_stock' && <AlertTriangle className="w-5 h-5 text-amber-300" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-white">
                    {activeInlineTab === 'today_sales' && (isEn ? "Today's Sales & Invoices Detailed Register" : "আজকের বিক্রয় ও ইনভয়েস বিস্তারিত তালিকা")}
                    {activeInlineTab === 'month_sales' && (isEn ? "Monthly Complete Sales Ledger" : "চলতি মাসের সম্পূর্ণ বিক্রয় বিবরণী তালিকা")}
                    {activeInlineTab === 'profit_breakdown' && (isEn ? "Product Profit Margin & Analytics Table" : "পণ্যভিত্তিক নিট লাভ ও মার্জিন বিশ্লেষণ তালিকা")}
                    {activeInlineTab === 'customer_dues' && (isEn ? "Customer Due Book & Ledger" : "কাস্টমার বকেয়া খাতা ও লেজার তালিকা")}
                    {activeInlineTab === 'stock_valuation' && (isEn ? "Inventory Valuation & Stock Table" : "স্টক পণ্যের মূল্যায়ন ও ইনভেন্টরি তালিকা")}
                    {activeInlineTab === 'low_stock' && (isEn ? "Low Stock & Reorder Warning Table" : "লো-স্টক ও রি-অর্ডার সতর্কতা তালিকা")}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-400/30">
                    {isEn ? 'Direct Dashboard Table' : 'সরাসরি ড্যাশবোর্ড ভিউ'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  {activeInlineTab === 'today_sales' && (isEn ? `Today's Revenue: ${currencySymbol}${todayRevenue.toFixed(2)} (${todaySales.length} invoices)` : `আজকের মোট বিক্রি: ${currencySymbol}${todayRevenue.toFixed(2)} (${todaySales.length} টি ইনভয়েস)`)}
                  {activeInlineTab === 'month_sales' && (isEn ? `Monthly Revenue: ${currencySymbol}${monthRevenue.toFixed(2)} (${currentMonthSales.length} sales)` : `চলতি মাসের মোট বিক্রি: ${currencySymbol}${monthRevenue.toFixed(2)} (${currentMonthSales.length} টি বিক্রি)`)}
                  {activeInlineTab === 'profit_breakdown' && (isEn ? `Total Estimated Profit: ${currencySymbol}${totalEstimatedProfit.toFixed(2)}` : `সর্বমোট আনুমানিক নিট লাভ: ${currencySymbol}${totalEstimatedProfit.toFixed(2)}`)}
                  {activeInlineTab === 'customer_dues' && (isEn ? `Total Customer Due: ${currencySymbol}${totalDueAmount.toFixed(2)} (${dueCustomersCount} customers)` : `সর্বমোট বকেয়া: ${currencySymbol}${totalDueAmount.toFixed(2)} (${dueCustomersCount} জন বাকিদার)`)}
                  {activeInlineTab === 'stock_valuation' && (isEn ? `Stock Selling Value: ${currencySymbol}${totalStockSellingValue.toFixed(0)} | Cost Value: ${currencySymbol}${totalStockPurchaseValue.toFixed(0)}` : `মোট স্টক বিক্রয় মূল্য: ${currencySymbol}${totalStockSellingValue.toFixed(0)} | ক্রয় মূল্য: ${currencySymbol}${totalStockPurchaseValue.toFixed(0)}`)}
                  {activeInlineTab === 'low_stock' && (isEn ? `Items Below Reorder Threshold: ${lowStockProducts.length} items` : `রি-অর্ডার সীমার নিচে মোট: ${lowStockProducts.length} টি পণ্য`)}
                </p>
              </div>
            </div>

            {/* Quick Switch Switcher Tabs & Collapse Button */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="flex bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/60 overflow-x-auto max-w-full shadow-inner">
                {[
                  { id: 'today_sales', label: isEn ? "Today Sales" : 'আজকের বিক্রি' },
                  { id: 'month_sales', label: isEn ? "Month Sales" : 'মাসের বিক্রি' },
                  { id: 'profit_breakdown', label: isEn ? "Net Profit" : 'নিট লাভ' },
                  { id: 'customer_dues', label: isEn ? "Due Book" : 'বাকি খাতা' },
                  { id: 'stock_valuation', label: isEn ? "Stock Value" : 'স্টক মান' },
                  { id: 'low_stock', label: isEn ? "Stock Alert" : 'স্টক অ্যালার্ট' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleCardClick(t.id as DrilldownType)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeInlineTab === t.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveInlineTab(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
                title={isEn ? "Hide Table" : "টেবিল লুকান"}
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">{isEn ? 'Hide' : 'লুকান'}</span>
              </button>
            </div>

          </div>

          {/* Action Toolbar: Search, Print, Export & Shortcuts */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={drilldownSearch}
                onChange={(e) => setDrilldownSearch(e.target.value)}
                placeholder={isEn ? "Search name, phone, code or invoice..." : "নাম, ফোন, কোড বা ইনভয়েস নং দিয়ে ফিল্টার করুন..."}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-2xs"
              />
            </div>

            {/* Print, Export & Navigation Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={handlePrintTableReport}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:text-indigo-600 transition-colors"
                title={isEn ? "Print Table Report" : "সম্পূর্ণ টেবিল রিপোর্ট প্রিন্ট করুন"}
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span className="truncate">{isEn ? 'Print Report' : 'প্রিন্ট রিপোর্ট'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:text-emerald-600 transition-colors"
                title={isEn ? "Download CSV / Excel file" : "CSV / Excel ফাইলে ডাউনলোড করুন"}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate">{isEn ? 'Export (CSV)' : 'এক্সপোর্ট (CSV)'}</span>
              </button>

              {activeInlineTab === 'customer_dues' && (
                <button
                  type="button"
                  onClick={() => onNavigate('customers')}
                  className="col-span-2 sm:col-span-1 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="truncate">{isEn ? 'Open Due Book' : 'বাকি খাতা খুলুন'}</span>
                </button>
              )}

              {activeInlineTab === 'stock_valuation' && (
                <button
                  type="button"
                  onClick={() => onNavigate('products')}
                  className="col-span-2 sm:col-span-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span className="truncate">{isEn ? 'Stock Manager' : 'স্টক ম্যানেজার'}</span>
                </button>
              )}

              {activeInlineTab === 'low_stock' && (
                <button
                  type="button"
                  onClick={() => onNavigate('products')}
                  className="col-span-2 sm:col-span-1 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="truncate">{isEn ? 'Purchase Stock' : 'পণ্য ক্রয় / স্টক ইন'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Content Area */}
          <div className="overflow-x-auto min-h-[260px]">
            
            {/* 1 & 2: TODAY'S & MONTHLY SALES TABLE */}
            {(activeInlineTab === 'today_sales' || activeInlineTab === 'month_sales') && (() => {
              const sourceSales = activeInlineTab === 'today_sales' ? todaySales : currentMonthSales;
              const filtered = sourceSales.filter(s => 
                s.invoice_no.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                s.customer_name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                (s.customer_phone && s.customer_phone.includes(drilldownSearch)) ||
                s.payment_method.toLowerCase().includes(drilldownSearch.toLowerCase())
              );

              const totalItems = filtered.length;
              const totalPages = Math.ceil(totalItems / pageSize) || 1;
              const paginatedSales = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

              if (totalItems === 0) {
                return (
                  <div className="text-center py-12 text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-bold text-slate-600">{isEn ? 'No sales records found' : 'কোনো বিক্রয় রেকর্ড পাওয়া যায়নি'}</p>
                  </div>
                );
              }

              return (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold text-slate-700">
                      <th className="p-3 w-12 text-center">SL</th>
                      <th className="p-3">{isEn ? 'Invoice No' : 'ইনভয়েস নং'}</th>
                      <th className="p-3">{isEn ? 'Date & Time' : 'তারিখ ও সময়'}</th>
                      <th className="p-3">{isEn ? 'Customer Name & Phone' : 'কাস্টমার নাম ও ফোন'}</th>
                      <th className="p-3 text-center">{isEn ? 'Items' : 'আইটেম'}</th>
                      <th className="p-3">{isEn ? 'Payment' : 'পেমেন্ট মাধ্যম'}</th>
                      <th className="p-3 text-right">{isEn ? 'Grand Total' : 'মোট প্রদেয়'}</th>
                      <th className="p-3 text-right">{isEn ? 'Paid' : 'আদায়'}</th>
                      <th className="p-3 text-right">{isEn ? 'Due' : 'বকেয়া'}</th>
                      <th className="p-3 text-center">{isEn ? 'Status' : 'অবস্থা'}</th>
                      <th className="p-3 text-center w-16">{isEn ? 'Print' : 'প্রিন্ট'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11.5px]">
                    {paginatedSales.map((sale, idx) => (
                      <tr key={sale.id} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="p-3 text-center text-slate-400 font-mono">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="p-3 font-mono font-bold text-indigo-700">{sale.invoice_no}</td>
                        <td className="p-3 font-mono text-slate-600 text-[10.5px]">
                          {new Date(sale.created_at).toLocaleDateString('en-GB')} {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{sale.customer_name}</span>
                          {sale.customer_phone && <span className="text-[10px] text-slate-400 font-mono">{sale.customer_phone}</span>}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {sale.items.length} {isEn ? 'items' : 'টি'}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10.5px] font-semibold text-slate-700">
                            {sale.payment_method}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {currencySymbol}{sale.grand_total.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">
                          {currencySymbol}{sale.paid_amount.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600">
                          {sale.due_amount > 0 ? `${currencySymbol}${sale.due_amount.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sale.payment_status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sale.payment_status === 'DUE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {sale.payment_status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handlePrintSale(sale)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title={isEn ? "Print Invoice Receipt" : "ইনভয়েস প্রিন্ট করুন"}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}

            {/* 3: PROFIT BREAKDOWN TABLE */}
            {activeInlineTab === 'profit_breakdown' && (() => {
              const filtered = profitList.filter(p =>
                p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                p.category.toLowerCase().includes(drilldownSearch.toLowerCase())
              );

              const totalItems = filtered.length;
              const totalPages = Math.ceil(totalItems / pageSize) || 1;
              const paginatedProfit = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

              if (totalItems === 0) {
                return (
                  <div className="text-center py-12 text-slate-400">
                    <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-bold text-slate-600">{isEn ? 'No profit analytics data found' : 'কোনো লাভ মার্জিন ডাটা পাওয়া যায়নি'}</p>
                  </div>
                );
              }

              return (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold text-slate-700">
                      <th className="p-3 w-12 text-center">SL</th>
                      <th className="p-3">{isEn ? 'Product Name' : 'পণ্যের নাম'}</th>
                      <th className="p-3">{isEn ? 'Category' : 'ক্যাটাগরি'}</th>
                      <th className="p-3 text-center">{isEn ? 'Qty Sold' : 'বিক্রিত পরিমাণ'}</th>
                      <th className="p-3 text-right">{isEn ? 'Total Cost' : 'মোট ক্রয় খরচ'}</th>
                      <th className="p-3 text-right">{isEn ? 'Total Revenue' : 'মোট বিক্রয় রেভিনিউ'}</th>
                      <th className="p-3 text-right">{isEn ? 'Net Profit' : 'নিট লাভ (৳)'}</th>
                      <th className="p-3 text-right">{isEn ? 'Margin (%)' : 'প্রফিট মার্জিন (%)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11.5px]">
                    {paginatedProfit.map((p, idx) => {
                      const marginPercent = p.totalRevenue > 0 ? ((p.netProfit / p.totalRevenue) * 100).toFixed(1) : '0';
                      return (
                        <tr key={p.id} className="hover:bg-teal-50/40 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-mono">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="p-3 font-bold text-slate-900">{p.name}</td>
                          <td className="p-3 text-slate-500 font-semibold">{p.category || 'General'}</td>
                          <td className="p-3 text-center font-bold text-slate-800">{p.qtySold} {isEn ? 'pcs' : 'পিস'}</td>
                          <td className="p-3 text-right font-mono text-slate-600">{currencySymbol}{p.totalCost.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">{currencySymbol}{p.totalRevenue.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-black text-teal-700">{currencySymbol}{p.netProfit.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            <span className="px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                              {marginPercent}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}

            {/* 4: CUSTOMER DUES LEDGER TABLE */}
            {activeInlineTab === 'customer_dues' && (() => {
              const filtered = customers
                .filter(c => (c.current_due || 0) > 0)
                .filter(c =>
                  c.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                  c.phone.includes(drilldownSearch) ||
                  (c.address && c.address.toLowerCase().includes(drilldownSearch.toLowerCase()))
                );

              const totalItems = filtered.length;
              const totalPages = Math.ceil(totalItems / pageSize) || 1;
              const paginatedCustomers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

              if (totalItems === 0) {
                return (
                  <div className="text-center py-12 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
                    <p className="font-bold text-slate-700">{isEn ? 'All customer dues are cleared!' : 'কোনো কাস্টমারের বকেয়া নেই!'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{isEn ? 'Zero outstanding balance' : 'সব বাকি সফলভাবে পরিশোধিত'}</p>
                  </div>
                );
              }

              return (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold text-slate-700">
                      <th className="p-3 w-12 text-center">SL</th>
                      <th className="p-3">{isEn ? 'Customer Name' : 'কাস্টমার নাম'}</th>
                      <th className="p-3">{isEn ? 'Mobile Phone' : 'মোবাইল ফোন'}</th>
                      <th className="p-3">{isEn ? 'Address' : 'ঠিকানা'}</th>
                      <th className="p-3 text-right">{isEn ? 'Total Spent' : 'মোট কেনাকাটা'}</th>
                      <th className="p-3 text-right">{isEn ? 'Current Due' : 'বর্তমান বকেয়া (৳)'}</th>
                      <th className="p-3 text-center">{isEn ? 'Action' : 'অ্যাকশন'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11.5px]">
                    {paginatedCustomers.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-rose-50/40 transition-colors">
                        <td className="p-3 text-center text-slate-400 font-mono">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{c.name}</td>
                        <td className="p-3 font-mono text-slate-700 font-semibold">{c.phone}</td>
                        <td className="p-3 text-slate-500">{c.address || '-'}</td>
                        <td className="p-3 text-right font-mono text-slate-500">{currencySymbol}{(c.total_spent || 0).toFixed(2)}</td>
                        <td className="p-3 text-right font-mono font-black text-rose-600 text-sm">
                          {currencySymbol}{c.current_due.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => onNavigate('customers')}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10.5px] font-bold cursor-pointer transition-colors"
                          >
                            {isEn ? 'Collect Due >' : 'বাকি আদায় >'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}

            {/* 5: INVENTORY VALUATION TABLE */}
            {activeInlineTab === 'stock_valuation' && (() => {
              const filtered = products.filter(p =>
                p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                p.code.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                (p.barcode && p.barcode.includes(drilldownSearch)) ||
                p.category_name.toLowerCase().includes(drilldownSearch.toLowerCase())
              );

              const totalItems = filtered.length;
              const totalPages = Math.ceil(totalItems / pageSize) || 1;
              const paginatedProducts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

              if (totalItems === 0) {
                return (
                  <div className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-bold text-slate-600">{isEn ? 'No products found' : 'কোনো পণ্য পাওয়া যায়নি'}</p>
                  </div>
                );
              }

              return (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold text-slate-700">
                      <th className="p-3 w-12 text-center">SL</th>
                      <th className="p-3">{isEn ? 'SKU / Code' : 'পণ্য কোড / SKU'}</th>
                      <th className="p-3">{isEn ? 'Product Name' : 'পণ্যের নাম'}</th>
                      <th className="p-3">{isEn ? 'Category' : 'ক্যাটাগরি'}</th>
                      <th className="p-3 text-center">{isEn ? 'Stock Qty' : 'স্টক পরিমাণ'}</th>
                      <th className="p-3 text-right">{isEn ? 'Unit Cost' : 'একক ক্রয় দর'}</th>
                      <th className="p-3 text-right">{isEn ? 'Selling Price' : 'একক বিক্রয় দর'}</th>
                      <th className="p-3 text-right">{isEn ? 'Total Cost' : 'মোট ক্রয় মান'}</th>
                      <th className="p-3 text-right">{isEn ? 'Total Value' : 'মোট বিক্রয় মান'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11.5px]">
                    {paginatedProducts.map((p, idx) => {
                      const costVal = p.stock_quantity * (p.purchase_price || 0);
                      const sellVal = p.stock_quantity * (p.selling_price || 0);
                      return (
                        <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-mono">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-700">{p.code}</td>
                          <td className="p-3 font-bold text-slate-900">{p.name}</td>
                          <td className="p-3 text-slate-500 font-semibold">{p.category_name}</td>
                          <td className="p-3 text-center">
                            <span className={`font-mono font-bold px-2.5 py-0.5 rounded-lg ${
                              p.stock_quantity <= p.min_stock_alert ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {p.stock_quantity} {p.unit || ''}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-600">{currencySymbol}{(p.purchase_price || 0).toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">{currencySymbol}{(p.selling_price || 0).toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-slate-700">{currencySymbol}{costVal.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-black text-blue-700">{currencySymbol}{sellVal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}

            {/* 6: LOW STOCK TABLE */}
            {activeInlineTab === 'low_stock' && (() => {
              const filtered = lowStockProducts.filter(p =>
                p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                p.code.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                p.category_name.toLowerCase().includes(drilldownSearch.toLowerCase())
              );

              const totalItems = filtered.length;
              const totalPages = Math.ceil(totalItems / pageSize) || 1;
              const paginatedLowStock = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

              if (totalItems === 0) {
                return (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
                    <p className="font-bold text-slate-700">{isEn ? 'All items have sufficient stock!' : 'সকল পণ্যের পর্যাপ্ত স্টক রয়েছে!'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{isEn ? 'No products under reorder threshold' : 'কোনো পণ্য রি-অর্ডার সীমার নিচে নেই'}</p>
                  </div>
                );
              }

              return (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold text-slate-700">
                      <th className="p-3 w-12 text-center">SL</th>
                      <th className="p-3">{isEn ? 'Code' : 'পণ্য কোড'}</th>
                      <th className="p-3">{isEn ? 'Product Name' : 'পণ্যের নাম'}</th>
                      <th className="p-3">{isEn ? 'Category' : 'ক্যাটাগরি'}</th>
                      <th className="p-3 text-center">{isEn ? 'Current Stock' : 'বর্তমান স্টক'}</th>
                      <th className="p-3 text-center">{isEn ? 'Alert Level' : 'অ্যালার্ট সীমা'}</th>
                      <th className="p-3 text-center">{isEn ? 'Shortage' : 'ঘাটতি পরিমাণ'}</th>
                      <th className="p-3 text-right">{isEn ? 'Cost Price' : 'ক্রয় মূল্য'}</th>
                      <th className="p-3 text-center">{isEn ? 'Action' : 'অ্যাকশন'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11.5px]">
                    {paginatedLowStock.map((p, idx) => {
                      const shortage = Math.max(0, p.min_stock_alert - p.stock_quantity);
                      return (
                        <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-mono">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-700">{p.code}</td>
                          <td className="p-3 font-bold text-slate-900">{p.name}</td>
                          <td className="p-3 text-slate-500 font-semibold">{p.category_name}</td>
                          <td className="p-3 text-center">
                            <span className="font-mono font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                              {p.stock_quantity} {p.unit || ''}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-600">
                            {p.min_stock_alert}
                          </td>
                          <td className="p-3 text-center font-mono font-black text-amber-700">
                            +{shortage}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700">
                            {currencySymbol}{(p.purchase_price || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => onNavigate('products')}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10.5px] font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              {isEn ? 'Add Stock >' : 'স্টক যোগ করুন >'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}

          </div>

          {/* PAGINATION & FOOTER CONTROLS */}
          {(() => {
            let totalItems = 0;
            if (activeInlineTab === 'today_sales') {
              totalItems = todaySales.filter(s => 
                s.invoice_no.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                s.customer_name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                (s.customer_phone && s.customer_phone.includes(drilldownSearch)) ||
                s.payment_method.toLowerCase().includes(drilldownSearch.toLowerCase())
              ).length;
            } else if (activeInlineTab === 'month_sales') {
              totalItems = currentMonthSales.filter(s => 
                s.invoice_no.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                s.customer_name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                (s.customer_phone && s.customer_phone.includes(drilldownSearch)) ||
                s.payment_method.toLowerCase().includes(drilldownSearch.toLowerCase())
              ).length;
            } else if (activeInlineTab === 'profit_breakdown') {
              totalItems = profitList.filter(p =>
                p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                p.category.toLowerCase().includes(drilldownSearch.toLowerCase())
              ).length;
            } else if (activeInlineTab === 'customer_dues') {
              totalItems = customers
                .filter(c => (c.current_due || 0) > 0)
                .filter(c =>
                  c.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                  c.phone.includes(drilldownSearch) ||
                  (c.address && c.address.toLowerCase().includes(drilldownSearch.toLowerCase()))
                ).length;
            } else if (activeInlineTab === 'stock_valuation') {
              totalItems = products.filter(p =>
                p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                p.code.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                (p.barcode && p.barcode.includes(drilldownSearch)) ||
                p.category_name.toLowerCase().includes(drilldownSearch.toLowerCase())
              ).length;
            } else if (activeInlineTab === 'low_stock') {
              totalItems = lowStockProducts.filter(p =>
                p.name.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                p.code.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                p.category_name.toLowerCase().includes(drilldownSearch.toLowerCase())
              ).length;
            }

            const totalPages = Math.ceil(totalItems / pageSize) || 1;
            const startIdx = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
            const endIdx = Math.min(currentPage * pageSize, totalItems);

            return (
              <div className="px-4 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                
                {/* Rows per page & Count Display */}
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span>{isEn ? 'Rows per page:' : 'প্রতি পেজে:'}</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <span className="font-medium text-slate-500">
                    {totalItems > 0 ? (
                      <>
                        {isEn ? 'Showing:' : 'প্রদর্শন:'} <b className="text-slate-800 font-mono">{startIdx} - {endIdx}</b> ({isEn ? 'Total' : 'সর্বমোট'} <b className="text-indigo-600 font-mono">{totalItems}</b> {isEn ? 'records' : 'টি রেকর্ড'})
                      </>
                    ) : (
                      isEn ? '0 records' : '০ টি রেকর্ড'
                    )}
                  </span>
                </div>

                {/* Pagination Navigation Controls */}
                <div className="flex items-center gap-1">
                  
                  {/* First Page */}
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title={isEn ? "First Page" : "প্রথম পেজ"}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Previous Page */}
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title={isEn ? "Previous Page" : "পূর্ববর্তী পেজ"}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Numbers */}
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

                  {/* Next Page */}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title={isEn ? "Next Page" : "পরবর্তী পেজ"}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title={isEn ? "Last Page" : "সর্বশেষ পেজ"}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>

                  {/* Collapse Button in Footer */}
                  <div className="pl-3 border-l border-slate-200 ml-2">
                    <button
                      type="button"
                      onClick={() => setActiveInlineTab(null)}
                      className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Hide' : 'লুকান'}</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })()}

        </div>
      )}

      {/* 4. SALES ANALYTICS & PAYMENT BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Weekly Sales Bar Graph */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>{isEn ? 'Weekly Sales Trend' : 'বিগত ৭ দিনের বিক্রয় চিত্র'}</span>
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">{isEn ? 'Realtime daily turnover analytics' : 'রিয়েলটাইম দৈনিক টার্নওভার বিশ্লেষণ'}</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
              {isEn ? 'Total: ' : 'সর্বমোট: '}{currencySymbol}{last7Days.reduce((a, b) => a + b.total, 0).toFixed(2)}
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2">
            {last7Days.map((day, idx) => {
              const heightPercent = Math.max(8, Math.min(100, (day.total / maxDayTotal) * 100));
              const isToday = idx === last7Days.length - 1;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                  <span className="text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded shadow-2xs border border-indigo-100">
                    {currencySymbol}{day.total.toFixed(0)}
                  </span>
                  
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all group-hover:scale-105" style={{ height: `${heightPercent}%` }}>
                    <div 
                      className={`w-full h-full rounded-t-xl transition-all ${
                        isToday 
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400' 
                          : 'bg-gradient-to-t from-indigo-600 to-blue-400 group-hover:from-indigo-700 group-hover:to-blue-500'
                      }`} 
                    />
                  </div>

                  <span className={`text-[10.5px] font-bold ${isToday ? 'text-emerald-700 font-extrabold' : 'text-slate-600'}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>{isEn ? 'Payment Methods Breakdown' : 'পেমেন্ট মাধ্যম অনুপাত (Payment Breakdown)'}</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">{isEn ? 'Total Sales' : 'সর্বমোট বিক্রি'}</span>
            </div>

            <div className="space-y-3 pt-3">
              {Object.entries(paymentBreakdown).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">{isEn ? 'No sales records yet' : 'কোনো বিক্রয় রেকর্ড নেই'}</p>
              ) : (
                Object.entries(paymentBreakdown).map(([method, amount]) => {
                  const percent = Math.round((amount / totalPaymentSum) * 100);
                  const isCash = method === 'CASH';
                  const isBkash = method.includes('BKASH') || method.includes('বিকাশ');
                  const isNagad = method.includes('NAGAD') || method.includes('নগদ');
                  const isCard = method.includes('CARD') || method.includes('কার্ড');
                  const isDue = method.includes('DUE') || method.includes('বাকি');

                  const colorClass = isCash
                    ? 'bg-emerald-500'
                    : isBkash
                    ? 'bg-pink-500'
                    : isNagad
                    ? 'bg-amber-500'
                    : isCard
                    ? 'bg-blue-500'
                    : isDue
                    ? 'bg-rose-500'
                    : 'bg-indigo-500';

                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{method}</span>
                        <span className="font-mono text-slate-600">{currencySymbol}{amount.toFixed(2)} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colorClass} rounded-full transition-all`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>{isEn ? 'Digital & Cash Payment Ratio' : 'ডিজিটাল ও ক্যাশ পেমেন্ট রেশিও'}</span>
            <button
              type="button"
              onClick={() => onNavigate('global_settings')}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              {isEn ? 'Payment Gateways >' : 'পেমেন্ট গেটওয়ে সেটিংস >'}
            </button>
          </div>
        </div>

      </div>

      {/* 5. QUICK LAUNCH ACTIONS HUB */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>{isEn ? 'Quick Operations & Module Shortcuts' : 'কুইক অ্যাকশন হাব ও মডিউল শর্টকাট (Quick Operations)'}</span>
          </h2>
          <span className="text-[10px] text-slate-400">{isEn ? 'One-click quick navigation' : 'দ্রুত এক ক্লিকে নেভিগেট করুন'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { id: 'pos_sales', title: isEn ? 'POS Billing' : 'POS কাউন্টার', sub: isEn ? 'Quick Sale' : 'কুইক চেকআউট', icon: ShoppingCart, color: 'from-emerald-500 to-teal-600' },
            { id: 'products', title: isEn ? 'Products' : 'পণ্য ও স্টক', sub: isEn ? 'Inventory' : 'ইনভেন্টরি ম্যানেজ', icon: Package, color: 'from-blue-500 to-indigo-600' },
            { id: 'customers', title: isEn ? 'Due CRM' : 'বাকি খাতা (CRM)', sub: isEn ? 'Customers' : 'কাস্টমার লেজার', icon: Users, color: 'from-rose-500 to-pink-600' },
            { id: 'accounting', title: isEn ? 'Accounts' : 'হিসাব ও খাতা', sub: isEn ? 'Cash Ledger' : 'আয় ও ব্যয় রেজিস্টার', icon: DollarSign, color: 'from-indigo-500 to-purple-600' },
            { id: 'reports', title: isEn ? 'Reports' : 'রিপোর্ট ও লাভ', sub: isEn ? 'Analytics' : 'ব্যবসায়িক অ্যানালিটিক্স', icon: FileSpreadsheet, color: 'from-amber-500 to-orange-600' },
            { id: 'barcode_studio', title: isEn ? 'Barcode' : 'বারকোড স্টুডিও', sub: isEn ? 'Print Sticker' : 'স্টিকার প্রিন্ট', icon: Barcode, color: 'from-cyan-500 to-blue-600' },
            { id: 'digital_services', title: isEn ? 'Services' : 'ডিজিটাল সেবা', sub: isEn ? 'Rate Cards' : 'ফটোকপি ও বিল পে', icon: Smartphone, color: 'from-purple-500 to-indigo-600' },
            { id: 'global_settings', title: isEn ? 'Settings' : 'সিস্টেম সেটিংস', sub: isEn ? 'Shop & Config' : 'দোকান ও টেমপ্লেট', icon: Sliders, color: 'from-slate-700 to-slate-900' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-2xs hover:shadow-lg transition-all flex flex-col items-center text-center gap-2 group cursor-pointer active:scale-95"
              >
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 block group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">
                    {item.sub}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. TOP SELLING PRODUCTS & RECENT SALES FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Top Selling Products */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>{isEn ? 'Top Selling Products' : 'সর্বোচ্চ বিক্রিত পণ্য (Top Selling Products)'}</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              {isEn ? 'All Products >' : 'সব পণ্য >'}
            </button>
          </div>

          {topSellingProducts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">{isEn ? 'No sales data yet' : 'কোনো বিক্রয় ডাটা নেই'}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {topSellingProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {p.category || 'General'} • {isEn ? 'Stock:' : 'স্টক:'} <b>{p.currentStock}</b>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700 text-sm block">
                      {currencySymbol}{p.totalRevenue.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {p.qtySold} {isEn ? 'sold' : 'পিস বিক্রয়'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices & Billing Feed */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>{isEn ? 'Recent Invoices' : 'সাম্প্রতিক বিক্রয় ও ইনভয়েস (Recent Invoices)'}</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              {isEn ? 'Invoice Report >' : 'ইনভয়েস রিপোর্ট >'}
            </button>
          </div>

          {sales.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">{isEn ? 'No invoices issued yet' : 'কোনো ইনভয়েস ইস্যু করা হয়নি'}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/60 rounded-xl px-1.5 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700">{sale.invoice_no}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                        sale.payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sale.payment_status === 'DUE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {sale.payment_status}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      {sale.customer_name} • {sale.items.length} {isEn ? 'items' : 'আইটেম'} • {sale.payment_method}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900 text-sm block">
                      {currencySymbol}{sale.grand_total.toFixed(2)}
                    </span>
                    <span className="text-[9.5px] text-slate-400 font-mono">
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 7. SPECIALIZED INDUSTRY PANELS */}
      {(hasTelecom || hasGrocery || hasLibrary) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Telecom Desk */}
          {hasTelecom && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900">{isEn ? 'Telecom & Repairs Desk' : 'টেলিকম ও সার্ভিস সেন্টার'}</h3>
                </div>
                <Badge variant="primary">Active</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <span className="text-[9.5px] text-slate-500 font-bold uppercase block">{isEn ? 'IMEI Stock' : 'ইনভেন্টরি IMEI'}</span>
                  <span className="text-base font-bold text-blue-700 font-mono mt-0.5 block">{availableDevices.length} {isEn ? 'Devices' : 'টি'}</span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                  <span className="text-[9.5px] text-slate-500 font-bold uppercase block">{isEn ? 'Repairs Pending' : 'মেরামত পেন্ডিং'}</span>
                  <span className="text-base font-bold text-amber-700 font-mono mt-0.5 block">{pendingRepairs.length} {isEn ? 'Tickets' : 'টি'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('telecom_imei')}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>{isEn ? 'View IMEI Registry' : 'IMEI রেজিস্ট্রি দেখুন'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Grocery Batch Desk */}
          {hasGrocery && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900">{isEn ? 'Grocery & Expiry Monitor' : 'মুদি ও এক্সপায়ারি মনিটর'}</h3>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100">
                  <span className="text-[9.5px] text-slate-500 font-bold uppercase block">{isEn ? 'Expiring Batches' : 'মেয়াদোত্তীর্ণ ব্যাচ'}</span>
                  <span className="text-base font-bold text-rose-700 font-mono mt-0.5 block">{expiringBatches.length} {isEn ? 'Lots' : 'লট'}</span>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <span className="text-[9.5px] text-slate-500 font-bold uppercase block">{isEn ? 'Weight Scale Items' : 'ওজন স্কেল আইটেম'}</span>
                  <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                    {products.filter(p => p.tracking_mode === 'TRACKING_WEIGHT').length} {isEn ? 'Items' : 'টি'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('grocery_batches')}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>{isEn ? 'Track Batches & Expiry' : 'ব্যাচ ও মেয়াদ ট্র্যাক করুন'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Library Desk */}
          {hasLibrary && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-900">{isEn ? 'Bookstore & Circulation' : 'লাইব্রেরি ও বই লেনদেন'}</h3>
                </div>
                <Badge variant="purple">Active</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100">
                  <span className="text-[9.5px] text-slate-500 font-bold uppercase block">{isEn ? 'Borrowed Books' : 'ধারকৃত বই'}</span>
                  <span className="text-base font-bold text-purple-700 font-mono mt-0.5 block">{activeBorrows.length} {isEn ? 'Books' : 'টি'}</span>
                </div>
                <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100">
                  <span className="text-[9.5px] text-slate-500 font-bold uppercase block">{isEn ? 'Bookstore Catalog' : 'বুকস্টোর সেলস'}</span>
                  <span className="text-base font-bold text-purple-700 font-mono mt-0.5 block">{products.filter(p => p.category_name?.includes('বই') || p.category_name?.includes('খাতা')).length} {isEn ? 'Books' : 'টি'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('library_circulation')}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>{isEn ? 'Book Issue & Return' : 'বই ইস্যু ও রিটার্ন'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      )}

      {/* 8. SYSTEM SECURITY & AUDIT TRAIL */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>{isEn ? 'Security Audit Log' : 'সিস্টেম সিকিউরিটি ও সাম্প্রতিক অডিট লগ (Security Audit Log)'}</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('audit')}
            className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            {isEn ? 'All Audit Logs >' : 'সম্পূর্ণ অডিট লগ >'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {auditLogs.map(log => (
            <div key={log.id} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs">
                {log.severity === 'critical' || log.severity === 'warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 truncate">{log.action}</span>
                  <span className="text-[9.5px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 mt-0.5 truncate">{log.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
