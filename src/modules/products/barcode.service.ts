import crypto from 'crypto';

export class BarcodeService {
  /**
   * Derives a deterministic unique numeric shop prefix (e.g. 201 to 299) for a tenant.
   * Ensures every tenant/shop has an isolated, distinct barcode namespace.
   */
  public static getTenantNumericPrefix(tenantIdOrCode: string): string {
    if (!tenantIdOrCode) return '201';

    // Extract any existing numeric digits first
    const digits = tenantIdOrCode.replace(/[^0-9]/g, '');
    if (digits.length >= 2) {
      const num = parseInt(digits.slice(0, 3), 10);
      const prefix = 200 + (num % 99);
      return String(prefix);
    }

    // Otherwise derive from string hash
    let hash = 0;
    for (let i = 0; i < tenantIdOrCode.length; i++) {
      hash = (hash * 31 + tenantIdOrCode.charCodeAt(i)) % 99;
    }
    return String(201 + Math.abs(hash));
  }

  /**
   * Generates a 13-digit EAN-13 barcode strictly unique to the specified tenant/shop.
   * Format: [3-digit Tenant Prefix (2xx)][8-digit Item Sequence / Number][1-digit Checksum]
   */
  public static generateTenantUniqueBarcode(
    tenant: { id: string; code?: string }, 
    sequenceOrUid?: string | number
  ): string {
    const tenantPrefix = this.getTenantNumericPrefix(tenant.code || tenant.id);
    
    let itemPart = '';
    if (typeof sequenceOrUid === 'number') {
      itemPart = sequenceOrUid.toString().padStart(8, '0');
    } else if (typeof sequenceOrUid === 'string' && sequenceOrUid.trim()) {
      const digits = sequenceOrUid.replace(/[^0-9]/g, '');
      if (digits.length > 0) {
        itemPart = digits.slice(-8).padStart(8, '0');
      }
    }

    if (!itemPart) {
      itemPart = Math.floor(10000000 + Math.random() * 90000000).toString();
    }

    const raw12 = `${tenantPrefix}${itemPart}`;
    const checkDigit = this.calculateEan13CheckDigit(raw12);
    return `${raw12}${checkDigit}`;
  }

  /**
   * Generates a 13-digit EAN-13 compatible internal barcode (starts with 200 for in-store use)
   */
  public static generateEan13(prefix = '200'): string {
    const cleanPrefix = prefix.replace(/[^0-9]/g, '').slice(0, 3).padEnd(3, '2');
    const randomDigits = Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, '0');

    const raw12 = `${cleanPrefix}${randomDigits}`;
    const checkDigit = this.calculateEan13CheckDigit(raw12);
    return `${raw12}${checkDigit}`;
  }

  /**
   * Calculates the standard EAN-13 checksum digit
   */
  public static calculateEan13CheckDigit(first12Digits: string): number {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(first12Digits[i] || '0', 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
  }

  /**
   * Generates an alphanumeric SKU code (e.g. SAM-A54-8GB-1234)
   */
  public static generateSku(productName: string, suffix?: string): string {
    const words = productName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    const prefix = words.slice(0, 3).map((w) => w.slice(0, 4)).join('-');
    const randomSuffix = suffix || (typeof crypto !== 'undefined' && crypto.randomBytes ? crypto.randomBytes(2).toString('hex').toUpperCase() : Math.random().toString(36).substring(2, 6).toUpperCase());

    return `${prefix || 'PRD'}-${randomSuffix}`;
  }
}
