import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  CreditCard, 
  Smartphone, 
  Layers, 
  Scale, 
  RefreshCw, 
  Zap, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Plus, 
  Minus, 
  Receipt, 
  Printer,
  Barcode,
  Coins,
  Wallet,
  QrCode,
  Percent,
  Sliders,
  DollarSign,
  ArrowRightLeft,
  Building2,
  Tag,
  Camera,
  Package
} from 'lucide-react';
import { 
  Tenant, 
  UserRole, 
  GenericProduct, 
  CartItem, 
  CustomerMember, 
  SaleTransaction,
  DeviceItem,
  ProductBatch,
  CustomPaymentMethod,
} from '../../types';
import { storageService } from '../../services/storageService';
import { RuleEngine } from '../../engine/ruleEngine';
import { Modal } from '../common/Modal';
import { CameraScannerModal } from '../common/CameraScannerModal';
import { printPosReceipt } from '../../shared/utils/printReceipt';
import { generateQrCodeSvg } from '../../shared/utils/qrCode';

interface POSViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
}

const DEFAULT_PHOTOCOPY_RATES = [
  { id: 'rate_pc_1', title: 'A4 সাইজ B&W ফটোকপি', rate: 3, unit: 'পৃষ্ঠা', description: 'একক বা উভয় পৃষ্ঠা সাধারণ পেপার' },
  { id: 'rate_pc_2', title: 'লিগ্যাল সাইজ ফটোকপি (Legal B&W)', rate: 4, unit: 'পৃষ্ঠা', description: 'দলিল, কোর্ট পেপার ও লিগ্যাল সাইজ' },
  { id: 'rate_pc_3', title: 'A4 সাইজ কালার প্রিন্ট (Color Print)', rate: 10, unit: 'পৃষ্ঠা', description: 'সাধারণ পেপারে রঙিন প্রিন্ট' },
  { id: 'rate_pc_4', title: 'গ্লসি ফটো পেপার প্রিন্ট (A4 Glossy)', rate: 25, unit: 'পৃষ্ঠা', description: 'ল্যাব কোয়ালিটি গ্লসি পেপার প্রিন্ট' },
  { id: 'rate_pc_5', title: 'পাসপোর্ট সাইজ ছবি (৪ কপি)', rate: 20, unit: 'সেট', description: 'ল্যাব কোয়ালিটি কালার পাসপোর্ট ছবি' },
  { id: 'rate_pc_6', title: 'সার্টিফিকেট / পেপার লেমিনেটিং', rate: 25, unit: 'পিস', description: 'ওয়াটারপ্রুফ প্লাস্টিক লেমিনেশন' },
  { id: 'rate_pc_7', title: 'বই / শিট স্পাইরাল বাইন্ডিং', rate: 35, unit: 'কপি', description: 'রিং বাইন্ডিং ও ট্রান্সপারেন্ট কভার শিট' },
  { id: 'rate_pc_8', title: 'স্ট্যাম্প পেপার টাইপিং ও কম্পোজ', rate: 50, unit: 'পেজ', description: 'হলফনামা ও এফিডেভিট টাইপিং' },
];

const DEFAULT_ONLINE_SERVICES = [
  { id: 'rate_os_1', title: 'NID কার্ড অনলাইন কপি / সংশোধন', rate: 50, description: 'জাতীয় পরিচয়পত্র ডাউনলোড ও ফরম' },
  { id: 'rate_os_2', title: 'ই-পাসপোর্ট অনলাইন আবেদন ফরম', rate: 100, description: 'নতুন পাসপোর্ট আবেদন ও পেমেন্ট চালান' },
  { id: 'rate_os_3', title: 'অনলাইন ভর্তি ও চাকরির আবেদন', rate: 100, description: 'ভর্তি এবং চাকরির ফরম ফিলাপ' },
  { id: 'rate_os_4', title: 'জন্ম নিবন্ধন অনলাইন আবেদন / যাচাই', rate: 50, description: 'নতুন জন্ম সনদ আবেদন ও সংশোধন' },
  { id: 'rate_os_5', title: 'ড্রাইভিং লাইসেন্স ও BRTA ফি স্লিপ', rate: 150, description: 'লার্নার লাইসেন্স আবেদন ও ফি' },
  { id: 'rate_os_6', title: 'বিদ্যুৎ, গ্যাস ও পানি বিল পরিশোধ', rate: 10, description: 'পল্লী বিদ্যুৎ, ডেসকো ও ওয়াসা বিল' },
  { id: 'rate_os_7', title: 'ই-ট্যাক্স রিটার্ন দাখিল (E-TIN / Return)', rate: 200, description: 'অনলাইন আয়কর রিটার্ন জমা' },
  { id: 'rate_os_8', title: 'কম্পিউটার টাইপিং ও সিভি তৈরি', rate: 30, description: 'ডকুমেন্ট কম্পোজ ও সিভি তৈরি' },
  { id: 'rate_os_9', title: 'খতিয়ান / পরচা ও ই-নামজারি আবেদন', rate: 150, description: 'ভূমি মন্ত্রণালয় আরএস/সিএস পরচা' },
];

