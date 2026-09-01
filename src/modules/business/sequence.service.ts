import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../config/database';
import { numberSequences } from '../../db/schema/tenants';

export class SequenceService {
  /**
   * Generates next sequence number atomically for a tenant/branch and sequence type.
   * Format: PREFIX-YEAR-0001 (e.g. INV-2026-0001, PUR-2026-0001, REP-2026-0001)
   */
  public static async generateNextNumber(
    tenantId: string,
    sequenceType: string,
    branchId?: string
  ): Promise<string> {
    const currentYear = new Date().getFullYear();
    const defaultPrefix = this.getDefaultPrefix(sequenceType);

    // Try finding existing sequence for tenant, branch, type, year
    const existing = await db.query.numberSequences.findFirst({
      where: and(
        eq(numberSequences.tenantId, tenantId),
        eq(numberSequences.sequenceType, sequenceType),
        eq(numberSequences.year, currentYear),
        branchId ? eq(numberSequences.branchId, branchId) : undefined
      ),
    });

    let nextNumber = 1001;
    let prefix = defaultPrefix;

    if (existing) {
      prefix = existing.prefix;
      nextNumber = existing.lastNumber + 1;

      await db
        .update(numberSequences)
        .set({
          lastNumber: nextNumber,
        } as any)
        .where(eq(numberSequences.id, existing.id));
    } else {
      const newId = `seq-${tenantId}-${sequenceType}-${currentYear}-${branchId || 'main'}`;
      await db
        .insert(numberSequences)
        .values({
          id: newId,
          tenantId,
          branchId: branchId || null,
          sequenceType,
          prefix,
          year: currentYear,
          lastNumber: nextNumber,
        } as any)
        .onConflictDoUpdate({
          target: numberSequences.id,
          set: { lastNumber: sql`${numberSequences.lastNumber} + 1` } as any,
        });
    }

    const formattedNumber = String(nextNumber).padStart(4, '0');
    return `${prefix}-${currentYear}-${formattedNumber}`;
  }

  public static getDefaultPrefix(sequenceType: string): string {
    switch (sequenceType.toUpperCase()) {
      case 'SALE':
        return 'INV';
      case 'PURCHASE':
        return 'PUR';
      case 'REPAIR':
        return 'REP';
      case 'TRADE_IN':
        return 'TRD';
      case 'PAYMENT':
        return 'PAY';
      case 'EXPENSE':
        return 'EXP';
      case 'JOURNAL':
        return 'JRN';
      case 'TRANSFER':
        return 'TRF';
      case 'BORROW':
        return 'BOR';
      default:
        return 'DOC';
    }
  }
}
