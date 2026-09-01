import { eq, and, desc, count, sql, inArray, gte, lte } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import {
  accounts,
  journalEntries,
  journalEntryLines,
  expenses,
  dailyClosings,
} from '../../db/schema/accounting';
import { payments } from '../../db/schema/sales';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { SequenceService } from '../business/sequence.service';

export interface CreateAccountInput {
  tenantId: string;
  branchId?: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  isBank?: boolean;
  isMfs?: boolean;
  currency?: string;
}

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateJournalEntryInput {
  tenantId: string;
  branchId?: string;
  entryDate?: Date;
  referenceType?: string;
  referenceId?: string;
  lines: JournalLineInput[];
  notes?: string;
  createdBy?: string;
}

export interface CreateExpenseInput {
  tenantId: string;
  branchId?: string;
  expenseCategory: string;
  title: string;
  amount: number;
  paymentMethod?: string;
  accountId?: string;
  expenseDate?: Date;
  notes?: string;
  recordedBy?: string;
}

export interface OpenDayInput {
  tenantId: string;
  branchId: string;
  businessDate: string; // YYYY-MM-DD
  openingCash: number;
  userId?: string;
}

export interface CloseDayInput {
  tenantId: string;
  branchId: string;
  businessDate: string; // YYYY-MM-DD
  actualCash: number;
  notes?: string;
  userId?: string;
}

export class AccountingService {
  // ==========================================
  // CHART OF ACCOUNTS
  // ==========================================

  public static async getAccounts(tenantId: string, type?: string) {
    const conditions = [eq(accounts.tenantId, tenantId), eq(accounts.isActive, true)];
    if (type) conditions.push(eq(accounts.type, type));

    return db.query.accounts.findMany({
      where: and(...conditions),
      orderBy: (a, { asc }) => [asc(a.code)],
    });
  }

