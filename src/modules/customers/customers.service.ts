import { eq, and, or, ilike, count, sql, desc, gt } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import { customers, customerTransactions } from '../../db/schema/customers';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { BusinessService } from '../business/business.service';
import { SequenceService } from '../business/sequence.service';

export interface CreateCustomerInput {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  creditLimit?: string;
  openingDue?: string;
  customFields?: Record<string, unknown>;
}

export interface CustomerFilters {
  search?: string;
  dueOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface RecordCustomerTransactionInput {
  tenantId: string;
  branchId?: string;
  customerId: string;
  transactionType: 'OPENING' | 'SALE' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT';
  debit?: number; // Increases due (e.g. credit sale)
  credit?: number; // Decreases due (e.g. cash/bKash payment or return)
  invoiceNo?: string;
  paymentMethod?: string;
  notes?: string;
  createdBy?: string;
}

export class CustomersService {
  /**
   * Creates a new customer with phone uniqueness validation, opening due ledger entry, and custom fields
   */
  public static async createCustomer(input: CreateCustomerInput) {
    const customerId = `cust-${crypto.randomUUID().slice(0, 10)}`;
    const cleanPhone = input.phone.trim();

    // 1. Validate phone uniqueness for tenant
    const existing = await db.query.customers.findFirst({
      where: and(eq(customers.tenantId, input.tenantId), eq(customers.phone, cleanPhone)),
    });

    if (existing) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Customer with phone '${cleanPhone}' already exists in your store`,
        400
      );
    }

    const openingDue = input.openingDue ? Number(input.openingDue) : 0;

    const [newCustomer] = await db
      .insert(customers)
      .values({
        id: customerId,
        tenantId: input.tenantId,
        name: input.name.trim(),
        phone: cleanPhone,
        email: input.email?.trim() || null,
        address: input.address || '',
        notes: input.notes || '',
        creditLimit: input.creditLimit || '0.00',
        currentDue: openingDue.toFixed(2),
        totalPurchases: '0.00',
        isActive: true,
      } as any)
      .returning();

    // 2. If opening due exists, record opening transaction
    if (openingDue > 0) {
      const txId = `ctx-${crypto.randomUUID().slice(0, 10)}`;
      await db.insert(customerTransactions).values({
        id: txId,
        tenantId: input.tenantId,
        customerId,
        transactionType: 'OPENING',
        debit: openingDue.toFixed(2),
        credit: '0.00',
        balance: openingDue.toFixed(2),
        notes: 'Initial Opening Due',
      } as any);
    }

    // 3. Save Custom Fields if provided
    if (input.customFields && Object.keys(input.customFields).length > 0) {
      await BusinessService.saveCustomFieldValues(
        input.tenantId,
        'CUSTOMER',
        customerId,
        input.customFields
      );
    }

    return {
      ...newCustomer,
      customFields: input.customFields || {},
    };
  }

  /**
   * Retrieves paginated list of customers with search and due filter
   */
  public static async getCustomers(tenantId: string, filters: CustomerFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [
      eq(customers.tenantId, tenantId),
      eq(customers.isActive, true),
    ];

    if (filters.dueOnly) {
      conditions.push(gt(customers.currentDue, '0.00'));
    }

    if (filters.search) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(customers.name, q),
          ilike(customers.phone, q),
          ilike(customers.email, q)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.customers.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (c, { desc }) => [desc(c.createdAt)],
      }),
      db.select({ count: count() }).from(customers).where(whereClause),
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
   * Retrieves single customer with ledger history and custom field values
   */
  public static async getCustomerById(customerId: string, tenantId: string) {
    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
    });

    if (!customer) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Customer not found', 404);
    }

    const [recentTx, customFields] = await Promise.all([
      db.query.customerTransactions.findMany({
        where: eq(customerTransactions.customerId, customerId),
        limit: 50,
        orderBy: [desc(customerTransactions.transactionDate)],
      }),
      BusinessService.getCustomFieldValues(tenantId, customerId),
    ]);

    return {
      ...customer,
      recentTransactions: recentTx,
      customFields,
    };
  }

  /**
   * Updates customer profile
   */
  public static async updateCustomer(
    customerId: string,
    tenantId: string,
    updates: Partial<typeof customers.$inferInsert>,
    customFields?: Record<string, unknown>
  ) {
    const existing = await db.query.customers.findFirst({
      where: and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
    });

    if (!existing) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Customer not found', 404);
    }

    const [updated] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
      .returning();

    if (customFields && Object.keys(customFields).length > 0) {
      await BusinessService.saveCustomFieldValues(tenantId, 'CUSTOMER', customerId, customFields);
    }

    return updated;
  }

  /**
   * Deactivates customer
   */
  public static async deleteCustomer(customerId: string, tenantId: string) {
    const existing = await db.query.customers.findFirst({
      where: and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
    });

    if (!existing) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Customer not found', 404);
    }

    await db
      .update(customers)
      .set({ isActive: false, updatedAt: new Date() } as any)
      .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)));

    return { deleted: true, customerId };
  }

  /**
   * ATOMIC TRANSACTION LEDGER RECORDING (SELECT FOR UPDATE)
   * Debit increases due, Credit decreases due.
   */
  public static async recordTransaction(input: RecordCustomerTransactionInput) {
    const {
      tenantId,
      branchId,
      customerId,
      transactionType,
      debit = 0,
      credit = 0,
      invoiceNo,
      paymentMethod,
      notes,
      createdBy,
    } = input;

    return await db.transaction(async (tx) => {
      // 1. Lock customer row for balance mutation
      const lockedRows = await tx.execute(
        sql`SELECT * FROM ${customers}
            WHERE id = ${customerId} AND tenant_id = ${tenantId}
            FOR UPDATE`
      );

      const customer = (lockedRows.rows as any[])[0];
      if (!customer) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'Customer not found', 404);
      }

      const currentDue = Number(customer.current_due || 0);
      const newDue = currentDue + debit - credit;

      // 2. Update customer current due
      await tx
        .update(customers)
        .set({
          currentDue: newDue.toFixed(2),
          updatedAt: new Date(),
        } as any)
        .where(eq(customers.id, customerId));

      // 3. Write customer transaction ledger entry
      const txId = `ctx-${crypto.randomUUID().slice(0, 10)}`;

      const [entry] = await tx
        .insert(customerTransactions)
        .values({
          id: txId,
          tenantId,
          branchId: branchId || null,
          customerId,
          transactionType,
          debit: debit.toFixed(2),
          credit: credit.toFixed(2),
          balance: newDue.toFixed(2),
          invoiceNo: invoiceNo || null,
          paymentMethod: paymentMethod || null,
          notes: notes || '',
          createdBy: createdBy || null,
        } as any)
        .returning();

      return {
        transactionId: txId,
        previousDue: currentDue,
        newDue,
        entry,
      };
    });
  }

  /**
   * Dedicated Due Collection Workflow
   */
  public static async collectDue(
    customerId: string,
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
      customerId,
      transactionType: 'PAYMENT',
      credit: amount,
      invoiceNo: receiptNo,
      paymentMethod,
      notes: notes || `Customer Due Collection (${receiptNo})`,
      createdBy: userId,
    });

    return {
      receiptNo,
      ...result,
    };
  }
}
