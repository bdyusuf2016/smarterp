import { eq, and, sql, count, inArray, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import {
  inventoryStock,
  inventoryTransactions,
  inventoryLocations,
  stockTransfers,
  stockTransferItems,
} from '../../db/schema/inventory';
import { products, productVariants } from '../../db/schema/products';
import { tenantSettings } from '../../db/schema/tenants';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { StockCalcService } from './stock-calc.service';
import { SequenceService } from '../business/sequence.service';

export interface StockAdjustmentInput {
  tenantId: string;
  branchId: string;
  locationId?: string;
  productId: string;
  variantId?: string;
  quantityDelta: number; // Positive for IN, negative for OUT
  transactionType:
    | 'OPENING'
    | 'PURCHASE'
    | 'SALE'
    | 'SALE_RETURN'
    | 'PURCHASE_RETURN'
    | 'ADJUSTMENT'
    | 'DAMAGE'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT'
    | 'REPAIR_USAGE'
    | 'TRADE_IN';
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy?: string;
}

export interface StockTransferItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
  costPrice?: number;
}

export class InventoryService {
  /**
   * ATOMIC STOCK ADJUSTMENT WITH CONCURRENCY CONTROL
   * Executes inside a database transaction with row-level locks (SELECT FOR UPDATE)
   */
  public static async adjustStock(input: StockAdjustmentInput) {
    const {
      tenantId,
      branchId,
      locationId,
      productId,
      variantId,
      quantityDelta,
      transactionType,
      unitCost = 0,
      referenceType,
      referenceId,
      notes,
      createdBy,
    } = input;

    return await db.transaction(async (tx) => {
      // 1. Fetch tenant settings to check negative inventory allowance
      const settings = await tx.query.tenantSettings.findFirst({
        where: eq(tenantSettings.tenantId, tenantId),
      });
      const allowNegative = settings?.allowNegativeInventory ?? false;

      // 2. Lock and find the inventory_stock row for this tenant/branch/product/variant
      const conditions = [
        eq(inventoryStock.tenantId, tenantId),
        eq(inventoryStock.branchId, branchId),
        eq(inventoryStock.productId, productId),
      ];
      if (variantId) {
        conditions.push(eq(inventoryStock.variantId, variantId));
      }

      // Execute locked row lookup using SQL FOR UPDATE
      const lockedRows = await tx.execute(
        sql`SELECT * FROM ${inventoryStock}
            WHERE ${sql.join(conditions, sql` AND `)}
            FOR UPDATE`
      );

      const existingStock = (lockedRows.rows as any[])[0];

      const currentQty = existingStock ? Number(existingStock.quantity) : 0;
      const currentAvgCost = existingStock ? Number(existingStock.avg_cost_price || 0) : 0;
      const newQty = currentQty + quantityDelta;

      // 3. Prevent negative stock if disabled in tenant settings
      if (!allowNegative && newQty < 0) {
        throw new AppError(
          ErrorCodes.INSUFFICIENT_STOCK,
          `Insufficient stock. Available: ${currentQty.toFixed(3)}, Requested: ${Math.abs(quantityDelta).toFixed(3)}`,
          400,
          { currentStock: currentQty, requestedDelta: quantityDelta }
        );
      }

      // 4. Calculate new weighted average cost on positive stock inward
      let newAvgCost = currentAvgCost.toFixed(2);
      if (quantityDelta > 0 && unitCost > 0) {
        newAvgCost = StockCalcService.calculateWeightedAverageCost(
          currentQty,
          currentAvgCost,
          quantityDelta,
          unitCost
        );
      }

      const formattedNewQty = StockCalcService.formatQuantity(newQty);
      const stockId = existingStock?.id || `stk-${crypto.randomUUID().slice(0, 10)}`;

      if (existingStock) {
        await tx
          .update(inventoryStock)
          .set({
            quantity: formattedNewQty,
            avgCostPrice: newAvgCost,
            locationId: locationId || existingStock.location_id || null,
            updatedAt: new Date(),
          } as any)
          .where(eq(inventoryStock.id, existingStock.id));
      } else {
        await tx.insert(inventoryStock).values({
          id: stockId,
          tenantId,
          branchId,
          locationId: locationId || null,
          productId,
          variantId: variantId || null,
          quantity: formattedNewQty,
          reservedQuantity: '0.000',
          avgCostPrice: newAvgCost,
        } as any);
      }

      // 5. Insert Immutable Double-Entry Audit Transaction
      const transactionId = `itx-${crypto.randomUUID().slice(0, 12)}`;
      const totalCost = (Math.abs(quantityDelta) * (unitCost || Number(newAvgCost))).toFixed(2);

      const [auditTx] = await tx
        .insert(inventoryTransactions)
        .values({
          id: transactionId,
          tenantId,
          branchId,
          locationId: locationId || null,
          productId,
          variantId: variantId || null,
          transactionType,
          quantity: StockCalcService.formatQuantity(quantityDelta),
          unitCost: (unitCost || Number(newAvgCost)).toFixed(2),
          totalCost,
          balanceAfter: formattedNewQty,
          referenceType: referenceType || null,
          referenceId: referenceId || null,
          notes: notes || '',
          createdBy: createdBy || null,
        } as any)
        .returning();

      return {
        stockId,
        previousQuantity: currentQty,
        newQuantity: newQty,
        avgCostPrice: newAvgCost,
        transaction: auditTx,
      };
    });
  }

