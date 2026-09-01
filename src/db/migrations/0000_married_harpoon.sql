CREATE TABLE "branches" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(32) DEFAULT '',
	"email" varchar(255) DEFAULT '',
	"address" text DEFAULT '',
	"is_main" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "number_sequences" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"sequence_type" varchar(32) NOT NULL,
	"prefix" varchar(16) NOT NULL,
	"year" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_settings" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"receipt_header" text DEFAULT '',
	"receipt_footer" text DEFAULT 'Thank you for shopping with us!',
	"default_tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"default_warranty_months" integer DEFAULT 12 NOT NULL,
	"allow_negative_inventory" boolean DEFAULT false NOT NULL,
	"auto_focus_scanner" boolean DEFAULT true NOT NULL,
	"theme" varchar(32) DEFAULT 'dark' NOT NULL,
	"language" varchar(8) DEFAULT 'bn' NOT NULL,
	"custom_json" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"currency" varchar(16) DEFAULT 'BDT' NOT NULL,
	"currency_symbol" varchar(8) DEFAULT '৳' NOT NULL,
	"address" text DEFAULT '',
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"plan_type" varchar(32) DEFAULT 'pro' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "business_categories" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"icon" varchar(64) DEFAULT 'Store' NOT NULL,
	"is_system" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "business_category_modules" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"business_category_id" varchar(64) NOT NULL,
	"module_id" varchar(64) NOT NULL,
	"enabled_by_default" boolean DEFAULT true NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "custom_field_definitions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"business_category_id" varchar(64),
	"entity_type" varchar(32) NOT NULL,
	"name" varchar(128) NOT NULL,
	"code" varchar(64) NOT NULL,
	"field_type" varchar(32) NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb,
	"is_required" boolean DEFAULT false NOT NULL,
	"default_value" text,
	"placeholder" varchar(255),
	"help_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_field_values" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"custom_field_id" varchar(64) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"value_text" text,
	"value_number" integer,
	"value_boolean" boolean,
	"value_date" timestamp with time zone,
	"value_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"category_group" varchar(32) DEFAULT 'COMMON' NOT NULL,
	"icon" varchar(64) DEFAULT 'Box' NOT NULL,
	"is_core" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "modules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tenant_business_categories" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"business_category_id" varchar(64) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_modules" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"module_id" varchar(64) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"refresh_token_hash" varchar(255) NOT NULL,
	"ip_address" varchar(64) DEFAULT '',
	"user_agent" text DEFAULT '',
	"expires_at" timestamp with time zone NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_branch_access" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"branch_id" varchar(64) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"password_hash" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"module" varchar(64) NOT NULL,
	"action" varchar(64) NOT NULL,
	"code" varchar(128) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"is_system" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"role_id" varchar(64) NOT NULL,
	"permission_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64),
	"code" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"is_system" boolean DEFAULT false NOT NULL,
	"is_protected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"role_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"business_category_id" varchar(64),
	"parent_id" varchar(64),
	"name" varchar(255) NOT NULL,
	"code" varchar(64) NOT NULL,
	"icon" varchar(64) DEFAULT 'Folder',
	"badge_color" varchar(32) DEFAULT '#3b82f6',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(64) NOT NULL,
	"barcode" varchar(128) NOT NULL,
	"cost_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"selling_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"business_category_id" varchar(64),
	"category_id" varchar(64),
	"brand_id" varchar(64),
	"unit_id" varchar(64),
	"name" varchar(255) NOT NULL,
	"sku" varchar(64) NOT NULL,
	"barcode" varchar(128) NOT NULL,
	"description" text DEFAULT '',
	"tracking_mode" varchar(32) DEFAULT 'TRACKING_QUANTITY' NOT NULL,
	"cost_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"selling_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"min_selling_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"reorder_level" numeric(12, 3) DEFAULT '5.000' NOT NULL,
	"alert_qty" numeric(12, 3) DEFAULT '5.000' NOT NULL,
	"warranty_months" varchar(64) DEFAULT '',
	"is_active" boolean DEFAULT true NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"name" varchar(64) NOT NULL,
	"code" varchar(32) NOT NULL,
	"symbol" varchar(16) NOT NULL,
	"allow_decimal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"product_id" varchar(64) NOT NULL,
	"variant_id" varchar(64),
	"imei1" varchar(64) NOT NULL,
	"imei2" varchar(64),
	"serial_number" varchar(64),
	"model" varchar(255),
	"color" varchar(64),
	"storage" varchar(64),
	"battery_health" integer,
	"cost_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"selling_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"warranty_months" integer DEFAULT 12 NOT NULL,
	"purchase_id" varchar(64),
	"purchase_item_id" varchar(64),
	"sale_id" varchar(64),
	"sale_item_id" varchar(64),
	"sold_invoice_no" varchar(64),
	"status" varchar(32) DEFAULT 'IN_STOCK' NOT NULL,
	"condition" varchar(32) DEFAULT 'NEW' NOT NULL,
	"notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warranties" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"device_id" varchar(64),
	"sale_id" varchar(64),
	"customer_id" varchar(64),
	"invoice_no" varchar(64) NOT NULL,
	"warranty_type" varchar(64) DEFAULT 'OFFICIAL_SERVICE' NOT NULL,
	"duration_months" integer DEFAULT 12 NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"terms" text DEFAULT '',
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_batches" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"product_id" varchar(64) NOT NULL,
	"batch_number" varchar(64) NOT NULL,
	"quantity" numeric(12, 3) DEFAULT '0.000' NOT NULL,
	"mfg_date" timestamp with time zone NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"cost_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"selling_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"supplier_id" varchar(64),
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_copies" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"book_title_id" varchar(64) NOT NULL,
	"barcode" varchar(128) NOT NULL,
	"copy_number" varchar(32) NOT NULL,
	"shelf_location" varchar(64) DEFAULT '',
	"condition" varchar(32) DEFAULT 'GOOD' NOT NULL,
	"cost_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(32) DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_titles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"isbn" varchar(32),
	"title" varchar(255) NOT NULL,
	"author" varchar(255) NOT NULL,
	"publisher" varchar(255) DEFAULT '',
	"edition" varchar(64) DEFAULT '',
	"publication_year" integer,
	"genre" varchar(64) DEFAULT '',
	"language" varchar(32) DEFAULT 'Bengali',
	"page_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "borrow_transactions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"member_id" varchar(64) NOT NULL,
	"book_copy_id" varchar(64) NOT NULL,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"return_date" timestamp with time zone,
	"returned_to_branch_id" varchar(64),
	"status" varchar(32) DEFAULT 'ISSUED' NOT NULL,
	"late_fee_charged" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"late_fee_paid" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_members" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"member_no" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"email" varchar(255),
	"address" text DEFAULT '',
	"member_type" varchar(32) DEFAULT 'GENERAL' NOT NULL,
	"max_allowed_books" integer DEFAULT 3 NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"joined_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_locations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(32) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_stock" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64) NOT NULL,
	"location_id" varchar(64),
	"product_id" varchar(64) NOT NULL,
	"variant_id" varchar(64),
	"quantity" numeric(12, 3) DEFAULT '0.000' NOT NULL,
	"reserved_quantity" numeric(12, 3) DEFAULT '0.000' NOT NULL,
	"avg_cost_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64) NOT NULL,
	"location_id" varchar(64),
	"product_id" varchar(64) NOT NULL,
	"variant_id" varchar(64),
	"transaction_type" varchar(32) NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"unit_cost" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total_cost" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"balance_after" numeric(12, 3) NOT NULL,
	"reference_type" varchar(32),
	"reference_id" varchar(64),
	"notes" text DEFAULT '',
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transfer_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"transfer_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"variant_id" varchar(64),
	"quantity" numeric(12, 3) NOT NULL,
	"received_quantity" numeric(12, 3) DEFAULT '0.000' NOT NULL,
	"cost_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"transfer_no" varchar(64) NOT NULL,
	"from_branch_id" varchar(64) NOT NULL,
	"to_branch_id" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"notes" text DEFAULT '',
	"created_by" varchar(64),
	"received_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_transactions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"customer_id" varchar(64) NOT NULL,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"transaction_type" varchar(32) NOT NULL,
	"debit" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"credit" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"balance" numeric(14, 2) NOT NULL,
	"invoice_no" varchar(64),
	"payment_method" varchar(32),
	"notes" text DEFAULT '',
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"email" varchar(255),
	"address" text DEFAULT '',
	"notes" text DEFAULT '',
	"credit_limit" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"current_due" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total_purchases" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_transactions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"supplier_id" varchar(64) NOT NULL,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"transaction_type" varchar(32) NOT NULL,
	"debit" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"credit" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"balance" numeric(14, 2) NOT NULL,
	"invoice_no" varchar(64),
	"payment_method" varchar(32),
	"notes" text DEFAULT '',
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"company_name" varchar(255) DEFAULT '',
	"contact_person" varchar(255) DEFAULT '',
	"phone" varchar(32) NOT NULL,
	"email" varchar(255),
	"address" text DEFAULT '',
	"current_payable" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total_purchases" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"purchase_id" varchar(64) NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"variant_id" varchar(64),
	"quantity" numeric(12, 3) NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"subtotal" numeric(14, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_payments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"purchase_id" varchar(64),
	"supplier_id" varchar(64) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"payment_method" varchar(32) NOT NULL,
	"payment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"reference_no" varchar(64),
	"account_id" varchar(64),
	"notes" text DEFAULT '',
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_return_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"return_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"variant_id" varchar(64),
	"quantity" numeric(12, 3) NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_returns" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64) NOT NULL,
	"purchase_id" varchar(64),
	"supplier_id" varchar(64) NOT NULL,
	"return_no" varchar(64) NOT NULL,
	"return_date" timestamp with time zone DEFAULT now() NOT NULL,
	"total_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"refund_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"reason" text DEFAULT '',
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64) NOT NULL,
	"supplier_id" varchar(64) NOT NULL,
	"invoice_no" varchar(64) NOT NULL,
	"supplier_invoice_no" varchar(64),
	"purchase_date" timestamp with time zone DEFAULT now() NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"discount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"tax" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"grand_total" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"due_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"payment_status" varchar(32) DEFAULT 'PAID' NOT NULL,
	"status" varchar(32) DEFAULT 'RECEIVED' NOT NULL,
	"notes" text DEFAULT '',
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"reference_type" varchar(32) NOT NULL,
	"reference_id" varchar(64) NOT NULL,
	"customer_id" varchar(64),
	"amount" numeric(14, 2) NOT NULL,
	"payment_method" varchar(32) NOT NULL,
	"transaction_no" varchar(64),
	"account_id" varchar(64),
	"status" varchar(32) DEFAULT 'COMPLETED' NOT NULL,
	"payment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text DEFAULT '',
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"sale_id" varchar(64) NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"variant_id" varchar(64),
	"device_id" varchar(64),
	"batch_id" varchar(64),
	"book_copy_id" varchar(64),
	"product_name" varchar(255) NOT NULL,
	"sku" varchar(64) NOT NULL,
	"barcode" varchar(128) NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"cost_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"discount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"tax" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"imei" varchar(64),
	"warranty_text" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_return_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"return_id" varchar(64) NOT NULL,
	"sale_item_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"variant_id" varchar(64),
	"device_id" varchar(64),
	"batch_id" varchar(64),
	"quantity" numeric(12, 3) NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"refund_total" numeric(14, 2) NOT NULL,
	"restock_item" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_returns" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64) NOT NULL,
	"sale_id" varchar(64) NOT NULL,
	"customer_id" varchar(64),
	"return_no" varchar(64) NOT NULL,
	"return_date" timestamp with time zone DEFAULT now() NOT NULL,
	"return_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"refund_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"reason" text DEFAULT '',
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64) NOT NULL,
	"customer_id" varchar(64),
	"customer_name" varchar(255) DEFAULT 'Cash Customer' NOT NULL,
	"customer_phone" varchar(32) DEFAULT '',
	"invoice_no" varchar(64) NOT NULL,
	"sale_date" timestamp with time zone DEFAULT now() NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"discount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"tax" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"grand_total" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"due_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"change_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(32) DEFAULT 'COMPLETED' NOT NULL,
	"payment_method_summary" varchar(128) DEFAULT 'Cash',
	"cashier_id" varchar(64),
	"cashier_name" varchar(255),
	"notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"repair_job_id" varchar(64) NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"product_id" varchar(64),
	"variant_id" varchar(64),
	"part_name" varchar(255) NOT NULL,
	"quantity" numeric(12, 3) DEFAULT '1.000' NOT NULL,
	"unit_cost" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"unit_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_jobs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64) NOT NULL,
	"token_no" varchar(64) NOT NULL,
	"customer_id" varchar(64),
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(32) NOT NULL,
	"device_model" varchar(255) NOT NULL,
	"imei" varchar(64),
	"passcode" varchar(64) DEFAULT '',
	"problem_description" text NOT NULL,
	"diagnostic_notes" text DEFAULT '',
	"technician_id" varchar(64),
	"estimated_cost" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"final_cost" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"parts_cost" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"labor_cost" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"advance_paid" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"due_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(32) DEFAULT 'RECEIVED' NOT NULL,
	"warranty_months" integer DEFAULT 0 NOT NULL,
	"expected_delivery_date" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"notes" text DEFAULT '',
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_status_history" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"repair_job_id" varchar(64) NOT NULL,
	"status" varchar(32) NOT NULL,
	"notes" text DEFAULT '',
	"changed_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_ins" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64) NOT NULL,
	"trade_in_no" varchar(64) NOT NULL,
	"customer_id" varchar(64),
	"seller_name" varchar(255) NOT NULL,
	"seller_phone" varchar(32) NOT NULL,
	"seller_nid" varchar(64) NOT NULL,
	"device_model" varchar(255) NOT NULL,
	"imei1" varchar(64) NOT NULL,
	"imei2" varchar(64),
	"condition" varchar(32) DEFAULT 'USED' NOT NULL,
	"evaluation_notes" text DEFAULT '',
	"valuation_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"purchase_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"target_selling_price" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"converted_to_device_id" varchar(64),
	"status" varchar(32) DEFAULT 'EVALUATED' NOT NULL,
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recharges" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"operator" varchar(32) NOT NULL,
	"service_type" varchar(32) DEFAULT 'FLEXILOAD' NOT NULL,
	"recipient_phone" varchar(32) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"commission" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(32) DEFAULT 'SUCCESS' NOT NULL,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text DEFAULT '',
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"code" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(32) NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_bank" boolean DEFAULT false NOT NULL,
	"is_mfs" boolean DEFAULT false NOT NULL,
	"current_balance" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(16) DEFAULT 'BDT' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_closings" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64) NOT NULL,
	"business_date" varchar(16) NOT NULL,
	"opening_cash" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"cash_sales" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"cash_received" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"cash_expenses" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"expected_cash" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"actual_cash" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"difference" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(32) DEFAULT 'OPEN' NOT NULL,
	"closed_by" varchar(64),
	"closed_at" timestamp with time zone,
	"reopen_reason" text,
	"reopened_by" varchar(64),
	"reopened_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"expense_category" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"payment_method" varchar(32) DEFAULT 'CASH' NOT NULL,
	"account_id" varchar(64),
	"expense_date" timestamp with time zone DEFAULT now() NOT NULL,
	"invoice_no" varchar(64),
	"notes" text DEFAULT '',
	"recorded_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"entry_no" varchar(64) NOT NULL,
	"entry_date" timestamp with time zone DEFAULT now() NOT NULL,
	"reference_type" varchar(32) NOT NULL,
	"reference_id" varchar(64),
	"total_debit" numeric(14, 2) NOT NULL,
	"total_credit" numeric(14, 2) NOT NULL,
	"is_balanced" boolean DEFAULT true NOT NULL,
	"notes" text DEFAULT '',
	"created_by" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entry_lines" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"journal_entry_id" varchar(64) NOT NULL,
	"account_id" varchar(64) NOT NULL,
	"debit" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"credit" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"description" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"user_id" varchar(64),
	"action" varchar(64) NOT NULL,
	"module" varchar(64) NOT NULL,
	"resource" varchar(64) NOT NULL,
	"resource_id" varchar(64),
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(64) DEFAULT '',
	"user_agent" text DEFAULT '',
	"request_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_policies" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"module" varchar(64) NOT NULL,
	"action" varchar(64) NOT NULL,
	"threshold_amount" numeric(14, 2),
	"threshold_percentage" numeric(5, 2),
	"requires_approval" boolean DEFAULT true NOT NULL,
	"approver_role_id" varchar(64),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(64) NOT NULL,
	"branch_id" varchar(64),
	"policy_id" varchar(64),
	"module" varchar(64) NOT NULL,
	"action" varchar(64) NOT NULL,
	"requested_by" varchar(64) NOT NULL,
	"requested_amount" numeric(14, 2),
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"decided_by" varchar(64),
	"decided_at" timestamp with time zone,
	"decision_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_category_modules" ADD CONSTRAINT "business_category_modules_business_category_id_business_categories_id_fk" FOREIGN KEY ("business_category_id") REFERENCES "public"."business_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_category_modules" ADD CONSTRAINT "business_category_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_business_category_id_business_categories_id_fk" FOREIGN KEY ("business_category_id") REFERENCES "public"."business_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_custom_field_id_custom_field_definitions_id_fk" FOREIGN KEY ("custom_field_id") REFERENCES "public"."custom_field_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_business_categories" ADD CONSTRAINT "tenant_business_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_business_categories" ADD CONSTRAINT "tenant_business_categories_business_category_id_business_categories_id_fk" FOREIGN KEY ("business_category_id") REFERENCES "public"."business_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_branch_access" ADD CONSTRAINT "user_branch_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_branch_access" ADD CONSTRAINT "user_branch_access_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_business_category_id_business_categories_id_fk" FOREIGN KEY ("business_category_id") REFERENCES "public"."business_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_business_category_id_business_categories_id_fk" FOREIGN KEY ("business_category_id") REFERENCES "public"."business_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_book_title_id_book_titles_id_fk" FOREIGN KEY ("book_title_id") REFERENCES "public"."book_titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_titles" ADD CONSTRAINT "book_titles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_titles" ADD CONSTRAINT "book_titles_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrow_transactions" ADD CONSTRAINT "borrow_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrow_transactions" ADD CONSTRAINT "borrow_transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrow_transactions" ADD CONSTRAINT "borrow_transactions_member_id_library_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."library_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrow_transactions" ADD CONSTRAINT "borrow_transactions_book_copy_id_book_copies_id_fk" FOREIGN KEY ("book_copy_id") REFERENCES "public"."book_copies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrow_transactions" ADD CONSTRAINT "borrow_transactions_returned_to_branch_id_branches_id_fk" FOREIGN KEY ("returned_to_branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transfer_id_stock_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."stock_transfers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_from_branch_id_branches_id_fk" FOREIGN KEY ("from_branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_to_branch_id_branches_id_fk" FOREIGN KEY ("to_branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_transactions" ADD CONSTRAINT "supplier_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_transactions" ADD CONSTRAINT "supplier_transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_transactions" ADD CONSTRAINT "supplier_transactions_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_transactions" ADD CONSTRAINT "supplier_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_return_id_purchase_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."purchase_returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_batch_id_product_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."product_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_book_copy_id_book_copies_id_fk" FOREIGN KEY ("book_copy_id") REFERENCES "public"."book_copies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_return_id_sale_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."sale_returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_sale_item_id_sale_items_id_fk" FOREIGN KEY ("sale_item_id") REFERENCES "public"."sale_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_batch_id_product_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."product_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_items" ADD CONSTRAINT "repair_items_repair_job_id_repair_jobs_id_fk" FOREIGN KEY ("repair_job_id") REFERENCES "public"."repair_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_items" ADD CONSTRAINT "repair_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_items" ADD CONSTRAINT "repair_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_items" ADD CONSTRAINT "repair_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_status_history" ADD CONSTRAINT "repair_status_history_repair_job_id_repair_jobs_id_fk" FOREIGN KEY ("repair_job_id") REFERENCES "public"."repair_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_status_history" ADD CONSTRAINT "repair_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_ins" ADD CONSTRAINT "trade_ins_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_ins" ADD CONSTRAINT "trade_ins_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_ins" ADD CONSTRAINT "trade_ins_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_ins" ADD CONSTRAINT "trade_ins_converted_to_device_id_devices_id_fk" FOREIGN KEY ("converted_to_device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_ins" ADD CONSTRAINT "trade_ins_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recharges" ADD CONSTRAINT "recharges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recharges" ADD CONSTRAINT "recharges_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recharges" ADD CONSTRAINT "recharges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_reopened_by_users_id_fk" FOREIGN KEY ("reopened_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_policies" ADD CONSTRAINT "approval_policies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_policies" ADD CONSTRAINT "approval_policies_approver_role_id_roles_id_fk" FOREIGN KEY ("approver_role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_policy_id_approval_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."approval_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "branches_tenant_code_unique" ON "branches" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "branches_tenant_idx" ON "branches" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "number_sequences_tenant_type_year_unique" ON "number_sequences" USING btree ("tenant_id","sequence_type","year");--> statement-breakpoint
CREATE INDEX "number_sequences_tenant_branch_idx" ON "number_sequences" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_settings_tenant_unique" ON "tenant_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenants_code_idx" ON "tenants" USING btree ("code");--> statement-breakpoint
CREATE INDEX "tenants_status_idx" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "business_categories_code_idx" ON "business_categories" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "bcm_category_module_unique" ON "business_category_modules" USING btree ("business_category_id","module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cfd_tenant_entity_code_unique" ON "custom_field_definitions" USING btree ("tenant_id","entity_type","code");--> statement-breakpoint
CREATE INDEX "cfd_tenant_idx" ON "custom_field_definitions" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cfv_entity_field_unique" ON "custom_field_values" USING btree ("entity_id","custom_field_id");--> statement-breakpoint
CREATE INDEX "cfv_tenant_entity_idx" ON "custom_field_values" USING btree ("tenant_id","entity_id");--> statement-breakpoint
CREATE INDEX "modules_code_idx" ON "modules" USING btree ("code");--> statement-breakpoint
CREATE INDEX "modules_group_idx" ON "modules" USING btree ("category_group");--> statement-breakpoint
CREATE UNIQUE INDEX "tbc_tenant_category_unique" ON "tenant_business_categories" USING btree ("tenant_id","business_category_id");--> statement-breakpoint
CREATE INDEX "tbc_tenant_idx" ON "tenant_business_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tm_tenant_module_unique" ON "tenant_modules" USING btree ("tenant_id","module_id");--> statement-breakpoint
CREATE INDEX "tm_tenant_idx" ON "tenant_modules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_tenant_idx" ON "sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sessions_refresh_hash_idx" ON "sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "uba_user_branch_unique" ON "user_branch_access" USING btree ("user_id","branch_id");--> statement-breakpoint
CREATE INDEX "uba_user_idx" ON "user_branch_access" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_tenant_phone_unique" ON "users" USING btree ("tenant_id","phone");--> statement-breakpoint
CREATE INDEX "users_tenant_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "permissions_code_idx" ON "permissions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "permissions_module_idx" ON "permissions" USING btree ("module");--> statement-breakpoint
CREATE UNIQUE INDEX "rp_role_permission_unique" ON "role_permissions" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "rp_role_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_tenant_code_unique" ON "roles" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "roles_tenant_idx" ON "roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ur_user_role_unique" ON "user_roles" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE INDEX "ur_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brands_tenant_code_unique" ON "brands" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "brands_tenant_idx" ON "brands" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_tenant_code_unique" ON "product_categories" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "categories_tenant_idx" ON "product_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pv_tenant_sku_unique" ON "product_variants" USING btree ("tenant_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "pv_tenant_barcode_unique" ON "product_variants" USING btree ("tenant_id","barcode");--> statement-breakpoint
CREATE INDEX "pv_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_sku_unique" ON "products" USING btree ("tenant_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_barcode_unique" ON "products" USING btree ("tenant_id","barcode");--> statement-breakpoint
CREATE INDEX "products_tenant_idx" ON "products" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_tracking_idx" ON "products" USING btree ("tracking_mode");--> statement-breakpoint
CREATE UNIQUE INDEX "units_tenant_code_unique" ON "units" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "units_tenant_idx" ON "units" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "devices_tenant_imei1_unique" ON "devices" USING btree ("tenant_id","imei1");--> statement-breakpoint
CREATE INDEX "devices_tenant_status_idx" ON "devices" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "devices_product_idx" ON "devices" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "devices_serial_idx" ON "devices" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "warranties_tenant_idx" ON "warranties" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "warranties_device_idx" ON "warranties" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "warranties_invoice_idx" ON "warranties" USING btree ("invoice_no");--> statement-breakpoint
CREATE UNIQUE INDEX "pb_tenant_product_batch_unique" ON "product_batches" USING btree ("tenant_id","product_id","batch_number");--> statement-breakpoint
CREATE INDEX "pb_tenant_expiry_idx" ON "product_batches" USING btree ("tenant_id","expiry_date");--> statement-breakpoint
CREATE INDEX "pb_product_idx" ON "product_batches" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "book_copies_tenant_barcode_unique" ON "book_copies" USING btree ("tenant_id","barcode");--> statement-breakpoint
CREATE INDEX "book_copies_tenant_status_idx" ON "book_copies" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "book_copies_title_idx" ON "book_copies" USING btree ("book_title_id");--> statement-breakpoint
CREATE INDEX "book_titles_tenant_isbn_idx" ON "book_titles" USING btree ("tenant_id","isbn");--> statement-breakpoint
CREATE INDEX "book_titles_tenant_author_idx" ON "book_titles" USING btree ("tenant_id","author");--> statement-breakpoint
CREATE INDEX "book_titles_product_idx" ON "book_titles" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "borrow_transactions_tenant_status_idx" ON "borrow_transactions" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "borrow_transactions_member_idx" ON "borrow_transactions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "borrow_transactions_copy_idx" ON "borrow_transactions" USING btree ("book_copy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "library_members_tenant_no_unique" ON "library_members" USING btree ("tenant_id","member_no");--> statement-breakpoint
CREATE INDEX "library_members_tenant_phone_idx" ON "library_members" USING btree ("tenant_id","phone");--> statement-breakpoint
CREATE UNIQUE INDEX "loc_tenant_code_unique" ON "inventory_locations" USING btree ("tenant_id","branch_id","code");--> statement-breakpoint
CREATE INDEX "loc_tenant_branch_idx" ON "inventory_locations" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_tenant_branch_prod_variant_unique" ON "inventory_stock" USING btree ("tenant_id","branch_id","product_id","variant_id");--> statement-breakpoint
CREATE INDEX "stock_tenant_branch_idx" ON "inventory_stock" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE INDEX "stock_product_idx" ON "inventory_stock" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inv_trans_tenant_idx" ON "inventory_transactions" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "inv_trans_product_idx" ON "inventory_transactions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inv_trans_branch_idx" ON "inventory_transactions" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "st_tenant_transfer_no_unique" ON "stock_transfers" USING btree ("tenant_id","transfer_no");--> statement-breakpoint
CREATE INDEX "st_tenant_idx" ON "stock_transfers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "cust_trans_customer_idx" ON "customer_transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "cust_trans_tenant_idx" ON "customer_transactions" USING btree ("tenant_id","transaction_date");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_tenant_phone_unique" ON "customers" USING btree ("tenant_id","phone");--> statement-breakpoint
CREATE INDEX "customers_tenant_idx" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "customers_due_idx" ON "customers" USING btree ("current_due");--> statement-breakpoint
CREATE INDEX "supp_trans_supplier_idx" ON "supplier_transactions" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supp_trans_tenant_idx" ON "supplier_transactions" USING btree ("tenant_id","transaction_date");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_tenant_phone_unique" ON "suppliers" USING btree ("tenant_id","phone");--> statement-breakpoint
CREATE INDEX "suppliers_tenant_idx" ON "suppliers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "suppliers_payable_idx" ON "suppliers" USING btree ("current_payable");--> statement-breakpoint
CREATE INDEX "purchase_items_purchase_idx" ON "purchase_items" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "purchase_items_product_idx" ON "purchase_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "purchase_payments_purchase_idx" ON "purchase_payments" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "purchase_payments_supplier_idx" ON "purchase_payments" USING btree ("supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pr_tenant_return_no_unique" ON "purchase_returns" USING btree ("tenant_id","return_no");--> statement-breakpoint
CREATE INDEX "pr_supplier_idx" ON "purchase_returns" USING btree ("supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_tenant_invoice_unique" ON "purchases" USING btree ("tenant_id","invoice_no");--> statement-breakpoint
CREATE INDEX "purchases_tenant_idx" ON "purchases" USING btree ("tenant_id","purchase_date");--> statement-breakpoint
CREATE INDEX "purchases_supplier_idx" ON "purchases" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "payments_tenant_idx" ON "payments" USING btree ("tenant_id","payment_date");--> statement-breakpoint
CREATE INDEX "payments_reference_idx" ON "payments" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "payments_method_idx" ON "payments" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "sale_items_sale_idx" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_items_product_idx" ON "sale_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sale_items_device_idx" ON "sale_items" USING btree ("device_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sr_tenant_return_no_unique" ON "sale_returns" USING btree ("tenant_id","return_no");--> statement-breakpoint
CREATE INDEX "sr_sale_idx" ON "sale_returns" USING btree ("sale_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_tenant_invoice_unique" ON "sales" USING btree ("tenant_id","invoice_no");--> statement-breakpoint
CREATE INDEX "sales_tenant_date_idx" ON "sales" USING btree ("tenant_id","sale_date");--> statement-breakpoint
CREATE INDEX "sales_customer_idx" ON "sales" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "sales_branch_idx" ON "sales" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "repair_items_job_idx" ON "repair_items" USING btree ("repair_job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repair_tenant_token_unique" ON "repair_jobs" USING btree ("tenant_id","token_no");--> statement-breakpoint
CREATE INDEX "repair_tenant_status_idx" ON "repair_jobs" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "repair_technician_idx" ON "repair_jobs" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "repair_cust_phone_idx" ON "repair_jobs" USING btree ("customer_phone");--> statement-breakpoint
CREATE INDEX "rsh_job_idx" ON "repair_status_history" USING btree ("repair_job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tradein_tenant_no_unique" ON "trade_ins" USING btree ("tenant_id","trade_in_no");--> statement-breakpoint
CREATE INDEX "tradein_tenant_imei_idx" ON "trade_ins" USING btree ("tenant_id","imei1");--> statement-breakpoint
CREATE INDEX "tradein_tenant_nid_idx" ON "trade_ins" USING btree ("tenant_id","seller_nid");--> statement-breakpoint
CREATE INDEX "recharges_tenant_idx" ON "recharges" USING btree ("tenant_id","transaction_date");--> statement-breakpoint
CREATE INDEX "recharges_operator_idx" ON "recharges" USING btree ("operator");--> statement-breakpoint
CREATE INDEX "recharges_phone_idx" ON "recharges" USING btree ("recipient_phone");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_tenant_code_unique" ON "accounts" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "accounts_tenant_idx" ON "accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "accounts_type_idx" ON "accounts" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "dc_tenant_branch_date_unique" ON "daily_closings" USING btree ("tenant_id","branch_id","business_date");--> statement-breakpoint
CREATE INDEX "dc_tenant_date_idx" ON "daily_closings" USING btree ("tenant_id","business_date");--> statement-breakpoint
CREATE INDEX "expenses_tenant_idx" ON "expenses" USING btree ("tenant_id","expense_date");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("expense_category");--> statement-breakpoint
CREATE UNIQUE INDEX "je_tenant_entry_no_unique" ON "journal_entries" USING btree ("tenant_id","entry_no");--> statement-breakpoint
CREATE INDEX "je_tenant_date_idx" ON "journal_entries" USING btree ("tenant_id","entry_date");--> statement-breakpoint
CREATE INDEX "je_reference_idx" ON "journal_entries" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "jel_entry_idx" ON "journal_entry_lines" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "jel_account_idx" ON "journal_entry_lines" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "audit_tenant_idx" ON "audit_logs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_resource_idx" ON "audit_logs" USING btree ("resource","resource_id");--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ap_tenant_idx" ON "approval_policies" USING btree ("tenant_id","module","action");--> statement-breakpoint
CREATE INDEX "ar_tenant_status_idx" ON "approval_requests" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "ar_requester_idx" ON "approval_requests" USING btree ("requested_by");