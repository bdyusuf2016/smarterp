import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Barcode, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Eye, 
  Layers, 
  RefreshCw, 
  Settings, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ScrollText,
  FileSpreadsheet,
  Check,
  Tag,
  Scissors
} from 'lucide-react';
import { Tenant, UserRole, GenericProduct } from '../../types';
import { storageService } from '../../services/storageService';
import { BarcodeService } from '../../modules/products/barcode.service';
import { generateQrCodeSvg } from '../../shared/utils/qrCode';
import { generateBarcode128Svg } from '../../shared/utils/barcodeSvg';

interface BarcodeStudioViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
}

interface StickerPrintItem {
  id: string;
  product: GenericProduct;
  qty: number;
}

// Preset format definitions matching industry standard thermal & A4 labels
interface PresetFormat {
  name: string;
  width: number;
  height: number;
  margin: number;
  cols: number;
  fontSize: 'small' | 'normal' | 'large';
  barcodePx: number;
  description: string;
  isRoll: boolean;
}

const PRESET_FORMATS: Record<string, PresetFormat> = {
  'roll-50x25': {
    name: '৫০ × ২৫ মিমি (রোল ১-কলাম)',
    width: 50,
    height: 25,
    margin: 1,
    cols: 1,
    fontSize: 'normal',
    barcodePx: 26,
    description: 'স্ট্যান্ডার্ড থার্মাল সিঙ্গেল রোল লেবেল',
    isRoll: true
  },
  'roll-40x30': {
    name: '৪০ × ৩০ মিমি (কমপ্যাক্ট রোল)',
    width: 40,
    height: 30,
    margin: 1,
    cols: 1,
    fontSize: 'normal',
    barcodePx: 26,
    description: 'ছোট স্টিকার ও প্রাইস ট্যাগ',
    isRoll: true
  },
  'roll-50x30': {
    name: '৫০ × ৩০ মিমি (লার্জ রোল)',
    width: 50,
    height: 30,
    margin: 1,
    cols: 1,
    fontSize: 'normal',
    barcodePx: 30,
    description: 'বড় ও স্পষ্ট টেক্সট প্রাইস ট্যাগ',
    isRoll: true
  },
  'roll-38x25-2col': {
    name: '৩৮ × ২৫ মিমি (২-কলাম ডাবল রোল)',
    width: 38,
    height: 25,
    margin: 1,
    cols: 2,
    fontSize: 'small',
    barcodePx: 22,
    description: 'ডাবল কলাম থার্মাল স্টিকার রোল',
    isRoll: true
  },
  'a4-30': {
    name: 'A4 শিট (৩০ টি লেবেল - ৩×১০)',
    width: 63.5,
    height: 29.6,
    margin: 2,
    cols: 3,
    fontSize: 'normal',
    barcodePx: 28,
    description: 'সাধারণ লেজার/ইঙ্কজেট A4 স্টিকার পেপার',
    isRoll: false
  },
  'a4-24': {
    name: 'A4 শিট (২৪ টি লেবেল - ২×১২)',
    width: 70,
    height: 36,
    margin: 2,
    cols: 2,
    fontSize: 'normal',
    barcodePx: 32,
    description: 'বড় সাইজ A4 স্টিকার শিট পেপার',
    isRoll: false
  },
  'custom': {
    name: 'কাস্টম সাইজ (Custom Dimensions)',
    width: 50,
    height: 25,
    margin: 1,
    cols: 1,
    fontSize: 'normal',
    barcodePx: 26,
    description: 'নিজের প্রয়োজনমতো সাইজ ও মার্জিন দিন',
    isRoll: true
  }
};

/**
 * High-fidelity Single Sticker Label Component
 * Renders authentic SVG barcodes, crisp typography, and accurate proportions.
 */
