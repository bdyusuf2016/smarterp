import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Barcode, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Sliders, 
  Eye, 
  Layers, 
  Check, 
  RefreshCw, 
  Tag, 
  Settings, 
  Building2, 
  Sparkles,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Tenant, UserRole, GenericProduct } from '../../types';
import { storageService } from '../../services/storageService';
import { BarcodeService } from '../../modules/products/barcode.service';
import { generateQrCodeSvg } from '../../shared/utils/qrCode';

interface BarcodeStudioViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
}

interface StickerPrintItem {
  id: string;
  product: GenericProduct;
  qty: number;
}

// Preset format definitions matching V1
const PRESET_FORMATS: Record<string, {
  name: string;
  width: number;
  height: number;
  margin: number;
  cols: number;
  fontSize: 'small' | 'normal' | 'large';
  barcodePx: number;
  description: string;
}> = {
  'roll-50x25': {
    name: '50 × 25 mm (রোল ১-কলাম)',
    width: 50,
    height: 25,
    margin: 1,
    cols: 1,
    fontSize: 'normal',
    barcodePx: 35,
    description: 'স্ট্যান্ডার্ড থার্মাল সিঙ্গেল রোল লেবেল'
  },
  'roll-40x30': {
    name: '40 × 30 mm (কমপ্যাক্ট রোল)',
    width: 40,
    height: 30,
    margin: 1,
    cols: 1,
    fontSize: 'normal',
    barcodePx: 35,
    description: 'ছোট স্টিকার ও প্রাইস ট্যাগ'
  },
  'roll-50x30': {
    name: '50 × 30 mm (লার্জ রোল)',
    width: 50,
    height: 30,
    margin: 1,
    cols: 1,
    fontSize: 'normal',
    barcodePx: 40,
    description: 'বড় ও স্পষ্ট টেক্সট প্রাইস ট্যাগ'
  },
  'roll-38x25-2col': {
    name: '38 × 25 mm (২-কলাম ডাবল রোল)',
    width: 38,
    height: 25,
    margin: 1,
    cols: 2,
    fontSize: 'small',
    barcodePx: 25,
    description: 'ডাবল কলাম থার্মাল স্টিকার রোল'
  },
  'a4-30': {
    name: 'A4 শিট (৩০ টি লেবেল - ৩×১০)',
    width: 63.5,
    height: 29.6,
    margin: 2,
    cols: 3,
    fontSize: 'normal',
    barcodePx: 35,
    description: 'সাধারণ লেজার/ইঙ্কজেট A4 স্টিকার শিট'
  },
  'a4-24': {
    name: 'A4 শিট (২৪ টি লেবেল - ২×১২)',
    width: 70,
    height: 36,
    margin: 2,
    cols: 2,
    fontSize: 'normal',
    barcodePx: 40,
    description: 'বড় সাইজ A4 স্টিকার পেপার'
  },
  'custom': {
    name: 'কাস্টম সাইজ (Custom Dimensions)',
    width: 50,
    height: 25,
    margin: 1,
    cols: 1,
    fontSize: 'normal',
    barcodePx: 35,
    description: 'নিজের প্রয়োজনমতো সাইজ ও মার্জিন দিন'
  }
};

