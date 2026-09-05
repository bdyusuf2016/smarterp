import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  SlidersHorizontal,
  Layers,
  Smartphone,
  BookOpen,
  Scale,
  Hash,
  Printer,
  Sparkles,
  Tag,
  Trash2,
  Check,
  Eye,
  Info,
  Building2,
  X,
  Zap,
  CheckCircle2,
  AlertCircle,
  Cpu,
  FileText,
  Camera
} from 'lucide-react';
import { 
  Tenant, 
  UserRole, 
  GenericProduct, 
  TrackingMode,
  CustomFieldDefinition
} from '../../types';
import { storageService } from '../../services/storageService';
import { i18n } from '../../services/i18nService';
import { CatalogInitEngine } from '../../engine/catalogInitEngine';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { CameraScannerModal } from '../common/CameraScannerModal';
import { CustomFieldRenderer } from '../common/CustomFieldRenderer';
import { printBarcodeStickers } from '../../shared/utils/printReceipt';
import { IconRenderer } from '../common/IconRenderer';
import { PinVerificationModal } from '../common/PinVerificationModal';
import { useConfirm } from '../../context/ConfirmationContext';

interface ProductsViewProps {
  activeTenant: Tenant;
  activeRole: UserRole;
}

interface DynamicPropertyItem {
  id: string;
  key: string;
  value: string;
}

export interface SubcategoryMeta {
  name: string;
  defaultUnit: string;
  suggestedUnits: string[];
  defaultTracking?: TrackingMode;
}

export const BUSINESS_PRODUCT_CATEGORIES: Record<string, { label: string; subcategories: SubcategoryMeta[] }> = {
  cat_stationery: {
    label: 'বই-খাতা ও স্টেশনারি',
    subcategories: [
      { name: 'কাগজ ও অফসেট রিম', defaultUnit: 'রিম', suggestedUnits: ['রিম', 'প্যাকেট', 'শিট', 'বক্স', 'কার্টুন'], defaultTracking: 'TRACKING_QUANTITY' },
      { name: 'খাতা ও নোটবুক', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'ডজন', 'বান্ডিল', 'বক্স'], defaultTracking: 'TRACKING_QUANTITY' },
      { name: 'কলম, পেন্সিল ও মার্কার', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'বক্স', 'ডজন', 'প্যাকেট'], defaultTracking: 'TRACKING_QUANTITY' },
      { name: 'বই, গাইড ও টেস্ট পেপার', defaultUnit: 'কপি', suggestedUnits: ['কপি', 'বই', 'সেট'], defaultTracking: 'TRACKING_BOOK' },
      { name: 'অফিস সাপ্লাই ও ফাইল', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'ফাইল', 'বক্স', 'সেট'], defaultTracking: 'TRACKING_QUANTITY' },
      { name: 'আর্ট, ড্রয়িং ও কালার', defaultUnit: 'সেট', suggestedUnits: ['সেট', 'পিস', 'বক্স', 'প্যাক'], defaultTracking: 'TRACKING_QUANTITY' },
      { name: 'ক্যালকুলেটর ও জ্যামিতি বক্স', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'বক্স', 'সেট'], defaultTracking: 'TRACKING_SERIAL' },
      { name: 'অন্যান্য স্টেশনারি', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'প্যাকেট', 'বক্স'], defaultTracking: 'TRACKING_QUANTITY' }
    ]
  },
  cat_telecom: {
    label: 'টেলিকম ও মোবাইল শপ',
    subcategories: [
      { name: 'স্মার্টফোন ও ফিচারফোন', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'সেট', 'বক্স'], defaultTracking: 'TRACKING_IMEI' },
      { name: 'চার্জার ও ডেটা কেবল', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'বক্স', 'প্যাকেট'], defaultTracking: 'TRACKING_QUANTITY' },
      { name: 'হেডফোন, বাডস ও স্পিকার', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'সেট', 'বক্স'], defaultTracking: 'TRACKING_SERIAL' },
      { name: 'গ্লাস ও ব্যাক কভার', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'বক্স', 'প্যাক'], defaultTracking: 'TRACKING_QUANTITY' },
      { name: 'পাওয়ার ব্যাংক ও ব্যাটারি', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'সেট'], defaultTracking: 'TRACKING_SERIAL' },
      { name: 'সিম, রাউটার ও মেমোরি কার্ড', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'কার্ড', 'প্যাকেট'], defaultTracking: 'TRACKING_SERIAL' },
      { name: 'অন্যান্য গ্যাজেট', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'সেট'], defaultTracking: 'TRACKING_QUANTITY' }
    ]
  },
  cat_grocery: {
    label: 'মুদি ও সুপারশপ',
    subcategories: [
      { name: 'চাল, ডাল ও আটা-ময়দা', defaultUnit: 'কেজি', suggestedUnits: ['কেজি', 'বস্তা', 'গ্রাম', 'প্যাকেট'], defaultTracking: 'TRACKING_WEIGHT' },
      { name: 'তেল, ঘি ও মশলাপাতি', defaultUnit: 'লিটার', suggestedUnits: ['লিটার', 'বোতল', 'কেজি', 'গ্রাম', 'মি.লি.'], defaultTracking: 'TRACKING_BATCH' },
      { name: 'স্ন্যাক্স, বিস্কুট ও চানাচুর', defaultUnit: 'প্যাকেট', suggestedUnits: ['প্যাকেট', 'বক্স', 'পিস', 'জার', 'কার্টুন'], defaultTracking: 'TRACKING_BATCH' },
      { name: 'পানীয়, চা ও জুস', defaultUnit: 'বোতল', suggestedUnits: ['বোতল', 'ক্যান', 'প্যাকেট', 'কেজি', 'লিটার'], defaultTracking: 'TRACKING_BATCH' },
      { name: 'দুধ, ডিম ও ডেইরি', defaultUnit: 'লিটার', suggestedUnits: ['লিটার', 'হালি', 'ডজন', 'পিস', 'প্যাকেট'], defaultTracking: 'TRACKING_BATCH' },
      { name: 'সাবান, শ্যাম্পু ও টয়লেট্রিজ', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'বোতল', 'প্যাক', 'বক্স'], defaultTracking: 'TRACKING_QUANTITY' },
      { name: 'অন্যান্য মুদি পণ্য', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'কেজি', 'প্যাকেট'], defaultTracking: 'TRACKING_QUANTITY' }
    ]
  },
  cat_services: {
    label: 'ফটোকপি ও ডিজিটাল সেবা',
    subcategories: [
      { name: 'ফটোকপি ও জেরক্স', defaultUnit: 'পৃষ্ঠা', suggestedUnits: ['পৃষ্ঠা', 'কপি', 'সেট'], defaultTracking: 'TRACKING_NONE' },
      { name: 'কালার ও ব্ল্যাক প্রিন্টিং', defaultUnit: 'পৃষ্ঠা', suggestedUnits: ['পৃষ্ঠা', 'কপি', 'শিট'], defaultTracking: 'TRACKING_NONE' },
      { name: 'অনলাইন আবেদন ও সরকারি ফরম', defaultUnit: 'সেবা', suggestedUnits: ['সেবা', 'আবেদন', 'ফরম'], defaultTracking: 'TRACKING_NONE' },
      { name: 'লেমিনেশন ও স্পাইরাল বাইন্ডিং', defaultUnit: 'পিস', suggestedUnits: ['পিস', 'কপি', 'বুকলেট'], defaultTracking: 'TRACKING_NONE' },
      { name: 'ছবি প্রিন্ট ও পাসপোর্ট সাইজ ছবি', defaultUnit: 'কপি', suggestedUnits: ['কপি', 'সেট', 'পাতা'], defaultTracking: 'TRACKING_NONE' },
      { name: 'অন্যান্য নাগরিক সেবা', defaultUnit: 'সেবা', suggestedUnits: ['সেবা', 'কপি'], defaultTracking: 'TRACKING_NONE' }
    ]
  },
  cat_library: {
    label: 'লাইব্রেরি ও বইঘর',
    subcategories: [
      { name: 'পাঠ্যবই ও একাডেমিক গাইড', defaultUnit: 'কপি', suggestedUnits: ['কপি', 'বই', 'সেট'], defaultTracking: 'TRACKING_BOOK' },
      { name: 'উপন্যাস ও সাহিত্য', defaultUnit: 'কপি', suggestedUnits: ['কপি', 'বই', 'ভলিউম'], defaultTracking: 'TRACKING_BOOK' },
      { name: 'ইসলামিক ও ধর্মীয় বই', defaultUnit: 'কপি', suggestedUnits: ['কপি', 'বই', 'সেট'], defaultTracking: 'TRACKING_BOOK' },
      { name: 'শিশু-কিশোর ও কমিকস', defaultUnit: 'কপি', suggestedUnits: ['কপি', 'বই'], defaultTracking: 'TRACKING_BOOK' },
      { name: 'অন্যান্য বই', defaultUnit: 'কপি', suggestedUnits: ['কপি', 'বই'], defaultTracking: 'TRACKING_BOOK' }
    ]
  }
};

