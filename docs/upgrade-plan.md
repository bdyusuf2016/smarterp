# Dokan Manager V2 - Production Upgrade & Migration Plan

## 1. Architectural Vision: Universal Business Management Platform

Dokan Manager V2 is built as a generic, multi-tenant, branch-aware Business Management & ERP/POS Platform. It decouples the core business engine from industry-specific verticals.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. CORE PLATFORM ENGINES                           │
│  - Multi-Tenancy Engine               - Branch Isolation Engine             │
│  - Argon2id & JWT Session Auth        - Database-Driven RBAC Engine         │
│  - Double-Entry General Ledger        - Audit Logging Engine                │
│  - Custom Field Engine (EAV/JSONB)    - Number Sequence Generator           │
│  - Module Activation Registry         - Dynamic Approval Policy Engine      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         2. COMMON BUSINESS SERVICES                         │
│  - Generic Product Catalog (Tracking: NONE, QTY, SERIAL, IMEI, BATCH, etc.) │
│  - Generic Inventory Ledger (Atomic Trans, Stock Locks, Branch Transfers)   │
│  - Generic POS & Sales (Split Payment: Cash, bKash, Nagad, Card, Due)       │
│  - Generic Purchasing & Supplier Ledger (Payables, Returns, Receipts)       │
│  - Generic Customer Management (Receivables, Due Collections, History)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       3. INDUSTRY SPECIALIZATION PLUGINS                    │
│  ┌────────────────────┐ ┌────────────────────┐ ┌──────────────────────────┐  │
│  │   TELECOM PLUGIN   │ │   GROCERY PLUGIN   │ │      LIBRARY PLUGIN      │  │
│  │ - IMEI Lifecycle   │ │ - Batch Tracking   │ │ - Book Titles & Copies   │  │
│  │ - Mobile Repairs   │ │ - Expiry Alerts    │ │ - Members & Subscriptions│  │
│  │ - Trade-In NID     │ │ - Scale & Weight   │ │ - Borrow / Return / Fees │  │
│  │ - Flexiload/MFS    │ │ - Food Barcodes    │ │                          │  │
│  └────────────────────┘ └────────────────────┘ └──────────────────────────┘  │
│  ┌────────────────────┐ ┌────────────────────┐ ┌──────────────────────────┐  │
│  │ ELECTRONICS PLUGIN │ │ STATIONERY PLUGIN  │ │ FUTURE VERTICALS (SaaS)  │  │
│  │ - Serial Tracking  │ │ - Units & Packs    │ │ - Pharmacy, Restaurant,  │  │
│  │ - Auto Warranty    │ │ - Class Book Guides│ │   Garments, Hardware     │  │
│  └────────────────────┘ └────────────────────┘ └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Design & Normalization Plan

### 2.1 Table Groupings (Drizzle ORM Schemas)

1. **`db/schema/tenants.ts`**:
   - `tenants`: Primary tenant registry, subscription plans, status.
   - `branches`: Multi-branch locations with unique branch codes.
   - `tenant_settings`: Tenant-level configuration overrides.
   - `number_sequences`: Concurrency-safe prefix/sequence generator (`INV-2026-000001`, `PUR-2026-000001`, `REP-2026-000001`).

2. **`db/schema/rbac.ts` & `db/schema/users.ts`**:
   - `users`: User identity, Argon2id password hash, status.
   - `sessions`: Refresh token rotation, client IP, user agent, expiration, revocation.
   - `roles`: Tenant-customizable & system default roles.
   - `permissions`: Database-driven `module.action` catalog.
   - `role_permissions` & `user_roles`: Explicit mapping tables.
   - `user_branch_access`: Branch-level access scoping.

3. **`db/schema/business.ts`**:
   - `business_categories`: Catalog of verticals (`TELECOM`, `GROCERY`, `STATIONERY`, `LIBRARY`, `ELECTRONICS`).
   - `modules`: Catalog of system, common, and industry modules.
   - `business_category_modules`: Default module bindings for each business vertical.
   - `tenant_business_categories`: Tenant assigned categories (primary/secondary).
   - `tenant_modules`: Per-tenant active module activations.
   - `custom_field_definitions` & `custom_field_values`: Universal dynamic attribute engine.

