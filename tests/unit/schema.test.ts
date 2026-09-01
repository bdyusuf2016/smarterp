import { describe, it, expect } from 'vitest';
import * as schema from '../../src/db/schema';
import { getTableColumns } from 'drizzle-orm';

describe('PostgreSQL Drizzle Schema Architecture Test Suite', () => {
  it('should export all essential multi-tenant and branch tables', () => {
    expect(schema.tenants).toBeDefined();
    expect(schema.branches).toBeDefined();
    expect(schema.tenantSettings).toBeDefined();
    expect(schema.numberSequences).toBeDefined();

    const tenantCols = getTableColumns(schema.tenants);
    expect(tenantCols.id).toBeDefined();
    expect(tenantCols.code).toBeDefined();
    expect(tenantCols.currency).toBeDefined();
  });

  it('should export generic business category & custom field system tables', () => {
    expect(schema.businessCategories).toBeDefined();
    expect(schema.modules).toBeDefined();
    expect(schema.businessCategoryModules).toBeDefined();
    expect(schema.tenantBusinessCategories).toBeDefined();
    expect(schema.tenantModules).toBeDefined();
    expect(schema.customFieldDefinitions).toBeDefined();
    expect(schema.customFieldValues).toBeDefined();
  });

  it('should export user authentication, sessions & RBAC engine tables', () => {
    expect(schema.users).toBeDefined();
    expect(schema.sessions).toBeDefined();
    expect(schema.roles).toBeDefined();
    expect(schema.permissions).toBeDefined();
    expect(schema.rolePermissions).toBeDefined();
    expect(schema.userRoles).toBeDefined();
    expect(schema.userBranchAccess).toBeDefined();
  });

  it('should export generic product catalog and inventory ledger tables', () => {
    expect(schema.productCategories).toBeDefined();
    expect(schema.brands).toBeDefined();
    expect(schema.units).toBeDefined();
    expect(schema.products).toBeDefined();
    expect(schema.productVariants).toBeDefined();
    expect(schema.inventoryLocations).toBeDefined();
    expect(schema.inventoryStock).toBeDefined();
    expect(schema.inventoryTransactions).toBeDefined();
    expect(schema.stockTransfers).toBeDefined();
    expect(schema.stockTransferItems).toBeDefined();
  });

  it('should export industry specialization tables (Telecom, Grocery, Library, Electronics)', () => {
    expect(schema.devices).toBeDefined();
    expect(schema.warranties).toBeDefined();
    expect(schema.productBatches).toBeDefined();
    expect(schema.bookTitles).toBeDefined();
    expect(schema.bookCopies).toBeDefined();
    expect(schema.libraryMembers).toBeDefined();
    expect(schema.borrowTransactions).toBeDefined();
    expect(schema.repairJobs).toBeDefined();
    expect(schema.repairItems).toBeDefined();
    expect(schema.tradeIns).toBeDefined();
    expect(schema.recharges).toBeDefined();
  });

  it('should export transactional sales, POS, purchases, customers, and suppliers tables', () => {
    expect(schema.sales).toBeDefined();
    expect(schema.saleItems).toBeDefined();
    expect(schema.payments).toBeDefined();
    expect(schema.saleReturns).toBeDefined();
    expect(schema.saleReturnItems).toBeDefined();
    expect(schema.purchases).toBeDefined();
    expect(schema.purchaseItems).toBeDefined();
    expect(schema.purchasePayments).toBeDefined();
    expect(schema.purchases).toBeDefined();
    expect(schema.customers).toBeDefined();
    expect(schema.customerTransactions).toBeDefined();
    expect(schema.suppliers).toBeDefined();
    expect(schema.supplierTransactions).toBeDefined();
  });

  it('should export double-entry accounting, audit trail, and approval policies tables', () => {
    expect(schema.accounts).toBeDefined();
    expect(schema.journalEntries).toBeDefined();
    expect(schema.journalEntryLines).toBeDefined();
    expect(schema.expenses).toBeDefined();
    expect(schema.dailyClosings).toBeDefined();
    expect(schema.auditLogs).toBeDefined();
    expect(schema.approvalPolicies).toBeDefined();
    expect(schema.approvalRequests).toBeDefined();
  });
});
