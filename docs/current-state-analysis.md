# Dokan Manager - Current State Analysis

## 1. Executive Summary
This document analyzes the legacy Dokan Manager codebase (`dokanmanager/`), evaluates its strengths, architectural gaps, and prototype-only patterns, and outlines the transformation strategy for **Dokan Manager V2** (`dokanmanager-v2/`).

---

## 2. Workspace & Codebase Inventory

| Area | Current Status / Implementation in Prototype | Limitations & Architectural Gaps |
|---|---|---|
| **Language & Tooling** | Vanilla JS / TS script compilation, monolithic DOM scripts (`src/app.ts` ~5100 lines, `src/data.ts` ~1500 lines). | Lack of modular controllers, lack of backend API server boundaries, global namespace pollution. |
| **Persistence** | Browser `localStorage` (`dokan_products_v1`, `dokan_sales_v1`, etc.) with rudimentary fallback REST routes. | Not multi-tenant safe, vulnerable to data loss, no transactional integrity, no concurrency locking. |
| **Data Schema** | Single flat SQL tables with JSON columns (`imei_list JSONB`, `items JSONB`, `dues.history JSONB`). | Unnormalized, impossible to index relational device lifecycles, violates double-entry principles. |
| **Business Scope** | Hardcoded primarily for Telecom (Phones, Chargers, Glass, Audio, SIM) with prototype tags for other sectors. | Lacks dynamic configuration engine for generic verticals (Grocery, Stationery, Library, Electronics). |
| **Authentication & RBAC** | Hardcoded PIN / Demo credentials (`owner@dokan.local`, simulated roles `SHOP_OWNER`, `CASHIER`). | No Argon2id hashing, no JWT session rotation, permissions evaluated only on client-side UI. |
| **Inventory & POS** | Basic quantity decrement without row locking or transactional consistency. | Prone to overselling under concurrency; no batch/expiry, no weight scaling, no serial number state machine. |
| **Accounting** | Simple revenue minus expense calculation in frontend logic. | No double-entry ledger, no balance sheet, no immutable daily closing lock. |

---

## 3. Reusable Assets & Preserved Domain Concepts

We will preserve and elevate the following valuable concepts and UX patterns into V2:

1. **Bengali & English Domain Terminology (i18n)**:
   - Preserved terms: *কাস্টমার বাকির খাতা (Customer Due Ledger)*, *ফ্লেক্সিলোড ও MFS রেজিস্টার*, *মোবাইল সার্ভিসিং জবশিট*, *পুরাতন ফোন কেনাবেচা (Trade-in NID)*, *দৈনিক ক্যাশ ক্লোজিং*.
2. **Fast POS Workflow & Keyboard Shortcuts**:
   - `F2` (New Bill), `Enter` (Complete Sale), Barcode scanner auto-focus, dynamic cart calculations.
3. **Bangladeshi Telecom Specifics**:
   - SIM cards, Flexiload commission calculation, bKash / Nagad / Rocket split payments, dual IMEI registration.
4. **Generic Vertical Blueprints**:
   - Telecom, Grocery (Batches, Expiry, Weight), Stationery (Units, Packs), Library (Books, Borrowing, Late Fees), Electronics (Serials, Warranties).
5. **Dynamic Category & Custom Field Models**:
   - Configurable property definitions (Text, Number, Date, Select) attached to entities.

---

## 4. Prototype Limitations to Remove & Replace

1. ❌ **localStorage as Main Storage** $\to$ Replace with **PostgreSQL 16 + Drizzle ORM + Connection Pooling**.
2. ❌ **Frontend-Only RBAC & Validation** $\to$ Replace with **Database-Driven `module.action` RBAC Engine + Zod Request Validation**.
3. ❌ **Monolithic Code in Single Files** $\to$ Replace with **Layered Clean Architecture (Routes $\to$ Middleware $\to$ Controllers $\to$ Services $\to$ Repositories)**.
4. ❌ **Hardcoded Demo Accounts** $\to$ Replace with **Argon2id + Secure JWT Access/Refresh Token Rotation + Session Revocation**.
5. ❌ **Unbalanced Financial Calculations** $\to$ Replace with **Double-Entry General Ledger ($\sum \text{Debit} = \sum \text{Credit}$) + Immutable Daily Closings**.
6. ❌ **Simulated Multi-Tenancy** $\to$ Replace with **Strict Application-Level Tenant & Branch Isolation + Tenant Context Middleware**.