4. **`db/schema/products.ts` & `db/schema/inventory.ts`**:
   - `product_categories`, `brands`, `units`.
   - `products`: Industry-agnostic catalog (`id`, `sku`, `barcode`, `name`, `tracking_mode`, `cost_price`, `selling_price`, `tax`, `min_selling_price`, `reorder_level`).
   - `product_variants`: Optional size/color variations.
   - `inventory_locations`, `inventory_stock` (branch/location level quantities).
   - `inventory_transactions`: Immutable stock movement ledger (`OPENING`, `PURCHASE`, `SALE`, `SALE_RETURN`, `ADJUSTMENT`, `DAMAGE`, `TRANSFER_IN`, `TRANSFER_OUT`, `REPAIR_USAGE`, `TRADE_IN`).
   - `stock_transfers` & `stock_transfer_items`: Inter-branch stock workflow.

5. **`db/schema/devices.ts` (Telecom & Electronics)**:
   - `devices`: Unique IMEI1, IMEI2, Serial Number tracking, condition, cost, and lifecycle status (`IN_STOCK`, `RESERVED`, `SOLD`, `REPAIR`, `RETURNED`, `TRADE_IN`, `DAMAGED`, `LOST`).
   - `warranties`: Product/device warranty policies and expiration tracking.

6. **`db/schema/grocery.ts`**:
   - `product_batches`: Batch numbers, manufacturing dates, expiry dates, batch quantity.

7. **`db/schema/library.ts`**:
   - `book_titles`: ISBN, author, publisher, edition, publication year, genre.
   - `book_copies`: Individual physical book copies with barcode, shelf location, condition, status (`AVAILABLE`, `BORROWED`, `LOST`, `DAMAGED`, `RESERVED`).
   - `library_members`: Card ID, membership type, max allowed books, status.
   - `borrow_transactions`: Issue date, due date, return date, late fees applied.
   - `late_fees`: Assessment and settlement.

8. **`db/schema/customers.ts` & `db/schema/suppliers.ts`**:
   - `customers` & `customer_transactions`: Customer master and immutable ledger (`OPENING`, `SALE`, `PAYMENT`, `RETURN`, `ADJUSTMENT`).
   - `suppliers` & `supplier_transactions`: Supplier master and payable ledger.

9. **`db/schema/purchases.ts` & `db/schema/sales.ts`**:
   - `purchases`, `purchase_items`, `purchase_payments`, `purchase_returns`, `purchase_return_items`.
   - `sales`, `sale_items`, `payments` (MFS, Cash, Card, Bank, Due), `sale_returns`, `sale_return_items`.

10. **`db/schema/repairs.ts`, `db/schema/tradeins.ts`, `db/schema/recharges.ts`**:
    - `repair_jobs`, `repair_items` (inventory parts consumed), `repair_status_history`, `repair_payments`.
    - `trade_ins`: Device valuation, seller information, NID record, conversion to stock.
    - `recharges`: Operator flexiload and MFS cash-in/out records with commission profit.

11. **`db/schema/accounting.ts`**:
    - `accounts`: Chart of accounts (Asset, Liability, Equity, Revenue, Expense) in BDT (৳).
    - `journal_entries` & `journal_entry_lines`: Double-entry balanced journal lines ($\sum \text{Debit} = \sum \text{Credit}$).
    - `daily_closings`: Shift/day reconciliation with discrepancy tracking and immutability locks.

12. **`db/schema/audit.ts` & `db/schema/approval.ts`**:
    - `audit_logs`: Immutable audit records with before/after state diffs, IP, request ID, user ID.
    - `approval_policies`, `approval_requests`, `approval_actions`: Threshold overrides.

---

## 3. RBAC Matrix Plan

All permissions follow strict `module.action` format:

