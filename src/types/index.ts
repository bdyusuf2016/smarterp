/**
 * Dokan Manager V2 - Generic Business Platform Architecture Types
 * Pure modular design separating Core Platform from Industry-specific extensions.
 */

export type TrackingMode = 
  | 'TRACKING_NONE'
  | 'TRACKING_QUANTITY'
  | 'TRACKING_SERIAL'
  | 'TRACKING_IMEI'
  | 'TRACKING_BATCH'
  | 'TRACKING_WEIGHT'
  | 'TRACKING_BOOK';

export type ModuleCategoryGroup = 'CORE' | 'COMMON' | 'OPTIONAL';

export type UserRole = 
  | 'SUPER_ADMIN'   // Platform / System Admin (Md. Yusuf Ali) — Global Multi-Tenant, Module Matrix & Studio
  | 'ADMIN'         // Shop Owner / Store Admin (দোকান মালিক) — Single Store Operations
  | 'MANAGER'       // Store Manager (স্টোর ম্যানেজার) — Catalog, Reports, Inventory
  | 'CASHIER'       // POS Cashier (ক্যাশিয়ার) — Quick Sales & Billing
  | 'TECHNICIAN'    // Technician (টেকনিশিয়ান) — IMEI & Repair Service
  | 'LIBRARIAN';    // Librarian (লাইব্রেরিয়ান) — Book Catalog & Circulation

// ==================================================
// BUSINESS CATEGORY MODEL
// ==================================================
export interface BusinessCategoryConfig {
  requiresIMEI?: boolean;
  requiresSerial?: boolean;
  requiresBatch?: boolean;
  supportsExpiry?: boolean;
  supportsWeight?: boolean;
  supportsBorrowing?: boolean;
  supportsLateFee?: boolean;
  supportsRepairs?: boolean;
  supportsTradeIn?: boolean;
  supportsRecharge?: boolean;
  supportsWarranty?: boolean;
  defaultWarrantyMonths?: number;
  borrowingDurationDays?: number;
  lateFeePerDay?: number;
  allowNegativeInventory?: boolean;
  defaultTaxRate?: number;
  currencySymbol?: string;
  defaultTrackingMode?: TrackingMode;
  [key: string]: unknown;
}

export interface BusinessCategory {
  id: string;
  code: string; // e.g. 'TELECOM', 'GROCERY', 'STATIONERY', 'LIBRARY', 'ELECTRONICS'
  name: string;
  description: string;
  icon: string; // Lucide icon identifier
  is_system: boolean;
  is_active: boolean;
  configuration: BusinessCategoryConfig;
  created_at: string;
  updated_at: string;
}

// ==================================================
// TENANT BUSINESS PROFILE
// ==================================================
export interface TenantBusinessCategory {
  id: string;
  tenant_id: string;
  business_category_id: string;
  is_primary: boolean;
  is_active: boolean;
  configuration?: Partial<BusinessCategoryConfig>;
  created_at: string;
  updated_at?: string;
}

export interface Tenant {
  id: string;
  code: string;
  name: string;
  owner_name: string;
  email: string;
  phone: string;
  currency: string;
  currency_symbol: string;
  address: string;
  vat_number?: string;
  tin_number?: string;
  bin_number?: string;
  subdomain?: string;
  custom_domain?: string;
  status?: 'active' | 'suspended' | 'trial';
  system_branding?: string;
  active_categories: TenantBusinessCategory[];
  enabled_modules?: string[];
  created_at: string;
  updated_at?: string;
}

// ==================================================
// INVOICE & PRINT TEMPLATE CONFIGURATION
// ==================================================
export type InvoiceTemplateStyle = 'modern' | 'classic' | 'thermal' | 'colorful' | 'tax_compliant';

