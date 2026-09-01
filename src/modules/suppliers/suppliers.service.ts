import { eq, and, or, ilike, count, sql, desc, gt } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import { suppliers, supplierTransactions } from '../../db/schema/suppliers';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { BusinessService } from '../business/business.service';
import { SequenceService } from '../business/sequence.service';

export interface CreateSupplierInput {
  tenantId: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  openingPayable?: string;
  customFields?: Record<string, unknown>;
}

export interface SupplierFilters {
  search?: string;
  payableOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface RecordSupplierTransactionInput {
  tenantId: string;
  branchId?: string;
  supplierId: string;
  transactionType: 'OPENING' | 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT';
  debit?: number; // Decreases payable (e.g. payment made or purchase return)
  credit?: number; // Increases payable (e.g. credit purchase)
  invoiceNo?: string;
  paymentMethod?: string;
  notes?: string;
  createdBy?: string;
}

export class SuppliersService {
  /**
   * Creates a new supplier with phone uniqueness check, opening payable entry, and custom fields
   */
  public static async createSupplier(input: CreateSupplierInput) {
    const supplierId = `supp-${crypto.randomUUID().slice(0, 10)}`;
    const cleanPhone = input.phone.trim();

    // 1. Check phone uniqueness
    const existing = await db.query.suppliers.findFirst({
      where: and(eq(suppliers.tenantId, input.tenantId), eq(suppliers.phone, cleanPhone)),
    });

    if (existing) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Supplier with phone '${cleanPhone}' already exists in your store`,
        400
      );
    }

    const openingPayable = input.openingPayable ? Number(input.openingPayable) : 0;

    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        id: supplierId,
        tenantId: input.tenantId,
        name: input.name.trim(),
        companyName: input.companyName?.trim() || '',
        contactPerson: input.contactPerson?.trim() || '',
        phone: cleanPhone,
        email: input.email?.trim() || null,
        address: input.address || '',
        currentPayable: openingPayable.toFixed(2),
        totalPurchases: '0.00',
        isActive: true,
      } as any)
      .returning();

    // 2. If opening payable exists, record opening transaction
    if (openingPayable > 0) {
      const txId = `stx-${crypto.randomUUID().slice(0, 10)}`;
      await db.insert(supplierTransactions).values({
        id: txId,
        tenantId: input.tenantId,
        supplierId,
        transactionType: 'OPENING',
        credit: openingPayable.toFixed(2),
        debit: '0.00',
        balance: openingPayable.toFixed(2),
        notes: 'Initial Opening Payable',
      } as any);
    }

    // 3. Save Custom Fields if provided
    if (input.customFields && Object.keys(input.customFields).length > 0) {
      await BusinessService.saveCustomFieldValues(
        input.tenantId,
        'SUPPLIER',
        supplierId,
        input.customFields
      );
    }

    return {
      ...newSupplier,
      customFields: input.customFields || {},
    };
  }

  /**
   * Retrieves paginated list of suppliers with search and payable filter
   */
  public static async getSuppliers(tenantId: string, filters: SupplierFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [
      eq(suppliers.tenantId, tenantId),
      eq(suppliers.isActive, true),
    ];

    if (filters.payableOnly) {
      conditions.push(gt(suppliers.currentPayable, '0.00'));
    }

    if (filters.search) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(suppliers.name, q),
          ilike(suppliers.companyName, q),
          ilike(suppliers.phone, q)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.suppliers.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (s, { desc }) => [desc(s.createdAt)],
      }),
      db.select({ count: count() }).from(suppliers).where(whereClause),
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
   * Retrieves single supplier with ledger history and custom fields
   */
  public static async getSupplierById(supplierId: string, tenantId: string) {
    const supplier = await db.query.suppliers.findFirst({
      where: and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)),
    });

    if (!supplier) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier not found', 404);
    }

    const [recentTx, customFields] = await Promise.all([
      db.query.supplierTransactions.findMany({
        where: eq(supplierTransactions.supplierId, supplierId),
        limit: 50,
        orderBy: [desc(supplierTransactions.transactionDate)],
      }),
      BusinessService.getCustomFieldValues(tenantId, supplierId),
    ]);

    return {
      ...supplier,
      recentTransactions: recentTx,
      customFields,
    };
  }

  /**
   * Updates supplier profile
   */
  public static async updateSupplier(
    supplierId: string,
    tenantId: string,
    updates: Partial<typeof suppliers.$inferInsert>,
    customFields?: Record<string, unknown>
  ) {
    const existing = await db.query.suppliers.findFirst({
      where: and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)),
    });

    if (!existing) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier not found', 404);
    }

    const [updated] = await db
      .update(suppliers)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)))
      .returning();

    if (customFields && Object.keys(customFields).length > 0) {
      await BusinessService.saveCustomFieldValues(tenantId, 'SUPPLIER', supplierId, customFields);
    }

    return updated;
  }

  /**
   * Deactivates supplier
   */
  public static async deleteSupplier(supplierId: string, tenantId: string) {
    const existing = await db.query.suppliers.findFirst({
      where: and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)),
    });

    if (!existing) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier not found', 404);
    }

    await db
      .update(suppliers)
      .set({ isActive: false, updatedAt: new Date() } as any)
      .where(and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)));

    return { deleted: true, supplierId };
  }

  /**
   * ATOMIC TRANSACTION LEDGER RECORDING (SELECT FOR UPDATE)
   * Credit increases payable, Debit decreases payable.
   */
  public static async recordTransaction(input: RecordSupplierTransactionInput) {
    const {
      tenantId,
      branchId,
      supplierId,
      transactionType,
      debit = 0,
      credit = 0,
      invoiceNo,
      paymentMethod,
      notes,
      createdBy,
    } = input;

    return await db.transaction(async (tx) => {
      // 1. Lock supplier row
      const lockedRows = await tx.execute(
        sql`SELECT * FROM ${suppliers}
            WHERE id = ${supplierId} AND tenant_id = ${tenantId}
            FOR UPDATE`
      );

      const supplier = (lockedRows.rows as any[])[0];
      if (!supplier) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier not found', 404);
      }

      const currentPayable = Number(supplier.current_payable || 0);
      const newPayable = currentPayable + credit - debit;

      // 2. Update supplier current payable
      await tx
        .update(suppliers)
        .set({
          currentPayable: newPayable.toFixed(2),
          updatedAt: new Date(),
        } as any)
        .where(eq(suppliers.id, supplierId));

      // 3. Write transaction ledger entry
      const txId = `stx-${crypto.randomUUID().slice(0, 10)}`;

      const [entry] = await tx
        .insert(supplierTransactions)
        .values({
          id: txId,
          tenantId,
          branchId: branchId || null,
          supplierId,
          transactionType,
          debit: debit.toFixed(2),
          credit: credit.toFixed(2),
          balance: newPayable.toFixed(2),
          invoiceNo: invoiceNo || null,
          paymentMethod: paymentMethod || null,
          notes: notes || '',
          createdBy: createdBy || null,
        } as any)
        .returning();

      return {
        transactionId: txId,
        previousPayable: currentPayable,
        newPayable,
        entry,
      };
    });
  }

  /**
   * Dedicated Supplier Payment Workflow
   */
  public static async paySupplier(
    supplierId: string,
    tenantId: string,
    branchId: string,
    amount: number,
    paymentMethod: string,
    notes?: string,
    userId?: string
  ) {
    if (amount <= 0) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Payment amount must be greater than zero', 400);
    }

    const receiptNo = await SequenceService.generateNextNumber(tenantId, 'PAYMENT', branchId);

    const result = await this.recordTransaction({
      tenantId,
      branchId,
      supplierId,
      transactionType: 'PAYMENT',
      debit: amount,
      invoiceNo: receiptNo,
      paymentMethod,
      notes: notes || `Supplier Payment (${receiptNo})`,
      createdBy: userId,
    });

    return {
      receiptNo,
      ...result,
    };
  }
}