interface StickerCardProps {
  product: GenericProduct;
  widthMm: number;
  heightMm: number;
  borderStyle: 'dashed' | 'solid' | 'none';
  showShopName: boolean;
  shopTitle: string;
  showProductName: boolean;
  showPrice: boolean;
  pricePrefix: string;
  showCodeNumber: boolean;
  codeType: 'barcode' | 'qrcode';
  barcodeHeightPx: number;
  fontSize: 'small' | 'normal' | 'large';
  scaleMultiplier?: number;
  isPrint?: boolean;
}

const StickerCard: React.FC<StickerCardProps> = ({
  product,
  widthMm,
  heightMm,
  borderStyle,
  showShopName,
  shopTitle,
  showProductName,
  showPrice,
  pricePrefix,
  showCodeNumber,
  codeType,
  barcodeHeightPx,
  fontSize,
  scaleMultiplier = 1,
  isPrint = false
}) => {
  const barcodeText = product.barcode || product.code;

  // Generate authentic SVG graphics
  const codeSvg = useMemo(() => {
    if (codeType === 'qrcode') {
      const qrSize = Math.max(22, Math.min(heightMm * 1.3, 38));
      return generateQrCodeSvg(barcodeText, qrSize);
    } else {
      const h = Math.max(16, Math.min(barcodeHeightPx, heightMm * 1.15));
      return generateBarcode128Svg(barcodeText, h, 1.1, false);
    }
  }, [barcodeText, codeType, heightMm, barcodeHeightPx]);

  // Dynamic font sizing
  const isSmall = heightMm <= 26 || fontSize === 'small';
  const isLarge = heightMm >= 34 && fontSize === 'large';

  const shopNameClass = isSmall 
    ? 'text-[8px] tracking-tight pb-0.5' 
    : isLarge 
      ? 'text-[10px] tracking-wider pb-1' 
      : 'text-[9px] tracking-normal pb-0.5';

  const prodNameClass = isSmall 
    ? 'text-[8.5px] line-clamp-1 leading-tight mt-0.5' 
    : isLarge 
      ? 'text-[11px] line-clamp-2 leading-tight mt-0.5' 
      : 'text-[9.5px] line-clamp-1 leading-tight mt-0.5';

  const codeNumClass = isSmall 
    ? 'text-[7.5px] mt-0.5' 
    : isLarge 
      ? 'text-[9px] mt-1' 
      : 'text-[8px] mt-0.5';

  const footerClass = isSmall 
    ? 'text-[8px] pt-0.5' 
    : isLarge 
      ? 'text-[10px] pt-1' 
      : 'text-[9px] pt-0.5';

  const priceClass = isSmall 
    ? 'text-[9px]' 
    : isLarge 
      ? 'text-[12px]' 
      : 'text-[10px]';

  // Base mm-to-pixel ratio for on-screen preview (3.6px per mm ≈ 96 DPI standard)
  const basePxPerMm = 3.6 * scaleMultiplier;
  const cardWidthPx = Math.round(widthMm * basePxPerMm);
  const cardHeightPx = Math.round(heightMm * basePxPerMm);

  const borderClass = isPrint
    ? borderStyle === 'none'
      ? 'border-0'
      : borderStyle === 'dashed'
        ? 'border border-dashed border-black'
        : 'border border-solid border-black'
    : borderStyle === 'none'
      ? 'border border-slate-200/50 shadow-xs'
      : borderStyle === 'dashed'
        ? 'border border-dashed border-slate-400 shadow-xs'
        : 'border border-solid border-slate-700 shadow-xs';

  return (
    <div
      className={`bg-white text-black flex flex-col justify-between items-center text-center overflow-hidden box-border p-1 ${borderClass}`}
      style={
        isPrint
          ? {
              width: `${widthMm}mm`,
              height: `${heightMm}mm`,
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }
          : {
              width: `${cardWidthPx}px`,
              height: `${cardHeightPx}px`,
              minWidth: `${cardWidthPx}px`,
              minHeight: `${cardHeightPx}px`,
              borderRadius: isPrint || borderStyle === 'dashed' ? '0' : '4px'
            }
      }
    >
      {/* 1. Shop Header */}
      {showShopName && (
        <div className={`w-full font-black uppercase truncate border-b border-black leading-none ${shopNameClass}`}>
          {shopTitle}
        </div>
      )}

      {/* 2. Product Name */}
      {showProductName && (
        <div className={`w-full font-bold px-0.5 ${prodNameClass}`}>
          {product.name}
        </div>
      )}

      {/* 3. Barcode / QR Code Graphic */}
      <div className="my-auto w-full flex flex-col items-center justify-center overflow-hidden px-1">
        {codeType === 'qrcode' ? (
          <div 
            className="flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: codeSvg }} 
          />
        ) : (
          <div 
            className="w-full max-w-[95%] flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: codeSvg }} 
          />
        )}

        {/* Barcode / Code Text */}
        {showCodeNumber && (
          <div className={`font-mono font-bold tracking-wider leading-none text-black ${codeNumClass}`}>
            {barcodeText}
          </div>
        )}
      </div>

      {/* 4. Footer: SKU & Price */}
      <div className={`w-full flex items-center justify-between border-t border-black leading-none px-0.5 ${footerClass}`}>
        <span className="font-mono text-slate-700 truncate max-w-[50%] text-left">
          {product.code}
        </span>
        {showPrice && (
          <span className={`font-black text-black ml-auto whitespace-nowrap ${priceClass}`}>
            {pricePrefix} {Number(product.selling_price || 0).toFixed(0)}
          </span>
        )}
      </div>
    </div>
  );
};

