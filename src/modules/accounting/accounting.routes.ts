import { Router } from 'express';
import { AccountingController } from './accounting.controller';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireModule } from '../../middleware/module.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createAccountSchema,
  createJournalEntrySchema,
  createExpenseSchema,
  openDaySchema,
  closeDaySchema,
} from './accounting.schema';

export const accountingRouter = Router();

// Protect all accounting routes with JWT + ACCOUNTING module check
accountingRouter.use(authenticateJwt);
accountingRouter.use(requireModule('ACCOUNTING'));

// Chart of Accounts
accountingRouter.get('/accounts', requirePermission('accounting.view'), AccountingController.getAccounts);
accountingRouter.post('/accounts', requirePermission('accounting.manage'), validateBody(createAccountSchema), AccountingController.createAccount);

// Journal Entries
accountingRouter.post('/journal-entries', requirePermission('accounting.manage'), validateBody(createJournalEntrySchema), AccountingController.createJournalEntry);

// Expenses
accountingRouter.get('/expenses', requirePermission('expenses.view'), AccountingController.getExpenses);
accountingRouter.post('/expenses', requirePermission('expenses.create'), validateBody(createExpenseSchema), AccountingController.createExpense);

// Daily Closing & Cash Register
accountingRouter.get('/daily-closing/status', requirePermission('sales.view'), AccountingController.getDailyStatus);
accountingRouter.post('/daily-closing/open', requirePermission('sales.create'), validateBody(openDaySchema), AccountingController.openDay);
accountingRouter.post('/daily-closing/close', requirePermission('sales.create'), validateBody(closeDaySchema), AccountingController.closeDay);

// Financial Reports
accountingRouter.get('/reports/trial-balance', requirePermission('reports.view'), AccountingController.getTrialBalance);
accountingRouter.get('/reports/income-statement', requirePermission('reports.view'), AccountingController.getIncomeStatement);
