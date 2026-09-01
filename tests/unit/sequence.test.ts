import { describe, it, expect } from 'vitest';
import { SequenceService } from '../../src/modules/business/sequence.service';

describe('SequenceService Unit Tests', () => {
  it('should return correct default prefixes for all document types', () => {
    expect(SequenceService.getDefaultPrefix('SALE')).toBe('INV');
    expect(SequenceService.getDefaultPrefix('PURCHASE')).toBe('PUR');
    expect(SequenceService.getDefaultPrefix('REPAIR')).toBe('REP');
    expect(SequenceService.getDefaultPrefix('TRADE_IN')).toBe('TRD');
    expect(SequenceService.getDefaultPrefix('PAYMENT')).toBe('PAY');
    expect(SequenceService.getDefaultPrefix('EXPENSE')).toBe('EXP');
    expect(SequenceService.getDefaultPrefix('JOURNAL')).toBe('JRN');
    expect(SequenceService.getDefaultPrefix('TRANSFER')).toBe('TRF');
    expect(SequenceService.getDefaultPrefix('BORROW')).toBe('BOR');
    expect(SequenceService.getDefaultPrefix('UNKNOWN')).toBe('DOC');
  });
});
