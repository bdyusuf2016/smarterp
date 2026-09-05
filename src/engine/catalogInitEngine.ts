import {
  Tenant,
  GenericProduct,
  TrackingMode,
  DeviceItem,
  ProductBatch,
  BookItem
} from '../types';
import { storageService } from '../services/storageService';

export interface CategoryStarterProduct {
  code: string;
  sku: string;
  barcode: string;
  name: string;
  category_name: string;
  brand?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  tracking_mode: TrackingMode;
  specialized_data?: {
    device?: Partial<DeviceItem>;
    batch?: Partial<ProductBatch>;
    book?: Partial<BookItem>;
  };
}

export interface BusinessCategoryStarterPack {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  products: CategoryStarterProduct[];
}

export const CATEGORY_STARTER_PACKS: Record<string, BusinessCategoryStarterPack> = {
  // 1. Telecom & Mobile Shop
  cat_electronics_telecom: {
    categoryId: 'cat_electronics_telecom',
    categoryCode: 'TELECOM',
    categoryName: 'টেলিকম ও মোবাইল শপ',
    products: [
      {
        code: 'TEL-001',
        sku: 'TEL-SAM-A54',
        barcode: '200100100001',
        name: 'Samsung Galaxy A54 (8/128GB)',
        category_name: 'স্মার্টফোন (Smartphones)',
        brand: 'Samsung',
        unit: 'পিস',
        purchase_price: 32000,
        selling_price: 35500,
        stock_quantity: 4,
        min_stock_alert: 2,
        tracking_mode: 'TRACKING_IMEI',
        specialized_data: {
          device: {
            imei: '864201048291001',
            model: 'Samsung Galaxy A54 5G',
            color: 'Awesome Lime',
            storage: '128GB',
            warranty_months: 12
          }
        }
      },
      {
        code: 'TEL-002',
        sku: 'TEL-REDMI-NOTE13',
        barcode: '200100100002',
        name: 'Xiaomi Redmi Note 13 (6/128GB)',
        category_name: 'স্মার্টফোন (Smartphones)',
        brand: 'Xiaomi',
        unit: 'পিস',
        purchase_price: 19500,
        selling_price: 22000,
        stock_quantity: 5,
        min_stock_alert: 2,
        tracking_mode: 'TRACKING_IMEI',
        specialized_data: {
          device: {
            imei: '864201048291002',
            model: 'Redmi Note 13',
            color: 'Midnight Black',
            storage: '128GB',
            warranty_months: 12
          }
        }
      },
      {
        code: 'TEL-003',
        sku: 'TEL-FAST-CHG-33W',
        barcode: '200100100003',
        name: '33W Super Fast USB-C Charger Adapter',
        category_name: 'অ্যাক্সেসরিজ (Accessories)',
        brand: 'Anker',
        unit: 'পিস',
        purchase_price: 850,
        selling_price: 1250,
        stock_quantity: 20,
        min_stock_alert: 5,
        tracking_mode: 'TRACKING_QUANTITY'
      },
      {
        code: 'TEL-004',
        sku: 'TEL-GLASS-11D',
        barcode: '200100100004',
        name: '11D Curved Tempered Glass Protector',
        category_name: 'প্রোটেকশন (Protection)',
        brand: 'Gorilla',
        unit: 'পিস',
        purchase_price: 45,
        selling_price: 150,
        stock_quantity: 50,
        min_stock_alert: 10,
        tracking_mode: 'TRACKING_QUANTITY'
      },
      {
        code: 'TEL-005',
        sku: 'TEL-BATTERY-20K',
        barcode: '200100100005',
        name: 'Remax 20,000mAh Fast Charging Power Bank',
        category_name: 'পাওয়ার ব্যাংক (Power Banks)',
        brand: 'Remax',
        unit: 'পিস',
        purchase_price: 1600,
        selling_price: 2200,
        stock_quantity: 8,
        min_stock_alert: 2,
        tracking_mode: 'TRACKING_SERIAL'
      }
    ]
  },

  // 2. Grocery & Supermarket
  cat_grocery_supermarket: {
    categoryId: 'cat_grocery_supermarket',
    categoryCode: 'GROCERY',
    categoryName: 'মুদি ও সুপারশপ',
    products: [
      {
        code: 'GRO-001',
        sku: 'GRO-RICE-MINIKET',
        barcode: '200200100001',
        name: 'প্রিমিয়াম মিনিকেট চাল (৫০ কেজি বস্তা)',
        category_name: 'চাল ও খাদ্যশস্য (Rice & Grains)',
        brand: 'রশিদ অটো রাইস',
        unit: 'বস্তা',
        purchase_price: 3200,
        selling_price: 3450,
        stock_quantity: 25,
        min_stock_alert: 5,
        tracking_mode: 'TRACKING_WEIGHT'
      },
      {
        code: 'GRO-002',
        sku: 'GRO-OIL-SOYA-5L',
        barcode: '200200100002',
        name: 'রূপচাঁদা সয়াবিন তেল (৫ লিটার পেট বোতল)',
        category_name: 'ভোজ্য তেল (Edible Oil)',
        brand: 'রূপচাঁদা',
        unit: 'বোতল',
        purchase_price: 810,
        selling_price: 850,
        stock_quantity: 30,
        min_stock_alert: 8,
        tracking_mode: 'TRACKING_BATCH',
        specialized_data: {
          batch: {
            batch_number: 'RUP-2026-B1',
            expiry_date: '2027-06-30',
            quantity: 30
          }
        }
      },
      {
        code: 'GRO-003',
        sku: 'GRO-LENTIL-DESHI',
        barcode: '200200100003',
        name: 'দেশি মসুর ডাল (প্রিমিয়াম সিলেকশন)',
        category_name: 'ডাল ও শস্য (Pulses)',
        brand: 'ফ্রেশ',
        unit: 'কেজি',
        purchase_price: 125,
        selling_price: 145,
        stock_quantity: 120,
        min_stock_alert: 20,
        tracking_mode: 'TRACKING_WEIGHT'
      },
      {
        code: 'GRO-004',
        sku: 'GRO-SUGAR-REF',
        barcode: '200200100004',
        name: 'ফ্রেশ পরিশোধিত সাদা চিনি',
        category_name: 'চিনি ও মিষ্টি (Sugar)',
        brand: 'মেঘনা',
        unit: 'কেজি',
        purchase_price: 130,
        selling_price: 140,
        stock_quantity: 150,
        min_stock_alert: 25,
        tracking_mode: 'TRACKING_WEIGHT'
      },
      {
        code: 'GRO-005',
        sku: 'GRO-MILK-DANO-1KG',
        barcode: '200200100005',
        name: 'ডানো ফুল ক্রিম গুঁড়ো দুধ (১ কেজি ফয়েল প্যাক)',
        category_name: 'দুধ ও দুগ্ধজাত (Dairy & Milk)',
        brand: 'Dano',
        unit: 'প্যাক',
        purchase_price: 840,
        selling_price: 890,
        stock_quantity: 20,
        min_stock_alert: 5,
        tracking_mode: 'TRACKING_BATCH',
        specialized_data: {
          batch: {
            batch_number: 'DAN-8902',
            expiry_date: '2027-10-15',
            quantity: 20
          }
        }
      }
    ]
  },

  // 3. Bookstore & Stationery
  cat_library_bookstore: {
    categoryId: 'cat_library_bookstore',
    categoryCode: 'STATIONERY_BOOKSTORE',
    categoryName: 'বই-খাতা, প্রকাশনী ও স্টেশনারি',
    products: [
      {
        code: 'BKS-001',
        sku: 'BKS-ANANDA-MATH',
        barcode: '200300100001',
        name: 'আনন্দ গণিত গাইড (১০ম শ্রেণি - পাঞ্জেরী)',
        category_name: 'গাইড ও পাঠ্যবই (Academic Books)',
        brand: 'পাঞ্জেরী পাবলিকেশন্স',
        unit: 'কপি',
        purchase_price: 360,
        selling_price: 450,
        stock_quantity: 15,
        min_stock_alert: 3,
        tracking_mode: 'TRACKING_BOOK',
        specialized_data: {
          book: {
            title: 'আনন্দ গণিত গাইড ১০ম শ্রেণি',
            author: 'অধ্যাপক এম এ করিম',
            publisher: 'পাঞ্জেরী পাবলিকেশন্স',
            edition: '২০২৬ সংস্করণ',
            isbn: '978-984-40-1920-1'
          }
        }
      },
      {
        code: 'BKS-002',
        sku: 'STA-NOTE-PRACTICAL',
        barcode: '200300100002',
        name: 'সাইন্স প্র্যাকটিক্যাল নোটবুক (১২০ পাতা)',
        category_name: 'খাতা ও নোটবুক (Notebooks)',
        brand: 'বসুন্ধরা পেপার',
        unit: 'পিস',
        purchase_price: 65,
        selling_price: 90,
        stock_quantity: 60,
        min_stock_alert: 15,
        tracking_mode: 'TRACKING_QUANTITY'
      },
      {
        code: 'BKS-003',
        sku: 'STA-PEN-PINPOINT-BOX',
        barcode: '200300100003',
        name: 'ম্যাটাডোর পিনপয়েন্ট বলপেন (২০ পিস বক্স)',
        category_name: 'কলম ও মার্কার (Pens & Markers)',
        brand: 'Matador',
        unit: 'বক্স',
        purchase_price: 85,
        selling_price: 120,
        stock_quantity: 40,
        min_stock_alert: 10,
        tracking_mode: 'TRACKING_QUANTITY'
      },
      {
        code: 'BKS-004',
        sku: 'STA-A4-DOUBLE-A',
        barcode: '200300100004',
        name: 'Double A প্রিমিয়াম A4 ফটো পেপার রিম (৮০ GSM, ৫০০ পাতা)',
        category_name: 'প্রিন্টিং পেপার (Paper Reams)',
        brand: 'Double A',
        unit: 'রিম',
        purchase_price: 420,
        selling_price: 490,
        stock_quantity: 35,
        min_stock_alert: 10,
        tracking_mode: 'TRACKING_QUANTITY'
      },
      {
        code: 'BKS-005',
        sku: 'STA-CALC-FX991',
        barcode: '200300100005',
        name: 'Casio Scientific Calculator FX-991CW Original',
        category_name: 'সায়েন্টিফিক ক্যালকুলেটর (Calculators)',
        brand: 'Casio',
        unit: 'পিস',
        purchase_price: 1850,
        selling_price: 2250,
        stock_quantity: 10,
        min_stock_alert: 2,
        tracking_mode: 'TRACKING_SERIAL'
      }
    ]
  },

  // 4. Digital & Photocopy Services
  cat_digital_services: {
    categoryId: 'cat_digital_services',
    categoryCode: 'DIGITAL_SERVICES',
    categoryName: 'ফটোকপি, প্রিন্ট ও অনলাইন সেবা',
    products: [
      {
        code: 'DS-001',
        sku: 'DS-PHOTOCOPY-A4',
        barcode: '200400100001',
        name: 'A4 সাদা-কালো ফটোকপি (এক পিঠ)',
        category_name: 'ফটোকপি সার্ভিস (Photocopy)',
        unit: 'পাতা',
        purchase_price: 1.0,
        selling_price: 3.0,
        stock_quantity: 9999,
        min_stock_alert: 100,
        tracking_mode: 'TRACKING_NONE'
      },
      {
        code: 'DS-002',
        sku: 'DS-COLOR-PRINT-A4',
        barcode: '200400100002',
        name: 'A4 কালার প্রিন্টিং (হাই-কোয়ালিটি গ্লসি)',
        category_name: 'কালার প্রিন্টিং (Color Print)',
        unit: 'পাতা',
        purchase_price: 5.0,
        selling_price: 15.0,
        stock_quantity: 9999,
        min_stock_alert: 100,
        tracking_mode: 'TRACKING_NONE'
      },
      {
        code: 'DS-003',
        sku: 'DS-LAM-LEGAL',
        barcode: '200400100003',
        name: 'দলিল ও সার্টিফিকেট লেমিনেটিং (Legal Size)',
        category_name: 'লেমিনেটিং (Laminating)',
        unit: 'পিস',
        purchase_price: 8.0,
        selling_price: 30.0,
        stock_quantity: 9999,
        min_stock_alert: 50,
        tracking_mode: 'TRACKING_NONE'
      },
      {
        code: 'DS-004',
        sku: 'DS-NID-PRINT',
        barcode: '200400100004',
        name: 'স্মার্ট এনআইডি কার্ড রঙিন প্রিন্ট ও লেমিনেশন',
        category_name: 'অনলাইন নাগরিক সেবা (Citizen Services)',
        unit: 'সেট',
        purchase_price: 10.0,
        selling_price: 50.0,
        stock_quantity: 9999,
        min_stock_alert: 50,
        tracking_mode: 'TRACKING_NONE'
      },
      {
        code: 'DS-005',
        sku: 'DS-ONLINE-APPLY',
        barcode: '200400100005',
        name: 'চাকরি ও ভর্তি অনলাইন আবেদন ফরম পূরণ সার্ভিস',
        category_name: 'অনলাইন ফরম ফিলাপ (Application Fees)',
        unit: 'আবেদন',
        purchase_price: 0,
        selling_price: 100.0,
        stock_quantity: 9999,
        min_stock_alert: 10,
        tracking_mode: 'TRACKING_NONE'
      }
    ]
  },

  // 5. Pharmacy & Healthcare
  cat_pharmacy_health: {
    categoryId: 'cat_pharmacy_health',
    categoryCode: 'PHARMACY',
    categoryName: 'ফার্মেসি ও ঔষধের দোকান',
    products: [
      {
        code: 'MED-001',
        sku: 'MED-NAPA-500',
        barcode: '200500100001',
        name: 'Napa 500mg Paracetamol Tablet (বক্স)',
        category_name: 'ট্যাবলেট ও ক্যাপসুল (Tablets)',
        brand: 'Beximco Pharma',
        unit: 'পাতা',
        purchase_price: 10.0,
        selling_price: 12.0,
        stock_quantity: 100,
        min_stock_alert: 20,
        tracking_mode: 'TRACKING_BATCH',
        specialized_data: {
          batch: {
            batch_number: 'BEX-NP-882',
            expiry_date: '2028-02-28',
            quantity: 100
          }
        }
      },
      {
        code: 'MED-002',
        sku: 'MED-SECLO-20',
        barcode: '200500100002',
        name: 'Seclo 20mg Omeprazole Capsule',
        category_name: 'গ্যাস্ট্রিক ও এসিডিটি (Gastric Care)',
        brand: 'Square Pharma',
        unit: 'পাতা',
        purchase_price: 54.0,
        selling_price: 60.0,
        stock_quantity: 80,
        min_stock_alert: 15,
        tracking_mode: 'TRACKING_BATCH',
        specialized_data: {
          batch: {
            batch_number: 'SQR-SC-901',
            expiry_date: '2027-11-30',
            quantity: 80
          }
        }
      },
      {
        code: 'MED-003',
        sku: 'MED-SAVLON-100ML',
        barcode: '200500100003',
        name: 'Savlon Antiseptic Liquid (100ml Bottle)',
        category_name: 'ফার্স্ট এইড ও অ্যান্টিসেপটিক (First Aid)',
        brand: 'ACI Limited',
        unit: 'বোতল',
        purchase_price: 48.0,
        selling_price: 55.0,
        stock_quantity: 30,
        min_stock_alert: 5,
        tracking_mode: 'TRACKING_BATCH'
      },
      {
        code: 'MED-004',
        sku: 'MED-THERMOMETER-DIG',
        barcode: '200500100004',
        name: 'Omron Digital Body Thermometer',
        category_name: 'মেডিকেল ডিভাইস (Medical Devices)',
        brand: 'Omron',
        unit: 'পিস',
        purchase_price: 220.0,
        selling_price: 290.0,
        stock_quantity: 15,
        min_stock_alert: 3,
        tracking_mode: 'TRACKING_SERIAL'
      }
    ]
  },

  // 6. Fashion & Clothing
  cat_fashion_clothing: {
    categoryId: 'cat_fashion_clothing',
    categoryCode: 'FASHION',
    categoryName: 'পোশাক ও ফ্যাশন শপ',
    products: [
      {
        code: 'FSH-001',
        sku: 'FSH-PANJABI-COTTON-L',
        barcode: '200600100001',
        name: 'প্রিমিয়াম সুতি পাঞ্জাবি (White Embroidery, Size L)',
        category_name: 'পাঞ্জাবি ও কুর্তা (Panjabi)',
        brand: 'Lubnan Style',
        unit: 'পিস',
        purchase_price: 1450,
        selling_price: 2150,
        stock_quantity: 12,
        min_stock_alert: 3,
        tracking_mode: 'TRACKING_QUANTITY'
      },
      {
        code: 'FSH-002',
        sku: 'FSH-SHIRT-SLIM-40',
        barcode: '200600100002',
        name: 'ফর্মাল কটন শার্ট (Slim Fit Navy Blue, Size 40)',
        category_name: 'ফর্মাল শার্ট (Formal Shirts)',
        brand: 'Richman',
        unit: 'পিস',
        purchase_price: 1100,
        selling_price: 1650,
        stock_quantity: 15,
        min_stock_alert: 4,
        tracking_mode: 'TRACKING_QUANTITY'
      },
      {
        code: 'FSH-003',
        sku: 'FSH-JEANS-DENIM-32',
        barcode: '200600100003',
        name: 'স্ট্রেচ ডেনিম জিন্স প্যান্ট (Size 32)',
        category_name: 'জিন্স ও ট্রাউজার (Jeans & Trousers)',
        brand: 'Lee Cooper',
        unit: 'পিস',
        purchase_price: 1250,
        selling_price: 1850,
        stock_quantity: 18,
        min_stock_alert: 4,
        tracking_mode: 'TRACKING_QUANTITY'
      },
      {
        code: 'FSH-004',
        sku: 'FSH-POLO-TSHIRT-XL',
        barcode: '200600100004',
        name: 'ক্লাসিক পলো টি-শার্ট (100% Combed Cotton, Size XL)',
        category_name: 'টি-শার্ট ও পোলো (T-Shirts)',
        brand: 'Sailor',
        unit: 'পিস',
        purchase_price: 550,
        selling_price: 850,
        stock_quantity: 25,
        min_stock_alert: 5,
        tracking_mode: 'TRACKING_QUANTITY'
      }
    ]
  },

  // 7. Restaurant & Fast Food
  cat_restaurant_cafe: {
    categoryId: 'cat_restaurant_cafe',
    categoryCode: 'RESTAURANT',
    categoryName: 'রেস্তোরাঁ ও ক্যাফে',
    products: [
      {
        code: 'RES-001',
        sku: 'RES-CHICKEN-BIRYANI',
        barcode: '200700100001',
        name: 'স্পেশাল চিকেন বিরিয়ানি প্ল্যাটার (Half/Full)',
        category_name: 'প্রধান খাবার (Main Course)',
        unit: 'প্লেট',
        purchase_price: 160,
        selling_price: 240,
        stock_quantity: 100,
        min_stock_alert: 10,
        tracking_mode: 'TRACKING_NONE'
      },
      {
        code: 'RES-002',
        sku: 'RES-BURGER-CRISPY',
        barcode: '200700100002',
        name: 'ক্রিস্পি ক্রাঞ্চ চিকেন চিজ বার্গার',
        category_name: 'বার্গার ও স্ন্যাকস (Fast Food)',
        unit: 'পিস',
        purchase_price: 110,
        selling_price: 190,
        stock_quantity: 50,
        min_stock_alert: 10,
        tracking_mode: 'TRACKING_NONE'
      },
      {
        code: 'RES-003',
        sku: 'RES-COLD-COFFEE',
        barcode: '200700100003',
        name: 'কোল্ড কফি উইথ ভ্যানিলা আইসক্রিম',
        category_name: 'পানীয় ও ডেজার্ট (Beverages)',
        unit: 'গ্লাস',
        purchase_price: 60,
        selling_price: 130,
        stock_quantity: 80,
        min_stock_alert: 10,
        tracking_mode: 'TRACKING_NONE'
      }
    ]
  },

  // 8. Hardware & Sanitary
  cat_hardware_sanitary: {
    categoryId: 'cat_hardware_sanitary',
    categoryCode: 'HARDWARE',
    categoryName: 'হার্ডওয়্যার ও স্যানিটারি',
    products: [
      {
        code: 'HDW-001',
        sku: 'HDW-PVC-PIPE-1INCH',
        barcode: '200800100001',
        name: 'গাজী PVC পাইপ (১ ইঞ্চি, ১০ ফুট)',
        category_name: 'পাইপ ও ফিটিংস (Pipes & Fittings)',
        brand: 'Gazi Group',
        unit: 'পিস',
        purchase_price: 140,
        selling_price: 180,
        stock_quantity: 50,
        min_stock_alert: 10,
        tracking_mode: 'TRACKING_QUANTITY'
      },
      {
        code: 'HDW-002',
        sku: 'HDW-CEMENT-50KG',
        barcode: '200800100002',
        name: 'শাহ সিমেন্ট (৫০ কেজি ব্যাগ)',
        category_name: 'নির্মাণ সামগ্রী (Building Materials)',
        brand: 'Shah Cement',
        unit: 'ব্যাগ',
        purchase_price: 520,
        selling_price: 560,
        stock_quantity: 100,
        min_stock_alert: 20,
        tracking_mode: 'TRACKING_QUANTITY'
      },
      {
        code: 'HDW-003',
        sku: 'HDW-LED-BULB-12W',
        barcode: '200800100003',
        name: 'Super Star 12W Energy Saving LED Bulb',
        category_name: 'বৈদ্যুতিক সরঞ্জাম (Electrical)',
        brand: 'Super Star',
        unit: 'পিস',
        purchase_price: 155,
        selling_price: 210,
        stock_quantity: 40,
        min_stock_alert: 8,
        tracking_mode: 'TRACKING_QUANTITY'
      }
    ]
  }
};

