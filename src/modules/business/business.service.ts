import { eq, and, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import {
  businessCategories,
  modules,
  businessCategoryModules,
  tenantBusinessCategories,
  tenantModules,
  customFieldDefinitions,
  customFieldValues,
} from '../../db/schema/business';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export interface CreateCustomFieldInput {
  tenantId: string;
  businessCategoryId?: string;
  entityType: string; // PRODUCT, CUSTOMER, SUPPLIER, SALE, REPAIR
  fieldName: string;
  fieldKey: string;
  fieldType: string; // TEXT, NUMBER, BOOLEAN, DATE, SELECT, JSON
  options?: string[];
  isRequired?: boolean;
  isSearchable?: boolean;
  showInPos?: boolean;
  showInPrint?: boolean;
  displayOrder?: number;
}

export class BusinessService {
  /**
   * Retrieves all supported global business categories
   */
  public static async getAllCategories() {
    return db.query.businessCategories.findMany({
      where: eq(businessCategories.isActive, true),
    });
  }

  /**
   * Retrieves all system and optional modules
   */
  public static async getAllModules() {
    return db.query.modules.findMany({
      where: eq(modules.isActive, true),
    });
  }

  /**
   * Retrieves all active business categories for a tenant
   */
  public static async getTenantCategories(tenantId: string) {
    const tenantCats = (await db.query.tenantBusinessCategories.findMany({
      where: and(
        eq(tenantBusinessCategories.tenantId, tenantId),
        eq(tenantBusinessCategories.isActive, true)
      ),
    })) as any[];

    if (tenantCats.length === 0) return [];

    const catIds = tenantCats.map((tc) => tc.businessCategoryId);
    const catList = (await db.query.businessCategories.findMany({
      where: inArray(businessCategories.id, catIds),
    })) as any[];

    return tenantCats.map((tc) => {
      const details = catList.find((c) => c.id === tc.businessCategoryId);
      return {
        ...tc,
        category: details || null,
      };
    });
  }

  /**
   * Enables a business category for a tenant and automatically activates its default modules
   */
  public static async enableTenantCategory(
    tenantId: string,
    categoryId: string,
    isPrimary = false
  ) {
    const category = await db.query.businessCategories.findFirst({
      where: eq(businessCategories.id, categoryId),
    });

    if (!category) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Business category not found', 404);
    }

    const mappingId = `tbc-${tenantId}-${categoryId}`;

    // Upsert tenant business category
    await db
      .insert(tenantBusinessCategories)
      .values({
        id: mappingId,
        tenantId,
        businessCategoryId: categoryId,
        isPrimary,
        isActive: true,
      } as any)
      .onConflictDoUpdate({
        target: [tenantBusinessCategories.tenantId, tenantBusinessCategories.businessCategoryId],
        set: { isActive: true, isPrimary } as any,
      });

    // Auto-enable default modules mapped to this category
    const categoryModules = (await db.query.businessCategoryModules.findMany({
      where: and(
        eq(businessCategoryModules.businessCategoryId, categoryId),
        eq(businessCategoryModules.enabledByDefault, true)
      ),
    })) as any[];

    for (const cm of categoryModules) {
      await this.enableTenantModule(tenantId, cm.moduleId);
    }

    return { enabled: true, categoryId };
  }

  /**
   * Disables a business category for a tenant
   */
  public static async disableTenantCategory(tenantId: string, categoryId: string) {
    await db
      .update(tenantBusinessCategories)
      .set({ isActive: false } as any)
      .where(
        and(
          eq(tenantBusinessCategories.tenantId, tenantId),
          eq(tenantBusinessCategories.businessCategoryId, categoryId)
        )
      );

    return { disabled: true, categoryId };
  }

  /**
   * Retrieves all enabled modules for a tenant (combines tenant_modules and active category modules)
   */
  public static async getTenantEnabledModules(tenantId: string): Promise<string[]> {
    // 1. Fetch explicitly enabled tenant modules
    const directModules = (await db.query.tenantModules.findMany({
      where: and(eq(tenantModules.tenantId, tenantId), eq(tenantModules.isEnabled, true)),
    })) as any[];

    const directModIds = directModules.map((m) => m.moduleId);

    // 2. Fetch modules enabled by tenant's active categories
    const activeCats = (await db.query.tenantBusinessCategories.findMany({
      where: and(
        eq(tenantBusinessCategories.tenantId, tenantId),
        eq(tenantBusinessCategories.isActive, true)
      ),
    })) as any[];

    let catModIds: string[] = [];
    if (activeCats.length > 0) {
      const catIds = activeCats.map((c) => c.businessCategoryId);
      const catModules = (await db.query.businessCategoryModules.findMany({
        where: inArray(businessCategoryModules.businessCategoryId, catIds),
      })) as any[];
      catModIds = catModules.map((cm) => cm.moduleId);
    }

    const allModIds = [...new Set([...directModIds, ...catModIds])];

    if (allModIds.length === 0) {
      // Return core modules by default
      const coreMods = (await db.query.modules.findMany({
        where: eq(modules.isCore, true),
      })) as any[];
      return coreMods.map((m) => String(m.code));
    }

    const enabledModRecords = (await db.query.modules.findMany({
      where: inArray(modules.id, allModIds),
    })) as any[];

    // Also include all core modules
    const coreModRecords = (await db.query.modules.findMany({
      where: eq(modules.isCore, true),
    })) as any[];

    const combinedCodes = [
      ...enabledModRecords.map((m) => String(m.code)),
      ...coreModRecords.map((m) => String(m.code)),
    ];

    return [...new Set(combinedCodes)];
  }

  /**
   * Enables or disables a specific module for a tenant
   */
  public static async toggleTenantModule(tenantId: string, moduleId: string, isEnabled: boolean) {
    const mod = await db.query.modules.findFirst({ where: eq(modules.id, moduleId) });
    if (!mod) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Module not found', 404);
    }

    const mappingId = `tm-${tenantId}-${moduleId}`;

    await db
      .insert(tenantModules)
      .values({
        id: mappingId,
        tenantId,
        moduleId,
        isEnabled,
      } as any)
      .onConflictDoUpdate({
        target: [tenantModules.tenantId, tenantModules.moduleId],
        set: { isEnabled } as any,
      });

    return { moduleId, isEnabled };
  }

  public static async enableTenantModule(tenantId: string, moduleId: string) {
    return this.toggleTenantModule(tenantId, moduleId, true);
  }

  public static async disableTenantModule(tenantId: string, moduleId: string) {
    return this.toggleTenantModule(tenantId, moduleId, false);
  }

  /**
   * Checks if a specific module is enabled for a tenant
   */
  public static async isModuleEnabled(tenantId: string, moduleCode: string): Promise<boolean> {
    const enabledModules = await this.getTenantEnabledModules(tenantId);
    return enabledModules.includes(moduleCode.toUpperCase());
  }

  /**
   * CUSTOM FIELDS: Define a new custom field for an entity
   */
  public static async createCustomFieldDefinition(input: CreateCustomFieldInput) {
    const fieldId = `cfd-${crypto.randomUUID()}`;

    const [newDef] = await db
      .insert(customFieldDefinitions)
      .values({
        id: fieldId,
        tenantId: input.tenantId,
        businessCategoryId: input.businessCategoryId || null,
        entityType: input.entityType.toUpperCase(),
        name: input.fieldName,
        code: input.fieldKey.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        fieldType: input.fieldType.toUpperCase(),
        options: input.options || [],
        isRequired: input.isRequired || false,
        sortOrder: input.displayOrder || 0,
      } as any)
      .returning();

    return newDef;
  }

  /**
   * CUSTOM FIELDS: Retrieves custom field definitions for a tenant and entity type
   */
  public static async getCustomFieldDefinitions(tenantId: string, entityType: string) {
    return db.query.customFieldDefinitions.findMany({
      where: and(
        eq(customFieldDefinitions.tenantId, tenantId),
        eq(customFieldDefinitions.entityType, entityType.toUpperCase())
      ),
    });
  }

  /**
   * CUSTOM FIELDS: Save custom field values for an entity instance
   */
  public static async saveCustomFieldValues(
    tenantId: string,
    entityType: string,
    entityId: string,
    valuesMap: Record<string, unknown>
  ) {
    const definitions = (await this.getCustomFieldDefinitions(tenantId, entityType)) as any[];

    for (const [key, val] of Object.entries(valuesMap)) {
      const def = definitions.find((d) => d.code === key || d.id === key);
      if (!def) continue;

      const valId = `cfv-${tenantId}-${def.id}-${entityId}`;
      const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');

      await db
        .insert(customFieldValues)
        .values({
          id: valId,
          tenantId,
          customFieldId: def.id,
          entityId,
          valueText: valStr,
          valueJson: typeof val === 'object' ? val : null,
        } as any)
        .onConflictDoUpdate({
          target: [customFieldValues.entityId, customFieldValues.customFieldId],
          set: {
            valueText: valStr,
            valueJson: typeof val === 'object' ? val : null,
            updatedAt: new Date(),
          } as any,
        });
    }
  }

  /**
   * CUSTOM FIELDS: Fetch custom field values for an entity instance
   */
  public static async getCustomFieldValues(tenantId: string, entityId: string) {
    const vals = (await db.query.customFieldValues.findMany({
      where: and(
        eq(customFieldValues.tenantId, tenantId),
        eq(customFieldValues.entityId, entityId)
      ),
    })) as any[];

    const result: Record<string, unknown> = {};
    for (const v of vals) {
      const def = (await db.query.customFieldDefinitions.findFirst({
        where: eq(customFieldDefinitions.id, v.customFieldId),
      })) as any;
      if (def) {
        result[def.code] = v.valueJson || v.valueText;
      }
    }
    return result;
  }
}
