import { eq, and, gte, lte, desc, count, sql, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../config/database';
import { sales, saleItems } from '../../db/schema/sales';
import { inventoryStock } from '../../db/schema/inventory';
import { products } from '../../db/schema/products';
import { customers } from '../../db/schema/customers';
import { suppliers } from '../../db/schema/suppliers';
import { auditLogs } from '../../db/schema/audit';

export interface ReportDateFilter {
  branchId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface RecordAuditInput {
  tenantId: string;
  branchId?: string;
  userId?: string;
  action: string;
  module: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export class ReportsService {
  /**
   * EXECUTIVE KPI SUMMARY DASHBOARD
   */
  public static async getExecutiveSummary(tenantId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const saleConditions = [eq(sales.tenantId, tenantId), gte(sales.saleDate, today)];
    if (branchId) saleConditions.push(eq(sales.branchId, branchId));

    // 1. Today's Sales & Invoices
    const todaySales = await db.query.sales.findMany({
      where: and(...saleConditions),
    });

    let todayRevenue = 0;
    let todayPaid = 0;
    let todayDue = 0;
    for (const s of todaySales) {
      todayRevenue += Number(s.grandTotal || 0);
      todayPaid += Number(s.paidAmount || 0);
      todayDue += Number(s.dueAmount || 0);
    }

    // 2. Today's Profit (Sales Revenue - Cost of Goods Sold)
    const todaySaleIds = todaySales.map((s) => s.id);
    let todayCogs = 0;
    if (todaySaleIds.length > 0) {
      const todayItems = await db.query.saleItems.findMany({
        where: inArray(saleItems.saleId, todaySaleIds),
      });
      for (const item of todayItems) {
        todayCogs += Number(item.quantity || 0) * Number(item.costPrice || 0);
      }
    }
    const todayGrossProfit = todayRevenue - todayCogs;

    // 3. Customer Dues & Total Customer Count
    const customerList = await db.query.customers.findMany({
      where: and(eq(customers.tenantId, tenantId), eq(customers.isActive, true)),
    });
    const totalCustomers = customerList.length;
    const totalCustomerDues = customerList.reduce((acc, curr) => acc + Number(curr.currentDue || 0), 0);

    // 4. Supplier Payables & Total Supplier Count
    const supplierList = await db.query.suppliers.findMany({
      where: and(eq(suppliers.tenantId, tenantId), eq(suppliers.isActive, true)),
    });
    const totalSuppliers = supplierList.length;
    const totalSupplierPayables = supplierList.reduce((acc, curr) => acc + Number(curr.currentPayable || 0), 0);

    // 5. Low Stock Items Alert Count
    const invConditions = [eq(inventoryStock.tenantId, tenantId)];
    if (branchId) invConditions.push(eq(inventoryStock.branchId, branchId));
    const invList = await db.query.inventoryStock.findMany({
      where: and(...invConditions),
    });

    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const inv of invList) {
      const q = Number(inv.quantity || 0);
      if (q <= 0) outOfStockCount++;
      else if (q <= 5) lowStockCount++;
    }

    return {
      today: {
        totalInvoices: todaySales.length,
        totalRevenue: todayRevenue,
        totalPaid: todayPaid,
        totalDue: todayDue,
        cogs: todayCogs,
        grossProfit: todayGrossProfit,
      },
      partyBalances: {
        totalCustomers,
        totalCustomerDues,
        totalSuppliers,
        totalSupplierPayables,
      },
      inventoryHealth: {
        totalStockedProducts: invList.length,
        lowStockCount,
        outOfStockCount,
      },
    };
  }

  /**
   * SALES & PROFIT ANALYTICS
   */
  public static async getSalesAnalytics(tenantId: string, filter: ReportDateFilter = {}) {
    const conditions = [eq(sales.tenantId, tenantId)];
    if (filter.branchId) conditions.push(eq(sales.branchId, filter.branchId));
    if (filter.fromDate) conditions.push(gte(sales.saleDate, filter.fromDate));
    if (filter.toDate) conditions.push(lte(sales.saleDate, filter.toDate));

    const saleRecords = await db.query.sales.findMany({
      where: and(...conditions),
      orderBy: [desc(sales.saleDate)],
      limit: 500,
    });

    let totalRevenue = 0;
    let totalPaid = 0;
    let totalDue = 0;

    for (const s of saleRecords) {
      totalRevenue += Number(s.grandTotal || 0);
      totalPaid += Number(s.paidAmount || 0);
      totalDue += Number(s.dueAmount || 0);
    }

    // Top Selling Items
    const sIds = saleRecords.map((s) => s.id);
    const itemMap = new Map<string, { productName: string; quantity: number; revenue: number }>();

    if (sIds.length > 0) {
      const sItems = await db.query.saleItems.findMany({
        where: inArray(saleItems.saleId, sIds),
      });

      for (const itm of sItems) {
        const existing = itemMap.get(itm.productId) || {
          productName: itm.productName,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += Number(itm.quantity || 0);
        existing.revenue += Number(itm.total || 0);
        itemMap.set(itm.productId, existing);
      }
    }

    const topSellingProducts = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      summary: {
        totalInvoices: saleRecords.length,
        totalRevenue,
        totalPaid,
        totalDue,
      },
      topSellingProducts,
    };
  }

  /**
   * INVENTORY VALUATION REPORT
   */
  public static async getInventoryValuation(tenantId: string, branchId?: string) {
    const conditions = [eq(inventoryStock.tenantId, tenantId)];
    if (branchId) conditions.push(eq(inventoryStock.branchId, branchId));

    const invList = await db.query.inventoryStock.findMany({
      where: and(...conditions),
    });

    const productIds: string[] = [...new Set(invList.map((i) => i.productId))];
    const prodList = productIds.length > 0
      ? await db.query.products.findMany({ where: inArray(products.id, productIds) })
      : [];

    let totalCostValuation = 0;
    let totalRetailValuation = 0;

    const items = invList.map((inv) => {
      const p = prodList.find((pr) => pr.id === inv.productId);
      const qty = Number(inv.quantity || 0);
      const cost = Number(inv.avgCostPrice || p?.costPrice || 0);
      const selling = Number(p?.sellingPrice || 0);

      const itemCostVal = qty * cost;
      const itemRetailVal = qty * selling;

      totalCostValuation += itemCostVal;
      totalRetailValuation += itemRetailVal;

      return {
        productId: inv.productId,
        productName: p?.name || 'Product',
        sku: p?.sku || '',
        quantityOnHand: qty,
        avgCostPrice: cost,
        sellingPrice: selling,
        costValuation: itemCostVal,
        retailValuation: itemRetailVal,
        lowStock: qty <= 5,
      };
    });

    return {
      summary: {
        totalUniqueProducts: invList.length,
        totalCostValuation,
        totalRetailValuation,
        potentialGrossProfit: Math.max(0, totalRetailValuation - totalCostValuation),
      },
      items,
    };
  }

  /**
   * AUDIT LOGS
   */
  public static async getAuditLogs(tenantId: string, filters: { module?: string; action?: string; userId?: string; page?: number; limit?: number } = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [eq(auditLogs.tenantId, tenantId)];
    if (filters.module) conditions.push(eq(auditLogs.module, filters.module));
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.userId) conditions.push(eq(auditLogs.userId, filters.userId));

    const whereClause = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.auditLogs.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (a, { desc }) => [desc(a.createdAt)],
      }),
      db.select({ count: count() }).from(auditLogs).where(whereClause),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        totalCount: Number(totalResult[0]?.count || 0),
        totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
      },
    };
  }

  public static async recordAuditLog(input: RecordAuditInput) {
    const id = `aud-${crypto.randomUUID().slice(0, 10)}`;
    const [entry] = await db
      .insert(auditLogs)
      .values({
        id,
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        userId: input.userId || null,
        action: input.action,
        module: input.module,
        resource: input.resource,
        resourceId: input.resourceId || null,
        oldValues: input.oldValues || null,
        newValues: input.newValues || null,
        ipAddress: input.ipAddress || '',
        userAgent: input.userAgent || '',
        requestId: input.requestId || null,
      } as any)
      .returning();

    return entry;
  }
}
