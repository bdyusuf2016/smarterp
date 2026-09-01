import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string().min(2, 'Location name is required'),
  code: z.string().optional(),
  branchId: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const adjustStockSchema = z.object({
  branchId: z.string().optional(),
  locationId: z.string().optional(),
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantityDelta: z.number({ required_error: 'Quantity delta is required' }),
  transactionType: z.enum([
    'OPENING',
    'PURCHASE',
    'SALE',
    'SALE_RETURN',
    'PURCHASE_RETURN',
    'ADJUSTMENT',
    'DAMAGE',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'REPAIR_USAGE',
    'TRADE_IN',
  ]),
  unitCost: z.number().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export const queryStockSchema = z.object({
  branchId: z.string().optional(),
  locationId: z.string().optional(),
  search: z.string().optional(),
  lowStockOnly: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export const queryTransactionsSchema = z.object({
  branchId: z.string().optional(),
  productId: z.string().optional(),
  transactionType: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export const createTransferSchema = z.object({
  fromBranchId: z.string().min(1, 'Source branch ID is required'),
  toBranchId: z.string().min(1, 'Destination branch ID is required'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      variantId: z.string().optional(),
      quantity: z.number().positive('Quantity must be greater than 0'),
      costPrice: z.number().optional(),
    })
  ).min(1, 'At least one item is required for transfer'),
});