export interface InvoiceTemplateConfig {
  templateStyle: InvoiceTemplateStyle;
  defaultPaperSize: '80mm' | '58mm' | 'A4' | 'A5';
  primaryColor: string;
  headerNote: string;
  footerNote: string;
  termsConditions?: string;
  showLogo: boolean;
  showWatermark: boolean;
  showQrCode: boolean;
  showCustomerDetails: boolean;
  showTinBin: boolean;
  showWarrantyNote: boolean;
  showSignatures: boolean;
  showSoftwareBranding: boolean;
  softwareBrandingText?: string;
}

// ==================================================
// CUSTOM PAYMENT METHOD CONFIGURATION
// ==================================================
export type CustomPaymentMethodType =
  | 'MFS'
  | 'BANK'
  | 'CARD'
  | 'DIGITAL_WALLET'
  | 'CHEQUE'
  | 'OTHER';

export interface CustomPaymentMethod {
  id: string;
  code: string;
  name: string;
  type: CustomPaymentMethodType;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  chargePercent?: number;
  requireTrxId?: boolean;
  qrCodeUrl?: string;
  isActive: boolean;
  color?: string;
  instructions?: string;
}

// ==================================================
// MODULAR FEATURE SYSTEM
// ==================================================
export interface Module {
  id: string;
  code: string; // e.g. 'SALES', 'IMEI', 'BATCH', 'BOOKS', 'REPAIRS'
  name: string;
  description: string;
  category_group: ModuleCategoryGroup;
  icon: string;
  is_core: boolean;
  is_active: boolean;
}

export interface BusinessCategoryModule {
  business_category_id: string;
  module_id: string;
  enabled_by_default: boolean;
  configuration?: Record<string, unknown>;
}

// ==================================================
// CUSTOM FIELD SYSTEM
// ==================================================
export type CustomFieldType = 
  | 'text' 
  | 'number' 
  | 'decimal' 
  | 'boolean' 
  | 'date' 
  | 'datetime' 
  | 'select' 
  | 'multi-select' 
  | 'phone' 
  | 'email';

export interface CustomFieldDefinition {
  id: string;
  entity_type: 'product' | 'customer' | 'sale' | 'supplier' | 'repair' | 'borrow';
  business_category_id?: string; // If bound to specific business category
  subcategory?: string; // Optional target subcategory (e.g. 'কাগজ ও অফসেট রিম')
  target_subcategories?: string[]; // Multiple target subcategories
  name: string;
  code: string;
  field_type: CustomFieldType;
  options?: string[]; // For select/multi-select
  is_required: boolean;
  default_value?: string | number | boolean;
  placeholder?: string;
  help_text?: string;
}

export interface CustomFieldValue {
  id: string;
  entity_id: string;
  custom_field_id: string;
  value: string | number | boolean | string[];
}

// ==================================================
// GENERIC PRODUCT & INVENTORY MODEL
// ==================================================
export interface GenericProduct {
  id: string;
  tenant_id: string;
  business_category_id: string;
  code: string;
  sku: string;
  barcode?: string;
  name: string;
  category_name: string;
  brand?: string;
  unit: string; // 'pcs', 'kg', 'box', 'item', 'copy'
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  tracking_mode: TrackingMode;
  is_active: boolean;
  custom_fields?: Record<string, unknown>;
  created_at: string;
}

// Specialized Entities (Separated from Core generic product)
export interface DeviceItem {
  id: string;
  product_id: string;
  imei: string;
  serial_number?: string;
  model: string;
  color?: string;
  storage?: string;
  battery_health?: number;
  status: 'available' | 'reserved' | 'sold' | 'in_repair' | 'returned';
  warranty_months: number;
  cost_price: number;
  selling_price: number;
  sold_invoice_no?: string;
}

export interface SerialNumberItem {
  id: string;
  product_id: string;
  serial_number: string;
  status: 'available' | 'sold' | 'defective';
  warranty_end_date?: string;
}

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  mfg_date: string;
  expiry_date: string;
  cost_price: number;
  selling_price: number;
  supplier_id?: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'depleted';
}

