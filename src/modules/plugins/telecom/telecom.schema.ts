import { z } from 'zod';

export const registerDeviceSchema = z.object({
  branchId: z.string().optional(),
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  imei1: z.string().min(6, 'IMEI 1 is required'),
  imei2: z.string().optional(),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  storage: z.string().optional(),
  batteryHealth: z.number().int().min(0).max(100).optional(),
  costPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  warrantyMonths: z.number().int().min(0).optional(),
  condition: z.enum(['NEW', 'USED', 'REFURBISHED', 'DEFECTIVE']).default('NEW'),
  notes: z.string().optional(),
});

export const createRepairJobSchema = z.object({
  branchId: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().min(2, 'Customer name is required'),
  customerPhone: z.string().min(6, 'Customer phone is required'),
  deviceModel: z.string().min(2, 'Device model is required'),
  imei: z.string().optional(),
  passcode: z.string().optional(),
  problemDescription: z.string().min(3, 'Problem description is required'),
  diagnosticNotes: z.string().optional(),
  estimatedCost: z.string().optional(),
  advancePaid: z.string().optional(),
  technicianId: z.string().optional(),
  expectedDeliveryDate: z.string().datetime().optional().transform((d) => (d ? new Date(d) : undefined)),
});

export const updateRepairStatusSchema = z.object({
  status: z.enum([
    'RECEIVED',
    'DIAGNOSING',
    'WAITING_APPROVAL',
    'WAITING_PARTS',
    'IN_REPAIR',
    'READY',
    'DELIVERED',
    'CANCELLED',
  ]),
  notes: z.string().optional(),
});

export const createTradeInSchema = z.object({
  branchId: z.string().optional(),
  customerId: z.string().optional(),
  sellerName: z.string().min(2, 'Seller name is required'),
  sellerPhone: z.string().min(6, 'Seller phone is required'),
  sellerNid: z.string().min(6, 'Seller National ID is required'),
  deviceModel: z.string().min(2, 'Device model is required'),
  imei1: z.string().min(6, 'IMEI 1 is required'),
  imei2: z.string().optional(),
  condition: z.enum(['LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).default('GOOD'),
  evaluationNotes: z.string().optional(),
  valuationAmount: z.string().min(1, 'Valuation amount is required'),
  purchasePrice: z.string().optional(),
  targetSellingPrice: z.string().optional(),
});

export const recordRechargeSchema = z.object({
  branchId: z.string().optional(),
  operator: z.enum(['GP', 'ROBI', 'BANGLALINK', 'TELETALK', 'BKASH', 'NAGAD', 'ROCKET']),
  serviceType: z.enum(['FLEXILOAD', 'CASH_IN', 'CASH_OUT', 'BILL_PAY']).default('FLEXILOAD'),
  recipientPhone: z.string().min(6, 'Recipient phone number is required'),
  amount: z.number().positive('Amount must be positive'),
  commission: z.number().min(0).optional(),
});