export const BarcodeStudioView: React.FC<BarcodeStudioViewProps> = ({
  activeTenant
}) => {
  const tenantPrefix = BarcodeService.getTenantNumericPrefix(activeTenant.code || activeTenant.id);

  // Load physical products
  const [products, setProducts] = useState<GenericProduct[]>(() => {
    let list = storageService.getProducts(activeTenant.id);
    if (list.length === 0) {
      list = storageService.getProducts();
    }
    return list.filter(p => 
      !p.id.startsWith('srv_') && 
      p.category_name !== 'ফটোকপি ও প্রিন্ট' && 
      p.category_name !== 'অনলাইন নাগরিক সেবা' &&
      p.category_name !== 'ডিজিটাল সেবা'
    );
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Format & Layout State
  const [selectedFormat, setSelectedFormat] = useState<string>('roll-50x25');
  const [widthMm, setWidthMm] = useState<number>(50);
  const [heightMm, setHeightMm] = useState<number>(25);
  const [marginMm, setMarginMm] = useState<number>(1);
  const [colsCount, setColsCount] = useState<number>(1);
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>('normal');
  const [codeType, setCodeType] = useState<'barcode' | 'qrcode'>('barcode');
  const [barcodeHeightPx, setBarcodeHeightPx] = useState<number>(26);
  const [borderStyle, setBorderStyle] = useState<'dashed' | 'solid' | 'none'>('dashed');
  const [pricePrefix, setPricePrefix] = useState<string>('৳');

  // Content Toggles
  const [showShopName, setShowShopName] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showCodeNumber, setShowCodeNumber] = useState(true);
  const [customShopTitle, setCustomShopTitle] = useState(activeTenant.name || 'SmartERP Shop');

  // UI Interactive States
  const [isCustomPanelOpen, setIsCustomPanelOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'closeup' | 'layout'>('closeup');
  const [previewZoom, setPreviewZoom] = useState<number>(1.25);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

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
      setBorderStyle(preset.isRoll ? 'none' : 'dashed');
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

  // Flattened stickers array for printing & layout
  const flattenedStickers = useMemo(() => {
    const result: GenericProduct[] = [];
    batchItems.forEach(item => {
      for (let i = 0; i < item.qty; i++) {
        result.push(item.product);
      }
    });
    return result;
  }, [batchItems]);

  const isCurrentA4 = !PRESET_FORMATS[selectedFormat]?.isRoll;
  const labelsPerPage = isCurrentA4 ? (selectedFormat === 'a4-24' ? 24 : 30) : flattenedStickers.length;
  const estimatedPages = isCurrentA4 ? Math.max(1, Math.ceil(flattenedStickers.length / labelsPerPage)) : 1;

  // Direct Print Trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-16 font-sans select-none">

      {/* ========================================================================= */}
      {/* 1. DYNAMIC PRINT STYLES ENGINE                                            */}
      {/* ========================================================================= */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            ${isCurrentA4 
              ? `size: A4 portrait; margin: 8mm 6mm !important;` 
              : `size: ${widthMm * colsCount + marginMm * 2}mm auto; margin: 0 !important;`
            }
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
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
            margin: 0 auto !important;
            padding: ${isCurrentA4 ? '0' : `${marginMm}mm 0`} !important;
            display: grid !important;
            grid-template-columns: repeat(${colsCount}, ${widthMm}mm) !important;
            gap: ${marginMm}mm !important;
            justify-content: center !important;
            background: white !important;
          }
        }
      `}} />

      {/* Hidden print container rendered ONLY when printing */}
      <div id="v1-barcode-print-workspace" className="hidden print:grid">
        {flattenedStickers.map((prod, idx) => (
          <StickerCard
            key={`print-sheet-${prod.id}-${idx}`}
            product={prod}
            widthMm={widthMm}
            heightMm={heightMm}
            borderStyle={borderStyle}
            showShopName={showShopName}
            shopTitle={customShopTitle}
            showProductName={showProductName}
            showPrice={showPrice}
            pricePrefix={pricePrefix}
            showCodeNumber={showCodeNumber}
            codeType={codeType}
            barcodeHeightPx={barcodeHeightPx}
            fontSize={fontSize}
            isPrint={true}
          />
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 2. ON-SCREEN WORKSPACE UI                                                 */}
      {/* ========================================================================= */}
      <div className="print:hidden space-y-5">
        
        {/* Header Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 leading-tight">
                    বারকোড স্টিকার ও প্রাইস ট্যাগ প্রিন্ট স্টুডিও
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                    V2 Studio
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-indigo-700 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    দোকান প্রিফিক্স: <b className="font-mono bg-indigo-50 px-1 py-0.2 rounded border border-indigo-100">{tenantPrefix}</b>
                  </span>
                  <span>•</span>
                  <span>থার্মাল রোল ও A4 শিটের জন্য হাই-রেজ্যুলেশন প্রিন্ট প্রিভিউ</span>
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
              onClick={() => setIsPrintModalOpen(true)}
              disabled={batchItems.length === 0}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-indigo-200 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>ফুল প্রিভিউ</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={batchItems.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন ({totalStickerCount})</span>
            </button>
          </div>
        </div>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN: Controls, Queue & Catalog (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Format & Preset Selector Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <span>লেবেল ও পেপার ফরম্যাট প্রিসেট</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomPanelOpen(!isCustomPanelOpen)}
                  className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isCustomPanelOpen ? 'কাস্টম অপশন লুকান' : 'কাস্টম সাইজ কনফিগার'}</span>
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
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold">{preset.name}</div>
                      {selectedFormat === key && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </div>
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
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
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
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
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
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">কলাম সংখ্যা (Cols)</label>
                    <select
                      value={colsCount}
                      onChange={e => setColsCount(parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                    >
                      <option value="1">১ কলাম (Single Roll)</option>
                      <option value="2">২ কলাম (Double Roll/A4)</option>
                      <option value="3">৩ কলাম (3-Up A4 Sheet)</option>
                      <option value="4">৪ কলাম (4-Up A4 Sheet)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Design Elements Toggles & Border Style */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
                      checked={showProductName}
                      onChange={e => setShowProductName(e.target.checked)}
                      className="w-3.5 h-3.5 text-indigo-600 rounded"
                    />
                    <span>পণ্যের নাম</span>
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
                    <span>কোড নম্বর</span>
                  </label>
                </div>

                {/* Border Style and Code Type Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      কাটিং বর্ডার স্টাইল:
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setBorderStyle('none')}
                        className={`px-2 py-1.5 rounded-lg border text-center font-bold text-[11px] transition-all ${
                          borderStyle === 'none'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        বর্ডারহীন (রোল)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBorderStyle('dashed')}
                        className={`px-2 py-1.5 rounded-lg border text-center font-bold text-[11px] transition-all ${
                          borderStyle === 'dashed'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        ড্যাশ (A4 গাইড)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBorderStyle('solid')}
                        className={`px-2 py-1.5 rounded-lg border text-center font-bold text-[11px] transition-all ${
                          borderStyle === 'solid'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        সলিড বর্ডার
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      গ্রাফিক মোড:
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setCodeType('barcode')}
                        className={`px-2 py-1.5 rounded-lg border text-center font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                          codeType === 'barcode'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Barcode className="w-3.5 h-3.5" />
                        <span>১D বারকোড (Code 128)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodeType('qrcode')}
                        className={`px-2 py-1.5 rounded-lg border text-center font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                          codeType === 'qrcode'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>২D QR কোড</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shop Header & Price Prefix Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">স্টিকার হেডার টেক্সট:</label>
                    <input
                      type="text"
                      value={customShopTitle}
                      onChange={e => setCustomShopTitle(e.target.value)}
                      placeholder="দোকানের নাম লিখুন..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">মূল্য প্রিফিক্স সিম্বল:</label>
                    <input
                      type="text"
                      value={pricePrefix}
                      onChange={e => setPricePrefix(e.target.value)}
                      placeholder="যেমন: ৳ বা মূল্য:"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
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
                  <span>দোকানের স্টক ক্যাটালগ ({products.length} টি পণ্য)</span>
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
                          +২
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddItem(prod, 4)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] cursor-pointer shadow-xs"
                        >
                          +৪
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Interactive Visual Sticker & Print Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-800 space-y-3 sticky top-16">
              
              {/* Preview Header & Switcher */}
              <div className="flex flex-col gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                    <Eye className="w-4 h-4" />
                    <span>লাইভ স্টিকার প্রিভিউ</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                    {widthMm}×{heightMm} মিমি ({colsCount}-কলাম)
                  </span>
                </div>

                {/* View Mode Switcher (Closeup vs Layout) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('closeup')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        previewMode === 'closeup'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      স্টিকার ক্লোজ-আপ
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('layout')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        previewMode === 'layout'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {isCurrentA4 ? 'A4 শিট লেআউট' : 'থার্মাল রোল লেআউট'}
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg text-slate-300 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.max(0.75, z - 0.25))}
                      className="p-1 hover:text-white cursor-pointer"
                      title="জুম আউট"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <span className="font-mono px-1 font-bold">{Math.round(previewZoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.min(2.0, z + 0.25))}
                      className="p-1 hover:text-white cursor-pointer"
                      title="জুম ইন"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Visual Preview Canvas */}
              <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[340px] max-h-[460px] overflow-auto">
                {batchItems.length === 0 ? (
                  <div className="text-center p-6 space-y-2">
                    <Barcode className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">প্রিভিউ করার মতো কোনো প্রোডাক্ট সিলেক্ট করা নেই।</p>
                    <p className="text-[11px] text-slate-500">বাম পাশের ক্যাটালগ থেকে প্রোডাক্ট যোগ করুন।</p>
                  </div>
                ) : previewMode === 'closeup' ? (
                  /* Single Label HD Detail Inspection View */
                  <div className="flex flex-col items-center justify-center p-3">
                    <div className="mb-2 text-[11px] text-indigo-300 font-medium flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      <span>১ম স্টিকারের হাই-রেজ্যুলেশন প্রিভিউ ({batchItems[0].product.name})</span>
                    </div>

                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 shadow-2xl flex items-center justify-center">
                      <StickerCard
                        product={batchItems[0].product}
                        widthMm={widthMm}
                        heightMm={heightMm}
                        borderStyle={borderStyle}
                        showShopName={showShopName}
                        shopTitle={customShopTitle}
                        showProductName={showProductName}
                        showPrice={showPrice}
                        pricePrefix={pricePrefix}
                        showCodeNumber={showCodeNumber}
                        codeType={codeType}
                        barcodeHeightPx={barcodeHeightPx}
                        fontSize={fontSize}
                        scaleMultiplier={previewZoom}
                      />
                    </div>

                    <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-3">
                      <span>সাইজ: <b className="text-slate-200">{widthMm} × {heightMm} mm</b></span>
                      <span>•</span>
                      <span>অনুপাত: <b className="text-slate-200">{(widthMm / heightMm).toFixed(2)}:1</b></span>
                      <span>•</span>
                      <span>বর্ডার: <b className="text-slate-200">{borderStyle === 'none' ? 'বর্ডারহীন' : borderStyle === 'dashed' ? 'ড্যাশ' : 'সলিড'}</b></span>
                    </div>
                  </div>
                ) : (
                  /* Full Roll / Sheet Grid Layout View */
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full flex items-center justify-between mb-2 px-1 text-[11px] text-slate-400">
                      <span>{isCurrentA4 ? 'A4 শিট পেপার প্রিভিউ' : 'থার্মাল পেপার রোল প্রিভিউ'}</span>
                      <span>মোট: <b className="text-indigo-400">{flattenedStickers.length}</b> টি স্টিকার</span>
                    </div>

                    {isCurrentA4 ? (
                      /* A4 Sheet Simulation Canvas */
                      <div 
                        className="bg-white text-black p-3 rounded-sm shadow-2xl border border-slate-300 mx-auto"
                        style={{
                          width: `${Math.round(210 * 1.3 * (previewZoom / 1.25))}px`,
                          minHeight: `${Math.round(297 * 1.3 * (previewZoom / 1.25))}px`,
                          transformOrigin: 'top center'
                        }}
                      >
                        <div className="text-[8px] text-slate-400 font-mono text-center pb-1 border-b border-slate-100 mb-2">
                          A4 Standard Page (210 × 297 mm) — {colsCount} কলাম
                        </div>
                        <div 
                          className="grid justify-center mx-auto"
                          style={{
                            gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))`,
                            gap: `${Math.max(2, marginMm * 1.5)}px`
                          }}
                        >
                          {flattenedStickers.slice(0, labelsPerPage).map((prod, idx) => (
                            <StickerCard
                              key={`preview-a4-${prod.id}-${idx}`}
                              product={prod}
                              widthMm={widthMm}
                              heightMm={heightMm}
                              borderStyle={borderStyle}
                              showShopName={showShopName}
                              shopTitle={customShopTitle}
                              showProductName={showProductName}
                              showPrice={showPrice}
                              pricePrefix={pricePrefix}
                              showCodeNumber={showCodeNumber}
                              codeType={codeType}
                              barcodeHeightPx={barcodeHeightPx}
                              fontSize={fontSize}
                              scaleMultiplier={0.6 * previewZoom}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Continuous Thermal Roll Simulation */
                      <div 
                        className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 shadow-inner flex flex-col items-center"
                        style={{ width: '100%' }}
                      >
                        {/* Thermal Printer Slot Header */}
                        <div className="w-full h-2 bg-slate-950 rounded-full mb-2 border-b border-slate-700 shadow-xs" />
                        
                        <div 
                          className="bg-white/95 rounded-md p-1 shadow-2xl space-y-1 border border-slate-200"
                          style={{
                            width: `${Math.round((widthMm * colsCount + 6) * 3.2 * previewZoom)}px`
                          }}
                        >
                          <div 
                            className="grid justify-center mx-auto gap-1"
                            style={{
                              gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))`
                            }}
                          >
                            {flattenedStickers.slice(0, colsCount * 8).map((prod, idx) => (
                              <StickerCard
                                key={`preview-roll-${prod.id}-${idx}`}
                                product={prod}
                                widthMm={widthMm}
                                heightMm={heightMm}
                                borderStyle={borderStyle}
                                showShopName={showShopName}
                                shopTitle={customShopTitle}
                                showProductName={showProductName}
                                showPrice={showPrice}
                                pricePrefix={pricePrefix}
                                showCodeNumber={showCodeNumber}
                                codeType={codeType}
                                barcodeHeightPx={barcodeHeightPx}
                                fontSize={fontSize}
                                scaleMultiplier={previewZoom * 0.9}
                              />
                            ))}
                          </div>
                        </div>

                        {flattenedStickers.length > colsCount * 8 && (
                          <div className="text-[10px] text-slate-400 mt-2 font-mono">
                            + আরও {flattenedStickers.length - (colsCount * 8)} টি স্টিকার রোল তালিকায় রয়েছে
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Total Stats & Action Buttons */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>কিউ আইটেম: <b className="text-white">{batchItems.length}</b> টি</span>
                <span>মোট স্টিকার: <b className="text-indigo-400 font-bold">{totalStickerCount}</b> কপি</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  disabled={batchItems.length === 0}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ফুল প্রিভিউ</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={batchItems.length === 0}
                  className="py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/40 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FULL-SCREEN INTERACTIVE PRINT PREVIEW MODAL                            */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    স্টিকার প্রিন্ট প্রিভিউ ও প্রিন্টার লেআউট ({PRESET_FORMATS[selectedFormat]?.name || 'কাস্টম'})
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    মোট {flattenedStickers.length} টি স্টিকার • {isCurrentA4 ? `আনুমানিক ${estimatedPages} টি A4 পাতা` : 'কন্টিনিউয়াস থার্মাল রোল'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>এখনই প্রিন্ট করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Toolbar */}
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-700">
                <span className="flex items-center gap-1">
                  <b>সাইজ:</b> {widthMm} × {heightMm} mm
                </span>
                <span className="flex items-center gap-1">
                  <b>কলাম:</b> {colsCount}
                </span>
                <span className="flex items-center gap-1">
                  <b>মার্জিন:</b> {marginMm} mm
                </span>
                <span className="flex items-center gap-1">
                  <b>বর্ডার:</b> {borderStyle === 'none' ? 'বর্ডারহীন' : borderStyle === 'dashed' ? 'ড্যাশ গাইড' : 'সলিড'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">প্রিভিউ জুম:</span>
                <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.max(0.6, z - 0.2))}
                    className="px-2 py-1 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono font-bold text-[11px]">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.min(2.5, z + 0.2))}
                    className="px-2 py-1 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body: Scrollable Canvas */}
            <div className="flex-1 bg-slate-900/10 p-6 overflow-y-auto flex items-center justify-center min-h-[400px]">
              <div 
                className="bg-white shadow-2xl p-4 rounded-md border border-slate-300 mx-auto"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${colsCount}, ${Math.round(widthMm * 3.6 * previewZoom)}px)`,
                  gap: `${Math.max(2, marginMm * 3.6 * previewZoom)}px`,
                  justifyContent: 'center'
                }}
              >
                {flattenedStickers.map((prod, idx) => (
                  <StickerCard
                    key={`modal-preview-${prod.id}-${idx}`}
                    product={prod}
                    widthMm={widthMm}
                    heightMm={heightMm}
                    borderStyle={borderStyle}
                    showShopName={showShopName}
                    shopTitle={customShopTitle}
                    showProductName={showProductName}
                    showPrice={showPrice}
                    pricePrefix={pricePrefix}
                    showCodeNumber={showCodeNumber}
                    codeType={codeType}
                    barcodeHeightPx={barcodeHeightPx}
                    fontSize={fontSize}
                    scaleMultiplier={previewZoom}
                  />
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
              <div className="text-slate-500 flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {borderStyle === 'dashed'
                    ? 'কাটিং গাইডলাইন সক্রিয় রয়েছে, প্রিন্টের পর কাঁচি দিয়ে সহজে কাটতে পারবেন।'
                    : 'প্রিন্ট ডায়ালগে মার্জিন "None" সিলেক্ট করলে পারফেক্ট অ্যালাইনমেন্ট পাওয়া যাবে।'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট পাঠান</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
