-- =========================================================================
-- SmartERP Enterprise V2.0 — Supabase Cloud Database Master Schema
-- Multi-Tenant Generic Business Architecture with Industry Specialized Extensions
-- Compatible with PostgreSQL 15+ / Supabase
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TENANTS & DOMAINS
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  currency VARCHAR(16) DEFAULT 'BDT',
  currency_symbol VARCHAR(8) DEFAULT '৳',
  address TEXT DEFAULT 'ঢাকা, বাংলাদেশ',
  vat_number VARCHAR(64),
  subdomain VARCHAR(128) UNIQUE,
  custom_domain VARCHAR(255) UNIQUE,
  status VARCHAR(32) DEFAULT 'active',
  system_branding VARCHAR(255) DEFAULT 'SmartERP Enterprise Platform V2.0',
  enabled_modules JSONB DEFAULT '["SALES", "PRODUCTS", "INVENTORY", "CUSTOMERS", "ACCOUNTING", "REPORTS"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BUSINESS CATEGORIES & EXTENSIONS
CREATE TABLE IF NOT EXISTS business_categories (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(64) DEFAULT 'Store',
  is_system BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_business_categories (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  business_category_id VARCHAR(64) REFERENCES business_categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, business_category_id)
);

-- 3. PRODUCTS & MASTER INVENTORY
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  business_category_id VARCHAR(64) REFERENCES business_categories(id) ON DELETE SET NULL,
  code VARCHAR(64) NOT NULL,
  sku VARCHAR(64) NOT NULL,
  barcode VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  category_name VARCHAR(128) NOT NULL,
  brand VARCHAR(128),
  unit VARCHAR(32) DEFAULT 'পিস',
  purchase_price NUMERIC(15, 2) DEFAULT 0.00,
  selling_price NUMERIC(15, 2) NOT NULL,
  stock_quantity NUMERIC(15, 2) DEFAULT 0,
  min_stock_alert NUMERIC(15, 2) DEFAULT 5,
  tracking_mode VARCHAR(64) DEFAULT 'TRACKING_QUANTITY',
  is_active BOOLEAN DEFAULT TRUE,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SPECIALIZED EXTENSION TABLES
-- 4a. IMEI & Serialized Devices (Telecom / Electronics)
CREATE TABLE IF NOT EXISTS device_items (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
  imei VARCHAR(64) UNIQUE NOT NULL,
  serial_number VARCHAR(128),
  model VARCHAR(255) NOT NULL,
  color VARCHAR(64),
  storage VARCHAR(64),
  battery_health INTEGER,
  status VARCHAR(32) DEFAULT 'available',
  sold_invoice_no VARCHAR(64),
  warranty_months INTEGER DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4b. Batches & Expiry (Grocery / Pharmacy)
CREATE TABLE IF NOT EXISTS product_batches (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
  batch_number VARCHAR(64) NOT NULL,
  expiry_date DATE NOT NULL,
  quantity NUMERIC(15, 2) DEFAULT 0,
  purchase_rate NUMERIC(15, 2),
  mrp NUMERIC(15, 2),
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4c. Books & Publications (Bookstore / Stationery)
CREATE TABLE IF NOT EXISTS book_items (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  publisher VARCHAR(255),
  edition VARCHAR(64),
  isbn VARCHAR(64),
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  shelf_location VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOMERS & SUPPLIERS
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  membership_card_no VARCHAR(64),
  current_due NUMERIC(15, 2) DEFAULT 0.00,
  credit_limit NUMERIC(15, 2) DEFAULT 10000.00,
  total_spent NUMERIC(15, 2) DEFAULT 0.00,
  loyalty_points INTEGER DEFAULT 0,
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  current_payable NUMERIC(15, 2) DEFAULT 0.00,
  total_purchases NUMERIC(15, 2) DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SALES & POS INVOICES
CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(64) PRIMARY KEY,
  invoice_no VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  business_category_id VARCHAR(64),
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) DEFAULT 'Walk-in Customer',
  customer_phone VARCHAR(64),
  items JSONB NOT NULL,
  subtotal NUMERIC(15, 2) DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) DEFAULT 0.00,
  discount_amount NUMERIC(15, 2) DEFAULT 0.00,
  trade_in_credit NUMERIC(15, 2) DEFAULT 0.00,
  grand_total NUMERIC(15, 2) NOT NULL,
  paid_amount NUMERIC(15, 2) DEFAULT 0.00,
  due_amount NUMERIC(15, 2) DEFAULT 0.00,
  payment_method VARCHAR(32) DEFAULT 'CASH',
  payment_status VARCHAR(32) DEFAULT 'PAID',
  specialized_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DOUBLE-ENTRY ACCOUNTING & GENERAL LEDGER
CREATE TABLE IF NOT EXISTS accounting_entries (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  reference_type VARCHAR(64) NOT NULL,
  reference_id VARCHAR(64),
  title VARCHAR(255) NOT NULL,
  debit_account VARCHAR(128) NOT NULL,
  credit_account VARCHAR(128) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDIT TRAIL
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  user_name VARCHAR(255) DEFAULT 'System User',
  user_role VARCHAR(64) DEFAULT 'ADMIN',
  action VARCHAR(128) NOT NULL,
  module_code VARCHAR(64) NOT NULL,
  details TEXT,
  severity VARCHAR(32) DEFAULT 'info',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_invoice ON sales(tenant_id, invoice_no);
CREATE INDEX IF NOT EXISTS idx_accounting_tenant ON accounting_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_imei ON device_items(imei);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_time ON audit_logs(tenant_id, timestamp DESC);

-- Enable Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