```typescript
export const SystemPermissions = [
  // Authentication & Sessions
  'auth.login', 'auth.logout', 'auth.change_password', 'auth.session_revoke',
  // Administration
  'tenants.view', 'tenants.create', 'tenants.update', 'tenants.manage_billing',
  'branches.view', 'branches.create', 'branches.update', 'branches.delete', 'branches.switch',
  'users.view', 'users.create', 'users.update', 'users.delete', 'users.assign_roles',
  'roles.view', 'roles.create', 'roles.update', 'roles.delete', 'roles.manage_permissions',
  // Products & Inventory
  'products.view', 'products.create', 'products.update', 'products.delete', 'products.view_cost',
  'inventory.view', 'inventory.receive', 'inventory.adjust', 'inventory.transfer', 'inventory.audit',
  'devices.view', 'devices.create', 'devices.update', 'devices.imei_search',
  // Sales & POS
  'sales.view', 'sales.create', 'sales.update', 'sales.void', 'sales.refund', 'sales.discount', 'sales.price_override',
  'payments.view', 'payments.create', 'payments.refund',
  // Purchasing & Partners
  'purchases.view', 'purchases.create', 'purchases.update', 'purchases.receive', 'purchases.cancel',
  'customers.view', 'customers.create', 'customers.update', 'customers.delete', 'customers.view_due', 'customers.collect_due',
  'suppliers.view', 'suppliers.create', 'suppliers.update', 'suppliers.delete', 'suppliers.view_payable', 'suppliers.make_payment',
  // Industry Plugins
  'repairs.view', 'repairs.create', 'repairs.update', 'repairs.assign', 'repairs.approve', 'repairs.deliver', 'repairs.cancel',
  'tradeins.view', 'tradeins.create', 'tradeins.update', 'tradeins.evaluate', 'tradeins.convert_to_inventory',
  'recharges.view', 'recharges.create', 'recharges.report',
  'library.view_books', 'library.manage_books', 'library.manage_members', 'library.borrow', 'library.return', 'library.waive_fees',
  'grocery.manage_batches', 'grocery.view_expiry',
  // Accounting & Reports
  'accounting.view', 'accounting.cash', 'accounting.bank', 'accounting.transfer', 'accounting.adjustment', 'accounting.close_day', 'accounting.reopen_day',
  'reports.sales', 'reports.purchases', 'reports.inventory', 'reports.profit', 'reports.expense', 'reports.customer_due', 'reports.supplier_due', 'reports.financial',
  // System
  'settings.view', 'settings.update', 'audit.view', 'approvals.manage', 'approvals.approve'
] as const;
```

---

## 4. Implementation Phasing Strategy

- **Phase 0: Workspace & Prototype Analysis** *(Completed)*
- **Phase 1: Backend Foundation & Infrastructure** *(Current)*
  - Setup TypeScript configuration, Express server, Pino logging, Helmet, CORS, Rate Limiting, Request ID, Zod validation middleware, Standard Api Responses, Result/Error types, and PostgreSQL pool configuration.
- **Phase 2: Database Schema & Migrations**
  - Implement full Drizzle PostgreSQL schema modules, relational foreign keys, indexes, and comprehensive database seeding script (`seed.ts`).
- **Phase 3: Authentication, Sessions & RBAC Engine**
  - Argon2id password hashing, access/refresh token rotation, session store with revocation, dynamic DB-driven `requirePermission` middleware.
- **Phase 4: Multi-Tenancy, Branch Isolation & Module Engine**
  - Tenant provisioning, branch scoping, business category assignment, module activation endpoints.
- **Phase 5: Generic Product Catalog & Custom Field Engine**
  - Products, categories, brands, units, and schema-driven custom field validation.
- **Phase 6: Generic Inventory & Stock Concurrency**
  - Transaction-safe inventory ledger, `SELECT FOR UPDATE` locking, stock adjustments, branch transfers.
- **Phase 7: Customers, Suppliers & Ledgers**
  - Partner records with transactional balance calculation and due collection workflows.
- **Phase 8: Purchases & Receiving**
  - Purchase invoices, automated stock receiving, supplier ledger entries.
- **Phase 9: POS / Sales Engine & Payments**
  - High-performance POS endpoint, atomic multi-item sales transactions, split payments (Cash, bKash, Nagad, Due), receipt sequence generator.
- **Phase 10: Industry Plugins (Telecom, Grocery, Library, Electronics)**
  - IMEI tracking, repairs, trade-in, flexiload; Grocery batches & expiry; Library catalog & borrowing; Electronics warranty.
- **Phase 11: Double-Entry Accounting & Daily Closing Engine**
  - Journal entry generator, balanced credit/debit invariant checks, automated daily cash closing with discrepancy detection.
- **Phase 12: Reporting Engine & Analytics Dashboard**
  - Dynamic category-specific reports, sales trends, inventory valuation, profit & loss statement.
- **Phase 13: Frontend Client Integration (React + Vite + Tailwind + shadcn/ui)**
  - Dynamic navigation generator based on $\text{Permissions} \cap \text{ActiveCategories} \cap \text{EnabledModules}$, high-speed POS terminal, management dashboards.
- **Phase 14: Verification, Security Hardening & Documentation**
  - Unit tests, integration tests, E2E flows, OpenAPI/Swagger specifications, deployment readiness.