export const POSView: React.FC<POSViewProps> = ({ activeTenant, activeRole }) => {
  const physicalProducts = storageService.getProducts(activeTenant.id) || [];
  const customers = storageService.getCustomers(activeTenant.id) || [];
  const devices = storageService.getDevices() || [];
  const batches = storageService.getBatches() || [];
  const tradeIns = (storageService.getTradeIns(activeTenant.id) || []).filter(t => t.status === 'pending' || t.status === 'accepted');

  // Load customized photocopy and online services rates
  const storagePhotocopyRatesKey = `dokan_v2_photocopy_rates_${activeTenant.id}`;
  const storageOnlineServicesKey = `dokan_v2_online_services_${activeTenant.id}`;

  const photocopyRates = (() => {
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
  })();

  const onlineServices = (() => {
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
  })();

  // Transform photocopy rates & online services into service products for the POS catalog
  const primaryCatId = activeTenant.active_categories?.find(c => c.is_primary)?.business_category_id || activeTenant.active_categories?.[0]?.business_category_id || 'cat_general';

  const serviceProducts: GenericProduct[] = [
    ...photocopyRates.filter((r: { is_active?: boolean }) => r.is_active !== false).map((r: { id: string; title: string; rate: number; unit?: string; description?: string }) => ({
      id: `srv_pc_${r.id}`,
      tenant_id: activeTenant.id,
      business_category_id: primaryCatId,
      code: `PC-${r.id.slice(-4).toUpperCase()}`,
      sku: `PC-${r.id.slice(-4).toUpperCase()}`,
      name: r.title,
      description: r.description || 'ফটোকপি ও প্রিন্টিং সেবা',
      category_name: 'ফটোকপি ও প্রিন্ট',
      brand: 'ফটোকপি ও প্রিন্টিং',
      unit: r.unit || 'পৃষ্ঠা',
      purchase_price: Math.round(r.rate * 0.3),
      selling_price: r.rate,
      stock_quantity: 9999,
      min_stock_alert: 0,
      tracking_mode: 'TRACKING_NONE' as const,
      is_active: true,
      created_at: new Date().toISOString()
    })),
    ...onlineServices.filter((s: { is_active?: boolean }) => s.is_active !== false).map((s: { id: string; title: string; rate: number; description?: string }) => ({
      id: `srv_os_${s.id}`,
      tenant_id: activeTenant.id,
      business_category_id: primaryCatId,
      code: `OS-${s.id.slice(-4).toUpperCase()}`,
      sku: `OS-${s.id.slice(-4).toUpperCase()}`,
      name: s.title,
      description: s.description || 'অনলাইন নাগরিক সেবা',
      category_name: 'অনলাইন নাগরিক সেবা',
      brand: 'ডিজিটাল সেবা',
      unit: 'আবেদন',
      purchase_price: 0,
      selling_price: s.rate,
      stock_quantity: 9999,
      min_stock_alert: 0,
      tracking_mode: 'TRACKING_NONE' as const,
      is_active: true,
      created_at: new Date().toISOString()
    }))
  ];

  // Combined Master Products
  const products = [...physicalProducts, ...serviceProducts];

  // Dynamic Payment Methods Configuration
  const [paymentConfig, setPaymentConfig] = useState(() => {
    try {
      const stored =
        localStorage.getItem(`dokan_v2_payment_settings_${activeTenant.id}`) ||
        localStorage.getItem('dokan_v2_payment_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      enableCash: true,
      enableBkash: true,
      bkashNumber: "01700000000",
      bkashType: "Merchant",
      enableNagad: true,
      nagadNumber: "01800000000",
      nagadType: "Personal",
      enableRocket: true,
      rocketNumber: "01900000000",
      enableCard: true,
      cardTerminalName: "City Bank POS",
      enableDueCredit: true,
      customMethods: [] as CustomPaymentMethod[],
    };
  });

  useEffect(() => {
    const handlePaymentSettingsChanged = () => {
      try {
        const stored =
          localStorage.getItem(`dokan_v2_payment_settings_${activeTenant.id}`) ||
          localStorage.getItem('dokan_v2_payment_settings');
        if (stored) setPaymentConfig(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('dokan_v2_payment_settings_changed', handlePaymentSettingsChanged);
    window.addEventListener('storage', handlePaymentSettingsChanged);
    return () => {
      window.removeEventListener('dokan_v2_payment_settings_changed', handlePaymentSettingsChanged);
      window.removeEventListener('storage', handlePaymentSettingsChanged);
    };
  }, [activeTenant.id]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cash_customer');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [customTrxId, setCustomTrxId] = useState<string>('');
  
  // Commercial Billing Options: VAT %, Discount (৳), Adjustment (±৳)
  const [vatPercent, setVatPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [selectedTradeInId, setSelectedTradeInId] = useState<string>('');

  // Received Amount (রিসিভ অ্যামাউন্ট) & Due Tracking
  const [receivedInput, setReceivedInput] = useState<string>('');

  // Specialized Selection Modals
  const [imeiModalProduct, setImeiModalProduct] = useState<GenericProduct | null>(null);
  const [batchModalProduct, setBatchModalProduct] = useState<GenericProduct | null>(null);
  const [weightModalProduct, setWeightModalProduct] = useState<GenericProduct | null>(null);
  const [tempWeightInput, setTempWeightInput] = useState<number>(1.0);

  // Quick Customer Add Modal
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');

  // Recharge quick modal
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);

  // Completed Receipt Modal & Dynamic Paper Size Selection
  const [completedSale, setCompletedSale] = useState<SaleTransaction | null>(null);
  const [previewPaperSize, setPreviewPaperSize] = useState<'80mm' | '58mm' | 'A4' | 'A5'>('80mm');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mobile Tab Switcher ('catalog' | 'cart') for phone screens
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Camera Barcode & QR Scanner Modal State
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Camera scan success handler (Auto adds matching product or populates search)
  const handleCameraScanSuccess = (scannedCode: string) => {
    const trimmed = scannedCode.trim();
    if (!trimmed) return;

    const found = products.find(p => 
      (p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()) ||
      p.code.toLowerCase() === trimmed.toLowerCase() ||
      (p.sku && p.sku.toLowerCase() === trimmed.toLowerCase())
    );

    if (found) {
      handleAddToCart(found);
    } else {
      setSearchTerm(trimmed);
    }
  };

  // Category filters
  const categoriesList = Array.from(new Set(products.map(p => p.category_name))).filter(Boolean);

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      Object.values(p.custom_fields || {}).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategoryFilter === 'ALL' || p.category_name === selectedCategoryFilter;
    return matchesSearch && matchesCat && p.is_active;
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * (vatPercent || 0)) / 100;
  
  const tradeInRecord = tradeIns.find(t => t.id === selectedTradeInId);
  const tradeInCredit = tradeInRecord ? tradeInRecord.offered_credit : 0;
  
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount + adjustmentAmount - tradeInCredit);

  // Validate if received amount is entered explicitly
  const isReceivedAmountEntered = paymentMethod === 'CREDIT_DUE' || (
    receivedInput.trim() !== '' &&
    !isNaN(Number(receivedInput)) &&
    Number(receivedInput) >= 0
  );

  // Determine effective paid amount, due, and change
  const effectivePaidAmount = paymentMethod === 'CREDIT_DUE'
    ? 0 
    : receivedInput.trim() === '' 
    ? 0 
    : Math.max(0, Number(receivedInput) || 0);

  const dueAmount = Math.max(0, grandTotal - effectivePaidAmount);
  const changeAmount = Math.max(0, effectivePaidAmount - grandTotal);
  const isCheckoutDisabled = cart.length === 0 || !isReceivedAmountEntered;

  const handleAddToCart = (product: GenericProduct) => {
    if (product.tracking_mode === 'TRACKING_IMEI') {
      setImeiModalProduct(product);
      return;
    }

    if (product.tracking_mode === 'TRACKING_BATCH') {
      setBatchModalProduct(product);
      return;
    }

    if (product.tracking_mode === 'TRACKING_WEIGHT') {
      setTempWeightInput(1.0);
      setWeightModalProduct(product);
      return;
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id && !item.selected_imei && !item.selected_batch);
    if (existingIndex >= 0) {
      const updated = [...cart];
      const currentQty = updated[existingIndex].quantity + 1;
      updated[existingIndex].quantity = currentQty;
      updated[existingIndex].total = currentQty * updated[existingIndex].unit_price - updated[existingIndex].discount;
      setCart(updated);
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        unit_price: product.selling_price,
        discount: 0,
        total: product.selling_price
      }]);
    }
  };

  const handleSelectImei = (device: DeviceItem) => {
    if (!imeiModalProduct) return;
    setCart([...cart, {
      product: imeiModalProduct,
      quantity: 1,
      unit_price: device.selling_price,
      discount: 0,
      total: device.selling_price,
      selected_imei: device.imei,
      warranty_months: device.warranty_months
    }]);
    setImeiModalProduct(null);
  };

  const handleSelectBatch = (batch: ProductBatch) => {
    if (!batchModalProduct) return;
    setCart([...cart, {
      product: batchModalProduct,
      quantity: 1,
      unit_price: batchModalProduct.selling_price,
      discount: 0,
      total: batchModalProduct.selling_price,
      selected_batch: batch.batch_number
    }]);
    setBatchModalProduct(null);
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      item.quantity = newQty;
      item.total = newQty * item.unit_price - item.discount;
    }
    setCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const handleClearCart = () => {
    setCart([]);
    setVatPercent(0);
    setDiscountAmount(0);
    setAdjustmentAmount(0);
    setReceivedInput('');
    setSelectedTradeInId('');
    setErrorMessage(null);
  };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName || !quickCustPhone) return;

    const newCust: CustomerMember = {
      id: `cust_${Date.now()}`,
      tenant_id: activeTenant.id,
      name: quickCustName,
      phone: quickCustPhone,
      customer_type: 'individual',
      total_spent: 0,
      loyalty_points: 10,
      current_due: 0,
      created_at: new Date().toISOString(),
    };

    storageService.saveCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setQuickCustName('');
    setQuickCustPhone('');
    setIsQuickCustomerModalOpen(false);
  };

  const handleProcessCheckout = () => {
    if (cart.length === 0) {
      setErrorMessage('কার্ট খালি! পণ্য নির্বাচন করুন।');
      return;
    }

    const selectedCust = customers.find(c => c.id === selectedCustomerId);
    const customerName = selectedCust ? selectedCust.name : 'সাধারণ কাস্টমার (ক্যাশ)';
    const customerPhone = selectedCust ? selectedCust.phone : '';

    const selectedCustomMethod = (paymentConfig.customMethods || []).find(
      (m: CustomPaymentMethod) => m.code === paymentMethod
    );

    const readableMethodName = selectedCustomMethod
      ? selectedCustomMethod.name
      : paymentMethod === 'CASH'
      ? 'ক্যাশ'
      : paymentMethod === 'BKASH'
      ? `বিকাশ (${paymentConfig.bkashType || 'MFS'})`
      : paymentMethod === 'NAGAD'
      ? `নগদ (${paymentConfig.nagadType || 'MFS'})`
      : paymentMethod === 'ROCKET'
      ? 'রকেট'
      : paymentMethod === 'CARD'
      ? (paymentConfig.cardTerminalName || 'ব্যাংক কার্ড')
      : paymentMethod === 'CREDIT_DUE'
      ? 'বাকিতে (Due)'
      : paymentMethod;

    const newSale: SaleTransaction = {
      id: `sale_${Date.now()}`,
      invoice_no: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      tenant_id: activeTenant.id,
      business_category_id: activeTenant.active_categories.find(c => c.is_primary)?.business_category_id || 'cat_general',
      customer_id: selectedCust?.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      items: cart,
      subtotal,
      tax_amount: taxAmount,
      tax_rate: vatPercent,
      discount_amount: discountAmount,
      adjustment_amount: adjustmentAmount,
      trade_in_credit: tradeInCredit,
      grand_total: grandTotal,
      paid_amount: effectivePaidAmount,
      due_amount: dueAmount,
      payment_method: readableMethodName,
      payment_status: dueAmount === 0 ? 'PAID' : effectivePaidAmount === 0 ? 'DUE' : 'PARTIAL',
      created_at: new Date().toISOString()
    };

    cart.forEach(item => {
      const prod = products.find(p => p.id === item.product.id);
      if (prod) {
        prod.stock_quantity = Math.max(0, prod.stock_quantity - item.quantity);
        storageService.saveProduct(prod);
      }
    });

    if (dueAmount > 0 && selectedCust) {
      selectedCust.current_due += dueAmount;
      storageService.saveCustomer(selectedCust);
    }

    storageService.saveSale(newSale);
    setCompletedSale(newSale);
    handleClearCart();
    setCustomTrxId('');
  };

  const isPreviewA4 = previewPaperSize === 'A4';
  const isPreviewA5 = previewPaperSize === 'A5';
  const isPreview58 = previewPaperSize === '58mm';
  const isPreviewThermal = previewPaperSize === '80mm' || previewPaperSize === '58mm';

  return (
    <div className="space-y-3 pb-16 lg:pb-0">
      {/* Mobile Segment Tab Switcher (< lg screens) */}
      <div className="lg:hidden flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'catalog'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>পণ্য ক্যাটালগ (Products)</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
            mobileTab === 'cart'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>কার্ট ও বিল (Cart)</span>
          {cart.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              mobileTab === 'cart' ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
            }`}>
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[560px] lg:h-[calc(100vh-105px)]">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: PRODUCT CATALOG & QUICK FILTER BAR (7 Cols)                  */}
        {/* ========================================================================= */}
        <div className={`lg:col-span-7 flex flex-col h-full bg-white border border-[#dee2e6] rounded-xl p-3 sm:p-3.5 shadow-xs overflow-hidden ${
          mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
        }`}>
        
        {/* Filter Bar */}
        <div className="space-y-2.5 pb-2.5 border-b border-[#dee2e6]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
              <input
                type="text"
                placeholder="প্রোডাক্ট নাম, SKU বা বারকোড স্ক্যান করুন..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-xs text-[#212529] placeholder:text-[#868e96] focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                autoFocus
              />
            </div>

            {/* Mobile / Device Camera Barcode Scanner Button */}
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-2.5 sm:px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs shadow-indigo-600/20 cursor-pointer shrink-0 transition-all active:scale-[0.97]"
              title="মোবাইল ক্যামেরা দিয়ে বারকোড বা QR স্ক্যান করুন"
            >
              <Camera className="w-4 h-4 text-indigo-100" />
              <span className="hidden sm:inline">ক্যামেরা স্ক্যান</span>
            </button>

            <button
              type="button"
              onClick={() => setRechargeModalOpen(true)}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-colors"
              title="ফ্লেক্সিলোড ও রিচার্জ রেজিস্টার"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>রিচার্জ / MFS</span>
            </button>
          </div>

          {/* Category Pills Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#f8f9fa] text-[#495057] hover:bg-gray-200 border border-[#dee2e6]'
              }`}
            >
              সব (All)
            </button>
            {categoriesList.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#f8f9fa] text-[#495057] hover:bg-gray-200 border border-[#dee2e6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pt-3 pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#868e96] text-xs py-12">
              <Search className="w-8 h-8 mb-2 opacity-40 text-blue-500" />
              <p>কোনো প্রোডাক্ট পাওয়া যায়নি!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => handleAddToCart(prod)}
                  className="bg-white hover:bg-blue-50/40 border border-[#dee2e6] hover:border-blue-400 rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm group text-xs relative"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-blue-600 font-bold mb-1">
                      <span className="truncate">{prod.category_name || 'General'}</span>
                      {prod.tracking_mode === 'TRACKING_IMEI' && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-mono font-bold">IMEI</span>
                      )}
                    </div>
                    <h4 className="font-bold text-[#1a1b1e] text-xs line-clamp-2 leading-snug group-hover:text-blue-600">
                      {prod.name}
                    </h4>

                    {/* Dynamic Custom Properties Mini Badges */}
                    {prod.custom_fields && Object.keys(prod.custom_fields).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(prod.custom_fields).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-100 font-medium">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-end justify-between mt-auto">
                    <div>
                      <div className="font-extrabold text-emerald-600 font-mono text-sm">
                        ৳{prod.selling_price.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#868e96] font-mono">
                        SKU: {prod.code || prod.sku || 'N/A'}
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      prod.id.startsWith('srv_')
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : prod.stock_quantity <= prod.min_stock_alert
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-[#f1f3f5] text-[#495057]'
                    }`}>
                      {prod.id.startsWith('srv_') ? `সেবা / ${prod.unit}` : `${prod.stock_quantity} ${prod.unit}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: POS CART & CHECKOUT LEDGER (5 Cols)                         */}
      {/* ========================================================================= */}
      <div className={`lg:col-span-5 flex flex-col h-full bg-white border border-[#dee2e6] rounded-xl p-3 sm:p-3.5 shadow-xs overflow-hidden ${
        mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'
      }`}>
        
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#dee2e6]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-[#1a1b1e] text-sm">কার্ট তালিকা</h3>
            <span className="bg-blue-600 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full font-mono">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>খালি করুন</span>
          </button>
        </div>

        {/* Customer Selector */}
        <div className="flex items-center gap-1.5 py-2 border-b border-[#dee2e6]">
          <User className="w-4 h-4 text-[#868e96] shrink-0" />
          <select
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="flex-1 bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600"
          >
            <option value="cash_customer">সাধারণ কাস্টমার (ক্যাশ)</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) {c.current_due > 0 ? `— বকেয়া: ৳${c.current_due}` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsQuickCustomerModalOpen(true)}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
            title="নতুন কাস্টমার যোগ করুন"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cart Item Rows */}
        <div className="flex-1 overflow-y-auto py-1.5 space-y-1.5 pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#868e96] text-xs py-8">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-30 text-blue-500" />
              <p>কার্ট খালি রয়েছে। প্রোডাক্ট ক্লিক বা স্ক্যান করুন!</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#f8f9fa] border border-[#dee2e6] rounded-lg p-2 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[#1a1b1e] truncate pr-2">
                    {item.product.name}
                  </div>
                  <span className="font-mono font-bold text-emerald-600">
                    ৳{item.total.toFixed(2)}
                  </span>
                </div>

                {item.selected_imei && (
                  <span className="text-[10px] text-purple-700 font-mono bg-purple-50 px-1 rounded w-fit border border-purple-200">
                    IMEI: {item.selected_imei}
                  </span>
                )}

                <div className="flex items-center justify-between text-[#868e96] text-[11px] pt-1">
                  <span>৳{item.unit_price.toFixed(2)} / {item.product.unit}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, -1)}
                      className="w-5 h-5 bg-white border border-[#dee2e6] hover:bg-gray-100 text-[#1a1b1e] rounded flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-[#1a1b1e] px-1.5">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, 1)}
                      className="w-5 h-5 bg-white border border-[#dee2e6] hover:bg-gray-100 text-[#1a1b1e] rounded flex items-center justify-center font-bold cursor-pointer"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 ml-1 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Summary & Commercial Billing Controls */}
        <div className="border-t border-[#dee2e6] pt-2 space-y-1.5 mt-auto">
          <div className="space-y-1 text-xs">
            {/* Subtotal */}
            <div className="flex justify-between text-[#868e96]">
              <span>সাবটোটাল</span>
              <span className="font-mono text-[#1a1b1e] font-semibold">৳{subtotal.toFixed(2)}</span>
            </div>

            {/* VAT, Discount & Adjustment Controls */}
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {/* VAT */}
              <div>
                <label className="text-[10px] text-[#868e96] block font-semibold mb-0.5">ভ্যাট (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={vatPercent || ''}
                  onChange={e => setVatPercent(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2 py-1 bg-[#f8f9fa] border border-[#dee2e6] text-[#1a1b1e] font-mono text-center rounded text-xs"
                  placeholder="0%"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="text-[10px] text-[#868e96] block font-semibold mb-0.5">ডিসকাউন্ট (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ''}
                  onChange={e => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2 py-1 bg-[#f8f9fa] border border-[#dee2e6] text-[#1a1b1e] font-mono text-center rounded text-xs"
                  placeholder="0"
                />
              </div>

              {/* Adjustment */}
              <div>
                <label className="text-[10px] text-[#868e96] block font-semibold mb-0.5">এডজাস্টমেন্ট (±৳)</label>
                <input
                  type="number"
                  step="0.5"
                  value={adjustmentAmount || ''}
                  onChange={e => setAdjustmentAmount(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-[#f8f9fa] border border-[#dee2e6] text-[#1a1b1e] font-mono text-center rounded text-xs"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center text-sm font-extrabold text-[#1a1b1e] pt-1 border-t border-[#dee2e6]">
              <span>সর্বমোট প্রদেয়</span>
              <span className="text-emerald-600 font-mono text-base font-extrabold">৳{grandTotal.toFixed(2)}</span>
            </div>

            {/* Received Amount Input & Due / Change Indicator */}
            <div className={`p-2.5 rounded-xl border transition-all space-y-2 mt-1 ${
              !isReceivedAmountEntered && cart.length > 0
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <DollarSign className={`w-4 h-4 ${!isReceivedAmountEntered && cart.length > 0 ? 'text-amber-600' : 'text-blue-600'}`} />
                  <div>
                    <span className="font-bold text-slate-800 text-xs">
                      প্রাপ্ত টাকা / জমা (৳) <span className="text-rose-600 font-bold">*</span>
                    </span>
                    {!isReceivedAmountEntered && cart.length > 0 && (
                      <span className="text-[9px] text-amber-700 font-semibold block">
                        টাকার পরিমাণ দেওয়া আবশ্যক
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={paymentMethod === 'CREDIT_DUE' ? '0' : receivedInput}
                    disabled={paymentMethod === 'CREDIT_DUE'}
                    onChange={e => setReceivedInput(e.target.value)}
                    placeholder="0.00"
                    className={`w-32 px-2.5 py-1.5 bg-white border-2 font-mono font-bold text-right rounded-lg text-xs shadow-2xs focus:outline-none ${
                      !isReceivedAmountEntered && cart.length > 0
                        ? 'border-amber-400 focus:border-amber-600 text-amber-900 bg-amber-50/30'
                        : 'border-blue-400 focus:border-blue-600 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Quick Cash Presets Shortcuts */}
              {paymentMethod !== 'CREDIT_DUE' && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/70">
                  <span className="text-[10px] text-slate-500 font-bold mr-0.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>দ্রুত জমা শর্টকাট:</span>
                  </span>

                  {/* Exact Cash Button: Auto-fills exact bill amount */}
                  <button
                    type="button"
                    disabled={cart.length === 0 || grandTotal <= 0}
                    onClick={() => setReceivedInput(grandTotal.toString())}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold shadow-xs transition-all flex items-center gap-1 ${
                      cart.length > 0 && grandTotal > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white cursor-pointer shadow-emerald-600/20'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                    title="কাস্টমার সম্পূর্ণ বিল সমপরিমাণ পরিশোধ করলে এই বাটনে চাপুন"
                  >
                    <span>⚡ সম্পূর্ণ পরিশোধ (৳{grandTotal.toFixed(0)})</span>
                  </button>

                  {/* Common Note Shortcuts */}
                  {[100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={cart.length === 0}
                      onClick={() => {
                        setReceivedInput(amt.toString());
                      }}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-800 border border-slate-300 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors shadow-2xs"
                      title={`কাস্টমার ৳${amt} এর নোট দিলে চাপুন`}
                    >
                      ৳{amt} নোট
                    </button>
                  ))}

                  {receivedInput !== '' && (
                    <button
                      type="button"
                      onClick={() => setReceivedInput('')}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded text-[10px] font-bold cursor-pointer transition-colors"
                      title="রিসিভ ফিল্ড ক্লিয়ার করুন"
                    >
                      মুছুন
                    </button>
                  )}
                </div>
              )}

              {/* Quick Due / Change Indicator Badges */}
              <div className="flex items-center justify-between text-[11px] font-bold pt-0.5">
                {!isReceivedAmountEntered && cart.length > 0 ? (
                  <span className="text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 w-full text-center text-[10.5px]">
                    ⚠️ বিল সম্পন্ন করতে রিসিভ অ্যামাউন্ট লিখুন বা &apos;ঠিক ঠিক&apos; চাপুন
                  </span>
                ) : dueAmount > 0 ? (
                  <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 w-full flex justify-between">
                    <span>বকেয়া / বাকি (Due):</span>
                    <span className="font-mono">৳{dueAmount.toFixed(2)}</span>
                  </span>
                ) : changeAmount > 0 ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-full flex justify-between">
                    <span>কাস্টমারকে ফেরত (Change):</span>
                    <span className="font-mono">৳{changeAmount.toFixed(2)}</span>
                  </span>
                ) : (
                  <span className="text-emerald-600 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>সম্পূর্ণ পরিশোধিত (Full Paid)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Payment Method Radio / Pill Group */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-700">
                পেমেন্ট মেথড নির্বাচন:
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono">
                {paymentMethod}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 text-[11px]">
              {[
                { id: 'CASH', label: 'নগদ ক্যাশ', icon: Coins, enabled: paymentConfig.enableCash !== false, color: '#059669' },
                { id: 'BKASH', label: `বিকাশ`, icon: Wallet, enabled: paymentConfig.enableBkash !== false, color: '#db2777' },
                { id: 'NAGAD', label: `নগদ`, icon: Wallet, enabled: paymentConfig.enableNagad !== false, color: '#d97706' },
                { id: 'ROCKET', label: 'রকেট', icon: Wallet, enabled: paymentConfig.enableRocket !== false, color: '#7c3aed' },
                { id: 'CARD', label: paymentConfig.cardTerminalName || 'কার্ড', icon: CreditCard, enabled: paymentConfig.enableCard !== false, color: '#2563eb' },
                { id: 'CREDIT_DUE', label: 'বাকিতে (Due)', icon: User, enabled: paymentConfig.enableDueCredit !== false, color: '#e11d48' },
                ...((paymentConfig.customMethods || [])
                  .filter((cm: CustomPaymentMethod) => cm.isActive)
                  .map((cm: CustomPaymentMethod) => ({
                    id: cm.code,
                    label: cm.name,
                    icon: cm.type === 'BANK' ? CreditCard : cm.type === 'MFS' ? Wallet : cm.type === 'CHEQUE' ? Receipt : CreditCard,
                    enabled: true,
                    color: cm.color || '#0284c7',
                    isCustom: true,
                    customData: cm,
                  }))
                ),
              ]
                .filter(m => m.enabled)
                .map(m => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(m.id);
                        if (m.id === 'CREDIT_DUE') {
                          setReceivedInput('0');
                        } else if (receivedInput === '0') {
                          setReceivedInput('');
                        }
                      }}
                      className={`py-1.5 px-2.5 rounded-lg font-bold border transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-[#f8f9fa] text-[#495057] border-[#dee2e6] hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
            </div>

            {/* TrxID / Note Input for MFS & Custom Methods */}
            {paymentMethod !== 'CASH' && paymentMethod !== 'CREDIT_DUE' && (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1 mt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-bold text-slate-700 flex items-center gap-1 shrink-0">
                    <Tag className="w-3 h-3 text-indigo-600" />
                    <span>TrxID / রেফারেন্স নং (ঐচ্ছিক/প্রয়োজনে):</span>
                  </label>
                  <input
                    type="text"
                    value={customTrxId}
                    onChange={(e) => setCustomTrxId(e.target.value)}
                    placeholder="যেমন: 8X74920482"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Account Details Hint */}
                {(() => {
                  const activeCustom = (paymentConfig.customMethods || []).find(
                    (cm: CustomPaymentMethod) => cm.code === paymentMethod
                  );
                  if (activeCustom) {
                    return (
                      <div className="text-[9.5px] text-slate-500 flex items-center gap-2 pt-0.5 font-medium">
                        {activeCustom.accountNumber && <span>📞 <b>{activeCustom.accountNumber}</b></span>}
                        {activeCustom.bankName && <span>🏦 {activeCustom.bankName}</span>}
                        {activeCustom.chargePercent ? <span>ফি: <b>{activeCustom.chargePercent}%</b></span> : null}
                        {activeCustom.instructions && <span>• {activeCustom.instructions}</span>}
                      </div>
                    );
                  }
                  if (paymentMethod === 'BKASH' && paymentConfig.bkashNumber) {
                    return (
                      <div className="text-[9.5px] text-pink-700 font-medium pt-0.5">
                        📱 বিকাশ ({paymentConfig.bkashType}): <b>{paymentConfig.bkashNumber}</b>
                      </div>
                    );
                  }
                  if (paymentMethod === 'NAGAD' && paymentConfig.nagadNumber) {
                    return (
                      <div className="text-[9.5px] text-amber-700 font-medium pt-0.5">
                        📱 নগদ ({paymentConfig.nagadType}): <b>{paymentConfig.nagadNumber}</b>
                      </div>
                    );
                  }
                  if (paymentMethod === 'ROCKET' && paymentConfig.rocketNumber) {
                    return (
                      <div className="text-[9.5px] text-purple-700 font-medium pt-0.5">
                        📱 রকেট: <b>{paymentConfig.rocketNumber}</b>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>

          {/* Big Complete Sale Button - Locked until Received Amount is entered */}
          <button
            type="button"
            disabled={isCheckoutDisabled}
            onClick={handleProcessCheckout}
            className={`w-full py-2.5 font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all ${
              isCheckoutDisabled
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-80'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer active:scale-[0.99]'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>
              {cart.length === 0
                ? 'কার্ট খালি! পণ্য নির্বাচন করুন'
                : !isReceivedAmountEntered
                ? '⚠️ প্রাপ্ত টাকা এন্ট্রি দিন (বাটন লক)'
                : `বিক্রয় সম্পন্ন ও রসিদ প্রিন্ট (৳${grandTotal.toFixed(2)})`}
            </span>
          </button>
        </div>
      </div>
    </div>

    {/* Mobile Floating Cart Summary Button when on catalog view */}
    {mobileTab === 'catalog' && cart.length > 0 && (
      <div className="lg:hidden fixed bottom-16 inset-x-3 z-20 animate-in slide-in-from-bottom duration-200">
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl font-bold shadow-xl shadow-blue-600/30 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-xs font-extrabold">{cart.reduce((s, i) => s + i.quantity, 0)} টি আইটেম কার্টে</div>
              <div className="text-[10px] text-blue-100 font-medium">ক্লিক করে বিল সম্পন্ন করুন</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black font-mono">৳{grandTotal.toFixed(2)}</span>
            <span className="text-xs font-bold bg-white text-blue-700 px-2.5 py-1 rounded-xl shadow-xs">বিল →</span>
          </div>
        </button>
      </div>
    )}

      {/* ========================================================================= */}
      {/* 1. Quick Customer Registration Modal                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isQuickCustomerModalOpen}
        onClose={() => setIsQuickCustomerModalOpen(false)}
        title="নতুন কাস্টমার যোগ করুন"
        subtitle="কুইক কাস্টমার প্রোফাইল তৈরি"
      >
        <form onSubmit={handleQuickAddCustomer} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-[#495057] mb-1">কাস্টমার নাম *</label>
            <input
              type="text"
              required
              value={quickCustName}
              onChange={e => setQuickCustName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded-lg text-[#1a1b1e]"
              placeholder="যেমন: মো: রফিকুল ইসলাম"
              autoFocus
            />
          </div>
          <div>
            <label className="block font-semibold text-[#495057] mb-1">মোবাইল নম্বর *</label>
            <input
              type="tel"
              required
              value={quickCustPhone}
              onChange={e => setQuickCustPhone(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded-lg text-[#1a1b1e]"
              placeholder="017XXXXXXXX"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
          >
            সেভ করুন ও সিলেক্ট করুন
          </button>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. IMEI Device Selection Modal                                            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(imeiModalProduct)}
        onClose={() => setImeiModalProduct(null)}
        title={`IMEI নির্বাচন করুন — ${imeiModalProduct?.name}`}
        subtitle="হ্যান্ডসেট স্টক হতে নির্দিষ্ট ইউনিট নির্বাচন"
      >
        <div className="space-y-3 text-xs">
          <div className="divide-y divide-[#dee2e6] border border-[#dee2e6] rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            {devices
              .filter(d => d.product_id === imeiModalProduct?.id && d.status === 'available')
              .map(dev => (
                <div
                  key={dev.id}
                  onClick={() => handleSelectImei(dev)}
                  className="p-2.5 hover:bg-blue-50 flex items-center justify-between cursor-pointer text-xs transition-colors"
                >
                  <div>
                    <div className="font-mono font-bold text-[#1a1b1e] flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      <span>IMEI: {dev.imei}</span>
                    </div>
                    <p className="text-[11px] text-[#868e96] mt-0.5">
                      {dev.color} • {dev.storage} • {dev.warranty_months} Months Warranty
                    </p>
                  </div>
                  <button type="button" className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded text-xs">
                    নির্বাচন
                  </button>
                </div>
              ))}
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. Completed Sale Print Preview Modal with Dynamic Paper Size (Exact V1) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(completedSale)}
        onClose={() => setCompletedSale(null)}
        title="ইনভয়েস রসিদ (Print Preview)"
        subtitle={`ইনভয়েস নম্বর: ${completedSale?.invoice_no}`}
      >
        {completedSale && (
          <div className="space-y-3 text-xs">
            {/* Top Toolbar with Dynamic Paper Size Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-[#1a1b1e]">কাগজের সাইজ (Paper Size):</span>
                <select
                  value={previewPaperSize}
                  onChange={e => setPreviewPaperSize(e.target.value as any)}
                  className="bg-white border border-[#dee2e6] rounded px-2.5 py-1 text-xs font-bold text-blue-700 cursor-pointer focus:outline-none focus:border-blue-600"
                >
                  <option value="80mm">80mm POS থার্মাল মেমো</option>
                  <option value="58mm">58mm মিনি থার্মাল স্লিপ</option>
                  <option value="A4">A4 ফুল পেজ ট্যাক্স ইনভয়েস</option>
                  <option value="A5">A5 হাফ শীট মেমো</option>
                </select>
              </div>

              <div className="text-[11px] text-[#868e96] font-mono">
                {previewPaperSize === 'A4' ? '210mm x 297mm' : previewPaperSize === 'A5' ? '148mm x 210mm' : previewPaperSize === '58mm' ? '58mm Roll' : '80mm Roll'}
              </div>
            </div>

            {/* Dynamic Interactive Receipt Preview Card */}
            <div className="bg-slate-200/60 p-3 sm:p-4 rounded-xl max-h-[60vh] overflow-y-auto border border-[#dee2e6]">
              <div className={`bg-white shadow-md border border-[#cbd5e1] rounded-lg p-4 transition-all duration-200 mx-auto relative overflow-hidden text-slate-800 ${
                isPreviewA4
                  ? 'max-w-2xl text-xs'
                  : isPreviewA5
                  ? 'max-w-lg text-[11.5px]'
                  : isPreview58
                  ? 'max-w-[270px] text-[10px]'
                  : 'max-w-[340px] text-[11.5px]'
              }`}>
                
                {/* Watermark Stamp */}
                {((() => {
                  try {
                    const tCfg = JSON.parse(localStorage.getItem(`dokan_v2_template_config_${activeTenant.id}`) || localStorage.getItem('dokan_v2_template_config') || '{}');
                    return tCfg.showWatermark !== false;
                  } catch { return true; }
                })()) && (
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[20deg] font-black tracking-widest uppercase border-4 rounded-lg pointer-events-none select-none z-10 opacity-15 whitespace-nowrap ${
                    completedSale.payment_status === 'DUE'
                      ? 'text-rose-600 border-rose-600 text-3xl px-6 py-2'
                      : 'text-emerald-600 border-emerald-600 text-3xl px-6 py-2'
                  }`}>
                    {completedSale.payment_status === 'DUE' ? 'DUE' : 'PAID'}
                  </div>
                )}

                {/* Slogan / Header Note from Template */}
                {(() => {
                  try {
                    const tCfg = JSON.parse(localStorage.getItem(`dokan_v2_template_config_${activeTenant.id}`) || localStorage.getItem('dokan_v2_template_config') || '{}');
                    if (tCfg.headerNote) {
                      return <div className="text-center font-bold text-xs text-blue-600 mb-1">{tCfg.headerNote}</div>;
                    }
                  } catch {}
                  return null;
                })()}

                {/* Header with Shop Info & Meta */}
                <div className={`flex justify-between items-center gap-3 mb-2 ${isPreviewThermal ? 'flex-col text-center' : ''}`}>
                  <div className={`flex items-center gap-2.5 ${isPreviewThermal ? 'flex-col text-center' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-lg shrink-0">
                      {activeTenant.name ? activeTenant.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h2 className="font-extrabold text-slate-900 text-base leading-tight">
                        {activeTenant.name || 'দোকান ম্যানেজার ERP'}
                      </h2>
                      <p className="text-[11px] text-slate-600 font-medium">📍 {activeTenant.address || 'ঢাকা, বাংলাদেশ'}</p>
                      <p className="text-[11px] text-blue-600 font-bold">📞 হটলাইন: {activeTenant.phone || '01700-000000'}</p>
                      {(activeTenant.bin_number || activeTenant.tin_number || activeTenant.vat_number) && (
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          {(activeTenant.bin_number || activeTenant.vat_number) && <span>BIN/VAT: <strong>{activeTenant.bin_number || activeTenant.vat_number}</strong></span>}
                          {(activeTenant.bin_number || activeTenant.vat_number) && activeTenant.tin_number && <span> • </span>}
                          {activeTenant.tin_number && <span>TIN: <strong>{activeTenant.tin_number}</strong></span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`bg-[#f8f9fa] border border-[#e2e8f0] rounded-md p-2 text-right ${isPreviewThermal ? 'w-full text-center' : ''}`}>
                    <div>ইনভয়েস #: <strong className="font-mono text-blue-600">{completedSale.invoice_no}</strong></div>
                    <div>তারিখ: <strong>{new Date(completedSale.created_at).toLocaleDateString('en-GB')}</strong></div>
                    <div>কাস্টমার: <strong>{completedSale.customer_name}</strong></div>
                    <div>বিলিং: <strong>Admin</strong></div>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-400 my-2"></div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse my-2 text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 font-bold">
                      <th className="p-1 text-center w-8">SL</th>
                      <th className="p-1">আইটেম ও বিবরণ</th>
                      <th className="p-1 text-center w-10">পরিমাণ</th>
                      <th className="p-1 text-right w-16">দর (৳)</th>
                      <th className="p-1 text-right w-16">মোট (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedSale.items.map((it, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="p-1 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-1">
                          <strong className="text-slate-900">{it.product.name}</strong>
                          {it.selected_imei && (
                            <div className="text-[9.5px] text-purple-700 font-mono font-bold">IMEI: {it.selected_imei}</div>
                          )}
                          {it.warranty_months && (
                            <div className="text-[9.5px] text-blue-600 font-bold mt-0.5">🛡️ ওয়ারেন্টি: {it.warranty_months} মাস</div>
                          )}
                        </td>
                        <td className="p-1 text-center font-bold">{it.quantity}</td>
                        <td className="p-1 text-right font-mono">৳{it.unit_price.toFixed(2)}</td>
                        <td className="p-1 text-right font-mono font-bold">৳{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-slate-400 my-2"></div>

                {/* Bottom Summary & Live SVG QR Code */}
                <div className={`flex justify-between items-end gap-3 my-2 ${isPreviewThermal ? 'flex-col-reverse items-stretch' : ''}`}>
                  
                  {/* Real Vector SVG QR Code */}
                  <div className="p-1.5 bg-white border border-slate-300 rounded-lg text-center shrink-0 inline-block mx-auto">
                    <div dangerouslySetInnerHTML={{
                      __html: generateQrCodeSvg(
                        `Invoice: ${completedSale.invoice_no} | ${activeTenant.name} | Total: ৳${completedSale.grand_total.toFixed(2)} | ${completedSale.payment_status}`,
                        isPreviewThermal ? 65 : 75
                      )
                    }} />
                    <small className="block text-[8px] text-slate-500 mt-1 font-mono">Scan to Verify</small>
                  </div>

                  {/* Summary Box with VAT, Discount & Adjustment */}
                  <div className={`space-y-0.5 text-right ${!isPreviewThermal ? 'w-56 bg-slate-50 p-2 rounded-lg border border-slate-200' : ''}`}>
                    <div className="flex justify-between text-slate-600">
                      <span>সাবটোটাল:</span>
                      <span className="font-mono font-semibold">৳{completedSale.subtotal.toFixed(2)}</span>
                    </div>

                    {completedSale.tax_amount > 0 && (
                      <div className="flex justify-between text-blue-600 font-medium">
                        <span>ভ্যাট / ট্যাক্স ({completedSale.tax_rate || 0}%):</span>
                        <span className="font-mono font-bold">+৳{completedSale.tax_amount.toFixed(2)}</span>
                      </div>
                    )}

                    {completedSale.discount_amount > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>ছাড় (Discount):</span>
                        <span className="font-mono">-৳{completedSale.discount_amount.toFixed(2)}</span>
                      </div>
                    )}

                    {completedSale.adjustment_amount !== undefined && completedSale.adjustment_amount !== 0 && (
                      <div className={`flex justify-between font-medium ${completedSale.adjustment_amount > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                        <span>এডজাস্টমেন্ট:</span>
                        <span className="font-mono">{completedSale.adjustment_amount > 0 ? '+' : ''}৳{completedSale.adjustment_amount.toFixed(2)}</span>
                      </div>
                    )}

                    {completedSale.trade_in_credit && completedSale.trade_in_credit > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>ট্রেড-ইন ভাউচার:</span>
                        <span className="font-mono">-৳{completedSale.trade_in_credit.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-b border-slate-300 py-1 my-1">
                      <span>সর্বমোট প্রদেয়:</span>
                      <span className="text-emerald-600 font-mono">৳{completedSale.grand_total.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>পেমেন্ট মাধ্যম:</span>
                      <span className="font-bold">{completedSale.payment_method}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>পরিশোধিত (Paid):</span>
                      <span className="font-mono font-bold text-emerald-600">৳{completedSale.paid_amount.toFixed(2)}</span>
                    </div>

                    {completedSale.due_amount > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>বকেয়া / বাকি:</span>
                        <span className="font-mono">৳{completedSale.due_amount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warranty Notice (Only when items have warranty) */}
                {completedSale.items.some(it => it.warranty_months) && (
                  <div className="p-1.5 bg-blue-50 border border-blue-200 rounded text-center text-blue-800 text-[10px] my-2">
                    <strong>ওয়ারেন্টি শর্তাবলী:</strong> পণ্য ক্রয়ের তারিখ হতে বর্ণিত সময়ের জন্য অফিসিয়াল ওয়ারেন্টি পলিসি প্রযোজ্য।
                  </div>
                )}

                {/* Terms & Conditions from Template */}
                {(() => {
                  try {
                    const tCfg = JSON.parse(localStorage.getItem(`dokan_v2_template_config_${activeTenant.id}`) || localStorage.getItem('dokan_v2_template_config') || '{}');
                    if (tCfg.termsConditions) {
                      return (
                        <div className="p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded text-[9.5px] text-slate-600 my-2 whitespace-pre-line">
                          <strong>শর্তাবলী:</strong><br />{tCfg.termsConditions}
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })()}

                {/* Dual Signatures for A4 / A5 with Ample Signing Room */}
                {(isPreviewA4 || isPreviewA5) && (
                  <div className="flex justify-between pt-14 pb-2 text-[11px] text-slate-600 font-semibold">
                    <div className="w-36 text-center border-t border-dashed border-slate-500 pt-1.5">
                      গ্রাহকের স্বাক্ষর
                    </div>
                    <div className="w-36 text-center border-t border-dashed border-slate-500 pt-1.5">
                      কর্তৃপক্ষের স্বাক্ষর
                    </div>
                  </div>
                )}

                {/* Footer Message with System Admin Branding */}
                <div className="text-center pt-2 text-[10px] text-slate-500">
                  <p className="font-bold text-slate-700">
                    {(() => {
                      try {
                        const tCfg = JSON.parse(localStorage.getItem(`dokan_v2_template_config_${activeTenant.id}`) || localStorage.getItem('dokan_v2_template_config') || '{}');
                        return tCfg.footerNote || '*** ধন্যবাদ আবার আসবেন ***';
                      } catch { return '*** ধন্যবাদ আবার আসবেন ***'; }
                    })()}
                  </p>
                  <p className="font-mono text-slate-500 text-[9.5px] tracking-wide mt-0.5">
                    {activeTenant.system_branding || 'SmartERP Enterprise Platform V2.0'}
                  </p>
                </div>
              </div>
            </div>

            {/* Print Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#dee2e6]">
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="px-4 py-2 bg-[#f8f9fa] hover:bg-gray-200 text-[#495057] font-bold rounded-lg cursor-pointer border border-[#dee2e6]"
              >
                বন্ধ করুন
              </button>

              <button
                type="button"
                onClick={() => {
                  let templateSettings: any = {};
                  try {
                    templateSettings = JSON.parse(
                      localStorage.getItem(`dokan_v2_template_config_${activeTenant.id}`) ||
                      localStorage.getItem('dokan_v2_template_config') ||
                      '{}'
                    );
                  } catch (e) {
                    console.error(e);
                  }

                  printPosReceipt({
                    shopName: activeTenant.name || 'SmartERP Enterprise',
                    shopAddress: activeTenant.address || 'ঢাকা, বাংলাদেশ',
                    shopPhone: activeTenant.phone || '01700-000000',
                    shopEmail: activeTenant.email || '',
                    tinNo: activeTenant.tin_number || '',
                    binNo: activeTenant.bin_number || activeTenant.vat_number || 'BIN-123456789',
                    vatRegNo: activeTenant.bin_number || activeTenant.vat_number || 'BIN-123456789',
                    headerNote: templateSettings.headerNote || 'বিসমিল্লাহির রাহমানির রাহিম',
                    footerNote: templateSettings.footerNote || 'বিক্রিত পণ্য ৭ দিনের মধ্যে ক্যাশ মেমো সহ পরিবর্তনযোগ্য। ধন্যবাদ, আবার আসবেন!',
                    termsNote: templateSettings.termsConditions || '',
                    templateStyle: templateSettings.templateStyle || 'modern',
                    primaryColor: templateSettings.primaryColor || '#0284c7',
                    showLogo: templateSettings.showLogo ?? true,
                    showQr: templateSettings.showQrCode ?? true,
                    showWatermark: templateSettings.showWatermark ?? true,
                    showSignatures: templateSettings.showSignatures ?? true,
                    showTinBin: templateSettings.showTinBin ?? true,
                    invoiceNo: completedSale.invoice_no,
                    date: completedSale.created_at,
                    customerName: completedSale.customer_name,
                    customerPhone: completedSale.customer_phone,
                    paymentMethod: completedSale.payment_method,
                    items: completedSale.items.map((it) => ({
                      name: it.product.name,
                      quantity: it.quantity,
                      unitPrice: it.unit_price,
                      total: it.total,
                      imei: it.selected_imei,
                      warrantyMonths: it.warranty_months,
                    })),
                    subtotal: completedSale.subtotal,
                    discount: completedSale.discount_amount,
                    tax: completedSale.tax_amount,
                    taxRate: completedSale.tax_rate,
                    adjustment: completedSale.adjustment_amount,
                    tradeInCredit: completedSale.trade_in_credit,
                    grandTotal: completedSale.grand_total,
                    paidAmount: completedSale.paid_amount,
                    dueAmount: completedSale.due_amount,
                    changeAmount: 0,
                    paperFormat: previewPaperSize,
                    softwareBranding: activeTenant.system_branding || 'SmartERP Enterprise Platform V2.0',
                  });
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট মেমো ({previewPaperSize} Print)</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 6. Live Camera Barcode & QR Scanner Modal                                 */}
      {/* ========================================================================= */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />
    </div>
  );
};
