import { describe, it, expect } from 'vitest';
import { StockCalcService } from '../../src/modules/inventory/stock-calc.service';

describe('StockCalcService Unit Tests', () => {
  it('should calculate accurate weighted average cost on new stock purchase', () => {
    // Current: 10 units @ 100 BDT, Inward: 10 units @ 120 BDT -> New Avg: (1000 + 1200) / 20 = 110.00 BDT
    const avg1 = StockCalcService.calculateWeightedAverageCost(10, 100, 10, 120);
    expect(avg1).toBe('110.00');

    // Current: 0 units @ 0 BDT, Inward: 5 units @ 500 BDT -> New Avg: 500.00 BDT
    const avg2 = StockCalcService.calculateWeightedAverageCost(0, 0, 5, 500);
    expect(avg2).toBe('500.00');

    // Current: 5 units @ 200 BDT, Inward: 15 units @ 160 BDT -> (1000 + 2400) / 20 = 170.00 BDT
    const avg3 = StockCalcService.calculateWeightedAverageCost(5, 200, 15, 160);
    expect(avg3).toBe('170.00');
  });

  it('should detect low stock alerts correctly', () => {
    // Current 3 <= Reorder 5 -> Low
    expect(StockCalcService.isLowStock(3, 5, 5)).toBe(true);

    // Current 10 > Reorder 5 -> Not Low
    expect(StockCalcService.isLowStock(10, 5, 5)).toBe(false);

    // Current 0 <= Reorder 5 -> Low
    expect(StockCalcService.isLowStock(0, 5, 5)).toBe(true);
  });

  it('should format quantities to 3-decimal precision', () => {
    expect(StockCalcService.formatQuantity(5)).toBe('5.000');
    expect(StockCalcService.formatQuantity(2.5)).toBe('2.500');
    expect(StockCalcService.formatQuantity(0.1234)).toBe('0.123');
  });
});
