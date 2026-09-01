import { z } from 'zod';

export const createAccountSchema = z.object({
  branchId: z.string().optional(),
  code: z.string().min(3, 'Account code must be at least 3 chars'),
  name: z.string().min(2, 'Account name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  isBank: z.boolean().optional(),
  isMfs: z.boolean().optional(),
  currency: z.string().default('BDT'),
});

export const createJournalEntrySchema = z.object({
  branchId: z.string().optional(),
  entryDate: z.string().datetime().optional().transform((d) => (d ? new Date(d) : undefined)),
  referenceType: z.string().default('MANUAL'),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(
    z.object({
      accountId: z.string().min(1, 'Account ID is required'),
      debit: z.number().min(0).default(0),
      credit: z.number().min(0).default(0),
      description: z.string().optional(),
    })
  ).min(2, 'Journal entry must contain at least 2 lines'),
});

export const createExpenseSchema = z.object({
  branchId: z.string().optional(),
  expenseCategory: z.string().min(2, 'Expense category is required'),
  title: z.string().min(2, 'Expense title is required'),
  amount: z.number().positive('Expense amount must be positive'),
  paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CARD', 'OTHER']).default('CASH'),
  accountId: z.string().optional(),
  expenseDate: z.string().datetime().optional().transform((d) => (d ? new Date(d) : undefined)),
  notes: z.string().optional(),
});

export const openDaySchema = z.object({
  branchId: z.string().optional(),
  businessDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Business date must be YYYY-MM-DD'),
  openingCash: z.number().min(0, 'Opening cash must be non-negative'),
});

export const closeDaySchema = z.object({
  branchId: z.string().optional(),
  businessDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Business date must be YYYY-MM-DD'),
  actualCash: z.number().min(0, 'Actual cash must be non-negative'),
  notes: z.string().optional(),
});
