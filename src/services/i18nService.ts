export type Language = 'bn' | 'en';

const TRANSLATIONS: Record<string, { bn: string; en: string }> = {
  // Navigation & Sections
  'nav.dashboard': { bn: 'ড্যাশবোর্ড (Overview)', en: 'Dashboard (Overview)' },
  'nav.pos_sales': { bn: 'POS কুইক বিলিং', en: 'POS Quick Billing' },
  'nav.products': { bn: 'পণ্য ও নতুন স্টক ইনওয়ার্ড', en: 'Products & Stock Inward' },
  'nav.products_catalog': { bn: 'পণ্য ও স্টক ক্যাটালগ', en: 'Products & Catalog' },
  'nav.digital_services': { bn: 'সেবা ও মূল্যহার তালিকা', en: 'Services & Rate Cards' },
  'nav.barcode_studio': { bn: 'বারকোড স্টিকার প্রিন্ট', en: 'Barcode Sticker Studio' },
  'nav.customers': { bn: 'কাস্টমার বাকির খাতা', en: 'Customer Due Ledger' },
  'nav.customers_crm': { bn: 'বাকি খাতা (CRM)', en: 'Customer Due Book (CRM)' },
  'nav.suppliers': { bn: 'সাপ্লায়ার ও বিল পেমেন্ট', en: 'Suppliers & Purchases' },
  'nav.accounting': { bn: 'হিসাব ও ক্যাশ খাতা', en: 'Accounts & Cash Ledger' },
  'nav.accounting_ledger': { bn: 'হিসাব ও খাতা', en: 'Accounting Ledger' },
  'nav.reports': { bn: 'রিপোর্ট ও অ্যানালিটিক্স', en: 'Reports & Analytics' },
  'nav.staff_management': { bn: 'কর্মচারী ও পারমিশন', en: 'Staff & Permissions' },
  'nav.global_settings': { bn: 'গ্লোবাল সেটিংস', en: 'Global Settings' },
  'nav.settings': { bn: 'সিস্টেম সেটিংস', en: 'System Settings' },
  'nav.audit': { bn: 'সিকিউরিটি অডিট লগ', en: 'Security Audit Logs' },
  'nav.tenant_provisioning': { bn: 'দোকান ও ডোমেন প্রভিশনিং', en: 'Shop & Domain Provisioning' },
  'nav.category_studio': { bn: 'বিজনেস ক্যাটাগরি স্টুডিও', en: 'Business Category Studio' },
  'nav.rbac_matrix': { bn: 'রোল ও পারমিশন ম্যাট্রিক্স', en: 'Role & Permission Matrix' },
  'nav.telecom_imei': { bn: 'IMEI হ্যান্ডসেট স্টক', en: 'IMEI Handset Inventory' },
  'nav.telecom_repairs': { bn: 'মোবাইল সার্ভিসিং', en: 'Device Repairs' },
  'nav.telecom_recharge': { bn: 'রিচার্জ ও MFS রেজিস্টার', en: 'Recharge & MFS Register' },
  'nav.grocery_batches': { bn: 'ব্যাচ ও মেয়াদ ট্র্যাকিং', en: 'Batch & Expiry Tracking' },
  'nav.grocery_scale': { bn: 'ডিজিটাল ওয়েট স্কেল', en: 'Digital Weighing Scale' },
  'nav.library_catalog': { bn: 'বই-খাতা ও প্রকাশনী ক্যাটালগ', en: 'Book & Stationery Catalog' },
  'nav.library_circulation': { bn: 'বুকস্টোর সেলস ও সাপ্লাই', en: 'Bookstore Sales & Circulation' },

  // Nav Groups
  'group.overview': { bn: 'সার্বিক চিত্র', en: 'OVERVIEW' },
  'group.sales': { bn: 'দৈনিক সেলস ও বিলিং', en: 'SALES & BILLING' },
  'group.inventory': { bn: 'ইনভেন্টরি ও স্টক', en: 'INVENTORY & STOCK' },
  'group.ledger': { bn: 'হিসাব ও লেজার', en: 'ACCOUNTS & LEDGERS' },
  'group.admin': { bn: 'দোকান প্রশাসন', en: 'SHOP ADMINISTRATION' },
  'group.super_admin': { bn: 'সিস্টেম অ্যাডমিন', en: 'SYSTEM ADMIN' },
  'group.telecom': { bn: 'টেলিকম ও সার্ভিস', en: 'TELECOM & REPAIRS' },
  'group.grocery': { bn: 'গ্রোসারি কন্ট্রোল', en: 'GROCERY CONTROL' },
  'group.stationery': { bn: 'বই ও স্টেশনারি ডেস্ক', en: 'BOOKSTORE & STATIONERY' },

  // Dashboard Metrics & Inline Tabs
  'dash.today_sales': { bn: 'আজকের বিক্রি', en: "Today's Sales" },
  'dash.month_sales': { bn: 'চলতি মাসের বিক্রি', en: 'Monthly Sales' },
  'dash.net_profit': { bn: 'আনুমানিক নিট লাভ', en: 'Estimated Net Profit' },
  'dash.customer_dues': { bn: 'মোট বাকি / খাতা', en: 'Customer Due Book' },
  'dash.stock_valuation': { bn: 'স্টক পণ্যের মান', en: 'Stock Valuation' },
  'dash.low_stock': { bn: 'স্টক সতর্কতা', en: 'Low Stock Alert' },
  'dash.invoices': { bn: 'ইনভয়েস তালিকা', en: 'Invoice List' },
  'dash.weekly_sales': { bn: 'বিগত ৭ দিনের বিক্রয় চিত্র', en: 'Weekly Sales Trend' },
  'dash.payment_breakdown': { bn: 'পেমেন্ট মাধ্যম অনুপাত', en: 'Payment Breakdown' },
  'dash.top_selling': { bn: 'সর্বোচ্চ বিক্রিত পণ্য', en: 'Top Selling Products' },
  'dash.recent_sales': { bn: 'সাম্প্রতিক বিক্রয় ও ইনভয়েস', en: 'Recent Invoices' },
  'dash.quick_actions': { bn: 'কুইক অ্যাকশন হাব ও মডিউল শর্টকাট', en: 'Quick Operations Hub' },

  // POS & Billing
  'pos.search_placeholder': { bn: 'প্রোডাক্ট নাম, SKU বা বারকোড স্ক্যান করুন...', en: 'Search product, SKU or scan barcode...' },
  'pos.all': { bn: 'সব পণ্য (All)', en: 'All Items' },
  'pos.cart_title': { bn: 'ক্যাশ মেমো ও কার্ট', en: 'Sales Memo & Cart' },
  'pos.customer': { bn: 'কাস্টমার', en: 'Customer' },
  'pos.cash_customer': { bn: 'নগদ ক্রেতা (Walk-in Customer)', en: 'Walk-in Cash Customer' },
  'pos.subtotal': { bn: 'সাব-টোটাল', en: 'Subtotal' },
  'pos.vat': { bn: 'ভ্যাট (VAT %)', en: 'VAT / Tax (%)' },
  'pos.discount': { bn: 'ছাড় / ডিসকাউন্ট (৳)', en: 'Discount (৳)' },
  'pos.adjustment': { bn: 'এডজাস্টমেন্ট (±৳)', en: 'Adjustment (±৳)' },
  'pos.grand_total': { bn: 'সর্বমোট প্রদেয় বিল', en: 'Grand Total' },
  'pos.paid_amount': { bn: 'জমা / ক্যাশ গ্রহণ (৳)', en: 'Cash Received (৳)' },
  'pos.change_return': { bn: 'ফেরত টাকা (Change Return)', en: 'Change Return' },
  'pos.due_balance': { bn: 'বকেয়া / বাকি (Due Balance)', en: 'Due Balance' },
  'pos.checkout_btn': { bn: 'বিল সম্পন্ন করুন ও রসিদ প্রিন্ট', en: 'Complete Sale & Print Receipt' },
  'pos.clear_cart': { bn: 'কার্ট খালি করুন', en: 'Clear Cart' },
  'pos.exact_cash': { bn: 'ঠিক ঠিক ৳', en: 'Exact Cash' },
  'pos.payment_methods': { bn: 'পেমেন্ট মাধ্যম', en: 'Payment Method' },

  // Reports & Financial Statement
  'rep.financial_statement': { bn: 'লাভ-ক্ষতি ও আর্থিক বিবরণী ড্যাশবোর্ড (Financial Statement V1)', en: 'Profit-Loss & Financial Statement Dashboard' },
  'rep.gross_sales': { bn: 'মোট বিক্রয় মূল্য (Gross Sales)', en: 'Gross Sales Revenue' },
  'rep.discounts': { bn: 'বাদ: ডিসকাউন্ট ও ছাড় (Less: Discounts)', en: 'Less: Discounts & Deductions' },
  'rep.net_sales': { bn: 'নিট বিক্রয় রাজস্ব (Net Sales Revenue)', en: 'Net Sales Revenue' },
  'rep.cogs': { bn: 'বাদ: বিক্রিত পণ্যের ক্রয়মূল্য (Less: COGS)', en: 'Less: Cost of Goods Sold (COGS)' },
  'rep.gross_profit': { bn: 'মোট গ্রস লাভ মার্জিন (Gross Profit Margin)', en: 'Gross Profit Margin' },
  'rep.other_income': { bn: 'যোগ: MFS ও রিচার্জ কমিশন (Add: Other Income)', en: 'Add: Other Income & Commission' },
  'rep.operating_expenses': { bn: 'বাদ: দোকানের মোট খরচ (Less: Operating Expenses)', en: 'Less: Operating Expenses' },
  'rep.net_operating_profit': { bn: 'চূড়ান্ত নিট লাভ / ক্ষতি (Net Operating Profit/Loss)', en: 'Net Operating Profit / Loss' },
  'rep.print_statement': { bn: 'প্রিন্ট স্টেটমেন্ট', en: 'Print Statement' },
  'rep.expenses_ledger': { bn: 'দোকানের খরচ খাতা', en: 'Expenses Ledger' },
  'rep.sales_register': { bn: 'বিক্রয় ও ইনভয়েস হিস্ট্রি', en: 'Sales & Invoice Register' },
  'rep.stock_valuation': { bn: 'স্টক ভ্যালুয়েশন ও ক্যাটালগ', en: 'Stock Valuation & Catalog' },
  'rep.customer_dues': { bn: 'কাস্টমার বাকি খাতা', en: 'Customer Due Ledger' },

  // Common Table & Pagination Actions
  'action.save': { bn: 'সংরক্ষণ করুন', en: 'Save Changes' },
  'action.cancel': { bn: 'বাতিল', en: 'Cancel' },
  'action.delete': { bn: 'মুছে ফেলুন', en: 'Delete' },
  'action.edit': { bn: 'সম্পাদনা', en: 'Edit' },
  'action.print': { bn: 'প্রিন্ট করুন', en: 'Print' },
  'action.print_report': { bn: 'প্রিন্ট রিপোর্ট', en: 'Print Report' },
  'action.add_new': { bn: '+ নতুন যোগ করুন', en: '+ Add New' },
  'action.search': { bn: 'খুঁজুন...', en: 'Search...' },
  'action.export': { bn: 'এক্সপোর্ট', en: 'Export' },
  'action.export_csv': { bn: 'এক্সপোর্ট (Excel/CSV)', en: 'Export (Excel/CSV)' },
  'action.download': { bn: 'ডাউনলোড', en: 'Download' },
  'action.restore': { bn: 'রিস্টোর', en: 'Restore' },
  'action.logout': { bn: 'লগআউট', en: 'Logout' },
  'action.refresh': { bn: 'রিফ্রেশ', en: 'Refresh' },
  'action.filter': { bn: 'ফিল্টার', en: 'Filter' },
  'action.collapse': { bn: 'লুকান', en: 'Collapse' },
  'action.expand': { bn: 'প্রসারিত করুন', en: 'Expand' },
  'action.next_page': { bn: 'পরবর্তী পেজ', en: 'Next Page' },
  'action.prev_page': { bn: 'পূর্ববর্তী পেজ', en: 'Previous Page' },
  'action.first_page': { bn: 'প্রথম পেজ', en: 'First Page' },
  'action.last_page': { bn: 'সর্বশেষ পেজ', en: 'Last Page' },
  'action.rows_per_page': { bn: 'প্রতি পেজে', en: 'Rows per page' },
  'action.showing': { bn: 'প্রদর্শন', en: 'Showing' },
  'action.of': { bn: 'এর মধ্যে', en: 'of' },
  'action.records': { bn: 'টি রেকর্ড', en: 'records' },

  // Accounting & Financials
  'acc.cash_in_hand': { bn: 'ক্যাশ ড্রয়ার / কাউন্টার ক্যাশ (Cash in Hand)', en: 'Cash in Hand (Drawer Cash)' },
  'acc.bank_account': { bn: 'বাণিজ্যিক ব্যাংক হিসাব (Bank Account)', en: 'Commercial Bank Account' },
  'acc.mfs_wallet': { bn: 'বিকাশ ও MFS ওয়ালেট (Mobile Financial Services)', en: 'bKash / Nagad / MFS Wallet' },
  'acc.accounts_receivable': { bn: 'গ্রাহক দেনাদার / বাকি পাওনা (Accounts Receivable)', en: 'Accounts Receivable (Customer Due)' },
  'acc.accounts_payable': { bn: 'সাপ্লায়ার পাওনাদার / দেনা (Accounts Payable)', en: 'Accounts Payable (Supplier Due)' },
  'acc.sales_revenue': { bn: 'পণ্য বিক্রয় রাজস্ব (Sales Revenue)', en: 'Sales Revenue' },
  'acc.cogs': { bn: 'বিক্রিত পণ্যের ক্রয়মূল্য (Cost of Goods Sold - COGS)', en: 'Cost of Goods Sold (COGS)' },
  'acc.operating_expenses': { bn: 'দোকান ভাড়া ও পরিচালন ব্যয় (Operating Expenses)', en: 'Operating Expenses' },
  'acc.net_profit': { bn: 'চূড়ান্ত নিট লাভ (Net Profit)', en: 'Net Profit' },
  'acc.net_loss': { bn: 'চূড়ান্ত নিট ক্ষতি (Net Loss)', en: 'Net Loss' },

  // Header, Theme & Language
  'theme.dark_mode': { bn: 'ডার্ক মোড', en: 'Dark Mode' },
  'theme.light_mode': { bn: 'লাইট মোড', en: 'Light Mode' },
  'theme.lang_bn': { bn: 'বাংলা (BN)', en: 'Bengali (BN)' },
  'theme.lang_en': { bn: 'English (EN)', en: 'English (EN)' },
  'theme.switch_lang': { bn: 'ভাষা পরিবর্তন করুন (Switch Language)', en: 'Switch Language (ভাষা পরিবর্তন)' },
};

