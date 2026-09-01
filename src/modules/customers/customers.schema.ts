import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  phone: z.string().min(6, 'Valid phone number is required'),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  creditLimit: z.string().optional(),
  openingDue: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  creditLimit: z.string().optional(),
  isActive: z.boolean().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const queryCustomersSchema = z.object({
  search: z.string().optional(),
  dueOnly: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export const collectDueSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CHEQUE']).default('CASH'),
  branchId: z.string().optional(),
  notes: z.string().optional(),
});
