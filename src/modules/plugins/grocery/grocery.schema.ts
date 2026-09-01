import { z } from 'zod';

export const createBatchSchema = z.object({
  branchId: z.string().optional(),
  productId: z.string().min(1, 'Product ID is required'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  quantity: z.number().positive('Quantity must be positive'),
  mfgDate: z.string().datetime().transform((d) => new Date(d)),
  expiryDate: z.string().datetime().transform((d) => new Date(d)),
  costPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  supplierId: z.string().optional(),
});

export const parseScaleBarcodeSchema = z.object({
  barcode: z.string().min(6, 'Barcode is required'),
});
