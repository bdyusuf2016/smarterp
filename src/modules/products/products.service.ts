import { eq, and, or, ilike, count, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import {
  products,
  productVariants,
  productCategories,
  brands,
  units,
} from '../../db/schema/products';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { BarcodeService } from './barcode.service';
import { BusinessService } from '../business/business.service';

export interface CreateVariantInput {
  name: string;
  sku?: string;
  barcode?: string;
  costPrice?: string;
  sellingPrice?: string;
  attributes?: Record<string, unknown>;
}

export interface CreateProductInput {
  tenantId: string;
  businessCategoryId?: string;
  categoryId?: string;
  brandId?: string;
  unitId?: string;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  trackingMode?: string; // TRACKING_NONE, TRACKING_QUANTITY, TRACKING_IMEI, TRACKING_SERIAL, TRACKING_BATCH, TRACKING_WEIGHT, TRACKING_BOOK
  costPrice?: string;
  sellingPrice: string;
  minSellingPrice?: string;
  taxRate?: string;
  reorderLevel?: string;
  alertQty?: string;
  warrantyMonths?: string;
  attributes?: Record<string, unknown>;
  variants?: CreateVariantInput[];
  customFields?: Record<string, unknown>;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  trackingMode?: string;
  businessCategoryId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class ProductsService {
  /**
   * Creates a new base product and its variants with automatic barcode/SKU generation and custom fields
   */
  public static async createProduct(input: CreateProductInput) {
    const productId = `prod-${crypto.randomUUID().slice(0, 10)}`;

    const sku = input.sku?.trim() || BarcodeService.generateSku(input.name);
    const barcode = input.barcode?.trim() || BarcodeService.generateEan13();

    // 1. Verify SKU uniqueness for tenant
    const existingSku = await db.query.products.findFirst({
      where: and(eq(products.tenantId, input.tenantId), eq(products.sku, sku)),
    });
    if (existingSku) {
      throw new AppError(
        ErrorCodes.PRODUCT_SKU_EXISTS,
        `A product with SKU '${sku}' already exists in your inventory`,
        400
      );
    }

    // 2. Verify Barcode uniqueness for tenant
    const existingBarcode = await db.query.products.findFirst({
      where: and(eq(products.tenantId, input.tenantId), eq(products.barcode, barcode)),
    });
    if (existingBarcode) {
      throw new AppError(
        ErrorCodes.PRODUCT_BARCODE_EXISTS,
        `A product with Barcode '${barcode}' already exists in your inventory`,
        400
      );
    }

    // 3. Insert Product
    const [newProduct] = await db
      .insert(products)
      .values({
        id: productId,
        tenantId: input.tenantId,
        businessCategoryId: input.businessCategoryId || null,
        categoryId: input.categoryId || null,
        brandId: input.brandId || null,
        unitId: input.unitId || null,
        name: input.name.trim(),
        sku,
        barcode,
        description: input.description || '',
        trackingMode: input.trackingMode || 'TRACKING_QUANTITY',
        costPrice: input.costPrice || '0.00',
        sellingPrice: input.sellingPrice,
        minSellingPrice: input.minSellingPrice || input.sellingPrice,
        taxRate: input.taxRate || '0.00',
        reorderLevel: input.reorderLevel || '5.000',
        alertQty: input.alertQty || '5.000',
        warrantyMonths: input.warrantyMonths || '',
        attributes: input.attributes || {},
        isActive: true,
      } as any)
      .returning();

    // 4. Create Product Variants
    const createdVariants: any[] = [];
    if (input.variants && input.variants.length > 0) {
      for (const [idx, v] of input.variants.entries()) {
        const vId = `var-${productId}-${idx + 1}`;
        const vSku = v.sku?.trim() || `${sku}-V${idx + 1}`;
        const vBarcode = v.barcode?.trim() || BarcodeService.generateEan13();

        const [createdV] = await db
          .insert(productVariants)
          .values({
            id: vId,
            tenantId: input.tenantId,
            productId,
            name: v.name,
            sku: vSku,
            barcode: vBarcode,
            costPrice: v.costPrice || input.costPrice || '0.00',
            sellingPrice: v.sellingPrice || input.sellingPrice,
            attributes: v.attributes || {},
            isActive: true,
          } as any)
          .returning();

        createdVariants.push(createdV);
      }
    } else {
      // Default single variant representing standard product
      const defaultVarId = `var-${productId}-default`;
      const [defaultVar] = await db
        .insert(productVariants)
        .values({
          id: defaultVarId,
          tenantId: input.tenantId,
          productId,
          name: 'Standard',
          sku,
          barcode,
          costPrice: input.costPrice || '0.00',
          sellingPrice: input.sellingPrice,
          attributes: {},
          isActive: true,
        } as any)
        .returning();

      createdVariants.push(defaultVar);
    }

    // 5. Save Custom Field Values if provided
    if (input.customFields && Object.keys(input.customFields).length > 0) {
      await BusinessService.saveCustomFieldValues(
        input.tenantId,
        'PRODUCT',
        productId,
        input.customFields
      );
    }

    return {
      ...newProduct,
      variants: createdVariants,
      customFields: input.customFields || {},
    };
  }

  /**
   * Retrieves paginated list of products matching search & filtering criteria
   */
  public static async getProducts(tenantId: string, filters: ProductFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [eq(products.tenantId, tenantId)];

    if (filters.isActive !== undefined) {
      conditions.push(eq(products.isActive, filters.isActive));
    }
    if (filters.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters.brandId) {
      conditions.push(eq(products.brandId, filters.brandId));
    }
    if (filters.trackingMode) {
      conditions.push(eq(products.trackingMode, filters.trackingMode));
    }
    if (filters.businessCategoryId) {
      conditions.push(eq(products.businessCategoryId, filters.businessCategoryId));
    }
    if (filters.search) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(products.name, q),
          ilike(products.sku, q),
          ilike(products.barcode, q)
        )!
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [items, totalResult] = await Promise.all([
      db.query.products.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (p, { desc }) => [desc(p.createdAt)],
      }),
      db.select({ count: count() }).from(products).where(whereClause),
    ]);

    const totalCount = Number(totalResult[0]?.count || 0);

    // Attach variants for each product
    const productIds = items.map((p) => p.id);
    const allVariants = productIds.length > 0
      ? await db.query.productVariants.findMany({
          where: inArray(productVariants.productId, productIds),
        })
      : [];

    const enriched = items.map((p) => ({
      ...p,
      variants: allVariants.filter((v) => v.productId === p.id),
    }));

    return {
      items: enriched,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Retrieves single product by ID with category, brand, unit, variants and custom field values
   */
  public static async getProductById(productId: string, tenantId: string) {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.tenantId, tenantId)),
    });

    if (!product) {
      throw new AppError(ErrorCodes.PRODUCT_NOT_FOUND, 'Product not found', 404);
    }

    const [variantsList, category, brand, unit, customFields] = await Promise.all([
      db.query.productVariants.findMany({
        where: eq(productVariants.productId, productId),
      }),
      product.categoryId
        ? db.query.productCategories.findFirst({ where: eq(productCategories.id, product.categoryId) })
        : null,
      product.brandId
        ? db.query.brands.findFirst({ where: eq(brands.id, product.brandId) })
        : null,
      product.unitId
        ? db.query.units.findFirst({ where: eq(units.id, product.unitId) })
        : null,
      BusinessService.getCustomFieldValues(tenantId, productId),
    ]);

    return {
      ...product,
      category,
      brand,
      unit,
      variants: variantsList,
      customFields,
    };
  }

  /**
   * Updates an existing product
   */
  public static async updateProduct(
    productId: string,
    tenantId: string,
    updates: Partial<typeof products.$inferInsert>,
    customFields?: Record<string, unknown>
  ) {
    const existing = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.tenantId, tenantId)),
    });

    if (!existing) {
      throw new AppError(ErrorCodes.PRODUCT_NOT_FOUND, 'Product not found', 404);
    }

    const [updated] = await db
      .update(products)
      .set({
        ...updates,
        updatedAt: new Date(),
      } as any)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .returning();

    if (customFields && Object.keys(customFields).length > 0) {
      await BusinessService.saveCustomFieldValues(tenantId, 'PRODUCT', productId, customFields);
    }

    return updated;
  }

  /**
   * Deactivates/Soft deletes a product
   */
  public static async deleteProduct(productId: string, tenantId: string) {
    const existing = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.tenantId, tenantId)),
    });

    if (!existing) {
      throw new AppError(ErrorCodes.PRODUCT_NOT_FOUND, 'Product not found', 404);
    }

    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() } as any)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));

    return { deleted: true, productId };
  }

  /**
   * Fast Barcode / SKU Scanner Lookup across products and product variants
   */
  public static async findByBarcodeOrSku(tenantId: string, code: string) {
    const cleanCode = code.trim();

    // 1. Check direct product barcode/sku
    const directProduct = await db.query.products.findFirst({
      where: and(
        eq(products.tenantId, tenantId),
        eq(products.isActive, true),
        or(eq(products.barcode, cleanCode), eq(products.sku, cleanCode))
      ),
    });

    if (directProduct) {
      const variantsList = await db.query.productVariants.findMany({
        where: eq(productVariants.productId, directProduct.id),
      });
      return {
        product: directProduct,
        variant: variantsList[0] || null,
      };
    }

    // 2. Check variant barcode/sku
    const variant = await db.query.productVariants.findFirst({
      where: and(
        eq(productVariants.tenantId, tenantId),
        eq(productVariants.isActive, true),
        or(eq(productVariants.barcode, cleanCode), eq(productVariants.sku, cleanCode))
      ),
    });

    if (variant) {
      const parentProduct = await db.query.products.findFirst({
        where: eq(products.id, variant.productId),
      });
      return {
        product: parentProduct || null,
        variant,
      };
    }

    throw new AppError(
      ErrorCodes.PRODUCT_NOT_FOUND,
      `No product or variant found matching code '${cleanCode}'`,
      404
    );
  }

  // ==========================================
  // CATEGORIES, BRANDS, UNITS HELPERS
  // ==========================================

  public static async getCategories(tenantId: string, businessCategoryId?: string) {
    return db.query.productCategories.findMany({
      where: and(
        eq(productCategories.tenantId, tenantId),
        eq(productCategories.isActive, true),
        businessCategoryId ? eq(productCategories.businessCategoryId, businessCategoryId) : undefined
      ),
    });
  }

  public static async createCategory(tenantId: string, name: string, code?: string, businessCategoryId?: string, icon?: string, badgeColor?: string) {
    const catId = `pcat-${crypto.randomUUID().slice(0, 8)}`;
    const catCode = (code || name).toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    const [newCat] = await db
      .insert(productCategories)
      .values({
        id: catId,
        tenantId,
        businessCategoryId: businessCategoryId || null,
        name: name.trim(),
        code: catCode,
        icon: icon || 'Folder',
        badgeColor: badgeColor || '#3b82f6',
        isActive: true,
      } as any)
      .returning();

    return newCat;
  }

  public static async getBrands(tenantId: string) {
    return db.query.brands.findMany({
      where: eq(brands.tenantId, tenantId),
    });
  }

  public static async createBrand(tenantId: string, name: string, code?: string) {
    const brandId = `brd-${crypto.randomUUID().slice(0, 8)}`;
    const brandCode = (code || name).toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    const [newBrand] = await db
      .insert(brands)
      .values({
        id: brandId,
        tenantId,
        name: name.trim(),
        code: brandCode,
      } as any)
      .returning();

    return newBrand;
  }

  public static async getUnits(tenantId: string) {
    return db.query.units.findMany({
      where: eq(units.tenantId, tenantId),
    });
  }

  public static async createUnit(tenantId: string, name: string, code: string, symbol: string, allowDecimal = false) {
    const unitId = `unit-${crypto.randomUUID().slice(0, 8)}`;

    const [newUnit] = await db
      .insert(units)
      .values({
        id: unitId,
        tenantId,
        name: name.trim(),
        code: code.toLowerCase().trim(),
        symbol: symbol.trim(),
        allowDecimal,
      } as any)
      .returning();

    return newUnit;
  }
}