class I18nService {
  private currentLang: Language = 'bn';

  constructor() {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dokan_v2_lang');
        if (saved === 'en' || saved === 'bn') {
          this.currentLang = saved;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  public getLanguage(): Language {
    return this.currentLang;
  }

  public setLanguage(lang: Language): void {
    this.currentLang = lang;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('dokan_v2_lang', lang);
        window.dispatchEvent(new CustomEvent('dokan_lang_changed', { detail: { lang } }));
      }
    } catch (e) {
      console.error(e);
    }
  }

  public t(key: string, fallbackBn?: string, fallbackEn?: string): string {
    const entry = TRANSLATIONS[key];
    if (entry) {
      return this.currentLang === 'en' ? entry.en : entry.bn;
    }
    if (this.currentLang === 'en' && fallbackEn) {
      return fallbackEn;
    }
    return fallbackBn || key;
  }

  /**
   * Convert Western digits (123) to Bengali digits (১২৩) when in Bengali mode
   */
  public toBengaliNumber(num: number | string): string {
    if (this.currentLang === 'en') return String(num);
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, w => bengaliDigits[parseInt(w, 10)]);
  }

  /**
   * Format currency string with configured symbol
   */
  public formatCurrency(amount: number, symbol: string = '৳'): string {
    const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${symbol} ${formatted}`;
  }
}

export const i18n = new I18nService();
