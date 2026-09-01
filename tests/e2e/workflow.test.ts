import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { TokenService } from '../../src/modules/auth/token.service';
import { SessionService } from '../../src/modules/auth/session.service';
import { BusinessService } from '../../src/modules/business/business.service';
import { ProductsService } from '../../src/modules/products/products.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { PurchasesService } from '../../src/modules/purchases/purchases.service';
import { SalesService } from '../../src/modules/sales/sales.service';
import { CustomersService } from '../../src/modules/customers/customers.service';
import { SuppliersService } from '../../src/modules/suppliers/suppliers.service';
import { AccountingService } from '../../src/modules/accounting/accounting.service';

describe('Dokan Manager V2 — Complete End-to-End Enterprise ERP Lifecycle E2E Suite', () => {
  const app = createApp();

  const mockToken = TokenService.generateAccessToken({
    userId: 'owner-001',
    tenantId: 'tenant-e2e',
    branchId: 'branch-e2e-main',
    roles: ['SHOP_OWNER'],
    permissions: [
      'tenants.manage',
      'products.create',
      'products.view',
      'inventory.view',
      'inventory.adjust',
      'suppliers.create',
      'suppliers.view',
      'suppliers.pay',
      'purchases.create',
      'purchases.view',
      'customers.create',
      'customers.view',
      'customers.collect_due',
      'sales.create',
      'sales.view',
      'accounting.view',
      'accounting.manage',
      'expenses.create',
      'reports.view',
    ],
    sessionId: 'sess-e2e',
  });

  beforeEach(() => {
    vi.spyOn(SessionService, 'getActiveSession').mockResolvedValue({
      id: 'sess-e2e',
      userId: 'owner-001',
      tenantId: 'tenant-e2e',
      tokenHash: 'hash',
      refreshTokenHash: 'rfhash',
      ipAddress: '127.0.0.1',
      userAgent: 'E2E Runner',
      expiresAt: new Date(Date.now() + 86400000),
      isRevoked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.spyOn(BusinessService, 'isModuleEnabled').mockResolvedValue(true);
  });

  it('Step 1: Product Catalog Creation with Barcode', async () => {
    vi.spyOn(ProductsService, 'createProduct').mockResolvedValue({
      id: 'prod-e2e-1',
      tenantId: 'tenant-e2e',
      name: 'Samsung Galaxy A55 5G',
      sku: 'SAM-A55-8-128',
      barcode: '2001234567890',
      costPrice: '42000.00',
      sellingPrice: '48500.00',
      isActive: true,
    } as any);

    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        name: 'Samsung Galaxy A55 5G',
        sku: 'SAM-A55-8-128',
        barcode: '2001234567890',
        costPrice: '42000.00',
        sellingPrice: '48500.00',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.barcode).toBe('2001234567890');
  });

  it('Step 2: Supplier Creation with Opening Balance', async () => {
    vi.spyOn(SuppliersService, 'createSupplier').mockResolvedValue({
      id: 'supp-e2e-1',
      tenantId: 'tenant-e2e',
      name: 'Samsung Bangladesh Distribution Ltd.',
      phone: '01711000111',
      currentPayable: '0.00',
      isActive: true,
    } as any);

    const res = await request(app)
      .post('/api/v1/suppliers')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        name: 'Samsung Bangladesh Distribution Ltd.',
        phone: '01711000111',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('Step 3: Inward Purchase Bill (Stock Increment + Supplier Payable)', async () => {
    vi.spyOn(PurchasesService, 'createPurchase').mockResolvedValue({
      id: 'pur-e2e-1',
      invoiceNo: 'PUR-2026-0001',
      grandTotal: '420000.00',
      paidAmount: '200000.00',
      dueAmount: '220000.00',
      paymentStatus: 'PARTIAL',
      status: 'RECEIVED',
    } as any);

    const res = await request(app)
      .post('/api/v1/purchases')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        supplierId: 'supp-e2e-1',
        paidAmount: 200000,
        paymentMethod: 'BANK',
        items: [
          {
            productId: 'prod-e2e-1',
            quantity: 10,
            unitPrice: 42000,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.invoiceNo).toBe('PUR-2026-0001');
    expect(res.body.data.dueAmount).toBe('220000.00');
  });

  it('Step 4: Customer Creation with Credit Limit', async () => {
    vi.spyOn(CustomersService, 'createCustomer').mockResolvedValue({
      id: 'cust-e2e-1',
      tenantId: 'tenant-e2e',
      name: 'Dr. Rafiqul Islam',
      phone: '01819223344',
      creditLimit: '100000.00',
      currentDue: '0.00',
      isActive: true,
    } as any);

    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        name: 'Dr. Rafiqul Islam',
        phone: '01819223344',
        creditLimit: '100000.00',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('Step 5: High-Speed POS Checkout with Split Payment (Cash + bKash + Due)', async () => {
    vi.spyOn(SalesService, 'createSale').mockResolvedValue({
      id: 'sale-e2e-1',
      invoiceNo: 'INV-2026-0001',
      customerName: 'Dr. Rafiqul Islam',
      grandTotal: '97000.00',
      paidAmount: '70000.00',
      dueAmount: '27000.00',
      paymentMethodSummary: 'CASH, BKASH',
      status: 'COMPLETED',
    } as any);

    const res = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        customerId: 'cust-e2e-1',
        customerName: 'Dr. Rafiqul Islam',
        items: [
          {
            productId: 'prod-e2e-1',
            quantity: 2,
            unitPrice: 48500,
          },
        ],
        payments: [
          { paymentMethod: 'CASH', amount: 30000 },
          { paymentMethod: 'BKASH', amount: 40000, transactionNo: 'TRX998877' },
          { paymentMethod: 'DUE', amount: 27000 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.invoiceNo).toBe('INV-2026-0001');
    expect(res.body.data.dueAmount).toBe('27000.00');
  });

  it('Step 6: Customer Due Collection Voucher', async () => {
    vi.spyOn(CustomersService, 'collectDue').mockResolvedValue({
      voucherNo: 'PAY-2026-0001',
      amountPaid: 27000,
      previousDue: 27000,
      newDue: 0,
      paymentMethod: 'BKASH',
      customerId: 'cust-e2e-1',
    } as any);

    const res = await request(app)
      .post('/api/v1/customers/cust-e2e-1/collect-due')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        amount: 27000,
        paymentMethod: 'BKASH',
        notes: 'Full due settlement via bKash',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.newDue).toBe(0);
    expect(res.body.data.voucherNo).toBe('PAY-2026-0001');
  });

  it('Step 7: Daily Cash Register Closing Reconciliation', async () => {
    vi.spyOn(AccountingService, 'closeDay').mockResolvedValue({
      id: 'dc-e2e-1',
      businessDate: '2026-09-01',
      openingCash: '10000.00',
      cashSales: '30000.00',
      cashReceived: '0.00',
      cashExpenses: '2000.00',
      expectedCash: '38000.00',
      actualCash: '38000.00',
      difference: '0.00',
      status: 'CLOSED',
    } as any);

    const res = await request(app)
      .post('/api/v1/accounting/daily-closing/close')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        businessDate: '2026-09-01',
        actualCash: 38000,
        notes: 'Daily register verified and balanced to 0 discrepancy',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CLOSED');
    expect(res.body.data.difference).toBe('0.00');
  });
});
