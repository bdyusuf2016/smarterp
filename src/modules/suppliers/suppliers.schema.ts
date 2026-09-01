import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().min(6, 'Valid phone number is required'),
  email: z.string().email().optional(),
  address: z.string().optional(),
  openingPayable: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(2).optional(),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const querySuppliersSchema = z.object({
  search: z.string().optional(),
  payableOnly: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export const paySupplierSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CHEQUE']).default('CASH'),
  branchId: z.string().optional(),
  notes: z.string().optional(),
});
