import { describe, it, expect } from 'vitest';
import { BarcodeService } from '../../src/modules/products/barcode.service';

describe('BarcodeService Unit Tests', () => {
  it('should calculate accurate EAN-13 check digits', () => {
    // Standard test barcodes
    const check1 = BarcodeService.calculateEan13CheckDigit('400638133393');
    expect(check1).toBe(1);

    const check2 = BarcodeService.calculateEan13CheckDigit('890103038345');
    expect(check2).toBe(8);
  });

  it('should generate 13-digit EAN-13 barcodes with valid checksum', () => {
    const code = BarcodeService.generateEan13('200');
    expect(code).toHaveLength(13);
    expect(code.startsWith('200')).toBe(true);

    const checkDigit = parseInt(code[12] || '0', 10);
    const calculated = BarcodeService.calculateEan13CheckDigit(code.slice(0, 12));
    expect(checkDigit).toBe(calculated);
  });

  it('should generate clean, readable SKUs from product names', () => {
    const sku = BarcodeService.generateSku('Samsung Galaxy A54 5G 8GB/128GB');
    expect(sku).toBeDefined();
    expect(sku.startsWith('SAMS-GALA-A54')).toBe(true);
  });
});
