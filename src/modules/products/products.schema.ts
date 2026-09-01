import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  unitId: z.string().optional(),
  businessCategoryId: z.string().optional(),
  trackingMode: z.enum([
    'TRACKING_NONE',
    'TRACKING_QUANTITY',
    'TRACKING_IMEI',
    'TRACKING_SERIAL',
    'TRACKING_BATCH',
    'TRACKING_WEIGHT',
    'TRACKING_BOOK',
  ]).default('TRACKING_QUANTITY'),
  costPrice: z.string().default('0.00'),
  sellingPrice: z.string().min(1, 'Selling price is required'),
  minSellingPrice: z.string().optional(),
  taxRate: z.string().default('0.00'),
  reorderLevel: z.string().default('5.000'),
  alertQty: z.string().default('5.000'),
  warrantyMonths: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
  variants: z.array(
    z.object({
      name: z.string().min(1, 'Variant name is required'),
      sku: z.string().optional(),
      barcode: z.string().optional(),
      costPrice: z.string().optional(),
      sellingPrice: z.string().optional(),
      attributes: z.record(z.unknown()).optional(),
    })
  ).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  unitId: z.string().optional(),
  trackingMode: z.string().optional(),
  costPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  minSellingPrice: z.string().optional(),
  taxRate: z.string().optional(),
  reorderLevel: z.string().optional(),
  alertQty: z.string().optional(),
  warrantyMonths: z.string().optional(),
  isActive: z.boolean().optional(),
  attributes: z.record(z.unknown()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const queryProductsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  trackingMode: z.string().optional(),
  businessCategoryId: z.string().optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  code: z.string().optional(),
  businessCategoryId: z.string().optional(),
  icon: z.string().optional(),
  badgeColor: z.string().optional(),
});

export const createBrandSchema = z.object({
  name: z.string().min(2, 'Brand name is required'),
  code: z.string().optional(),
});

export const createUnitSchema = z.object({
  name: z.string().min(2, 'Unit name is required'),
  code: z.string().min(1, 'Unit code is required'),
  symbol: z.string().min(1, 'Unit symbol is required'),
  allowDecimal: z.boolean().optional(),
});
