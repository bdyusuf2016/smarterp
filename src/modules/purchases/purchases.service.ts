import { eq, and, desc, count, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import {
  purchases,
  purchaseItems,
  purchasePayments,
  purchaseReturns,
  purchaseReturnItems,
} from '../../db/schema/purchases';
import { products, productVariants } from '../../db/schema/products';
import { suppliers } from '../../db/schema/suppliers';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { SequenceService } from '../business/sequence.service';
import { InventoryService } from '../inventory/inventory.service';
import { SuppliersService } from '../suppliers/suppliers.service';

export interface CreatePurchaseItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface CreatePurchaseInput {
  tenantId: string;
  branchId: string;
  supplierId: string;
  supplierInvoiceNo?: string;
  purchaseDate?: Date;
  items: CreatePurchaseItemInput[];
  discount?: number;
  tax?: number;
  paidAmount?: number;
  paymentMethod?: string;
  notes?: string;
  createdBy?: string;
}

export interface PurchaseFilters {
  branchId?: string;
  supplierId?: string;
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreatePurchaseReturnItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseReturnInput {
  tenantId: string;
  branchId: string;
  purchaseId?: string;
  supplierId: string;
  items: CreatePurchaseReturnItemInput[];
  refundAmount?: number;
  reason?: string;
  createdBy?: string;
}

export class PurchasesService {
  /**
   * Complete Inward Purchase Workflow:
   * 1. Validates supplier existence
   * 2. Calculates totals, tax, discount, grand total, and payment status
   * 3. Generates invoice sequence number
   * 4. Persists purchase & items
   * 5. Automatically adjusts inventory stock with weighted avg cost
   * 6. Automatically records supplier payable balance in ledger
   */
  public static async createPurchase(input: CreatePurchaseInput) {
    const {
      tenantId,
      branchId,
      supplierId,
      supplierInvoiceNo,
      purchaseDate = new Date(),
      items,
      discount = 0,
      tax = 0,
      paidAmount = 0,
      paymentMethod = 'CASH',
      notes,
      createdBy,
    } = input;

    if (!items || items.length === 0) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Purchase must contain at least one item', 400);
    }

    const supplier = await db.query.suppliers.findFirst({
      where: and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)),
    });
    if (!supplier) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier not found', 404);
    }

    // 1. Calculate totals
    let subtotal = 0;
    const computedItems = items.map((itm) => {
      const lineSubtotal = itm.quantity * itm.unitPrice;
      const lineTax = lineSubtotal * ((itm.taxRate || 0) / 100);
      const lineTotal = lineSubtotal + lineTax;
      subtotal += lineSubtotal;
      return {
        ...itm,
        subtotal: lineSubtotal,
        total: lineTotal,
      };
    });

    const grandTotal = Math.max(0, subtotal - discount + tax);
    const dueAmount = Math.max(0, grandTotal - paidAmount);

    let paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' = 'PAID';
    if (dueAmount > 0 && paidAmount > 0) {
      paymentStatus = 'PARTIAL';
    } else if (dueAmount > 0 && paidAmount === 0) {
      paymentStatus = 'DUE';
    }

    const purchaseId = `pur-${crypto.randomUUID().slice(0, 10)}`;
    const invoiceNo = await SequenceService.generateNextNumber(tenantId, 'PURCHASE', branchId);

    return await db.transaction(async (tx) => {
      // 2. Insert Purchase Header
      const [newPurchase] = await tx
        .insert(purchases)
        .values({
          id: purchaseId,
          tenantId,
          branchId,
          supplierId,
          invoiceNo,
          supplierInvoiceNo: supplierInvoiceNo || null,
          purchaseDate,
          subtotal: subtotal.toFixed(2),
          discount: discount.toFixed(2),
          tax: tax.toFixed(2),
          grandTotal: grandTotal.toFixed(2),
          paidAmount: paidAmount.toFixed(2),
          dueAmount: dueAmount.toFixed(2),
          paymentStatus,
          status: 'RECEIVED',
          notes: notes || '',
          createdBy: createdBy || null,
        } as any)
        .returning();

      // 3. Insert Purchase Items
      const createdItems: any[] = [];
      for (const itm of computedItems) {
        const itemId = `pi-${crypto.randomUUID().slice(0, 10)}`;
        const [insertedItem] = await tx
          .insert(purchaseItems)
          .values({
            id: itemId,
            purchaseId,
            tenantId,
            productId: itm.productId,
            variantId: itm.variantId || null,
            quantity: itm.quantity.toFixed(3),
            unitPrice: itm.unitPrice.toFixed(2),
            subtotal: itm.subtotal.toFixed(2),
            taxRate: (itm.taxRate || 0).toFixed(2),
            total: itm.total.toFixed(2),
          } as any)
          .returning();

        createdItems.push(insertedItem);
      }

      // 4. Record Initial Payment if paidAmount > 0
      if (paidAmount > 0) {
        const paymentId = `pp-${crypto.randomUUID().slice(0, 10)}`;
        await tx.insert(purchasePayments).values({
          id: paymentId,
          tenantId,
          purchaseId,
          supplierId,
          amount: paidAmount.toFixed(2),
          paymentMethod,
          paymentDate: purchaseDate,
          referenceNo: invoiceNo,
          notes: `Payment on Purchase ${invoiceNo}`,
          createdBy: createdBy || null,
        } as any);
      }

      // 5. Automated Inward Stock Increment
      for (const itm of computedItems) {
        await InventoryService.adjustStock({
          tenantId,
          branchId,
          productId: itm.productId,
          variantId: itm.variantId,
          quantityDelta: itm.quantity,
          transactionType: 'PURCHASE',
          unitCost: itm.unitPrice,
          referenceType: 'PURCHASE',
          referenceId: invoiceNo,
          notes: `Purchase Inward Bill: ${invoiceNo}`,
          createdBy,
        });

        // Update product cost price
        await tx
          .update(products)
          .set({ costPrice: itm.unitPrice.toFixed(2), updatedAt: new Date() } as any)
          .where(eq(products.id, itm.productId));

        if (itm.variantId) {
          await tx
            .update(productVariants)
            .set({ costPrice: itm.unitPrice.toFixed(2), updatedAt: new Date() } as any)
            .where(eq(productVariants.id, itm.variantId));
        }
      }

      // 6. Automated Supplier Payable Ledger Recording
      // Grand total credited (increases payable), paid amount debited (decreases payable)
      await SuppliersService.recordTransaction({
        tenantId,
        branchId,
        supplierId,
        transactionType: 'PURCHASE',
        credit: grandTotal,
        debit: paidAmount,
        invoiceNo,
        paymentMethod: paidAmount > 0 ? paymentMethod : undefined,
        notes: `Purchase Bill: ${invoiceNo}`,
        createdBy,
      });

      return {
        ...newPurchase,
        items: createdItems,
      };
    });
  }

  /**
   * Retrieves paginated list of purchases
   */
  public static async getPurchases(tenantId: string, filters: PurchaseFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [eq(purchases.tenantId, tenantId)];

    if (filters.branchId) {
      conditions.push(eq(purchases.branchId, filters.branchId));
    }
    if (filters.supplierId) {
      conditions.push(eq(purchases.supplierId, filters.supplierId));
    }
    if (filters.status) {
      conditions.push(eq(purchases.status, filters.status));
    }
    if (filters.paymentStatus) {
      conditions.push(eq(purchases.paymentStatus, filters.paymentStatus));
    }

    const whereClause = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.purchases.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (p, { desc }) => [desc(p.purchaseDate)],
      }),
      db.select({ count: count() }).from(purchases).where(whereClause),
    ]);

    const totalCount = Number(totalResult[0]?.count || 0);

    // Attach supplier name
    const supplierIds = [...new Set(items.map((p) => p.supplierId))];
    const supplierList = supplierIds.length > 0
      ? await db.query.suppliers.findMany({ where: inArray(suppliers.id, supplierIds) })
      : [];

    const enriched = items.map((p) => ({
      ...p,
      supplier: supplierList.find((s) => s.id === p.supplierId) || null,
    }));

    return {
      items: enriched,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Retrieves single purchase with supplier, items, and payments
   */
  public static async getPurchaseById(purchaseId: string, tenantId: string) {
    const purchase = await db.query.purchases.findFirst({
      where: and(eq(purchases.id, purchaseId), eq(purchases.tenantId, tenantId)),
    });

    if (!purchase) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Purchase not found', 404);
    }

    const [itemsList, paymentsList, supplier] = await Promise.all([
      db.query.purchaseItems.findMany({
        where: eq(purchaseItems.purchaseId, purchaseId),
      }),
      db.query.purchasePayments.findMany({
        where: eq(purchasePayments.purchaseId, purchaseId),
      }),
      db.query.suppliers.findFirst({
        where: eq(suppliers.id, purchase.supplierId),
      }),
    ]);

    const productIds = itemsList.map((i) => i.productId);
    const productList = productIds.length > 0
      ? await db.query.products.findMany({ where: inArray(products.id, productIds) })
      : [];

    const enrichedItems = itemsList.map((i) => ({
      ...i,
      product: productList.find((p) => p.id === i.productId) || null,
    }));

    return {
      ...purchase,
      supplier,
      items: enrichedItems,
      payments: paymentsList,
    };
  }

  /**
   * Purchase Returns Workflow:
   * 1. Creates purchase return record
   * 2. Automatically deducts inventory stock
   * 3. Automatically debits supplier payable ledger
   */
  public static async createPurchaseReturn(input: CreatePurchaseReturnInput) {
    const {
      tenantId,
      branchId,
      purchaseId,
      supplierId,
      items,
      refundAmount = 0,
      reason,
      createdBy,
    } = input;

    if (!items || items.length === 0) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Purchase return must contain at least one item', 400);
    }

    let totalAmount = 0;
    for (const itm of items) {
      totalAmount += itm.quantity * itm.unitPrice;
    }

    const returnId = `pret-${crypto.randomUUID().slice(0, 10)}`;
    const returnNo = await SequenceService.generateNextNumber(tenantId, 'RETURN', branchId);

    return await db.transaction(async (tx) => {
      const [newReturn] = await tx
        .insert(purchaseReturns)
        .values({
          id: returnId,
          tenantId,
          branchId,
          purchaseId: purchaseId || null,
          supplierId,
          returnNo,
          totalAmount: totalAmount.toFixed(2),
          refundAmount: refundAmount.toFixed(2),
          reason: reason || '',
          createdBy: createdBy || null,
        } as any)
        .returning();

      const createdItems: any[] = [];
      for (const itm of items) {
        const itemId = `pri-${crypto.randomUUID().slice(0, 10)}`;
        const lineTotal = itm.quantity * itm.unitPrice;

        const [createdItem] = await tx
          .insert(purchaseReturnItems)
          .values({
            id: itemId,
            returnId,
            productId: itm.productId,
            variantId: itm.variantId || null,
            quantity: itm.quantity.toFixed(3),
            unitPrice: itm.unitPrice.toFixed(2),
            total: lineTotal.toFixed(2),
          } as any)
          .returning();

        createdItems.push(createdItem);

        // Deduct inventory stock
        await InventoryService.adjustStock({
          tenantId,
          branchId,
          productId: itm.productId,
          variantId: itm.variantId,
          quantityDelta: -itm.quantity,
          transactionType: 'PURCHASE_RETURN',
          unitCost: itm.unitPrice,
          referenceType: 'PURCHASE_RETURN',
          referenceId: returnNo,
          notes: `Purchase Return: ${returnNo}`,
          createdBy,
        });
      }

      // Deduct supplier payable
      await SuppliersService.recordTransaction({
        tenantId,
        branchId,
        supplierId,
        transactionType: 'RETURN',
        debit: totalAmount,
        credit: 0,
        invoiceNo: returnNo,
        notes: `Purchase Return: ${returnNo}`,
        createdBy,
      });

      return {
        ...newReturn,
        items: createdItems,
      };
    });
  }
}
