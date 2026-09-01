import { Request, Response, NextFunction } from 'express';
import { ProductsService } from './products.service';
import { ResponseUtil } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export class ProductsController {
  /**
   * GET /api/v1/products
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const filters = req.query as any;
      const result = await ProductsService.getProducts(tenantId, filters);

      ResponseUtil.paginated(
        res,
        result.items,
        result.meta.page,
        result.meta.limit,
        result.meta.totalCount,
        'Products list retrieved'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/products
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const product = await ProductsService.createProduct({
        ...req.body,
        tenantId,
      });

      ResponseUtil.success(res, product, 'Product created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/products/scan/:code
   */
  public static async scanBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { code } = req.params;

      if (!tenantId || !code) {
        throw new AppError(ErrorCodes.PRODUCT_NOT_FOUND, 'Barcode / SKU parameter is required', 400);
      }

      const match = await ProductsService.findByBarcodeOrSku(tenantId, code);
      ResponseUtil.success(res, match, 'Product scanned successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/products/:id
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.PRODUCT_NOT_FOUND, 'Product ID missing', 400);
      }

      const product = await ProductsService.getProductById(id, tenantId);
      ResponseUtil.success(res, product, 'Product details retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/products/:id
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;
      const { customFields, ...updates } = req.body;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.PRODUCT_NOT_FOUND, 'Product ID missing', 400);
      }

      const updated = await ProductsService.updateProduct(id, tenantId, updates, customFields);
      ResponseUtil.success(res, updated, 'Product updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/products/:id
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId || !id) {
        throw new AppError(ErrorCodes.PRODUCT_NOT_FOUND, 'Product ID missing', 400);
      }

      const result = await ProductsService.deleteProduct(id, tenantId);
      ResponseUtil.success(res, result, 'Product deactivated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // CATEGORIES, BRANDS, UNITS CONTROLLERS
  // ==========================================

  public static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const businessCategoryId = req.query.businessCategoryId as string | undefined;

      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const list = await ProductsService.getCategories(tenantId, businessCategoryId);
      ResponseUtil.success(res, list, 'Product categories retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { name, code, businessCategoryId, icon, badgeColor } = req.body;

      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const newCat = await ProductsService.createCategory(tenantId, name, code, businessCategoryId, icon, badgeColor);
      ResponseUtil.success(res, newCat, 'Product category created', 201);
    } catch (err) {
      next(err);
    }
  }

  public static async getBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const list = await ProductsService.getBrands(tenantId);
      ResponseUtil.success(res, list, 'Brands retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async createBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { name, code } = req.body;

      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const newBrand = await ProductsService.createBrand(tenantId, name, code);
      ResponseUtil.success(res, newBrand, 'Brand created', 201);
    } catch (err) {
      next(err);
    }
  }

  public static async getUnits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const list = await ProductsService.getUnits(tenantId);
      ResponseUtil.success(res, list, 'Units retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async createUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { name, code, symbol, allowDecimal } = req.body;

      if (!tenantId) {
        throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);
      }

      const newUnit = await ProductsService.createUnit(tenantId, name, code, symbol, allowDecimal);
      ResponseUtil.success(res, newUnit, 'Unit created', 201);
    } catch (err) {
      next(err);
    }
  }
}
