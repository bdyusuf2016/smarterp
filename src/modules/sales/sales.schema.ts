import { z } from 'zod';

export const createSaleSchema = z.object({
  branchId: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().default('Cash Customer'),
  customerPhone: z.string().optional(),
  saleDate: z.string().datetime().optional().transform((d) => (d ? new Date(d) : undefined)),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  notes: z.string().optional(),
  cashierName: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      variantId: z.string().optional(),
      deviceId: z.string().optional(),
      batchId: z.string().optional(),
      bookCopyId: z.string().optional(),
      quantity: z.number().positive('Quantity must be greater than zero'),
      unitPrice: z.number().min(0, 'Unit price must be zero or positive'),
      discount: z.number().min(0).optional(),
      taxRate: z.number().min(0).optional(),
      imei: z.string().optional(),
      warrantyText: z.string().optional(),
    })
  ).min(1, 'Sale must contain at least one item'),
  payments: z.array(
    z.object({
      paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CARD', 'DUE', 'OTHER']),
      amount: z.number().min(0, 'Payment amount cannot be negative'),
      transactionNo: z.string().optional(),
      accountId: z.string().optional(),
      notes: z.string().optional(),
    })
  ).min(1, 'At least one payment method is required'),
});

export const querySalesSchema = z.object({
  branchId: z.string().optional(),
  customerId: z.string().optional(),
  cashierId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export const createSaleReturnSchema = z.object({
  branchId: z.string().optional(),
  saleId: z.string().min(1, 'Original Sale ID is required'),
  refundAmount: z.number().min(0).optional(),
  reason: z.string().optional(),
  items: z.array(
    z.object({
      saleItemId: z.string().min(1, 'Sale Item ID is required'),
      productId: z.string().min(1, 'Product ID is required'),
      variantId: z.string().optional(),
      deviceId: z.string().optional(),
      batchId: z.string().optional(),
      quantity: z.number().positive('Quantity must be positive'),
      unitPrice: z.number().min(0),
      restockItem: z.boolean().optional(),
    })
  ).min(1, 'Return must contain at least one item'),
});

export const parkCartSchema = z.object({
  branchId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      variantId: z.string().optional(),
      quantity: z.number().positive(),
      unitPrice: z.number().min(0),
      discount: z.number().optional(),
      taxRate: z.number().optional(),
      imei: z.string().optional(),
      warrantyText: z.string().optional(),
    })
  ).min(1, 'Cart must contain at least one item'),
});