  public static async createAccount(input: CreateAccountInput) {
    const cleanCode = input.code.trim();

    const existing = await db.query.accounts.findFirst({
      where: and(eq(accounts.tenantId, input.tenantId), eq(accounts.code, cleanCode)),
    });

    if (existing) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Account code '${cleanCode}' is already in use`,
        400
      );
    }

    const accountId = `acc-${crypto.randomUUID().slice(0, 10)}`;

    const [newAccount] = await db
      .insert(accounts)
      .values({
        id: accountId,
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        code: cleanCode,
        name: input.name.trim(),
        type: input.type,
        isSystem: false,
        isBank: input.isBank || false,
        isMfs: input.isMfs || false,
        currentBalance: '0.00',
        currency: input.currency || 'BDT',
        isActive: true,
      } as any)
      .returning();

    return newAccount;
  }

  // ==========================================
  // DOUBLE-ENTRY JOURNAL ENTRIES
  // ==========================================

  public static async createJournalEntry(input: CreateJournalEntryInput) {
    const {
      tenantId,
      branchId,
      entryDate = new Date(),
      referenceType = 'MANUAL',
      referenceId,
      lines,
      notes,
      createdBy,
    } = input;

    if (!lines || lines.length < 2) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'A journal entry must contain at least 2 lines (debit and credit)',
        400
      );
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const l of lines) {
      totalDebit += l.debit;
      totalCredit += l.credit;
    }

    // Double-entry balancing rule check
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Journal entry is out of balance. Total Debit: ${totalDebit.toFixed(2)} ৳ != Total Credit: ${totalCredit.toFixed(2)} ৳`,
        400
      );
    }

    const entryId = `je-${crypto.randomUUID().slice(0, 10)}`;
    const entryNo = await SequenceService.generateNextNumber(tenantId, 'JOURNAL', branchId);

    return await db.transaction(async (tx) => {
      const [newEntry] = await tx
        .insert(journalEntries)
        .values({
          id: entryId,
          tenantId,
          branchId: branchId || null,
          entryNo,
          entryDate,
          referenceType,
          referenceId: referenceId || null,
          totalDebit: totalDebit.toFixed(2),
          totalCredit: totalCredit.toFixed(2),
          isBalanced: true,
          notes: notes || '',
          createdBy: createdBy || null,
        } as any)
        .returning();

      const createdLines: any[] = [];
      for (const l of lines) {
        const lineId = `jel-${crypto.randomUUID().slice(0, 10)}`;
        const [insertedLine] = await tx
          .insert(journalEntryLines)
          .values({
            id: lineId,
            journalEntryId: entryId,
            accountId: l.accountId,
            debit: l.debit.toFixed(2),
            credit: l.credit.toFixed(2),
            description: l.description || '',
          } as any)
          .returning();

        createdLines.push(insertedLine);

        // Update account balance based on normal balance rules
        // Asset & Expense: +Debit, -Credit
        // Liability, Equity, Revenue: +Credit, -Debit
        const acc = await tx.query.accounts.findFirst({
          where: and(eq(accounts.id, l.accountId), eq(accounts.tenantId, tenantId)),
        });

        if (acc) {
          let delta = 0;
          if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
            delta = l.debit - l.credit;
          } else {
            delta = l.credit - l.debit;
          }

          const currentBal = Number(acc.currentBalance || 0);
          const newBal = currentBal + delta;

          await tx
            .update(accounts)
            .set({ currentBalance: newBal.toFixed(2), updatedAt: new Date() } as any)
            .where(eq(accounts.id, acc.id));
        }
      }

      return {
        ...newEntry,
        lines: createdLines,
      };
    });
  }

  // ==========================================
  // EXPENSES
  // ==========================================

  public static async createExpense(input: CreateExpenseInput) {
    const {
      tenantId,
      branchId,
      expenseCategory,
      title,
      amount,
      paymentMethod = 'CASH',
      accountId,
      expenseDate = new Date(),
      notes,
      recordedBy,
    } = input;

    const expenseId = `exp-${crypto.randomUUID().slice(0, 10)}`;
    const invoiceNo = `EXP-${Date.now().toString().slice(-6)}`;

    const [newExpense] = await db
      .insert(expenses)
      .values({
        id: expenseId,
        tenantId,
        branchId: branchId || null,
        expenseCategory,
        title: title.trim(),
        amount: amount.toFixed(2),
        paymentMethod,
        accountId: accountId || null,
        expenseDate,
        invoiceNo,
        notes: notes || '',
        recordedBy: recordedBy || null,
      } as any)
      .returning();

    return newExpense;
  }

  public static async getExpenses(tenantId: string, filters: { branchId?: string; expenseCategory?: string; page?: number; limit?: number } = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [eq(expenses.tenantId, tenantId)];
    if (filters.branchId) conditions.push(eq(expenses.branchId, filters.branchId));
    if (filters.expenseCategory) conditions.push(eq(expenses.expenseCategory, filters.expenseCategory));

    const whereClause = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.expenses.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (e, { desc }) => [desc(e.expenseDate)],
      }),
      db.select({ count: count() }).from(expenses).where(whereClause),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        totalCount: Number(totalResult[0]?.count || 0),
        totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
      },
    };
  }

  // ==========================================
  // DAILY CASH REGISTER CLOSING
  // ==========================================

  public static async getDailyClosingStatus(tenantId: string, branchId: string, businessDate: string) {
    const record = await db.query.dailyClosings.findFirst({
      where: and(
        eq(dailyClosings.tenantId, tenantId),
        eq(dailyClosings.branchId, branchId),
        eq(dailyClosings.businessDate, businessDate)
      ),
    });

    // Query live totals for this day
    const startOfDay = new Date(`${businessDate}T00:00:00.000Z`);
    const endOfDay = new Date(`${businessDate}T23:59:59.999Z`);

    const cashPayments = await db.query.payments.findMany({
      where: and(
        eq(payments.tenantId, tenantId),
        eq(payments.branchId, branchId),
        eq(payments.paymentMethod, 'CASH'),
        gte(payments.paymentDate, startOfDay),
        lte(payments.paymentDate, endOfDay)
      ),
    });

    let liveCashSales = 0;
    let liveCashReceived = 0;
    for (const p of cashPayments) {
      if (p.referenceType === 'SALE') {
        liveCashSales += Number(p.amount);
      } else if (p.referenceType === 'CUSTOMER_DUE') {
        liveCashReceived += Number(p.amount);
      }
    }

    const cashExpenseList = await db.query.expenses.findMany({
      where: and(
        eq(expenses.tenantId, tenantId),
        eq(expenses.branchId, branchId),
        eq(expenses.paymentMethod, 'CASH'),
        gte(expenses.expenseDate, startOfDay),
        lte(expenses.expenseDate, endOfDay)
      ),
    });

    const liveCashExpenses = cashExpenseList.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const openingCash = Number(record?.openingCash || 0);
    const expectedCash = openingCash + liveCashSales + liveCashReceived - liveCashExpenses;

    return {
      dailyClosingRecord: record || null,
      isDayOpen: !!record && record.status === 'OPEN',
      isDayClosed: !!record && record.status === 'CLOSED',
      liveSummary: {
        businessDate,
        openingCash,
        cashSales: liveCashSales,
        cashReceived: liveCashReceived,
        cashExpenses: liveCashExpenses,
        expectedCash,
      },
    };
  }

  public static async openDay(input: OpenDayInput) {
    const { tenantId, branchId, businessDate, openingCash, userId } = input;

    const existing = await db.query.dailyClosings.findFirst({
      where: and(
        eq(dailyClosings.tenantId, tenantId),
        eq(dailyClosings.branchId, branchId),
        eq(dailyClosings.businessDate, businessDate)
      ),
    });

    if (existing) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Day is already opened for date ${businessDate}`,
        400
      );
    }

    const closeId = `dc-${crypto.randomUUID().slice(0, 10)}`;

    const [newClose] = await db
      .insert(dailyClosings)
      .values({
        id: closeId,
        tenantId,
        branchId,
        businessDate,
        openingCash: openingCash.toFixed(2),
        cashSales: '0.00',
        cashReceived: '0.00',
        cashExpenses: '0.00',
        expectedCash: openingCash.toFixed(2),
        actualCash: '0.00',
        difference: '0.00',
        status: 'OPEN',
      } as any)
      .returning();

    return newClose;
  }

  public static async closeDay(input: CloseDayInput) {
    const { tenantId, branchId, businessDate, actualCash, notes, userId } = input;

    const status = await this.getDailyClosingStatus(tenantId, branchId, businessDate);
    if (!status.dailyClosingRecord || status.dailyClosingRecord.status !== 'OPEN') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot close a day that is not open', 400);
    }

    const expectedCash = status.liveSummary.expectedCash;
    const difference = actualCash - expectedCash;

    const [closedRecord] = await db
      .update(dailyClosings)
      .set({
        cashSales: status.liveSummary.cashSales.toFixed(2),
        cashReceived: status.liveSummary.cashReceived.toFixed(2),
        cashExpenses: status.liveSummary.cashExpenses.toFixed(2),
        expectedCash: expectedCash.toFixed(2),
        actualCash: actualCash.toFixed(2),
        difference: difference.toFixed(2),
        status: 'CLOSED',
        closedBy: userId || null,
        closedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(dailyClosings.id, status.dailyClosingRecord.id))
      .returning();

    return closedRecord;
  }

  // ==========================================
  // FINANCIAL REPORTS
  // ==========================================

  public static async getTrialBalance(tenantId: string) {
    const accList = await db.query.accounts.findMany({
      where: and(eq(accounts.tenantId, tenantId), eq(accounts.isActive, true)),
      orderBy: (a, { asc }) => [asc(a.code)],
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const trialList = accList.map((a) => {
      const bal = Number(a.currentBalance || 0);
      let debit = 0;
      let credit = 0;

      if (a.type === 'ASSET' || a.type === 'EXPENSE') {
        if (bal >= 0) debit = bal;
        else credit = Math.abs(bal);
      } else {
        if (bal >= 0) credit = bal;
        else debit = Math.abs(bal);
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        id: a.id,
        code: a.code,
        name: a.name,
        type: a.type,
        debit,
        credit,
      };
    });

    return {
      accounts: trialList,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  public static async getIncomeStatement(tenantId: string) {
    const accList = await db.query.accounts.findMany({
      where: and(eq(accounts.tenantId, tenantId), eq(accounts.isActive, true)),
    });

    const revenues = accList.filter((a) => a.type === 'REVENUE');
    const expensesList = accList.filter((a) => a.type === 'EXPENSE');

    const totalRevenue = revenues.reduce((acc, curr) => acc + Number(curr.currentBalance || 0), 0);
    const totalExpenses = expensesList.reduce((acc, curr) => acc + Number(curr.currentBalance || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      revenues: revenues.map((r) => ({ id: r.id, code: r.code, name: r.name, amount: Number(r.currentBalance || 0) })),
      expenses: expensesList.map((e) => ({ id: e.id, code: e.code, name: e.name, amount: Number(e.currentBalance || 0) })),
      totalRevenue,
      totalExpenses,
      netIncome,
    };
  }
}
