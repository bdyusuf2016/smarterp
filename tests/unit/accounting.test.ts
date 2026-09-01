import { describe, it, expect, vi } from 'vitest';
import { AccountingService } from '../../src/modules/accounting/accounting.service';

describe('Accounting Unit Tests Suite', () => {
  describe('Double-Entry Balance Validation', () => {
    it('should reject out-of-balance journal entry where Total Debit != Total Credit', async () => {
      await expect(
        AccountingService.createJournalEntry({
          tenantId: 'tenant-001',
          lines: [
            { accountId: 'acc-1', debit: 500, credit: 0 },
            { accountId: 'acc-2', debit: 0, credit: 450 }, // 500 != 450
          ],
        })
      ).rejects.toThrow(/out of balance/i);
    });
  });
});
