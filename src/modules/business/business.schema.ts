import { z } from 'zod';

export const enableCategorySchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  isPrimary: z.boolean().optional(),
});

export const toggleModuleSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  isEnabled: z.boolean(),
});

export const createCustomFieldSchema = z.object({
  entityType: z.enum(['PRODUCT', 'CUSTOMER', 'SUPPLIER', 'SALE', 'REPAIR']),
  fieldName: z.string().min(2, 'Field name must be at least 2 characters'),
  fieldKey: z.string().min(2, 'Field key must be at least 2 characters'),
  fieldType: z.enum(['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT', 'JSON']),
  businessCategoryId: z.string().optional(),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  isSearchable: z.boolean().optional(),
  showInPos: z.boolean().optional(),
  showInPrint: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export const saveCustomFieldValuesSchema = z.object({
  entityType: z.enum(['PRODUCT', 'CUSTOMER', 'SUPPLIER', 'SALE', 'REPAIR']),
  entityId: z.string().min(1, 'Entity ID is required'),
  values: z.record(z.unknown()),
});