export class CatalogInitEngine {
  static resolveStarterPack(id: string): BusinessCategoryStarterPack | undefined {
    if (CATEGORY_STARTER_PACKS[id]) return CATEGORY_STARTER_PACKS[id];
    const lower = id.toLowerCase();
    if (lower.includes('telecom') || lower.includes('mobile') || lower.includes('electronics')) {
      return CATEGORY_STARTER_PACKS['cat_electronics_telecom'];
    }
    if (lower.includes('grocery') || lower.includes('supermarket')) {
      return CATEGORY_STARTER_PACKS['cat_grocery_supermarket'];
    }
    if (lower.includes('stationery') || lower.includes('library') || lower.includes('book')) {
      return CATEGORY_STARTER_PACKS['cat_library_bookstore'];
    }
    if (lower.includes('service') || lower.includes('digital') || lower.includes('photocopy')) {
      return CATEGORY_STARTER_PACKS['cat_digital_services'];
    }
    if (lower.includes('pharmacy') || lower.includes('health') || lower.includes('medicine')) {
      return CATEGORY_STARTER_PACKS['cat_pharmacy_health'];
    }
    if (lower.includes('fashion') || lower.includes('clothing') || lower.includes('cloth')) {
      return CATEGORY_STARTER_PACKS['cat_fashion_clothing'];
    }
    if (lower.includes('restaurant') || lower.includes('cafe') || lower.includes('food')) {
      return CATEGORY_STARTER_PACKS['cat_restaurant_cafe'];
    }
    if (lower.includes('hardware') || lower.includes('sanitary')) {
      return CATEGORY_STARTER_PACKS['cat_hardware_sanitary'];
    }
    return undefined;
  }

