import { describe, it, expect } from 'vitest';
import { GroceryService } from '../../src/modules/plugins/grocery/grocery.service';

describe('Plugins Unit Tests Suite', () => {
  describe('Grocery Weigh-Scale Barcode Parser', () => {
    it('should accurately parse in-store weigh-scale barcode into itemCode and weight in kg', () => {
      // 20 [00105: SKU] [01250: 1.250 kg] [3: Checksum]
      const parsed = GroceryService.parseWeighScaleBarcode('2000105012503');
      expect(parsed.isScaleBarcode).toBe(true);
      expect(parsed.itemCode).toBe('00105');
      expect(parsed.weightKg).toBe(1.25);
    });

    it('should ignore regular standard commercial barcodes', () => {
      const parsed = GroceryService.parseWeighScaleBarcode('8901030383458');
      expect(parsed.isScaleBarcode).toBe(false);
    });
  });
});