export interface BookItem {
  id: string;
  product_id: string;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  edition?: string;
  shelf_location: string;
  category_genre: string;
  total_copies: number;
  available_copies: number;
  condition: 'new' | 'good' | 'fair' | 'damaged';
}

export interface RepairTicket {
  id: string;
  ticket_number: string;
  tenant_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  device_name: string;
  imei_or_serial?: string;
  problem_description: string;
  technician_name: string;
  estimated_cost: number;
  final_cost?: number;
  status: 'received' | 'diagnosing' | 'in_progress' | 'waiting_parts' | 'completed' | 'delivered' | 'cancelled';
  warranty_period_days: number;
  created_at: string;
  completed_at?: string;
}

export interface TradeInRecord {
  id: string;
  tenant_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  device_model: string;
  imei: string;
  condition_grade: 'A - Pristine' | 'B - Good' | 'C - Fair' | 'D - Damaged';
  evaluated_value: number;
  offered_credit: number;
  status: 'pending' | 'accepted' | 'redeemed_in_sale' | 'declined';
  notes?: string;
  created_at: string;
}

export interface RechargeRecord {
  id: string;
  tenant_id: string;
  operator: string;
  recharge_type: 'Airtime Topup' | 'Data Bundle' | 'Postpaid Bill' | 'Utility';
  phone_number: string;
  amount: number;
  commission_rate: number; // e.g. 0.025 (2.5%)
  commission_earned: number;
  status?: 'success' | 'pending' | 'failed';
  transaction_ref: string;
  created_at: string;
}

export interface BorrowRecord {
  id: string;
  tenant_id: string;
  member_id: string;
  member_name: string;
  member_card_no: string;
  book_id: string;
  book_title: string;
  isbn: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  late_fee_per_day: number;
  calculated_late_fee: number;
  late_fee_paid: boolean;
  status: 'borrowed' | 'returned' | 'overdue' | 'lost';
}

export interface CustomerMember {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customer_type: 'individual' | 'corporate' | 'library_member';
  membership_card_no?: string;
  max_borrow_limit?: number;
  active_borrow_count?: number;
  current_due: number;
  total_spent: number;
  loyalty_points: number;
  custom_fields?: Record<string, unknown>;
  created_at: string;
}

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  balance_payable: number;
  category_tags: string[];
}

// ==================================================
// TRANSACTION & SALES PIPELINE MODELS
// ==================================================
export interface CartItem {
  product: GenericProduct;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  // Specialized workflow attachments
  selected_imei?: string;
  selected_serial?: string;
  selected_batch?: string;
  weight_kg?: number;
  warranty_months?: number;
  custom_attributes?: Record<string, unknown>;
}

export interface SaleTransaction {
  id: string;
  invoice_no: string;
  tenant_id: string;
  business_category_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  items: CartItem[];
  subtotal: number;
  tax_amount: number;
  tax_rate?: number;
  discount_amount: number;
  adjustment_amount?: number;
  trade_in_credit?: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  payment_method: 'CASH' | 'CARD' | 'MOBILE_BANKING' | 'CREDIT_DUE' | 'SPLIT';
  payment_status: 'PAID' | 'PARTIAL' | 'DUE';
  notes?: string;
  // Specialized metadata
  specialized_data?: {
    assigned_imeis?: string[];
    assigned_serials?: string[];
    batch_deductions?: { batch_id: string; qty: number }[];
    recharge_records?: string[];
    trade_in_id?: string;
  };
  created_at: string;
}

export interface AccountingEntry {
  id: string;
  tenant_id: string;
  reference_type: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'REPAIR_PAYMENT' | 'LATE_FEE' | 'TRADE_IN' | 'RECHARGE_COMMISSION' | 'JOURNAL' | 'OPENING_BALANCE' | 'TRANSFER';
  reference_id: string;
  title: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_name: string;
  user_role: string;
  action: string;
  module_code: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}
