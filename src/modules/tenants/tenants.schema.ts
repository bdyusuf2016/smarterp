import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Tenant name must be at least 2 characters'),
  code: z.string().min(2, 'Tenant code must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name is required'),
  phone: z.string().min(6, 'Valid phone number is required'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6).optional(),
  currency: z.string().default('BDT'),
  currencySymbol: z.string().default('৳'),
  address: z.string().optional(),
  planType: z.string().default('pro'),
  primaryCategoryId: z.string().min(1, 'Primary business category is required'),
  secondaryCategoryIds: z.array(z.string()).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
});

export const updateSettingsSchema = z.object({
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  defaultTaxRate: z.string().optional(),
  defaultWarrantyMonths: z.number().int().min(0).optional(),
  allowNegativeInventory: z.boolean().optional(),
  autoFocusScanner: z.boolean().optional(),
  theme: z.string().optional(),
  language: z.string().optional(),
  customJson: z.record(z.unknown()).optional(),
});

export const createBranchSchema = z.object({
  code: z.string().min(2, 'Branch code is required'),
  name: z.string().min(2, 'Branch name is required'),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  isMain: z.boolean().optional(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});
