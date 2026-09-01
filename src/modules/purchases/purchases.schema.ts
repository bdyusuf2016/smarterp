import { z } from 'zod';

export const createPurchaseSchema = z.object({
  branchId: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  supplierInvoiceNo: z.string().optional(),
  purchaseDate: z.string().datetime().optional().transform((d) => (d ? new Date(d) : undefined)),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'BANK', 'BKASH', 'NAGAD', 'ROCKET', 'CHEQUE']).default('CASH'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      variantId: z.string().optional(),
      quantity: z.number().positive('Quantity must be greater than zero'),
      unitPrice: z.number().min(0, 'Unit price must be zero or positive'),
      taxRate: z.number().min(0).optional(),
    })
  ).min(1, 'Purchase must contain at least one item'),
});

export const queryPurchasesSchema = z.object({
  branchId: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export const createPurchaseReturnSchema = z.object({
  branchId: z.string().optional(),
  purchaseId: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  refundAmount: z.number().min(0).optional(),
  reason: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      variantId: z.string().optional(),
      quantity: z.number().positive('Quantity must be positive'),
      unitPrice: z.number().min(0),
    })
  ).min(1, 'Return must contain at least one item'),
});