  /**
   * Automatically import and provision starter catalog for a tenant
   */
  static initializeTenantCatalog(tenant: Tenant, options: { overwrite?: boolean } = {}): {
    importedCount: number;
    categoriesImported: string[];
    products: GenericProduct[];
  } {
    if (!tenant) {
      return { importedCount: 0, categoriesImported: [], products: [] };
    }

    const activeCatIds = (tenant.active_categories || [])
      .filter(ac => ac.is_active)
      .map(ac => ac.business_category_id);

    // If no specific category, fallback to telecom & grocery
    const targetCatIds = activeCatIds.length > 0 
      ? activeCatIds 
      : ['cat_electronics_telecom', 'cat_grocery_supermarket'];

    const existingProducts = storageService.getProducts(tenant.id);
    const existingCodes = new Set(existingProducts.map(p => p.code));

    const newlyCreated: GenericProduct[] = [];
    const categoriesImported: string[] = [];

    for (const catId of targetCatIds) {
      const pack = this.resolveStarterPack(catId);
      if (!pack) continue;

      categoriesImported.push(pack.categoryName);

      for (const item of pack.products) {
        if (!options.overwrite && existingCodes.has(item.code)) {
          continue;
        }

        const newProd: GenericProduct = {
          id: `prod_${tenant.id}_${item.code.toLowerCase().replace('-', '_')}`,
          tenant_id: tenant.id,
          business_category_id: catId,
          code: item.code,
          sku: item.sku,
          barcode: item.barcode,
          name: item.name,
          category_name: item.category_name,
          brand: item.brand,
          unit: item.unit,
          purchase_price: item.purchase_price,
          selling_price: item.selling_price,
          stock_quantity: item.stock_quantity,
          min_stock_alert: item.min_stock_alert,
          tracking_mode: item.tracking_mode,
          is_active: true,
          created_at: new Date().toISOString()
        };

        storageService.saveProduct(newProd);
        newlyCreated.push(newProd);
        existingCodes.add(item.code);

        // Provision specialized entity records
        if (item.specialized_data?.device && item.tracking_mode === 'TRACKING_IMEI') {
          storageService.saveDevice({
            id: `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            product_id: newProd.id,
            imei: item.specialized_data.device.imei || `8642010${Math.floor(10000000 + Math.random() * 90000000)}`,
            model: item.specialized_data.device.model || newProd.name,
            color: item.specialized_data.device.color || 'Standard',
            storage: item.specialized_data.device.storage || '128GB',
            status: 'available',
            warranty_months: item.specialized_data.device.warranty_months || 12,
            cost_price: item.purchase_price,
            selling_price: item.selling_price
          });
        }

        if (item.specialized_data?.batch && item.tracking_mode === 'TRACKING_BATCH') {
          storageService.saveBatch({
            id: `batch_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            product_id: newProd.id,
            batch_number: item.specialized_data.batch.batch_number || `BAT-${Date.now().toString().slice(-4)}`,
            mfg_date: new Date().toISOString().split('T')[0],
            expiry_date: item.specialized_data.batch.expiry_date || '2027-12-31',
            quantity: item.specialized_data.batch.quantity || newProd.stock_quantity,
            cost_price: item.purchase_price,
            selling_price: item.selling_price,
            status: 'active'
          });
        }

        if (item.specialized_data?.book && item.tracking_mode === 'TRACKING_BOOK') {
          storageService.saveBook({
            id: `book_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            product_id: newProd.id,
            title: item.specialized_data.book.title || newProd.name,
            author: item.specialized_data.book.author || 'লেখক / সম্পাদক',
            publisher: item.specialized_data.book.publisher || 'প্রকাশক',
            edition: item.specialized_data.book.edition || 'বর্তমান সংস্করণ',
            isbn: item.specialized_data.book.isbn || '978-984-00-0000-0',
            total_copies: newProd.stock_quantity,
            available_copies: newProd.stock_quantity,
            shelf_location: 'Rack A-1',
            category_genre: item.category_name,
            condition: 'new'
          });
        }
      }
    }

    if (newlyCreated.length > 0) {
      storageService.addAuditLog(
        'CATALOG_AUTO_INITIALIZED',
        'PRODUCTS',
        `${tenant.name} দোকানে ${newlyCreated.length} টি মাস্টার পণ্য স্বয়ংক্রিয়ভাবে ইমপোর্ট সম্পন্ন হয়েছে। (${categoriesImported.join(', ')})`
      );
    }

    return {
      importedCount: newlyCreated.length,
      categoriesImported,
      products: newlyCreated
    };
  }

  /**
   * Get all available starter packs
   */
  static getAvailablePacks(): BusinessCategoryStarterPack[] {
    return Object.values(CATEGORY_STARTER_PACKS);
  }
}
