import { eq, and, desc, count, sql, lte } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../../config/database';
import { productBatches } from '../../../db/schema/grocery';
import { products } from '../../../db/schema/products';
import { AppError } from '../../../shared/errors/app-error';
import { ErrorCodes } from '../../../shared/errors/error-codes';

export interface CreateBatchInput {
  tenantId: string;
  branchId?: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  mfgDate: Date;
  expiryDate: Date;
  costPrice?: string;
  sellingPrice?: string;
  supplierId?: string;
}

export class GroceryService {
  /**
   * Registers a new product batch with manufacturing and expiry dates
   */
  public static async createBatch(input: CreateBatchInput) {
    const cleanBatchNo = input.batchNumber.trim().toUpperCase();

    // Check duplicate batch number for same product
    const existing = await db.query.productBatches.findFirst({
      where: and(
        eq(productBatches.tenantId, input.tenantId),
        eq(productBatches.productId, input.productId),
        eq(productBatches.batchNumber, cleanBatchNo)
      ),
    });

    if (existing) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Batch '${cleanBatchNo}' already exists for this product`,
        400
      );
    }

    const batchId = `pb-${crypto.randomUUID().slice(0, 10)}`;

    const [newBatch] = await db
      .insert(productBatches)
      .values({
        id: batchId,
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        productId: input.productId,
        batchNumber: cleanBatchNo,
        quantity: input.quantity.toFixed(3),
        mfgDate: input.mfgDate,
        expiryDate: input.expiryDate,
        costPrice: input.costPrice || '0.00',
        sellingPrice: input.sellingPrice || '0.00',
        supplierId: input.supplierId || null,
        status: 'ACTIVE',
      } as any)
      .returning();

    return newBatch;
  }

  /**
   * Retrieves batches for product or list of expiring batches
   */
  public static async getBatches(tenantId: string, filters: { productId?: string; branchId?: string; expiringDays?: number } = {}) {
    const conditions = [eq(productBatches.tenantId, tenantId)];

    if (filters.productId) {
      conditions.push(eq(productBatches.productId, filters.productId));
    }
    if (filters.branchId) {
      conditions.push(eq(productBatches.branchId, filters.branchId));
    }
    if (filters.expiringDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + filters.expiringDays);
      conditions.push(lte(productBatches.expiryDate, targetDate));
    }

    return db.query.productBatches.findMany({
      where: and(...conditions),
      orderBy: [desc(productBatches.expiryDate)],
    });
  }

  /**
   * Electronic Weigh-Scale Barcode Parser:
   * Standard In-Store Scale Barcode Pattern: 20 [5-digit SKU/PLU] [5-digit Weight in Grams or Price in Cents] [Checksum]
   * Example: '2000105012503' -> SKU Prefix: '00105', Weight: 1.250 kg (1250g)
   */
  public static parseWeighScaleBarcode(barcode: string): { isScaleBarcode: boolean; itemCode?: string; weightKg?: number; price?: number } {
    const clean = barcode.trim();
    if (clean.length === 13 && (clean.startsWith('20') || clean.startsWith('21') || clean.startsWith('02'))) {
      const itemCode = clean.slice(2, 7); // 5-digit PLU
      const valuePart = parseInt(clean.slice(7, 12), 10); // 5-digit quantity or price

      // By standard default, 20/02 prefix represents weight in grams (e.g. 1250 = 1.250 kg)
      const weightKg = valuePart / 1000;

      return {
        isScaleBarcode: true,
        itemCode,
        weightKg,
      };
    }

    return { isScaleBarcode: false };
  }
}