  /**
   * Retrieves stock list for a branch with product details and low stock tags
   */
  public static async getStockByBranch(
    tenantId: string,
    branchId: string,
    filters: { search?: string; locationId?: string; lowStockOnly?: boolean; page?: number; limit?: number } = {}
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [
      eq(inventoryStock.tenantId, tenantId),
      eq(inventoryStock.branchId, branchId),
    ];

    if (filters.locationId) {
      conditions.push(eq(inventoryStock.locationId, filters.locationId));
    }

    const whereClause = and(...conditions);

    const [stockRows, totalResult] = await Promise.all([
      db.query.inventoryStock.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (s, { desc }) => [desc(s.updatedAt)],
      }),
      db.select({ count: count() }).from(inventoryStock).where(whereClause),
    ]);

    const totalCount = Number(totalResult[0]?.count || 0);

    // Enriched with product & variant info
    const productIds = [...new Set(stockRows.map((s) => s.productId))];
    const variantIds = [...new Set(stockRows.map((s) => s.variantId).filter(Boolean))] as string[];

    const [productList, variantList] = await Promise.all([
      productIds.length > 0
        ? db.query.products.findMany({ where: inArray(products.id, productIds) })
        : [],
      variantIds.length > 0
        ? db.query.productVariants.findMany({ where: inArray(productVariants.id, variantIds) })
        : [],
    ]);

    const enriched = stockRows.map((s) => {
      const p = productList.find((item) => item.id === s.productId);
      const v = variantList.find((item) => item.id === s.variantId);
      const currentQty = Number(s.quantity);
      const reorderLevel = p ? Number(p.reorderLevel) : 5;
      const alertQty = p ? Number(p.alertQty) : 5;
      const isLow = StockCalcService.isLowStock(currentQty, reorderLevel, alertQty);

      return {
        ...s,
        product: p || null,
        variant: v || null,
        isLowStock: isLow,
      };
    });

    const finalItems = filters.lowStockOnly ? enriched.filter((e) => e.isLowStock) : enriched;

    return {
      items: finalItems,
      meta: {
        page,
        limit,
        totalCount: filters.lowStockOnly ? finalItems.length : totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Retrieves low stock alert items across branch products
   */
  public static async getLowStockAlerts(tenantId: string, branchId: string) {
    return this.getStockByBranch(tenantId, branchId, { lowStockOnly: true, limit: 100 });
  }

  /**
   * Retrieves immutable audit transaction ledger
   */
  public static async getStockTransactions(
    tenantId: string,
    filters: { branchId?: string; productId?: string; transactionType?: string; page?: number; limit?: number } = {}
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [eq(inventoryTransactions.tenantId, tenantId)];
    if (filters.branchId) {
      conditions.push(eq(inventoryTransactions.branchId, filters.branchId));
    }
    if (filters.productId) {
      conditions.push(eq(inventoryTransactions.productId, filters.productId));
    }
    if (filters.transactionType) {
      conditions.push(eq(inventoryTransactions.transactionType, filters.transactionType));
    }

    const whereClause = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.inventoryTransactions.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (it, { desc }) => [desc(it.createdAt)],
      }),
      db.select({ count: count() }).from(inventoryTransactions).where(whereClause),
    ]);

    const totalCount = Number(totalResult[0]?.count || 0);

    return {
      items,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // ==========================================
  // LOCATIONS MANAGEMENT
  // ==========================================

  public static async getLocations(tenantId: string, branchId: string) {
    return db.query.inventoryLocations.findMany({
      where: and(
        eq(inventoryLocations.tenantId, tenantId),
        eq(inventoryLocations.branchId, branchId)
      ),
    });
  }

  public static async createLocation(tenantId: string, branchId: string, name: string, code?: string, isDefault = false) {
    const locId = `loc-${crypto.randomUUID().slice(0, 8)}`;
    const locCode = (code || name).toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    const [newLoc] = await db
      .insert(inventoryLocations)
      .values({
        id: locId,
        tenantId,
        branchId,
        name: name.trim(),
        code: locCode,
        isDefault,
      } as any)
      .returning();

    return newLoc;
  }

  // ==========================================
  // STOCK TRANSFERS WORKFLOW
  // ==========================================

  public static async createStockTransfer(
    tenantId: string,
    fromBranchId: string,
    toBranchId: string,
    items: StockTransferItemInput[],
    notes?: string,
    createdBy?: string
  ) {
    if (fromBranchId === toBranchId) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Source branch and destination branch cannot be the same',
        400
      );
    }

    const transferId = `trf-${crypto.randomUUID().slice(0, 10)}`;
    const transferNo = await SequenceService.generateNextNumber(tenantId, 'TRANSFER', fromBranchId);

    const [newTransfer] = await db
      .insert(stockTransfers)
      .values({
        id: transferId,
        tenantId,
        transferNo,
        fromBranchId,
        toBranchId,
        status: 'PENDING',
        notes: notes || '',
        createdBy: createdBy || null,
      } as any)
      .returning();

    const createdItems: any[] = [];
    for (const itm of items) {
      const itemId = `tri-${crypto.randomUUID().slice(0, 10)}`;
      const [createdItem] = await db
        .insert(stockTransferItems)
        .values({
          id: itemId,
          transferId,
          productId: itm.productId,
          variantId: itm.variantId || null,
          quantity: StockCalcService.formatQuantity(itm.quantity),
          costPrice: (itm.costPrice || 0).toFixed(2),
        } as any)
        .returning();

      createdItems.push(createdItem);
    }

    return {
      ...newTransfer,
      items: createdItems,
    };
  }

  /**
   * Dispatches transfer: locks source stock, deducts source branch inventory, sets status IN_TRANSIT
   */
  public static async dispatchStockTransfer(transferId: string, tenantId: string, userId: string) {
    const transfer = await db.query.stockTransfers.findFirst({
      where: and(eq(stockTransfers.id, transferId), eq(stockTransfers.tenantId, tenantId)),
    });

    if (!transfer) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Stock transfer not found', 404);
    }
    if (transfer.status !== 'PENDING') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, `Transfer cannot be dispatched with status ${transfer.status}`, 400);
    }

    const items = await db.query.stockTransferItems.findMany({
      where: eq(stockTransferItems.transferId, transferId),
    });

    // Deduct stock from source branch
    for (const item of items) {
      await this.adjustStock({
        tenantId,
        branchId: transfer.fromBranchId,
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantityDelta: -Number(item.quantity),
        transactionType: 'TRANSFER_OUT',
        referenceType: 'TRANSFER',
        referenceId: transfer.transferNo,
        unitCost: Number(item.costPrice),
        createdBy: userId,
      });
    }

    const [updated] = await db
      .update(stockTransfers)
      .set({ status: 'IN_TRANSIT', updatedAt: new Date() } as any)
      .where(eq(stockTransfers.id, transferId))
      .returning();

    return updated;
  }

  /**
   * Receives transfer: adds stock to destination branch, sets status RECEIVED
   */
  public static async receiveStockTransfer(transferId: string, tenantId: string, userId: string) {
    const transfer = await db.query.stockTransfers.findFirst({
      where: and(eq(stockTransfers.id, transferId), eq(stockTransfers.tenantId, tenantId)),
    });

    if (!transfer) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Stock transfer not found', 404);
    }
    if (transfer.status !== 'IN_TRANSIT' && transfer.status !== 'PENDING') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, `Transfer is already ${transfer.status}`, 400);
    }

    const items = await db.query.stockTransferItems.findMany({
      where: eq(stockTransferItems.transferId, transferId),
    });

    // Add stock to destination branch
    for (const item of items) {
      await this.adjustStock({
        tenantId,
        branchId: transfer.toBranchId,
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantityDelta: Number(item.quantity),
        transactionType: 'TRANSFER_IN',
        referenceType: 'TRANSFER',
        referenceId: transfer.transferNo,
        unitCost: Number(item.costPrice),
        createdBy: userId,
      });

      await db
        .update(stockTransferItems)
        .set({ receivedQuantity: item.quantity } as any)
        .where(eq(stockTransferItems.id, item.id));
    }

    const [updated] = await db
      .update(stockTransfers)
      .set({
        status: 'RECEIVED',
        receivedBy: userId,
        updatedAt: new Date(),
      } as any)
      .where(eq(stockTransfers.id, transferId))
      .returning();

    return updated;
  }

  public static async getTransfers(tenantId: string) {
    return db.query.stockTransfers.findMany({
      where: eq(stockTransfers.tenantId, tenantId),
      orderBy: (st, { desc }) => [desc(st.createdAt)],
    });
  }
}
