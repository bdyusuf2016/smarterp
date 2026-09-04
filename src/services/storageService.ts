import {
  BusinessCategory,
  Module,
  BusinessCategoryModule,
  Tenant,
  GenericProduct,
  DeviceItem,
  ProductBatch,
  BookItem,
  RepairTicket,
  TradeInRecord,
  RechargeRecord,
  BorrowRecord,
  CustomerMember,
  Supplier,
  CustomFieldDefinition,
  SaleTransaction,
  AccountingEntry,
  AuditLog,
  UserRole
} from '../types';

import {
  INITIAL_BUSINESS_CATEGORIES,
  INITIAL_MODULES,
  INITIAL_CATEGORY_MODULES,
  INITIAL_TENANTS,
  INITIAL_PRODUCTS,
  INITIAL_DEVICES,
  INITIAL_BATCHES,
  INITIAL_BOOKS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_REPAIRS,
  INITIAL_TRADE_INS,
  INITIAL_RECHARGES,
  INITIAL_BORROW_RECORDS,
  INITIAL_SALES,
  INITIAL_ACCOUNTING,
  INITIAL_AUDIT_LOGS,
  INITIAL_CUSTOM_FIELDS
} from '../data/seedData';

const STORAGE_KEYS = {
  CATEGORIES: 'dokan_v2_business_categories',
  MODULES: 'dokan_v2_modules',
  CATEGORY_MODULES: 'dokan_v2_category_modules',
  TENANTS: 'dokan_v2_tenants',
  ACTIVE_TENANT_ID: 'dokan_v2_active_tenant_id',
  ACTIVE_ROLE: 'dokan_v2_active_role',
  PRODUCTS: 'dokan_v2_products',
  DEVICES: 'dokan_v2_devices',
  BATCHES: 'dokan_v2_batches',
  BOOKS: 'dokan_v2_books',
  CUSTOMERS: 'dokan_v2_customers',
  SUPPLIERS: 'dokan_v2_suppliers',
  REPAIRS: 'dokan_v2_repairs',
  TRADE_INS: 'dokan_v2_trade_ins',
  RECHARGES: 'dokan_v2_recharges',
  BORROW_RECORDS: 'dokan_v2_borrow_records',
  SALES: 'dokan_v2_sales',
  ACCOUNTING: 'dokan_v2_accounting',
  AUDIT_LOGS: 'dokan_v2_audit_logs',
  CUSTOM_FIELDS: 'dokan_v2_custom_fields'
};

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      return JSON.parse(stored) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('dokan_storage_updated', { detail: { key } }));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  private dispatchInstantSync(table: string, record: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dokan_entity_saved', { detail: { table, record } }));
    }
  }

  // Categories
  getCategories(): BusinessCategory[] {
    return this.get<BusinessCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_BUSINESS_CATEGORIES);
  }

  saveCategory(category: BusinessCategory): void {
    const list = this.getCategories();
    const idx = list.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      list[idx] = { ...category, updated_at: new Date().toISOString() };
    } else {
      list.push(category);
    }
    this.set(STORAGE_KEYS.CATEGORIES, list);
    this.dispatchInstantSync('business_categories', category);
    this.addAuditLog('CATEGORY_UPDATED', 'SETTINGS', `Business category ${category.name} (${category.code}) created or updated.`);
  }

  // Modules
  getModules(): Module[] {
    return this.get<Module[]>(STORAGE_KEYS.MODULES, INITIAL_MODULES);
  }

  saveModule(module: Module): void {
    const list = this.getModules();
    const idx = list.findIndex(m => m.id === module.id);
    if (idx >= 0) {
      list[idx] = module;
    } else {
      list.push(module);
    }
    this.set(STORAGE_KEYS.MODULES, list);
  }

  // Category-Module Mappings
  getCategoryModules(): BusinessCategoryModule[] {
    return this.get<BusinessCategoryModule[]>(STORAGE_KEYS.CATEGORY_MODULES, INITIAL_CATEGORY_MODULES);
  }

  setCategoryModuleMapping(businessCategoryId: string, moduleId: string, enabled: boolean): void {
    let list = this.getCategoryModules();
    const existingIdx = list.findIndex(m => m.business_category_id === businessCategoryId && m.module_id === moduleId);
    if (existingIdx >= 0) {
      list[existingIdx].enabled_by_default = enabled;
    } else {
      list.push({
        business_category_id: businessCategoryId,
        module_id: moduleId,
        enabled_by_default: enabled
      });
    }
    this.set(STORAGE_KEYS.CATEGORY_MODULES, list);
  }

  // Tenants
  getTenants(): Tenant[] {
    return this.get<Tenant[]>(STORAGE_KEYS.TENANTS, INITIAL_TENANTS);
  }

  getActiveTenant(): Tenant {
    const tenants = this.getTenants();
    const activeId = this.get<string>(STORAGE_KEYS.ACTIVE_TENANT_ID, tenants[0]?.id || 'tenant_nexus');
    return tenants.find(t => t.id === activeId) || tenants[0] || INITIAL_TENANTS[0];
  }

  setActiveTenantId(tenantId: string): void {
    this.set(STORAGE_KEYS.ACTIVE_TENANT_ID, tenantId);
  }

  saveTenant(tenant: Tenant): void {
    const list = this.getTenants();
    const idx = list.findIndex(t => t.id === tenant.id);
    if (idx >= 0) {
      list[idx] = tenant;
    } else {
      list.push(tenant);
    }
    this.set(STORAGE_KEYS.TENANTS, list);
    this.dispatchInstantSync('tenants', tenant);
    this.addAuditLog('TENANT_SAVED', 'TENANTS', `Tenant ${tenant.name} profile updated.`);
  }

  deleteTenant(tenantId: string): void {
    const list = this.getTenants().filter(t => t.id !== tenantId);
    this.set(STORAGE_KEYS.TENANTS, list);
    this.addAuditLog('TENANT_DELETED', 'TENANTS', `Tenant ${tenantId} was deleted.`);
  }

  // Active Role
  getActiveRole(): UserRole {
    return this.get<UserRole>(STORAGE_KEYS.ACTIVE_ROLE, 'ADMIN');
  }

  setActiveRole(role: UserRole): void {
    this.set(STORAGE_KEYS.ACTIVE_ROLE, role);
  }

  // Generic Products
  getProducts(tenantId?: string): GenericProduct[] {
    const all = this.get<GenericProduct[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    if (!tenantId) return all;
    return all.filter(p => p.tenant_id === tenantId);
  }

  saveProduct(product: GenericProduct): void {
    const list = this.get<GenericProduct[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const idx = list.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      list[idx] = product;
    } else {
      list.unshift(product);
    }
    this.set(STORAGE_KEYS.PRODUCTS, list);
    this.dispatchInstantSync('products', product);
    this.addAuditLog('PRODUCT_SAVED', 'PRODUCTS', `Product ${product.name} (${product.code}) saved.`);
  }

  // Specialized: Devices (IMEIs)
  getDevices(): DeviceItem[] {
    return this.get<DeviceItem[]>(STORAGE_KEYS.DEVICES, INITIAL_DEVICES);
  }

  saveDevice(device: DeviceItem): void {
    const list = this.getDevices();
    const idx = list.findIndex(d => d.id === device.id || d.imei === device.imei);
    if (idx >= 0) {
      list[idx] = device;
    } else {
      list.unshift(device);
    }
    this.set(STORAGE_KEYS.DEVICES, list);
  }

  // Specialized: Batches
  getBatches(): ProductBatch[] {
    return this.get<ProductBatch[]>(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
  }

  saveBatch(batch: ProductBatch): void {
    const list = this.getBatches();
    const idx = list.findIndex(b => b.id === batch.id);
    if (idx >= 0) {
      list[idx] = batch;
    } else {
      list.unshift(batch);
    }
    this.set(STORAGE_KEYS.BATCHES, list);
  }

  // Specialized: Books
  getBooks(): BookItem[] {
    return this.get<BookItem[]>(STORAGE_KEYS.BOOKS, INITIAL_BOOKS);
  }

  saveBook(book: BookItem): void {
    const list = this.getBooks();
    const idx = list.findIndex(b => b.id === book.id);
    if (idx >= 0) {
      list[idx] = book;
    } else {
      list.unshift(book);
    }
    this.set(STORAGE_KEYS.BOOKS, list);
  }

  // Specialized: Repairs
  getRepairs(tenantId?: string): RepairTicket[] {
    const all = this.get<RepairTicket[]>(STORAGE_KEYS.REPAIRS, INITIAL_REPAIRS);
    if (!tenantId) return all;
    return all.filter(r => r.tenant_id === tenantId);
  }

  saveRepair(ticket: RepairTicket): void {
    const list = this.get<RepairTicket[]>(STORAGE_KEYS.REPAIRS, INITIAL_REPAIRS);
    const idx = list.findIndex(r => r.id === ticket.id);
    if (idx >= 0) {
      list[idx] = ticket;
    } else {
      list.unshift(ticket);
    }
    this.set(STORAGE_KEYS.REPAIRS, list);
    this.addAuditLog('REPAIR_SAVED', 'REPAIRS', `Repair Ticket ${ticket.ticket_number} (${ticket.status}) saved.`);
  }

  deleteRepair(ticketId: string): void {
    const list = this.get<RepairTicket[]>(STORAGE_KEYS.REPAIRS, INITIAL_REPAIRS);
    const filtered = list.filter(r => r.id !== ticketId);
    this.set(STORAGE_KEYS.REPAIRS, filtered);
  }

  // Specialized: Trade-Ins
  getTradeIns(tenantId?: string): TradeInRecord[] {
    const all = this.get<TradeInRecord[]>(STORAGE_KEYS.TRADE_INS, INITIAL_TRADE_INS);
    if (!tenantId) return all;
    return all.filter(t => t.tenant_id === tenantId);
  }

  saveTradeIn(tradeIn: TradeInRecord): void {
    const list = this.get<TradeInRecord[]>(STORAGE_KEYS.TRADE_INS, INITIAL_TRADE_INS);
    const idx = list.findIndex(t => t.id === tradeIn.id);
    if (idx >= 0) {
      list[idx] = tradeIn;
    } else {
      list.unshift(tradeIn);
    }
    this.set(STORAGE_KEYS.TRADE_INS, list);
    this.addAuditLog('TRADE_IN_SAVED', 'TRADE_IN', `Trade-In record for ${tradeIn.device_model} ($${tradeIn.offered_credit}) recorded.`);
  }

  // Specialized: Recharges
  getRecharges(tenantId?: string): RechargeRecord[] {
    const all = this.get<RechargeRecord[]>(STORAGE_KEYS.RECHARGES, INITIAL_RECHARGES);
    if (!tenantId) return all;
    return all.filter(r => r.tenant_id === tenantId);
  }

  saveRecharge(recharge: RechargeRecord): void {
    const list = this.get<RechargeRecord[]>(STORAGE_KEYS.RECHARGES, INITIAL_RECHARGES);
    list.unshift(recharge);
    this.set(STORAGE_KEYS.RECHARGES, list);
  }

  deleteRecharge(rechargeId: string): void {
    const list = this.get<RechargeRecord[]>(STORAGE_KEYS.RECHARGES, INITIAL_RECHARGES);
    const filtered = list.filter(r => r.id !== rechargeId);
    this.set(STORAGE_KEYS.RECHARGES, filtered);
  }

  // Specialized: Library Borrow Records
  getBorrowRecords(tenantId?: string): BorrowRecord[] {
    const all = this.get<BorrowRecord[]>(STORAGE_KEYS.BORROW_RECORDS, INITIAL_BORROW_RECORDS);
    if (!tenantId) return all;
    return all.filter(b => b.tenant_id === tenantId);
  }

  saveBorrowRecord(record: BorrowRecord): void {
    const list = this.get<BorrowRecord[]>(STORAGE_KEYS.BORROW_RECORDS, INITIAL_BORROW_RECORDS);
    const idx = list.findIndex(b => b.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    this.set(STORAGE_KEYS.BORROW_RECORDS, list);
    this.addAuditLog('BORROW_SAVED', 'BORROWING', `Circulation record for "${record.book_title}" (${record.status}) updated.`);
  }

  // Customers & Members
  getCustomers(tenantId?: string): CustomerMember[] {
    const all = this.get<CustomerMember[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    if (!tenantId) return all;
    return all.filter(c => c.tenant_id === tenantId);
  }

  saveCustomer(customer: CustomerMember): void {
    const list = this.get<CustomerMember[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const idx = list.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      list[idx] = customer;
    } else {
      list.unshift(customer);
    }
    this.set(STORAGE_KEYS.CUSTOMERS, list);
    this.dispatchInstantSync('customers', customer);
    this.addAuditLog('CUSTOMER_SAVED', 'CUSTOMERS', `Customer ${customer.name} saved.`);
  }

  deleteCustomer(customerId: string): void {
    const list = this.get<CustomerMember[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS).filter(c => c.id !== customerId);
    this.set(STORAGE_KEYS.CUSTOMERS, list);
    this.addAuditLog('CUSTOMER_DELETED', 'CUSTOMERS', `Customer ${customerId} deleted.`);
  }

  clearCustomers(tenantId?: string): void {
    if (tenantId) {
      const list = this.get<CustomerMember[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS).filter(c => c.tenant_id !== tenantId);
      this.set(STORAGE_KEYS.CUSTOMERS, list);
    } else {
      this.set(STORAGE_KEYS.CUSTOMERS, []);
    }
    this.addAuditLog('CUSTOMERS_CLEARED', 'CUSTOMERS', `Customer ledger wiped for tenant ${tenantId || 'all'}.`);
  }

  // Suppliers
  getSuppliers(tenantId?: string): Supplier[] {
    const all = this.get<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    if (!tenantId) return all;
    return all.filter(s => s.tenant_id === tenantId);
  }

  saveSupplier(supplier: Supplier): void {
    const list = this.get<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    const idx = list.findIndex(s => s.id === supplier.id);
    if (idx >= 0) {
      list[idx] = supplier;
    } else {
      list.unshift(supplier);
    }
    this.set(STORAGE_KEYS.SUPPLIERS, list);
    this.dispatchInstantSync('suppliers', supplier);
    this.addAuditLog('SUPPLIER_SAVED', 'SUPPLIERS', `Supplier ${supplier.name} saved.`);
  }

  deleteSupplier(supplierId: string): void {
    const list = this.get<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    const filtered = list.filter(s => s.id !== supplierId);
    this.set(STORAGE_KEYS.SUPPLIERS, filtered);
    this.addAuditLog('SUPPLIER_DELETED', 'SUPPLIERS', `Supplier ${supplierId} deleted.`);
  }

  recordSupplierPayment(tenantId: string, supplierId: string, amount: number, paymentMethod: string, referenceNo?: string, notes?: string): void {
    const suppliers = this.getSuppliers(tenantId);
    const sup = suppliers.find(s => s.id === supplierId);
    if (!sup) return;

    sup.balance_payable = Math.max(0, (sup.balance_payable || 0) - amount);
    this.saveSupplier(sup);

    // Save Accounting Record
    const entry: AccountingEntry = {
      id: `acc_sp_${Date.now()}`,
      tenant_id: tenantId,
      reference_type: 'PURCHASE',
      reference_id: referenceNo || `PAY-SUP-${Date.now().toString().slice(-4)}`,
      title: `সাপ্লায়ার বিল পরিশোধ: ${sup.name} ${notes ? `(${notes})` : ''}`.trim(),
      debit_account: 'সাপ্লায়ার দেনা হিসাব (Accounts Payable)',
      credit_account: paymentMethod,
      amount: amount,
      created_at: new Date().toISOString()
    };
    this.saveAccountingEntry(entry);
  }

  recordSupplierPurchase(tenantId: string, supplierId: string, invoiceNo: string, grandTotal: number, paidAmount: number, notes?: string): void {
    const suppliers = this.getSuppliers(tenantId);
    const sup = suppliers.find(s => s.id === supplierId);
    if (!sup) return;

    const dueAdded = Math.max(0, grandTotal - paidAmount);
    sup.balance_payable = (sup.balance_payable || 0) + dueAdded;
    this.saveSupplier(sup);

    // Save Accounting Record for purchase
    const entry: AccountingEntry = {
      id: `acc_pr_${Date.now()}`,
      tenant_id: tenantId,
      reference_type: 'PURCHASE',
      reference_id: invoiceNo || `INV-PUR-${Date.now().toString().slice(-4)}`,
      title: `পণ্য ক্রয় চালান: ${sup.name} (মোট: ৳${grandTotal}, পরিশোধ: ৳${paidAmount}) ${notes ? `(${notes})` : ''}`.trim(),
      debit_account: 'পণ্য ক্রয় হিসাব (Purchase Expense)',
      credit_account: paidAmount >= grandTotal ? 'ক্যাশ / ব্যাংক' : 'সাপ্লায়ার বকেয়া পাওনা',
      amount: grandTotal,
      created_at: new Date().toISOString()
    };
    this.saveAccountingEntry(entry);
  }

  // Custom Fields
  getCustomFields(categoryId?: string, entityType?: string, subcategoryName?: string): CustomFieldDefinition[] {
    const stored = this.get<CustomFieldDefinition[]>(STORAGE_KEYS.CUSTOM_FIELDS, []);
    
    // Merge stored with INITIAL_CUSTOM_FIELDS to ensure standard category/subcategory fields are always available
    const combinedMap = new Map<string, CustomFieldDefinition>();
    INITIAL_CUSTOM_FIELDS.forEach(f => combinedMap.set(f.id, f));
    stored.forEach(f => combinedMap.set(f.id, f));
    const all = Array.from(combinedMap.values());

    return all.filter(f => {
      if (entityType && f.entity_type && f.entity_type.toLowerCase() !== entityType.toLowerCase()) return false;
      if (categoryId && categoryId !== 'ALL') {
        if (f.business_category_id && f.business_category_id !== 'ALL' && f.business_category_id !== categoryId) {
          return false;
        }
      }
      if (subcategoryName) {
        if (f.target_subcategories && f.target_subcategories.length > 0) {
          const matches = f.target_subcategories.some(sub => 
            sub.trim().toLowerCase() === subcategoryName.trim().toLowerCase() ||
            subcategoryName.toLowerCase().includes(sub.toLowerCase()) ||
            sub.toLowerCase().includes(subcategoryName.toLowerCase())
          );
          if (!matches) return false;
        } else if (f.subcategory) {
          if (f.subcategory.trim().toLowerCase() !== subcategoryName.trim().toLowerCase()) return false;
        }
      }
      return true;
    });
  }

  saveCustomField(field: CustomFieldDefinition): void {
    const list = this.get<CustomFieldDefinition[]>(STORAGE_KEYS.CUSTOM_FIELDS, INITIAL_CUSTOM_FIELDS);
    const idx = list.findIndex(f => f.id === field.id);
    if (idx >= 0) {
      list[idx] = field;
    } else {
      list.push(field);
    }
    this.set(STORAGE_KEYS.CUSTOM_FIELDS, list);
    this.addAuditLog('CUSTOM_FIELD_SAVED', 'SETTINGS', `Custom field "${field.name}" (${field.code}) configured for ${field.entity_type}.`);
  }

  deleteCustomField(fieldId: string): void {
    const list = this.get<CustomFieldDefinition[]>(STORAGE_KEYS.CUSTOM_FIELDS, INITIAL_CUSTOM_FIELDS);
    const updated = list.filter(f => f.id !== fieldId);
    this.set(STORAGE_KEYS.CUSTOM_FIELDS, updated);
    this.addAuditLog('CUSTOM_FIELD_DELETED', 'SETTINGS', `Custom field ${fieldId} removed.`);
  }

  // Sales
  getSales(tenantId?: string): SaleTransaction[] {
    const all = this.get<SaleTransaction[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
    const seen = new Set<string>();
    const uniqueSales: SaleTransaction[] = [];
    let hadDuplicates = false;

    for (const s of all) {
      const key = s.id || s.invoice_no;
      if (key && seen.has(key)) {
        hadDuplicates = true;
        continue;
      }
      if (key) seen.add(key);
      uniqueSales.push(s);
    }

    if (hadDuplicates) {
      this.set(STORAGE_KEYS.SALES, uniqueSales);
    }

    if (!tenantId) return uniqueSales;
    return uniqueSales.filter(s => s.tenant_id === tenantId);
  }

  saveSale(sale: SaleTransaction): void {
    const list = this.getSales();
    const idx = list.findIndex(s => s.id === sale.id || (sale.invoice_no && s.invoice_no === sale.invoice_no));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...sale };
    } else {
      list.unshift(sale);
    }
    this.set(STORAGE_KEYS.SALES, list);
    this.dispatchInstantSync('sales', sale);
  }

  // Accounting
  getAccounting(tenantId?: string): AccountingEntry[] {
    const all = this.get<AccountingEntry[]>(STORAGE_KEYS.ACCOUNTING, INITIAL_ACCOUNTING);
    const seen = new Set<string>();
    const uniqueEntries: AccountingEntry[] = [];
    let hadDuplicates = false;

    for (const a of all) {
      const key = a.id;
      if (key && seen.has(key)) {
        hadDuplicates = true;
        continue;
      }
      if (key) seen.add(key);
      uniqueEntries.push(a);
    }

    if (hadDuplicates) {
      this.set(STORAGE_KEYS.ACCOUNTING, uniqueEntries);
    }

    if (!tenantId) return uniqueEntries;
    return uniqueEntries.filter(a => a.tenant_id === tenantId);
  }

  saveAccountingEntry(entry: AccountingEntry): void {
    const list = this.getAccounting();
    const idx = list.findIndex(a => a.id === entry.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...entry };
    } else {
      list.unshift(entry);
    }
    this.set(STORAGE_KEYS.ACCOUNTING, list);
    this.dispatchInstantSync('accounting_entries', entry);
  }

  deleteAccountingEntry(id: string): void {
    const list = this.getAccounting();
    const filtered = list.filter(a => a.id !== id);
    this.set(STORAGE_KEYS.ACCOUNTING, filtered);
  }

  // Audit Logs
  getAuditLogs(tenantId?: string): AuditLog[] {
    const all = this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const seen = new Set<string>();
    const uniqueLogs: AuditLog[] = [];
    let hadDuplicates = false;

    for (const l of all) {
      if (l.id && seen.has(l.id)) {
        hadDuplicates = true;
        continue;
      }
      if (l.id) seen.add(l.id);
      uniqueLogs.push(l);
    }

    if (hadDuplicates) {
      this.set(STORAGE_KEYS.AUDIT_LOGS, uniqueLogs);
    }

    if (!tenantId) return uniqueLogs;
    return uniqueLogs.filter(a => !a.tenant_id || a.tenant_id === tenantId);
  }

  addAuditLog(action: string, moduleCode: string, details: string, severity: 'info' | 'warning' | 'critical' = 'info'): void {
    const activeTenant = this.getActiveTenant();
    const activeRole = this.getActiveRole() || 'ADMIN';
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      tenant_id: activeTenant?.id || 'system_tenant',
      user_name: activeTenant?.owner_name || 'System User',
      user_role: activeRole,
      action,
      module_code: moduleCode,
      details,
      timestamp: new Date().toISOString(),
      severity
    };
    const list = this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    list.unshift(log);
    // Keep max 100 entries
    if (list.length > 100) list.length = 100;
    this.set(STORAGE_KEYS.AUDIT_LOGS, list);
  }

  // Reset to seed data
  resetAll(): void {
    localStorage.clear();
    window.location.reload();
  }
}

export const storageService = new StorageService();