export const BarcodeStudioView: React.FC<BarcodeStudioViewProps> = ({
  activeTenant
}) => {
  const tenantPrefix = BarcodeService.getTenantNumericPrefix(activeTenant.code || activeTenant.id);

  // Load ONLY physical / external inventory products (excluding virtual/digital services)
  const [products, setProducts] = useState<GenericProduct[]>(() => {
    let list = storageService.getProducts(activeTenant.id);
    if (list.length === 0) {
      list = storageService.getProducts();
    }
    // Strictly physical goods only (exclude digital services / virtual rates)
    return list.filter(p => 
      !p.id.startsWith('srv_') && 
      p.category_name !== 'ফটোকপি ও প্রিন্ট' && 
      p.category_name !== 'অনলাইন নাগরিক সেবা' &&
      p.category_name !== 'ডিজিটাল সেবা'
    );
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Format and layout state
  const [selectedFormat, setSelectedFormat] = useState<string>('roll-50x25');
  const [widthMm, setWidthMm] = useState<number>(50);
  const [heightMm, setHeightMm] = useState<number>(25);
  const [marginMm, setMarginMm] = useState<number>(1);
  const [colsCount, setColsCount] = useState<number>(1);
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>('normal');
  const [codeType, setCodeType] = useState<'barcode' | 'qrcode'>('barcode');
  const [barcodeHeightPx, setBarcodeHeightPx] = useState<number>(35);
  const [borderStyle, setBorderStyle] = useState<'dashed' | 'solid' | 'none'>('dashed');
  const [pricePrefix, setPricePrefix] = useState<string>('মূল্য: ৳');

  // Content toggles
  const [showShopName, setShowShopName] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showCodeNumber, setShowCodeNumber] = useState(true);
  const [showCustomProps, setShowCustomProps] = useState(true);
  const [customShopTitle, setCustomShopTitle] = useState(activeTenant.name || 'SmartERP');

  // Custom Settings Collapsible Panel
  const [isCustomPanelOpen, setIsCustomPanelOpen] = useState(false);

  // Print Queue items
  const [batchItems, setBatchItems] = useState<StickerPrintItem[]>(() => {
    if (products.length > 0) {
      return products.slice(0, 4).map(p => ({
        id: p.id,
        product: ensureTenantBarcode(p, activeTenant),
        qty: 4
      }));
    }
    return [];
  });

  // Ensure every product has a valid tenant-unique barcode
  function ensureTenantBarcode(p: GenericProduct, tenant: Tenant): GenericProduct {
    if (!p.barcode || !p.barcode.startsWith(tenantPrefix)) {
      const uniqueBarcode = BarcodeService.generateTenantUniqueBarcode(tenant, p.code || p.id);
      return { ...p, barcode: uniqueBarcode };
    }
    return p;
  }

  // Handle format preset change
  const handleFormatChange = (formatKey: string) => {
    setSelectedFormat(formatKey);
    const preset = PRESET_FORMATS[formatKey];
    if (preset) {
      setWidthMm(preset.width);
      setHeightMm(preset.height);
      setMarginMm(preset.margin);
      setColsCount(preset.cols);
      setFontSize(preset.fontSize);
      setBarcodeHeightPx(preset.barcodePx);
    }
    if (formatKey === 'custom') {
      setIsCustomPanelOpen(true);
    }
  };

  // Add Item to print queue
  const handleAddItem = (product: GenericProduct, qty = 4) => {
    const verifiedProduct = ensureTenantBarcode(product, activeTenant);
    const existingIdx = batchItems.findIndex(i => i.id === product.id);
    if (existingIdx >= 0) {
      const updated = [...batchItems];
      updated[existingIdx].qty += qty;
      setBatchItems(updated);
    } else {
      setBatchItems([...batchItems, { id: product.id, product: verifiedProduct, qty }]);
    }
  };

  // Update item quantity
  const handleUpdateQty = (productId: string, qty: number) => {
    const validQty = Math.max(1, qty);
    setBatchItems(batchItems.map(item => item.id === productId ? { ...item, qty: validQty } : item));
  };

  // Remove item
  const handleRemoveItem = (productId: string) => {
    setBatchItems(batchItems.filter(item => item.id !== productId));
  };

  // Add all products to print queue
  const handleAddAllProducts = () => {
    const itemsToAdd = filteredProducts.length > 0 ? filteredProducts : products;
    const newQueue = itemsToAdd.map(p => ({
      id: p.id,
      product: ensureTenantBarcode(p, activeTenant),
      qty: 4
    }));
    setBatchItems(newQueue);
  };

  // Auto re-generate tenant-unique barcodes for all products
  const handleRegenerateAllTenantBarcodes = () => {
    const updatedProducts = products.map((p, idx) => {
      const uniqueCode = BarcodeService.generateTenantUniqueBarcode(activeTenant, idx + 1);
      const updated = { ...p, barcode: uniqueCode };
      storageService.saveProduct(updated);
      return updated;
    });

    setProducts(updatedProducts);
    setBatchItems(batchItems.map(item => {
      const found = updatedProducts.find(p => p.id === item.id);
      return found ? { ...item, product: found } : item;
    }));
    alert(`সাফল্যের সাথে দোকানের সকল পণ্যে ইউনিক বারকোড (প্রিফিক্স: ${tenantPrefix}) তৈরি করা হয়েছে!`);
  };

  // Category filter
  const categoriesList = Array.from(new Set(products.map(p => p.category_name))).filter(Boolean);

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCat = selectedCategoryFilter === 'ALL' || p.category_name === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalStickerCount = batchItems.reduce((sum, item) => sum + item.qty, 0);

  // Flattened stickers array for printing
  const flattenedStickers: GenericProduct[] = [];
  batchItems.forEach(item => {
    for (let i = 0; i < item.qty; i++) {
      flattenedStickers.push(item.product);
    }
  });

  // Direct Print Trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-12 font-sans select-none">

      {/* ========================================================================= */}
      {/* 1. DYNAMIC PRINT STYLES ENGINE (Exact 1:1 V1 Print Logic)                 */}
      {/* ========================================================================= */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${widthMm * colsCount + marginMm * 2}mm ${heightMm + marginMm}mm;
            margin: ${marginMm}mm !important;
          }
          body * {
            visibility: hidden !important;
          }
          #v1-barcode-print-workspace, #v1-barcode-print-workspace * {
            visibility: visible !important;
          }
          #v1-barcode-print-workspace {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: grid !important;
            grid-template-columns: repeat(${colsCount}, minmax(0, 1fr)) !important;
            gap: ${marginMm}mm !important;
          }
          .v1-print-single-label {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            box-sizing: border-box !important;
          }
        }
      `}} />

      {/* Hidden container strictly rendered on Print */}
      <div id="v1-barcode-print-workspace" className="hidden print:grid">
        {flattenedStickers.map((prod, idx) => (
          <div
            key={`print-${prod.id}-${idx}`}
            className="v1-print-single-label flex flex-col justify-between items-center text-center p-1 bg-white text-black border border-black"
            style={{
              width: `${widthMm}mm`,
              height: `${heightMm}mm`,
              borderStyle: borderStyle === 'none' ? 'none' : borderStyle
            }}
          >
            {/* Shop Name */}
            {showShopName && (
              <div className="w-full text-[8px] font-black uppercase tracking-wider truncate border-b border-black pb-0.5 leading-none">
                {customShopTitle}
              </div>
            )}

            {/* Product Title */}
            {showProductName && (
              <div className="w-full text-[9px] font-extrabold line-clamp-1 leading-tight px-0.5 mt-0.5">
                {prod.name}
              </div>
            )}

            {/* Barcode / QR Code Graphic */}
            <div className="my-auto flex flex-col items-center">
              {codeType === 'qrcode' ? (
                <div 
                  className="w-7 h-7"
                  dangerouslySetInnerHTML={{ __html: generateQrCodeSvg(prod.barcode || prod.code, 28) }}
                />
              ) : (
                <div className="flex items-center gap-[1.5px] px-1" style={{ height: `${Math.min(28, barcodeHeightPx)}px` }}>
                  {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 4, 1].map((w, i) => (
                    <div key={i} className="bg-black h-full" style={{ width: `${w}px` }} />
                  ))}
                </div>
              )}

              {/* Barcode / SKU Text */}
              {showCodeNumber && (
                <div className="font-mono text-[8px] font-black tracking-wider leading-none mt-0.5">
                  {prod.barcode || prod.code}
                </div>
              )}
            </div>

            {/* Footer: SKU & Price */}
            <div className="w-full flex items-center justify-between border-t border-black pt-0.5 text-[8px] leading-none">
              <span className="font-mono truncate">{prod.code}</span>
              {showPrice && (
                <span className="font-black text-[9px]">
                  {pricePrefix} {prod.selling_price.toFixed(0)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 2. ON-SCREEN WORKSPACE UI                                                 */}
      {/* ========================================================================= */}
      <div className="print:hidden space-y-5">
        
        {/* Header Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  বারকোড স্টিকার ও প্রাইস ট্যাগ প্রিন্ট স্টুডিও (Barcode Hub V1 Engine)
                </h1>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-indigo-600 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    দোকানের ইউনিক প্রিফিক্স: <b className="font-mono">{tenantPrefix}</b>
                  </span>
                  <span>•</span>
                  <span>থার্মাল রোল ও A4 শিটের জন্য ফুল কনফিগারেশন</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerateAllTenantBarcodes}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer"
              title="দোকানের সকল পণ্যের জন্য সম্পূর্ণ নতুন ও ইউনিক বারকোড রেঞ্জ তৈরি করুন"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>ইউনিক বারকোড সিঙ্ক</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={batchItems.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>স্টিকার প্রিন্ট করুন ({totalStickerCount} কপি)</span>
            </button>
          </div>
        </div>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: Controls, Queue & Catalog (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Format & Preset Selector Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <span>লেবেল ও পেপার ফরম্যাট প্রিসেট (V1 Presets)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomPanelOpen(!isCustomPanelOpen)}
                  className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isCustomPanelOpen ? 'কাস্টম অপশন লুকান' : 'কাস্টম সাইজ সেটিংস'}</span>
                  {isCustomPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Format Presets Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(PRESET_FORMATS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleFormatChange(key)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedFormat === key
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{preset.name}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{preset.description}</div>
                  </button>
                ))}
              </div>

              {/* Collapsible Custom Settings */}
              {isCustomPanelOpen && (
                <div className="pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">প্রস্থ (Width mm)</label>
                    <input
                      type="number"
                      min="20"
                      max="210"
                      value={widthMm}
                      onChange={e => setWidthMm(parseFloat(e.target.value) || 50)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">উচ্চতা (Height mm)</label>
                    <input
                      type="number"
                      min="15"
                      max="297"
                      value={heightMm}
                      onChange={e => setHeightMm(parseFloat(e.target.value) || 25)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">মার্জিন (Margin mm)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={marginMm}
                      onChange={e => setMarginMm(parseFloat(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">কলাম সংখ্যা (Cols)</label>
                    <select
                      value={colsCount}
                      onChange={e => setColsCount(parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                    >
                      <option value="1">১ কলাম (Single Roll)</option>
                      <option value="2">২ কলাম (Double Roll/A4)</option>
                      <option value="3">৩ কলাম (3-Up A4)</option>
                      <option value="4">৪ কলাম (4-Up A4)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Design Elements Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={showShopName}
                    onChange={e => setShowShopName(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"
                  />
                  <span>দোকানের নাম</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={e => setShowPrice(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"
                  />
                  <span>বিক্রয়মূল্য (৳)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={showCodeNumber}
                    onChange={e => setShowCodeNumber(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"
                  />
                  <span>বারকোড কোড</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={codeType === 'qrcode'}
                    onChange={e => setCodeType(e.target.checked ? 'qrcode' : 'barcode')}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"
                  />
                  <span>QR কোড মোড</span>
                </label>
              </div>

              {/* Shop Header & Price Prefix Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">স্টিকার হেডার টেক্সট:</label>
                  <input
                    type="text"
                    value={customShopTitle}
                    onChange={e => setCustomShopTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">মূল্য প্রিফিক্স টেক্সট:</label>
                  <input
                    type="text"
                    value={pricePrefix}
                    onChange={e => setPricePrefix(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Print Queue Table */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>প্রিন্ট কিউ তালিকা ({batchItems.length} টি পণ্য, মোট {totalStickerCount} টি স্টিকার)</span>
                </div>
                {batchItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setBatchItems([])}
                    className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    কিউ খালি করুন
                  </button>
                )}
              </div>

              {batchItems.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  নিচের পণ্যের তালিকা থেকে পণ্য সিলেক্ট করুন অথবা <b>"+ সকল পণ্য যোগ করুন"</b> বাটনে চাপুন।
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {batchItems.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex-1 pr-3">
                        <div className="font-bold text-slate-900 truncate">{item.product.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-indigo-700">{item.product.barcode || item.product.code}</span>
                          <span>•</span>
                          <span className="font-black text-emerald-700">৳{item.product.selling_price}</span>
                          <span>•</span>
                          <span>স্টক: {item.product.stock_quantity} {item.product.unit}</span>
                        </div>
                      </div>

                      {/* Copies Controller */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-500 font-medium">কপি:</span>
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={item.qty}
                            onChange={e => handleUpdateQty(item.id, parseInt(e.target.value) || 1)}
                            className="w-12 text-center font-mono font-bold text-xs focus:outline-none border-x border-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Catalog & Search Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Search className="w-4 h-4 text-indigo-600" />
                  <span>দোকানের সম্পূর্ণ স্টক ও পণ্য ক্যাটালগ ({products.length} টি পণ্য)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddAllProducts}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>সকল পণ্য যোগ করুন</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="পণ্যের নাম, কোড বা বারকোড দিয়ে খুঁজুন..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Category Pills */}
              {categoriesList.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('ALL')}
                    className={`px-3 py-1 rounded-full font-bold whitespace-nowrap cursor-pointer text-[11px] ${
                      selectedCategoryFilter === 'ALL'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    সকল পণ্য ({products.length})
                  </button>
                  {categoriesList.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full font-bold whitespace-nowrap cursor-pointer text-[11px] ${
                        selectedCategoryFilter === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Product Catalog List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {filteredProducts.map(prod => {
                  const verifiedProd = ensureTenantBarcode(prod, activeTenant);
                  const isQueued = batchItems.some(i => i.id === prod.id);

                  return (
                    <div
                      key={prod.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isQueued ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex-1 pr-3">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{prod.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                            {prod.category_name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span className="font-bold text-indigo-700">{verifiedProd.barcode || prod.code}</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-700">৳{prod.selling_price}</span>
                          <span>•</span>
                          <span>স্টক: {prod.stock_quantity} {prod.unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddItem(prod, 2)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          +২ কপি
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddItem(prod, 4)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] cursor-pointer shadow-xs"
                        >
                          +৪ কপি
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Interactive Visual Sticker Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-800 space-y-3 sticky top-20">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                  <Eye className="w-4 h-4" />
                  <span>লাইভ স্টিকার প্রিভিউ (Visual Preview)</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded">
                  {widthMm}×{heightMm}mm ({colsCount}-Col)
                </span>
              </div>

              {/* Real-time Grid Preview Canvas */}
              <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
                {batchItems.length === 0 ? (
                  <p className="text-xs text-slate-500">প্রিভিউ করার মতো কোনো প্রোডাক্ট সিলেক্ট করা নেই।</p>
                ) : (
                  <div
                    className="w-full grid gap-2 justify-center"
                    style={{ gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))` }}
                  >
                    {batchItems.slice(0, colsCount * 2).map((item, idx) => (
                      <div
                        key={`preview-${item.id}-${idx}`}
                        className="bg-white text-black p-2 rounded-lg shadow-lg flex flex-col justify-between items-center text-center mx-auto transition-transform hover:scale-102"
                        style={{
                          width: `${Math.min(180, Math.max(120, widthMm * 2.8))}px`,
                          height: `${Math.min(140, Math.max(85, heightMm * 3.5))}px`,
                          border: borderStyle === 'none' ? 'none' : borderStyle === 'dashed' ? '1px dashed #bbb' : '1px solid #777'
                        }}
                      >
                        {showShopName && (
                          <div className="w-full text-[9px] font-black uppercase tracking-wider truncate border-b border-black pb-0.5 leading-none">
                            {customShopTitle}
                          </div>
                        )}

                        {showProductName && (
                          <div className="w-full text-[10px] font-black line-clamp-1 leading-tight px-0.5 mt-0.5">
                            {item.product.name}
                          </div>
                        )}

                        {/* Barcode graphic / QR code */}
                        <div className="my-auto flex flex-col items-center">
                          {codeType === 'qrcode' ? (
                            <div 
                              className="w-8 h-8"
                              dangerouslySetInnerHTML={{ __html: generateQrCodeSvg(item.product.barcode || item.product.code, 32) }}
                            />
                          ) : (
                            <div className="flex items-center gap-[1.5px] px-1" style={{ height: `${Math.min(26, barcodeHeightPx)}px` }}>
                              {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 4, 1].map((w, i) => (
                                <div key={i} className="bg-black h-full" style={{ width: `${w}px` }} />
                              ))}
                            </div>
                          )}

                          {showCodeNumber && (
                            <div className="font-mono text-[9px] font-black tracking-wider leading-none mt-0.5">
                              {item.product.barcode || item.product.code}
                            </div>
                          )}
                        </div>

                        {/* Footer: SKU & Price */}
                        <div className="w-full flex items-center justify-between border-t border-black pt-0.5 text-[8px] leading-none">
                          <span className="font-mono truncate">{item.product.code}</span>
                          {showPrice && (
                            <span className="font-black text-[10px]">
                              {pricePrefix} {item.product.selling_price.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Stats & Action */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>মোট আইটেম: <b className="text-white">{batchItems.length}</b> টি</span>
                <span>মোট প্রিন্ট: <b className="text-indigo-400">{totalStickerCount}</b> টি স্টিকার</span>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                disabled={batchItems.length === 0}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/40 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>সরাসরি থার্মাল প্রিন্টারে পাঠান ({totalStickerCount} টি)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