export const ProductsView: React.FC<ProductsViewProps> = ({ activeTenant }) => {
  const { confirm } = useConfirm();
  const products = storageService.getProducts(activeTenant.id);
  const categories = storageService.getCategories();
  
  const [lang, setLang] = useState<'bn' | 'en'>(() => i18n.getLanguage());
  const [, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleLang = () => setLang(i18n.getLanguage());
    const handleStorage = () => setRefreshKey(k => k + 1);
    window.addEventListener('dokan_lang_changed', handleLang);
    window.addEventListener('dokan_storage_updated', handleStorage);
    return () => {
      window.removeEventListener('dokan_lang_changed', handleLang);
      window.removeEventListener('dokan_storage_updated', handleStorage);
    };
  }, []);

  const isEn = lang === 'en';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrackingMode, setSelectedTrackingMode] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<GenericProduct | null>(null);
  const [inspectingProduct, setInspectingProduct] = useState<GenericProduct | null>(null);

  // Stock Inward State
  const [isStockInwardModalOpen, setIsStockInwardModalOpen] = useState(false);
  const [inwardProductId, setInwardProductId] = useState<string>('');
  const [inwardQty, setInwardQty] = useState<number>(10);
  const [inwardPurchasePrice, setInwardPurchasePrice] = useState<number>(0);
  const [inwardSellingPrice, setInwardSellingPrice] = useState<number>(0);
  const [inwardSupplier, setInwardSupplier] = useState<string>('');
  const [inwardNotes, setInwardNotes] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<Partial<GenericProduct>>({
    code: '',
    sku: '',
    barcode: '',
    name: '',
    category_name: 'General',
    brand: '',
    unit: 'pcs',
    purchase_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock_alert: 5,
    tracking_mode: 'TRACKING_QUANTITY',
    is_active: true,
    custom_fields: {}
  });

  // Category selection inside form
  const [formCategoryId, setFormCategoryId] = useState<string>('cat_telecom');

  // Specialized Tracking Mode States
  const [imeiList, setImeiList] = useState<string[]>([]);
  const [imeiInput, setImeiInput] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [tareWeightGm, setTareWeightGm] = useState<number>(0);
  const [authorName, setAuthorName] = useState('');
  const [publisherName, setPublisherName] = useState('');

  // Ad-hoc Dynamic Properties state (Custom Key-Values added on the fly)
  const [adHocProperties, setAdHocProperties] = useState<DynamicPropertyItem[]>([]);
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropVal, setNewPropVal] = useState('');

  // Camera Barcode & IMEI Scanner Target State
  const [scannerTarget, setScannerTarget] = useState<'product_barcode' | 'product_imei' | 'inward_scan' | null>(null);

  // Scanner Success Callback
  const handleScannerSuccess = (decodedText: string) => {
    const code = decodedText.trim();
    if (!code) return;

    if (scannerTarget === 'product_barcode') {
      setFormData(prev => ({ ...prev, barcode: code }));
      setScannerTarget(null);
    } else if (scannerTarget === 'product_imei') {
      if (!imeiList.includes(code)) {
        const updated = [...imeiList, code];
        setImeiList(updated);
        setFormData(prev => ({ ...prev, stock_quantity: updated.length }));
      }
    } else if (scannerTarget === 'inward_scan') {
      const found = products.find(p => 
        (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
        p.code.toLowerCase() === code.toLowerCase() ||
        (p.sku && p.sku.toLowerCase() === code.toLowerCase())
      );
      if (found) {
        setInwardProductId(found.id);
        setInwardPurchasePrice(found.purchase_price);
        setInwardSellingPrice(found.selling_price);
      } else {
        alert(isEn ? `No product found matching code: ${code}` : `কোড: ${code} এর সাথে কোনো পণ্য পাওয়া যায়নি।`);
      }
      setScannerTarget(null);
    }
  };

  // Fetch applicable custom fields for currently selected category & subcategory in form
  const categoryFieldDefs = storageService.getCustomFields(formCategoryId, 'product', formData.category_name);
  const definedFieldCodes = new Set(categoryFieldDefs.map(f => f.code));

  // Smart Category Change Handler: Automatically updates tracking mode, unit & properties
  const handleCategoryChange = (newCatId: string) => {
    const catObj = categories.find(c => c.id === newCatId);
    setFormCategoryId(newCatId);

    const subcats = BUSINESS_PRODUCT_CATEGORIES[newCatId]?.subcategories || [];
    const firstSubcat = subcats[0];

    // Determine smart default tracking mode & unit based on selected category / subcategory
    let smartTracking: TrackingMode = firstSubcat?.defaultTracking || 'TRACKING_QUANTITY';
    if (!firstSubcat?.defaultTracking) {
      if (newCatId === 'cat_telecom' || catObj?.code === 'TELECOM' || catObj?.code === 'ELECTRONICS') {
        smartTracking = 'TRACKING_IMEI';
      } else if (newCatId === 'cat_grocery' || catObj?.code === 'GROCERY' || catObj?.code === 'FOOD') {
        smartTracking = 'TRACKING_BATCH';
      } else if (newCatId === 'cat_library' || catObj?.code === 'LIBRARY') {
        smartTracking = 'TRACKING_BOOK';
      } else if (newCatId === 'cat_services' || catObj?.code === 'SERVICES') {
        smartTracking = 'TRACKING_NONE';
      }
    }

    const smartUnit = firstSubcat ? firstSubcat.defaultUnit : (newCatId === 'cat_grocery' ? 'kg' : newCatId === 'cat_services' ? 'service' : 'pcs');

    setFormData(prev => ({
      ...prev,
      business_category_id: newCatId,
      category_name: firstSubcat ? firstSubcat.name : catObj?.name || 'General',
      tracking_mode: smartTracking,
      unit: smartUnit
    }));
  };

  // Smart Subcategory Change Handler: Automatically updates category name, default unit, and tracking mode
  const handleSubcategoryChange = (subcatName: string) => {
    const subcats = BUSINESS_PRODUCT_CATEGORIES[formCategoryId]?.subcategories || [];
    const found = subcats.find(s => s.name === subcatName);
    setFormData(prev => ({
      ...prev,
      category_name: subcatName,
      unit: found ? found.defaultUnit : prev.unit || 'pcs',
      tracking_mode: found?.defaultTracking || prev.tracking_mode || 'TRACKING_QUANTITY'
    }));
  };

  // Filtered product list
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      // Search in custom fields
      Object.values(p.custom_fields || {}).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMode = selectedTrackingMode === 'ALL' || p.tracking_mode === selectedTrackingMode;
    const matchesCat = selectedCategoryFilter === 'ALL' || p.business_category_id === selectedCategoryFilter;
    return matchesSearch && matchesMode && matchesCat;
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    const primaryCatId = activeTenant.active_categories.find(c => c.is_primary)?.business_category_id || activeTenant.active_categories[0]?.business_category_id || 'cat_stationery';
    const primaryCatObj = categories.find(c => c.id === primaryCatId);

    setFormCategoryId(primaryCatId);
    setAdHocProperties([]);
    setNewPropKey('');
    setNewPropVal('');
    setImeiList([]);
    setImeiInput('');
    setBatchNo('');
    setExpiryDate('');
    setTareWeightGm(0);
    setAuthorName('');
    setPublisherName('');

    let initialTracking: TrackingMode = 'TRACKING_QUANTITY';
    let initialUnit = 'pcs';
    if (primaryCatId === 'cat_telecom' || primaryCatObj?.code === 'TELECOM') {
      initialTracking = 'TRACKING_IMEI';
      initialUnit = 'pcs';
    } else if (primaryCatId === 'cat_grocery' || primaryCatObj?.code === 'GROCERY') {
      initialTracking = 'TRACKING_BATCH';
      initialUnit = 'kg';
    } else if (primaryCatId === 'cat_library' || primaryCatObj?.code === 'LIBRARY') {
      initialTracking = 'TRACKING_BOOK';
      initialUnit = 'copy';
    } else if (primaryCatId === 'cat_services' || primaryCatObj?.code === 'SERVICES') {
      initialTracking = 'TRACKING_NONE';
      initialUnit = 'service';
    }

    setFormData({
      id: `prod_${Date.now()}`,
      tenant_id: activeTenant.id,
      business_category_id: primaryCatId,
      code: `SKU-${Date.now().toString().slice(-4)}`,
      sku: '',
      barcode: '',
      name: '',
      category_name: primaryCatObj?.name || 'General',
      brand: '',
      unit: initialUnit,
      purchase_price: 0,
      selling_price: 0,
      stock_quantity: 10,
      min_stock_alert: 3,
      tracking_mode: initialTracking,
      is_active: true,
      custom_fields: {},
      created_at: new Date().toISOString()
    });
    setIsCreateModalOpen(true);
  };

  // Security PIN Verification State
  const [pinModalConfig, setPinModalConfig] = useState<{
    isOpen: boolean;
    actionType: 'delete' | 'edit';
    title?: string;
    subtitle?: string;
    itemName?: string;
    onSuccess: () => void;
  }>({
    isOpen: false,
    actionType: 'delete',
    onSuccess: () => {}
  });

  const confirmDeleteProduct = (p: GenericProduct) => {
    storageService.deleteProduct(p.id);
    setRefreshKey(k => k + 1);
    alert(`পণ্য "${p.name}" সফলভাবে মুছে ফেলা হয়েছে!`);
  };

  const handleDeleteProduct = async (p: GenericProduct) => {
    if (storageService.isPinRequired('delete', activeTenant.id)) {
      setPinModalConfig({
        isOpen: true,
        actionType: 'delete',
        title: 'পণ্য মুছে ফেলতে সিকিউরিটি পিন',
        subtitle: `পণ্য "${p.name}" (${p.code}) মুছে ফেলার জন্য সিকিউরিটি পিন প্রদান করুন`,
        itemName: p.name,
        onSuccess: () => confirmDeleteProduct(p)
      });
    } else {
      const ok = await confirm({
        title: 'পণ্যটি মুছে ফেলতে চান?',
        message: `আপনি কি নিশ্চিত যে পণ্য "${p.name}" (${p.code}) ইনভেন্টরি ও প্রোডাক্ট ক্যাটালগ থেকে মুছে ফেলতে চান?`,
        itemName: `${p.name} (${p.code})`,
        confirmText: 'হ্যাঁ, মুছে ফেলুন',
        cancelText: 'বাতিল',
        type: 'danger',
        icon: 'trash',
        warningNote: 'সতর্কতা: পণ্যটি মুছে ফেললে পুনরায় ফিরিয়ে আনা সম্ভব নয়!'
      });
      if (ok) {
        confirmDeleteProduct(p);
      }
    }
  };

  const openEditDirect = (product: GenericProduct) => {
    setEditingProduct(product);
    const catId = product.business_category_id || activeTenant.active_categories[0]?.business_category_id || 'cat_stationery';
    setFormCategoryId(catId);
    setFormData({ ...product });

    // Load IMEIs if available
    const existingImeis = Array.isArray(product.custom_fields?.imei) 
      ? product.custom_fields.imei as string[] 
      : typeof product.custom_fields?.imei === 'string' 
        ? (product.custom_fields.imei as string).split(',').map(s => s.trim()).filter(Boolean)
        : [];
    setImeiList(existingImeis);
    setImeiInput('');
    setBatchNo(String(product.custom_fields?.batch_no || ''));
    setExpiryDate(String(product.custom_fields?.expiry_date || ''));
    setTareWeightGm(Number(product.custom_fields?.tare_weight_gm) || 0);
    setAuthorName(String(product.custom_fields?.author || ''));
    setPublisherName(String(product.custom_fields?.publisher || ''));

    // Separate schema-defined fields vs ad-hoc dynamic custom properties
    const schemaDefs = storageService.getCustomFields(catId, 'product');
    const schemaCodes = new Set(schemaDefs.map(d => d.code));
    
    const adHocs: DynamicPropertyItem[] = [];
    if (product.custom_fields) {
      Object.entries(product.custom_fields).forEach(([k, v]) => {
        if (!schemaCodes.has(k) && k !== 'imei' && k !== 'batch_no' && k !== 'expiry_date' && k !== 'tare_weight_gm' && k !== 'author' && k !== 'publisher') {
          adHocs.push({
            id: `adhoc_${k}_${Date.now()}`,
            key: k,
            value: String(v)
          });
        }
      });
    }
    setAdHocProperties(adHocs);
    setNewPropKey('');
    setNewPropVal('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (product: GenericProduct) => {
    if (storageService.isPinRequired('edit', activeTenant.id)) {
      setPinModalConfig({
        isOpen: true,
        actionType: 'edit',
        title: 'পণ্য সম্পাদনায় সিকিউরিটি পিন',
        subtitle: `পণ্য "${product.name}" (${product.code}) এর তথ্য এডিট করতে পিন দিন`,
        itemName: product.name,
        onSuccess: () => openEditDirect(product)
      });
    } else {
      openEditDirect(product);
    }
  };

  const handleAddAdHocProperty = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPropKey.trim() || !newPropVal.trim()) return;

    const formattedKey = newPropKey.trim();
    const formattedVal = newPropVal.trim();

    // Check if key already exists
    const exists = adHocProperties.some(p => p.key.toLowerCase() === formattedKey.toLowerCase());
    if (exists) {
      alert(`'${formattedKey}' প্রোপার্টি ইতিমধ্যে যুক্ত রয়েছে!`);
      return;
    }

    setAdHocProperties([
      ...adHocProperties,
      {
        id: `prop_${Date.now()}`,
        key: formattedKey,
        value: formattedVal
      }
    ]);

    setNewPropKey('');
    setNewPropVal('');
  };

  const handleRemoveAdHocProperty = (id: string) => {
    setAdHocProperties(adHocProperties.filter(p => p.id !== id));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    // Combine schema custom fields + ad-hoc dynamic custom properties
    const finalCustomFields: Record<string, unknown> = {
      ...(formData.custom_fields || {})
    };

    // Append all ad-hoc dynamic properties
    adHocProperties.forEach(p => {
      finalCustomFields[p.key] = p.value;
    });

    // Package specialized tracking mode metadata
    if (formData.tracking_mode === 'TRACKING_IMEI') {
      finalCustomFields['imei'] = imeiList;
    }
    if (batchNo.trim()) {
      finalCustomFields['batch_no'] = batchNo.trim();
    }
    if (expiryDate.trim()) {
      finalCustomFields['expiry_date'] = expiryDate.trim();
    }
    if (tareWeightGm > 0) {
      finalCustomFields['tare_weight_gm'] = tareWeightGm;
    }
    if (authorName.trim()) {
      finalCustomFields['author'] = authorName.trim();
    }
    if (publisherName.trim()) {
      finalCustomFields['publisher'] = publisherName.trim();
    }

    const currentCatObj = categories.find(c => c.id === formCategoryId);

    // Auto-calculate stock quantity for IMEI items if IMEIs were provided
    const calculatedStock = formData.tracking_mode === 'TRACKING_IMEI' && imeiList.length > 0
      ? imeiList.length
      : Number(formData.stock_quantity) || 0;

    const productToSave: GenericProduct = {
      id: formData.id || `prod_${Date.now()}`,
      tenant_id: activeTenant.id,
      business_category_id: formCategoryId,
      code: formData.code.trim(),
      sku: formData.sku?.trim() || formData.code.trim(),
      barcode: formData.barcode?.trim() || '',
      name: formData.name.trim(),
      category_name: formData.category_name || currentCatObj?.name || 'General',
      brand: formData.brand?.trim() || '',
      unit: formData.unit?.trim() || 'pcs',
      purchase_price: Number(formData.purchase_price) || 0,
      selling_price: Number(formData.selling_price) || 0,
      stock_quantity: calculatedStock,
      min_stock_alert: Number(formData.min_stock_alert) || 0,
      tracking_mode: formData.tracking_mode as TrackingMode || 'TRACKING_QUANTITY',
      is_active: formData.is_active ?? true,
      custom_fields: finalCustomFields,
      created_at: formData.created_at || new Date().toISOString()
    };

    storageService.saveProduct(productToSave);
    setIsCreateModalOpen(false);
  };

  const handleCustomFieldChange = (fieldCode: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...(prev.custom_fields || {}),
        [fieldCode]: value
      }
    }));
  };

  const renderTrackingBadge = (mode: TrackingMode) => {
    switch (mode) {
      case 'TRACKING_IMEI':
        return <Badge variant="purple"><Smartphone className="w-3 h-3 inline mr-1" /> IMEI Tracked</Badge>;
      case 'TRACKING_SERIAL':
        return <Badge variant="primary"><Hash className="w-3 h-3 inline mr-1" /> Serialized</Badge>;
      case 'TRACKING_BATCH':
        return <Badge variant="success"><Layers className="w-3 h-3 inline mr-1" /> Batch & Expiry</Badge>;
      case 'TRACKING_WEIGHT':
        return <Badge variant="amber"><Scale className="w-3 h-3 inline mr-1" /> Weight Scale</Badge>;
      case 'TRACKING_BOOK':
        return <Badge variant="secondary"><BookOpen className="w-3 h-3 inline mr-1 text-indigo-600" /> Book Master</Badge>;
      case 'TRACKING_NONE':
        return <Badge variant="secondary"><Sparkles className="w-3 h-3 inline mr-1 text-purple-600" /> Service / Rate Card</Badge>;
      default:
        return <Badge variant="secondary"><Package className="w-3 h-3 inline mr-1" /> Standard Quantity</Badge>;
    }
  };

  const handleOpenStockInward = (product?: GenericProduct) => {
    const targetProd = product || products[0];
    if (targetProd) {
      setInwardProductId(targetProd.id);
      setInwardPurchasePrice(targetProd.purchase_price);
      setInwardSellingPrice(targetProd.selling_price);
    } else {
      setInwardProductId('');
      setInwardPurchasePrice(0);
      setInwardSellingPrice(0);
    }
    setInwardQty(10);
    setInwardSupplier('');
    setInwardNotes('');
    setIsStockInwardModalOpen(true);
  };

  const handleSaveStockInward = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === inwardProductId);
    if (!prod) {
      alert('দয়া করে পণ্য নির্বাচন করুন');
      return;
    }

    const updatedProd: GenericProduct = {
      ...prod,
      stock_quantity: prod.stock_quantity + Number(inwardQty),
      purchase_price: Number(inwardPurchasePrice) || prod.purchase_price,
      selling_price: Number(inwardSellingPrice) || prod.selling_price
    };

    storageService.saveProduct(updatedProd);

    // Audit log
    storageService.addAuditLog(
      'STOCK_INWARD',
      'INVENTORY',
      `স্টক ইনওয়ার্ড: ${prod.name} এ ${inwardQty} ${prod.unit} যোগ করা হয়েছে। নতুন মোট স্টক: ${updatedProd.stock_quantity}`
    );

    setIsStockInwardModalOpen(false);
  };

  return (
    <div className="space-y-5 pb-10 select-none font-sans">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {isEn ? 'Products & Inventory Catalog' : 'পণ্য ও ইনভেন্টরি ক্যাটালগ (Product & Dynamic Properties)'}
              </h1>
              <p className="text-[11px] text-slate-500">
                {isEn ? 'Category-based custom schemas and item-level dynamic properties' : 'দোকানের ক্যাটাগরিভিত্তিক কাস্টম স্কিমা এবং আইটেম লেভেল ডাইনামিক প্রোপার্টি ম্যানেজমেন্ট'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const result = CatalogInitEngine.initializeTenantCatalog(activeTenant);
              if (result.importedCount > 0) {
                alert(`⚡ ${result.importedCount} ${isEn ? 'master products imported!' : 'টি মাস্টার পণ্য ক্যাটাগরি অনুযায়ী ইমপোর্ট সম্পন্ন!'}\n\n${isEn ? 'Categories:' : 'ক্যাটাগরি:'} ${result.categoriesImported.join(', ')}`);
                window.location.reload();
              } else {
                alert(isEn ? '✅ All master products already exist in catalog.' : '✅ সকল মাস্টার পণ্য ইতোমধ্যে ক্যাটালগে রয়েছে।');
              }
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>{isEn ? 'Import Catalog' : 'মাস্টার ক্যাটালগ ইমপোর্ট'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenStockInward()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'Stock Inward' : 'নতুন স্টক যুক্ত করুন (Stock Inward)'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? '+ Create Product' : 'নতুন পণ্য তৈরি করুন'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isEn ? "Search by name, SKU, barcode, brand or custom properties..." : "পণ্যের নাম, কোড, বারকোড, ব্র্যান্ড বা কাস্টম প্রোপার্টি (যেমন: 512GB, O'Reilly) দিয়ে খুঁজুন..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{isEn ? 'All Categories' : 'সকল ক্যাটাগরি'}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tracking Mode Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTrackingMode}
              onChange={e => setSelectedTrackingMode(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{isEn ? 'All Tracking Modes' : 'সকল ট্র্যাকিং মোড'}</option>
              <option value="TRACKING_QUANTITY">{isEn ? 'Standard Quantity' : 'Quantity (স্ট্যান্ডার্ড)'}</option>
              <option value="TRACKING_IMEI">{isEn ? 'IMEI Hardware' : 'IMEI (টেলিকম হার্ডওয়্যার)'}</option>
              <option value="TRACKING_SERIAL">{isEn ? 'Serial Number' : 'Serial Number (সিরিয়াল)'}</option>
              <option value="TRACKING_BATCH">{isEn ? 'Batch & Expiry' : 'Batch & Expiry (গ্রোসারি ও মেয়াদ)'}</option>
              <option value="TRACKING_WEIGHT">{isEn ? 'Weight Scale' : 'Weight Scale (ওজন পরিমাপ)'}</option>
              <option value="TRACKING_BOOK">{isEn ? 'Book Catalog' : 'Book Master (বই ও প্রকাশনী)'}</option>
              <option value="TRACKING_NONE">{isEn ? 'Service / Rate Card' : 'Service (ডিজিটাল সেবা)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">{isEn ? 'Product & Code' : 'পণ্য ও আইটেম কোড'}</th>
                <th className="py-3 px-4">{isEn ? 'Category' : 'ক্যাটাগরি'}</th>
                <th className="py-3 px-4">{isEn ? 'Tracking Mode' : 'ট্র্যাকিং মোড'}</th>
                <th className="py-3 px-4">{isEn ? 'Price (Cost / Sell)' : 'মূল্য (ক্রয় / বিক্রয়)'}</th>
                <th className="py-3 px-4">{isEn ? 'Stock Qty' : 'স্টক পরিমাণ'}</th>
                <th className="py-3 px-4">{isEn ? 'Custom Properties' : 'কাস্টম ও ডাইনামিক প্রোপার্টি'}</th>
                <th className="py-3 px-4 text-right">{isEn ? 'Action' : 'একশন'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">{isEn ? 'No products found' : 'কোনো পণ্য পাওয়া যায়নি'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{isEn ? 'Click the button above to add new products.' : 'নতুন পণ্য যুক্ত করতে উপরের বাটনে চাপুন।'}</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const customProps = Object.entries(product.custom_fields || {});
                  const catObj = categories.find(c => c.id === product.business_category_id);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{product.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">{product.code}</span>
                          {product.barcode && <span>• Barcode: {product.barcode}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {catObj?.icon && <IconRenderer name={catObj.icon} className="w-3 h-3 text-indigo-600" />}
                          <span>{catObj?.name || product.category_name}</span>
                        </span>
                        {product.brand && <p className="text-[10px] text-slate-400 mt-0.5">{isEn ? 'Brand:' : 'ব্র্যান্ড:'} {product.brand}</p>}
                      </td>

                      <td className="py-3.5 px-4">
                        {renderTrackingBadge(product.tracking_mode)}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div>
                          <span className="text-slate-400">৳{product.purchase_price.toFixed(2)}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="font-bold text-slate-900">৳{product.selling_price.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-sans font-semibold">
                          {isEn ? 'Margin:' : 'লাভ:'} ৳{(product.selling_price - product.purchase_price).toFixed(2)}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className={`font-bold text-xs ${product.stock_quantity <= product.min_stock_alert ? 'text-rose-600' : 'text-slate-900'}`}>
                          {product.stock_quantity} {product.unit}
                        </div>
                        {product.stock_quantity <= product.min_stock_alert && (
                          <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5">
                            <AlertCircle className="w-3 h-3" />
                            <span>{isEn ? 'Low Stock' : 'কম স্টক এলার্ট'}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {customProps.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">{isEn ? 'No custom properties' : 'কোনো কাস্টম প্রোপার্টি নেই'}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {customProps.slice(0, 3).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-medium">
                                <b className="font-semibold">{k}:</b> {String(v)}
                              </span>
                            ))}
                            {customProps.length > 3 && (
                              <button
                                type="button"
                                onClick={() => setInspectingProduct(product)}
                                className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                              >
                                +{customProps.length - 3} {isEn ? 'more' : 'আরও দেখুন'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectingProduct(product)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title={isEn ? "View Product Properties" : "পণ্যের সম্পূর্ণ প্রোপার্টি দেখুন"}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              printBarcodeStickers([
                                {
                                  shopName: activeTenant.name || 'SmartERP',
                                  productName: product.name,
                                  sku: product.sku || product.code,
                                  barcode: product.barcode || product.code,
                                  sellingPrice: product.selling_price,
                                },
                              ]);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={isEn ? "Print Barcode & Price Tag" : "বারকোড ও প্রাইস ট্যাগ প্রিন্ট করুন"}
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title={isEn ? "Edit Product" : "সম্পাদনা করুন"}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={isEn ? "Delete Product" : "পণ্য মুছে ফেলুন"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================== */}
      {/* ADD / EDIT PRODUCT MODAL WITH DYNAMIC PROPERTIES */}
      {/* ================================================== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingProduct ? (isEn ? `Edit Product: ${editingProduct.name}` : `পণ্য সম্পাদনা: ${editingProduct.name}`) : (isEn ? 'Create New Product & Dynamic Schema' : 'নতুন পণ্য ও ডায়নামিক প্রোপার্টি')}
        subtitle={isEn ? 'Category schema rules, dynamic fields and tracking modes' : 'দোকানের ক্যাটাগরি স্কিমা এবং আইটেমের নিজস্ব কাস্টম প্রোপার্টি ম্যানেজমেন্ট'}
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
          {/* SECTION 1: 3-Tier Category & Base Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase text-slate-800 tracking-wide">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>{isEn ? '1. Business Category & Product Type' : '১. বিজনেস ক্যাটাগরি, পণ্যের ধরন ও সাধারণ বিবরণ'}</span>
            </div>

            {/* 3-Tier Categorization Flow Box */}
            <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Business Category */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isEn ? '1. Business Domain / Category *' : '১. দোকানের বিজনেস ক্যাটাগরি (Business Domain) *'}
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Product Category / Subcategory */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isEn ? '2. Product Subcategory *' : '২. পণ্যের ক্যাটাগরি / সাব-ক্যাটাগরি (Product Category) *'}
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={formData.category_name || ''}
                      onChange={e => handleSubcategoryChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    >
                      {(BUSINESS_PRODUCT_CATEGORIES[formCategoryId]?.subcategories || []).map(sub => (
                        <option key={sub.name} value={sub.name}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Product Name / Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isEn ? '3. Product Title / Full Name *' : '৩. পণ্যের পূর্ণাঙ্গ নাম / টাইটেল (Product Title) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isEn
                      ? "e.g., Samsung Galaxy A15 (6GB/128GB), or A4 80GSM Offset Paper Ream"
                      : formCategoryId === 'cat_stationery' 
                        ? "যেমন: Fresh A4 Offset Paper 80GSM Ream (কাগজ), বা Matador Pinpoint Blue Pen" 
                        : formCategoryId === 'cat_telecom'
                          ? "যেমন: Samsung Galaxy A15 (6GB/128GB), বা Baseus 20W Fast Charger"
                          : formCategoryId === 'cat_grocery'
                            ? "যেমন: তীর ফর্টিফাইড সয়াবিন তেল ৫ লিটার, বা বোম্বে সুইটস চানাচুর ১৫০ গ্রাম"
                            : "যেমন: পণ্যের পূর্ণাঙ্গ ব্র্যান্ড ও বিবরণসহ নাম"
                  }
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 text-xs shadow-2xs"
                />
              </div>
            </div>

            {/* Other Base Attributes: SKU, Barcode, Brand, Unit */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'Item Code / SKU *' : 'আইটেম কোড / SKU *'}</label>
                <input
                  type="text"
                  required
                  placeholder="SKU-1001"
                  value={formData.code || ''}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{isEn ? 'Barcode / UPC' : 'বারকোড / UPC'}</span>
                  <button
                    type="button"
                    onClick={() => setScannerTarget('product_barcode')}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"
                    title={isEn ? "Scan barcode with camera" : "ক্যামেরা দিয়ে বারকোড স্ক্যান করুন"}
                  >
                    <Camera className="w-3 h-3" />
                    <span>{isEn ? 'Scan' : 'স্ক্যান'}</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={isEn ? "Scan or enter barcode" : "স্ক্যান করুন বা লিখুন"}
                    value={formData.barcode || ''}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setScannerTarget('product_barcode')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    title={isEn ? "Scan with camera" : "ক্যামেরা দিয়ে স্ক্যান করুন"}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'Brand / Company' : 'ব্র্যান্ড / কোম্পানি'}</label>
                <input
                  type="text"
                  placeholder={isEn ? "e.g., Apple, Samsung, Fresh" : "যেমন: Matador, Fresh, Apple, Teer"}
                  value={formData.brand || ''}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'Unit of Measure *' : 'একক (Unit of Measure) *'}</label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? "e.g., pcs, kg, box" : "যেমন: pcs, kg, রিম"}
                  value={formData.unit || 'pcs'}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900"
                />
                {/* Predefined Quick Unit Pills */}
                {(() => {
                  const currentSubcat = (BUSINESS_PRODUCT_CATEGORIES[formCategoryId]?.subcategories || []).find(
                    s => s.name === formData.category_name
                  ) || BUSINESS_PRODUCT_CATEGORIES[formCategoryId]?.subcategories[0];
                  const suggested = currentSubcat?.suggestedUnits || ['pcs', 'kg', 'box', 'copy', 'service'];

                  return (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span className="text-[9px] text-slate-400 font-medium mr-0.5">{isEn ? 'Quick:' : 'পছন্দ করুন:'}</span>
                      {suggested.map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, unit: u }))}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            formData.unit === u
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-800'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* SECTION 2: Pricing & Specialized Tracking Mechanisms */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5 text-xs font-bold uppercase text-slate-800 tracking-wide">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>{isEn ? '2. Pricing & Tracking Mechanism' : '২. মূল্য ও ইনভেন্টরি ট্র্যাকিং মোড'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{isEn ? 'Tracking Mechanism *' : 'ট্র্যাকিং মেকানিজম *'}</span>
                  <span className="text-[10px] text-indigo-600 font-bold font-mono">
                    {formData.tracking_mode}
                  </span>
                </label>
                <select
                  value={formData.tracking_mode || 'TRACKING_QUANTITY'}
                  onChange={e => {
                    const newMode = e.target.value as TrackingMode;
                    setFormData(prev => ({ ...prev, tracking_mode: newMode }));
                  }}
                  className="w-full px-3 py-2 bg-indigo-50/70 border-2 border-indigo-300 rounded-lg font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                >
                  <option value="TRACKING_QUANTITY">📦 TRACKING_QUANTITY ({isEn ? 'Standard Stock Counter' : 'স্ট্যান্ডার্ড স্টক গণনা'})</option>
                  <option value="TRACKING_IMEI">📱 TRACKING_IMEI ({isEn ? 'Telecom IMEI Registry' : 'টেলিকম IMEI ট্র্যাকিং'})</option>
                  <option value="TRACKING_SERIAL">🔢 TRACKING_SERIAL ({isEn ? 'Electronics Serial Number' : 'ইলেকট্রনিক্স সিরিয়াল'})</option>
                  <option value="TRACKING_BATCH">🏷️ TRACKING_BATCH ({isEn ? 'Grocery / Pharmacy Expiry' : 'গ্রোসারি ব্যাচ ও মেয়াদ'})</option>
                  <option value="TRACKING_WEIGHT">⚖️ TRACKING_WEIGHT ({isEn ? 'Scale Weight - Kg/gm' : 'ডিজিটাল ওজন স্কেল - কেজি/গ্রাম'})</option>
                  <option value="TRACKING_BOOK">📚 TRACKING_BOOK ({isEn ? 'Books & Library Catalog' : 'বই ও লাইব্রেরি ক্যাটালগ'})</option>
                  <option value="TRACKING_NONE">⚡ TRACKING_NONE ({isEn ? 'Virtual Service / Rate Card' : 'ভার্চুয়াল সেবা / ডিজিটাল রেট'})</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'Purchase Price (৳)' : 'ক্রয় মূল্য (৳)'}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={e => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'Selling Price (৳) *' : 'বিক্রয় মূল্য (৳) *'}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.selling_price}
                  onChange={e => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold font-mono text-indigo-700"
                />
              </div>
            </div>

            {/* DYNAMIC TRACKING PANEL: IMEI / SERIAL */}
            {(formData.tracking_mode === 'TRACKING_IMEI' || formData.tracking_mode === 'TRACKING_SERIAL') && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <span>{isEn ? `IMEI / Serial Registry (${imeiList.length} items)` : `IMEI / সিরিয়াল নম্বর ম্যানেজমেন্ট (${imeiList.length} টি সংযুক্ত)`}</span>
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold">
                    {isEn ? 'Stock Count:' : 'স্টক গণনা:'} <b className="font-mono">{imeiList.length}</b> {isEn ? 'pcs' : 'পিস'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={isEn ? "Enter 15-digit IMEI or Serial and press Enter..." : "১৫-ডিজিট IMEI বা সিরিয়াল লিখে Enter চাপুন বা স্ক্যান করুন..."}
                      value={imeiInput}
                      onChange={e => setImeiInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = imeiInput.trim();
                          if (val && !imeiList.includes(val)) {
                            const updated = [...imeiList, val];
                            setImeiList(updated);
                            setImeiInput('');
                            setFormData(prev => ({ ...prev, stock_quantity: updated.length }));
                          }
                        }
                      }}
                      className="w-full pl-3 pr-8 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setScannerTarget('product_imei')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title={isEn ? "Scan IMEI with camera" : "ক্যামেরা দিয়ে IMEI স্ক্যান করুন"}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setScannerTarget('product_imei')}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title={isEn ? "Scan IMEI barcode with camera" : "ক্যামেরা দিয়ে IMEI স্ক্যান করুন"}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isEn ? 'Scan' : 'স্ক্যান'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const val = imeiInput.trim();
                      if (val && !imeiList.includes(val)) {
                        const updated = [...imeiList, val];
                        setImeiList(updated);
                        setImeiInput('');
                        setFormData(prev => ({ ...prev, stock_quantity: updated.length }));
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                  >
                    {isEn ? '+ Add' : '+ যোগ'}
                  </button>
                </div>

                {imeiList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white rounded-lg border border-blue-200">
                    {imeiList.map((imei, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-mono text-[11px]">
                        <span>{imei}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = imeiList.filter((_, i) => i !== idx);
                            setImeiList(updated);
                            setFormData(prev => ({ ...prev, stock_quantity: updated.length }));
                          }}
                          className="hover:text-rose-600 font-bold ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DYNAMIC TRACKING PANEL: BATCH & EXPIRY */}
            {formData.tracking_mode === 'TRACKING_BATCH' && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>{isEn ? 'Batch & Expiry Date (Grocery / Pharmacy Lot)' : 'ব্যাচ ও মেয়াদোত্তীর্ণ ট্র্যাকিং (Grocery / Pharmacy Batch)'}</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">{isEn ? 'Batch Number' : 'ব্যাচ নম্বর (Batch No)'}</label>
                    <input
                      type="text"
                      placeholder={isEn ? "e.g., BATCH-2026-01" : "যেমন: BATCH-2026-01"}
                      value={batchNo}
                      onChange={e => setBatchNo(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">{isEn ? 'Expiry Date' : 'মেয়াদোত্তীর্ণ তারিখ (Expiry Date)'}</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC TRACKING PANEL: DIGITAL SCALE WEIGHT */}
            {formData.tracking_mode === 'TRACKING_WEIGHT' && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>{isEn ? 'Digital Weight Scale Pricing' : 'ডিজিটাল ওয়েট স্কেল মেকানিজম (Weighing Scale Pricing)'}</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">{isEn ? 'Tare Weight (gm)' : 'প্যাকেট / কন্টেইনারের ট্যার ওজন (Tare Weight gm)'}</label>
                    <input
                      type="number"
                      placeholder={isEn ? "e.g., 20 gm" : "যেমন: 20 গ্রাম"}
                      value={tareWeightGm || ''}
                      onChange={e => setTareWeightGm(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">{isEn ? 'Pricing Rate' : 'মূল্য নির্ধারণ একক'}</label>
                    <div className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800">
                      {isEn ? `Price per ${formData.unit || 'kg'}: ৳${formData.selling_price}` : `প্রতি ${formData.unit || 'কেজি'} বিক্রয় মূল্য: ৳${formData.selling_price}`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC TRACKING PANEL: BOOK CATALOG */}
            {formData.tracking_mode === 'TRACKING_BOOK' && (
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>{isEn ? 'Book Catalog Details' : 'বই ও লাইব্রেরি প্রকাশনা বিবরণ (Book Catalog)'}</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">{isEn ? 'Author / Editor' : 'লেখক / সম্পাদক (Author)'}</label>
                    <input
                      type="text"
                      placeholder={isEn ? "e.g., Dr. Muhammad Zafar Iqbal" : "যেমন: ড. মুহম্মদ জাফর ইকবাল"}
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">{isEn ? 'Publisher / Press' : 'প্রকাশনী / প্রেস (Publisher)'}</label>
                    <input
                      type="text"
                      placeholder={isEn ? "e.g., Ananya, Panjeree" : "যেমন: অনন্যা প্রকাশনী, পাঞ্জেরী"}
                      value={publisherName}
                      onChange={e => setPublisherName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC TRACKING PANEL: VIRTUAL SERVICE */}
            {formData.tracking_mode === 'TRACKING_NONE' && (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-700 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{isEn ? 'This is a virtual service / digital rate card (no physical inventory stock reduction).' : 'এটি একটি ভার্চুয়াল সেবা / ডিজিটাল সার্ভিস রেট কার্ড (কোনো ফিজিক্যাল ইনভেন্টরি স্টক মাইনাস হবে না)।'}</span>
              </div>
            )}

            {/* Standard Quantity Controls (Hidden for Virtual Services and Auto-calculated for IMEI) */}
            {formData.tracking_mode !== 'TRACKING_NONE' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isEn ? 'Current Stock Quantity' : 'বর্তমান স্টক পরিমাণ'} {formData.tracking_mode === 'TRACKING_IMEI' ? (isEn ? '(Auto-synced from IMEI)' : '(IMEI থেকে অটো-সিঙ্ক)') : ''}
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={e => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                    readOnly={formData.tracking_mode === 'TRACKING_IMEI' && imeiList.length > 0}
                    className={`w-full px-3 py-2 border rounded-lg font-mono font-bold ${
                      formData.tracking_mode === 'TRACKING_IMEI' && imeiList.length > 0
                        ? 'bg-slate-100 text-indigo-700 border-indigo-200'
                        : 'bg-white text-slate-900 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'Low Stock Alert Threshold' : 'কম স্টক এলার্ট সীমা (Threshold)'}</label>
                  <input
                    type="number"
                    value={formData.min_stock_alert}
                    onChange={e => setFormData({ ...formData, min_stock_alert: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: CATEGORY & SUBCATEGORY SCHEMA CUSTOM FIELDS */}
          {categoryFieldDefs.length > 0 && (
            <div className="space-y-3 pt-2 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-200/80 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>{isEn ? `3. Category Custom Fields (${categoryFieldDefs.length} fields defined)` : `৩. ক্যাটাগরি ও সাব-ক্যাটাগরি ভিত্তিক কাস্টম ফিল্ড (${categoryFieldDefs.length} টি নির্ধারিত)`}</span>
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold border border-indigo-200">
                    📁 {categories.find(c => c.id === formCategoryId)?.name}
                  </span>
                  {formData.category_name && (
                    <span className="text-[10.5px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                      🏷️ {formData.category_name}
                    </span>
                  )}
                </div>
              </div>
              
              <CustomFieldRenderer
                fields={categoryFieldDefs}
                values={formData.custom_fields || {}}
                onChange={handleCustomFieldChange}
              />
            </div>
          )}

          {/* SECTION 4: ON-THE-FLY AD-HOC DYNAMIC PROPERTIES */}
          <div className="space-y-3 pt-2 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isEn ? '4. Custom Dynamic Item Properties' : '৪. স্টকে Item এর জন্য কাস্টম প্রোপার্টি (Dynamic Custom Properties)'}</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-semibold">
                {isEn ? 'Add any ad-hoc field' : 'প্রয়োজনমতো যেকোনো ফিল্ড যুক্ত করুন'}
              </span>
            </div>

            {/* Input row to add new property on the fly */}
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2.5 rounded-lg border border-indigo-200 shadow-2xs">
              <div className="w-full sm:w-1/3">
                <input
                  type="text"
                  placeholder={isEn ? "Property Name (e.g., Color, GSM)" : "প্রোপার্টি নাম (যেমন: রং, সাইজ, কাগজের GSM)"}
                  value={newPropKey}
                  onChange={e => setNewPropKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <input
                  type="text"
                  placeholder={isEn ? "Property Value (e.g., Midnight Black, 80 GSM)" : "প্রোপার্টি ভ্যালু (যেমন: Midnight Black, XL, 80 GSM)"}
                  value={newPropVal}
                  onChange={e => setNewPropVal(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddAdHocProperty()}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold shrink-0 flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isEn ? 'Add' : 'যুক্ত করুন'}</span>
              </button>
            </div>

            {/* Active Ad-Hoc Properties List */}
            {adHocProperties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {adHocProperties.map(prop => (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-indigo-200 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-bold text-slate-700 shrink-0">{prop.key}:</span>
                      <span className="text-indigo-800 font-semibold truncate bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {prop.value}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAdHocProperty(prop.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      title={isEn ? "Remove" : "মুছে ফেলুন"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                {isEn ? 'No ad-hoc custom properties added.' : 'কোনো অতিরিক্ত কাস্টম প্রোপার্টি যুক্ত করা হয়নি।'}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
            >
              {isEn ? 'Cancel' : 'বাতিল'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingProduct ? (isEn ? 'Save Changes' : 'পরিবর্তন সেভ করুন') : (isEn ? 'Save Product Record' : 'পণ্য রেকর্ড সংরক্ষণ করুন')}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ================================================== */}
      {/* PRODUCT DETAILS & PROPERTY INSPECTOR MODAL */}
      {/* ================================================== */}
      {inspectingProduct && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingProduct(null)}
          title={isEn ? `Product Details: ${inspectingProduct.name}` : `পণ্যের বিবরণ: ${inspectingProduct.name}`}
          subtitle={`${isEn ? 'Item Code:' : 'আইটেম কোড:'} ${inspectingProduct.code} • Barcode: ${inspectingProduct.barcode || 'N/A'}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Core Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500 font-semibold">{isEn ? 'Cost Price' : 'ক্রয় মূল্য'}</div>
                <div className="text-base font-black text-slate-800 mt-0.5 font-mono">
                  ৳{inspectingProduct.purchase_price.toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                <div className="text-[11px] text-indigo-600 font-semibold">{isEn ? 'Selling Price' : 'বিক্রয় মূল্য'}</div>
                <div className="text-base font-black text-indigo-900 mt-0.5 font-mono">
                  ৳{inspectingProduct.selling_price.toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-[11px] text-emerald-600 font-semibold">{isEn ? 'Stock Quantity' : 'স্টক পরিমাণ'}</div>
                <div className="text-base font-black text-emerald-800 mt-0.5 font-mono">
                  {inspectingProduct.stock_quantity} {inspectingProduct.unit}
                </div>
              </div>
            </div>

            {/* Custom & Dynamic Properties Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{isEn ? 'Custom & Dynamic Schema Specifications:' : 'সকল কাস্টম ও ডাইনামিক প্রোপার্টি স্পেসিফিকেশন:'}</span>
              </div>

              {Object.keys(inspectingProduct.custom_fields || {}).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(inspectingProduct.custom_fields || {}).map(([key, val]) => (
                    <div key={key} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
                      <span className="font-bold text-slate-600 text-xs">{key}:</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100 font-mono">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-[11px]">
                  {isEn ? 'No custom properties attached to this product.' : 'এই পণ্যের সাথে কোনো কাস্টম প্রোপার্টি সংযুক্ত নেই।'}
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  const p = inspectingProduct;
                  setInspectingProduct(null);
                  handleOpenEdit(p);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEn ? 'Edit Product' : 'প্রোপার্টি সম্পাদনা করুন'}</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isEn ? 'Close' : 'বন্ধ করুন'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================================================== */}
      {/* STOCK INWARD / ADD STOCK MODAL                     */}
      {/* ================================================== */}
      {isStockInwardModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsStockInwardModalOpen(false)}
          title={isEn ? "Stock Inward (Add Stock)" : "নতুন স্টক ইনওয়ার্ড (Stock Inward / Add Stock)"}
          subtitle={isEn ? "Add incoming stock quantity and update cost / sell pricing" : "বিদ্যমান পণ্যে নতুন স্টক যোগ করুন এবং ক্রয়/বিক্রয় মূল্য আপডেট করুন"}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveStockInward} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'Select Product *' : 'পণ্য নির্বাচন করুন *'}</label>
              <select
                value={inwardProductId}
                onChange={e => {
                  const pid = e.target.value;
                  setInwardProductId(pid);
                  const p = products.find(prod => prod.id === pid);
                  if (p) {
                    setInwardPurchasePrice(p.purchase_price);
                    setInwardSellingPrice(p.selling_price);
                  }
                }}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="">{isEn ? '-- Select Product --' : '-- পণ্য সিলেক্ট করুন --'}</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}) • {isEn ? 'Current Stock:' : 'বর্তমান স্টক:'} {p.stock_quantity} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'Added Stock Qty *' : 'যোগকৃত নতুন স্টক পরিমাণ *'}</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={inwardQty}
                  onChange={e => setInwardQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-700 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'New Cost Price (৳)' : 'নতুন ক্রয় মূল্য (৳)'}</label>
                <input
                  type="number"
                  step="0.01"
                  value={inwardPurchasePrice}
                  onChange={e => setInwardPurchasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'New Selling Price (৳)' : 'নতুন বিক্রয় মূল্য (৳)'}</label>
                <input
                  type="number"
                  step="0.01"
                  value={inwardSellingPrice}
                  onChange={e => setInwardSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'Supplier / Vendor' : 'সাপ্লায়ার / মহাজন'}</label>
                <input
                  type="text"
                  placeholder={isEn ? "e.g., Global Tech, Fresh" : "যেমন: গ্লোবাল টেক, ফ্রেশ ডেইরি"}
                  value={inwardSupplier}
                  onChange={e => setInwardSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{isEn ? 'Challan No / Notes' : 'চালান নং / নোট'}</label>
                <input
                  type="text"
                  placeholder={isEn ? "Invoice or batch reference..." : "ইনভয়েস বা ব্যাচ রেফারেন্স..."}
                  value={inwardNotes}
                  onChange={e => setInwardNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Projected Stock Preview */}
            {inwardProductId && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-600">{isEn ? 'Current Stock: ' : 'বর্তমান স্টক: '}</span>
                  <b className="font-mono">{products.find(p => p.id === inwardProductId)?.stock_quantity || 0}</b>
                  <span className="text-slate-600">{isEn ? ' + Inward: ' : ' + নতুন ইনওয়ার্ড: '}</span>
                  <b className="text-emerald-700 font-mono">+{inwardQty}</b>
                </div>
                <div className="text-right">
                  <span className="text-slate-600 text-[11px]">{isEn ? 'Total After Inward: ' : 'ইনওয়ার্ডের পর মোট স্টক: '}</span>
                  <span className="font-black text-emerald-800 font-mono text-sm">
                    {((products.find(p => p.id === inwardProductId)?.stock_quantity || 0) + Number(inwardQty))}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsStockInwardModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                {isEn ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isEn ? 'Save Stock Inward' : 'স্টক ইনওয়ার্ড সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================================================== */}
      {/* CAMERA SCANNER MODAL (BARCODE / IMEI / INWARD)     */}
      {/* ================================================== */}
      <CameraScannerModal
        isOpen={scannerTarget !== null}
        onClose={() => setScannerTarget(null)}
        onScanSuccess={handleScannerSuccess}
        title={
          scannerTarget === 'product_barcode'
            ? (isEn ? 'Scan Product Barcode' : 'পণ্যের বারকোড স্ক্যান করুন')
            : scannerTarget === 'product_imei'
            ? (isEn ? 'Scan Device IMEI / Serial' : 'ডিভাইস IMEI বা সিরিয়াল স্ক্যান করুন')
            : (isEn ? 'Scan Product for Stock Inward' : 'স্টক ইনওয়ার্ডের জন্য পণ্য স্ক্যান করুন')
        }
        subtitle={
          scannerTarget === 'product_imei'
            ? (isEn ? 'Continuous mode: Scan multiple IMEIs consecutively' : 'ধারাবাহিক মোড: একের পর এক একাধিক IMEI স্ক্যান করুন')
            : undefined
        }
        continuousModeDefault={scannerTarget === 'product_imei'}
      />

      {/* Security PIN Verification Modal */}
      <PinVerificationModal
        isOpen={pinModalConfig.isOpen}
        onClose={() => setPinModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSuccess={pinModalConfig.onSuccess}
        actionType={pinModalConfig.actionType}
        title={pinModalConfig.title}
        subtitle={pinModalConfig.subtitle}
        itemName={pinModalConfig.itemName}
        tenantId={activeTenant.id}
      />
    </div>
  );
};
