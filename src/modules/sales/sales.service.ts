import { eq, and, desc, count, inArray, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import {
  sales,
  saleItems,
  payments,
  saleReturns,
  saleReturnItems,
} from '../../db/schema/sales';
import { customers } from '../../db/schema/customers';
import { products, productVariants } from '../../db/schema/products';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { SequenceService } from '../business/sequence.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';

export interface CreateSaleItemInput {
  productId: string;
  variantId?: string;
  deviceId?: string;
  batchId?: string;
  bookCopyId?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  imei?: string;
  warrantyText?: string;
}

export interface SplitPaymentInput {
  paymentMethod: 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CARD' | 'DUE' | 'OTHER';
  amount: number;
  transactionNo?: string;
  accountId?: string;
  notes?: string;
}

export interface CreateSaleInput {
  tenantId: string;
  branchId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  saleDate?: Date;
  items: CreateSaleItemInput[];
  payments: SplitPaymentInput[];
  discount?: number;
  tax?: number;
  notes?: string;
  cashierId?: string;
  cashierName?: string;
}

export interface SaleFilters {
  branchId?: string;
  customerId?: string;
  cashierId?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateSaleReturnItemInput {
  saleItemId: string;
  productId: string;
  variantId?: string;
  deviceId?: string;
  batchId?: string;
  quantity: number;
  unitPrice: number;
  restockItem?: boolean;
}

export interface CreateSaleReturnInput {
  tenantId: string;
  branchId: string;
  saleId: string;
  items: CreateSaleReturnItemInput[];
  refundAmount?: number;
  reason?: string;
  createdBy?: string;
}

export interface ParkedCart {
  id: string;
  tenantId: string;
  branchId: string;
  customerName?: string;
  customerPhone?: string;
  items: CreateSaleItemInput[];
  notes?: string;
  createdAt: Date;
}

export class SalesService {
  private static parkedCarts: Map<string, ParkedCart> = new Map();

  /**
   * HIGH-PERFORMANCE POS CHECKOUT ENGINE
   * 1. Validates items & stock
   * 2. Calculates subtotal, discounts, tax, grand total
   * 3. Reconciles split payments (Cash, MFS, Card, Due)
   * 4. Generates invoice sequence number (INV-2026-0001)
   * 5. Atomically deducts inventory stock with SELECT FOR UPDATE locks
   * 6. Atomically updates customer ledger if credit due
   */
  public static async createSale(input: CreateSaleInput) {
    const {
      tenantId,
      branchId,
      customerId,
      customerName = 'Cash Customer',
      customerPhone = '',
      saleDate = new Date(),
      items,
      payments: splitPayments,
      discount = 0,
      tax = 0,
      notes,
      cashierId,
      cashierName,
    } = input;

    if (!items || items.length === 0) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Sale must contain at least one item', 400);
    }

    if (!splitPayments || splitPayments.length === 0) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'At least one payment method is required', 400);
    }

    // 1. Fetch product and variant records to populate immutable metadata
    const productIds = items.map((i) => i.productId);
    const dbProducts = await db.query.products.findMany({
      where: and(eq(products.tenantId, tenantId), inArray(products.id, productIds)),
    });

    const variantIds = items.map((i) => i.variantId).filter(Boolean) as string[];
    const dbVariants = variantIds.length > 0
      ? await db.query.productVariants.findMany({
          where: and(eq(productVariants.tenantId, tenantId), inArray(productVariants.id, variantIds)),
        })
      : [];

    // 2. Compute Item Line Totals
    let subtotal = 0;
    const computedItems = items.map((itm) => {
      const p = dbProducts.find((prod) => prod.id === itm.productId);
      const v = itm.variantId ? dbVariants.find((vr) => vr.id === itm.variantId) : null;

      const pName = v ? `${p?.name || 'Item'} (${v.name})` : (p?.name || 'Item');
      const pSku = v?.sku || p?.sku || 'SKU';
      const pBarcode = v?.barcode || p?.barcode || 'BAR';
      const pCost = Number(v?.costPrice || p?.costPrice || 0);

      const lineSubtotal = itm.quantity * itm.unitPrice;
      const lineDiscount = itm.discount || 0;
      const lineTax = (lineSubtotal - lineDiscount) * ((itm.taxRate || 0) / 100);
      const lineTotal = lineSubtotal - lineDiscount + lineTax;

      subtotal += lineSubtotal;

      return {
        ...itm,
        productName: pName,
        sku: pSku,
        barcode: pBarcode,
        costPrice: pCost.toFixed(2),
        subtotal: lineSubtotal.toFixed(2),
        discount: lineDiscount.toFixed(2),
        tax: lineTax.toFixed(2),
        total: lineTotal.toFixed(2),
      };
    });

    const grandTotal = Math.max(0, subtotal - discount + tax);

    // 3. Reconcile Split Payments
    let totalCashAndOnlinePaid = 0;
    let explicitDueAmount = 0;
    const paymentMethodsSummary: string[] = [];

    for (const sp of splitPayments) {
      if (sp.paymentMethod === 'DUE') {
        explicitDueAmount += sp.amount;
      } else {
        totalCashAndOnlinePaid += sp.amount;
        paymentMethodsSummary.push(sp.paymentMethod);
      }
    }

    const netDue = Math.max(0, grandTotal - totalCashAndOnlinePaid);
    const changeAmount = Math.max(0, totalCashAndOnlinePaid - grandTotal);
    const paidAmount = Math.min(grandTotal, totalCashAndOnlinePaid);

    if (netDue > 0 && !customerId) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Cannot sell on credit/due of ${netDue.toFixed(2)} ৳ to a walk-in Cash Customer. Please select or register a customer.`,
        400
      );
    }

    const saleId = `sale-${crypto.randomUUID().slice(0, 10)}`;
    const invoiceNo = await SequenceService.generateNextNumber(tenantId, 'SALE', branchId);
    const summaryText = paymentMethodsSummary.length > 0
      ? paymentMethodsSummary.join(', ')
      : 'Due';

    return await db.transaction(async (tx) => {
      // 4. Insert Sale Header
      const [newSale] = await tx
        .insert(sales)
        .values({
          id: saleId,
          tenantId,
          branchId,
          customerId: customerId || null,
          customerName,
          customerPhone,
          invoiceNo,
          saleDate,
          subtotal: subtotal.toFixed(2),
          discount: discount.toFixed(2),
          tax: tax.toFixed(2),
          grandTotal: grandTotal.toFixed(2),
          paidAmount: paidAmount.toFixed(2),
          dueAmount: netDue.toFixed(2),
          changeAmount: changeAmount.toFixed(2),
          status: 'COMPLETED',
          paymentMethodSummary: summaryText,
          cashierId: cashierId || null,
          cashierName: cashierName || null,
          notes: notes || '',
        } as any)
        .returning();

      // 5. Insert Sale Items
      const createdItems: any[] = [];
      for (const itm of computedItems) {
        const itemId = `si-${crypto.randomUUID().slice(0, 10)}`;
        const [insertedItem] = await tx
          .insert(saleItems)
          .values({
            id: itemId,
            saleId,
            tenantId,
            productId: itm.productId,
            variantId: itm.variantId || null,
            deviceId: itm.deviceId || null,
            batchId: itm.batchId || null,
            bookCopyId: itm.bookCopyId || null,
            productName: itm.productName,
            sku: itm.sku,
            barcode: itm.barcode,
            quantity: itm.quantity.toFixed(3),
            unitPrice: itm.unitPrice.toFixed(2),
            costPrice: itm.costPrice,
            discount: itm.discount,
            tax: itm.tax,
            total: itm.total,
            imei: itm.imei || null,
            warrantyText: itm.warrantyText || null,
          } as any)
          .returning();

        createdItems.push(insertedItem);
      }

      // 6. Insert Payments
      for (const sp of splitPayments) {
        if (sp.paymentMethod !== 'DUE' && sp.amount > 0) {
          const payId = `pay-${crypto.randomUUID().slice(0, 10)}`;
          await tx.insert(payments).values({
            id: payId,
            tenantId,
            branchId,
            referenceType: 'SALE',
            referenceId: saleId,
            customerId: customerId || null,
            amount: sp.amount.toFixed(2),
            paymentMethod: sp.paymentMethod,
            transactionNo: sp.transactionNo || null,
            accountId: sp.accountId || null,
            status: 'COMPLETED',
            paymentDate: saleDate,
            notes: sp.notes || `POS Payment for Invoice ${invoiceNo}`,
            createdBy: cashierId || null,
          } as any);
        }
      }

      // 7. Instant Concurrency-Safe Stock Deduction
      for (const itm of computedItems) {
        await InventoryService.adjustStock({
          tenantId,
          branchId,
          productId: itm.productId,
          variantId: itm.variantId,
          quantityDelta: -itm.quantity,
          transactionType: 'SALE',
          unitCost: Number(itm.costPrice),
          referenceType: 'SALE',
          referenceId: invoiceNo,
          notes: `POS Sale Invoice: ${invoiceNo}`,
          createdBy: cashierId,
        });
      }

      // 8. Automated Customer Ledger Update
      if (customerId) {
        await CustomersService.recordTransaction({
          tenantId,
          branchId,
          customerId,
          transactionType: 'SALE',
          debit: grandTotal,
          credit: paidAmount,
          invoiceNo,
          paymentMethod: summaryText,
          notes: `POS Sale Invoice: ${invoiceNo}`,
          createdBy: cashierId,
        });

        // Increment customer totalPurchases
        await tx.execute(
          sql`UPDATE ${customers}
              SET total_purchases = total_purchases + ${grandTotal}, updated_at = NOW()
              WHERE id = ${customerId}`
        );
      }

      return {
        ...newSale,
        items: createdItems,
      };
    });
  }

  /**
   * Retrieves paginated list of sales invoices
   */
  public static async getSales(tenantId: string, filters: SaleFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [eq(sales.tenantId, tenantId)];

    if (filters.branchId) {
      conditions.push(eq(sales.branchId, filters.branchId));
    }
    if (filters.customerId) {
      conditions.push(eq(sales.customerId, filters.customerId));
    }
    if (filters.cashierId) {
      conditions.push(eq(sales.cashierId, filters.cashierId));
    }
    if (filters.status) {
      conditions.push(eq(sales.status, filters.status));
    }

    const whereClause = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.sales.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (s, { desc }) => [desc(s.saleDate)],
      }),
      db.select({ count: count() }).from(sales).where(whereClause),
    ]);

    const totalCount = Number(totalResult[0]?.count || 0);

    return {
      items,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Retrieves single sale invoice with items and payments
   */
  public static async getSaleById(saleId: string, tenantId: string) {
    const sale = await db.query.sales.findFirst({
      where: and(eq(sales.id, saleId), eq(sales.tenantId, tenantId)),
    });

    if (!sale) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Sale invoice not found', 404);
    }

    const [itemsList, paymentsList, customer] = await Promise.all([
      db.query.saleItems.findMany({
        where: eq(saleItems.saleId, saleId),
      }),
      db.query.payments.findMany({
        where: and(eq(payments.referenceType, 'SALE'), eq(payments.referenceId, saleId)),
      }),
      sale.customerId
        ? db.query.customers.findFirst({ where: eq(customers.id, sale.customerId) })
        : null,
    ]);

    return {
      ...sale,
      customer,
      items: itemsList,
      payments: paymentsList,
    };
  }

  /**
   * Sales Return Workflow:
   * 1. Creates sale return record
   * 2. Restores inventory stock if restockItem is true
   * 3. Adjusts customer ledger if customer was linked
   */
  public static async createSaleReturn(input: CreateSaleReturnInput) {
    const {
      tenantId,
      branchId,
      saleId,
      items,
      refundAmount = 0,
      reason,
      createdBy,
    } = input;

    if (!items || items.length === 0) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Sale return must contain at least one item', 400);
    }

    const origSale = await db.query.sales.findFirst({
      where: and(eq(sales.id, saleId), eq(sales.tenantId, tenantId)),
    });
    if (!origSale) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Original sale invoice not found', 404);
    }

    let returnTotal = 0;
    for (const itm of items) {
      returnTotal += itm.quantity * itm.unitPrice;
    }

    const returnId = `sret-${crypto.randomUUID().slice(0, 10)}`;
    const returnNo = await SequenceService.generateNextNumber(tenantId, 'SALE_RETURN', branchId);

    return await db.transaction(async (tx) => {
      const [newReturn] = await tx
        .insert(saleReturns)
        .values({
          id: returnId,
          tenantId,
          branchId,
          saleId,
          customerId: origSale.customerId || null,
          returnNo,
          returnAmount: returnTotal.toFixed(2),
          refundAmount: refundAmount.toFixed(2),
          reason: reason || '',
          createdBy: createdBy || null,
        } as any)
        .returning();

      const createdItems: any[] = [];
      for (const itm of items) {
        const itemId = `sri-${crypto.randomUUID().slice(0, 10)}`;
        const refundTotal = itm.quantity * itm.unitPrice;

        const [createdItem] = await tx
          .insert(saleReturnItems)
          .values({
            id: itemId,
            returnId,
            saleItemId: itm.saleItemId,
            productId: itm.productId,
            variantId: itm.variantId || null,
            deviceId: itm.deviceId || null,
            batchId: itm.batchId || null,
            quantity: itm.quantity.toFixed(3),
            unitPrice: itm.unitPrice.toFixed(2),
            refundTotal: refundTotal.toFixed(2),
            restockItem: itm.restockItem ?? true,
          } as any)
          .returning();

        createdItems.push(createdItem);

        // Restock inventory if requested
        if (itm.restockItem !== false) {
          await InventoryService.adjustStock({
            tenantId,
            branchId,
            productId: itm.productId,
            variantId: itm.variantId,
            quantityDelta: itm.quantity,
            transactionType: 'SALE_RETURN',
            unitCost: itm.unitPrice,
            referenceType: 'SALE_RETURN',
            referenceId: returnNo,
            notes: `Sale Return: ${returnNo}`,
            createdBy,
          });
        }
      }

      // Update customer ledger
      if (origSale.customerId) {
        await CustomersService.recordTransaction({
          tenantId,
          branchId,
          customerId: origSale.customerId,
          transactionType: 'RETURN',
          credit: returnTotal,
          debit: refundAmount,
          invoiceNo: returnNo,
          notes: `Sale Return: ${returnNo}`,
          createdBy,
        });
      }

      return {
        ...newReturn,
        items: createdItems,
      };
    });
  }

  // ==========================================
  // HELD / PARKED CARTS MANAGEMENT
  // ==========================================

  public static parkCart(tenantId: string, branchId: string, input: { customerName?: string; customerPhone?: string; items: CreateSaleItemInput[]; notes?: string }) {
    const cartId = `cart-${crypto.randomUUID().slice(0, 8)}`;
    const cart: ParkedCart = {
      id: cartId,
      tenantId,
      branchId,
      customerName: input.customerName || 'Held Cart',
      customerPhone: input.customerPhone,
      items: input.items,
      notes: input.notes,
      createdAt: new Date(),
    };

    this.parkedCarts.set(cartId, cart);
    return cart;
  }

  public static getParkedCarts(tenantId: string, branchId: string): ParkedCart[] {
    const list: ParkedCart[] = [];
    for (const c of this.parkedCarts.values()) {
      if (c.tenantId === tenantId && c.branchId === branchId) {
        list.push(c);
      }
    }
    return list;
  }

  public static deleteParkedCart(cartId: string, tenantId: string): boolean {
    const cart = this.parkedCarts.get(cartId);
    if (cart && cart.tenantId === tenantId) {
      this.parkedCarts.delete(cartId);
      return true;
    }
    return false;
  }
}
