import { eq, and, or, ilike, desc, count, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../../config/database';
import { devices, warranties } from '../../../db/schema/devices';
import { repairJobs, repairItems, repairStatusHistory } from '../../../db/schema/repairs';
import { tradeIns } from '../../../db/schema/tradeins';
import { recharges } from '../../../db/schema/recharges';
import { products } from '../../../db/schema/products';
import { AppError } from '../../../shared/errors/app-error';
import { ErrorCodes } from '../../../shared/errors/error-codes';
import { SequenceService } from '../../business/sequence.service';

export interface RegisterDeviceInput {
  tenantId: string;
  branchId?: string;
  productId: string;
  variantId?: string;
  imei1: string;
  imei2?: string;
  serialNumber?: string;
  model?: string;
  color?: string;
  storage?: string;
  batteryHealth?: number;
  costPrice?: string;
  sellingPrice?: string;
  warrantyMonths?: number;
  condition?: 'NEW' | 'USED' | 'REFURBISHED' | 'DEFECTIVE';
  notes?: string;
}

export interface CreateRepairJobInput {
  tenantId: string;
  branchId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  imei?: string;
  passcode?: string;
  problemDescription: string;
  diagnosticNotes?: string;
  estimatedCost?: string;
  advancePaid?: string;
  technicianId?: string;
  expectedDeliveryDate?: Date;
  createdBy?: string;
}

export interface CreateTradeInInput {
  tenantId: string;
  branchId: string;
  customerId?: string;
  sellerName: string;
  sellerPhone: string;
  sellerNid: string;
  deviceModel: string;
  imei1: string;
  imei2?: string;
  condition?: 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
  evaluationNotes?: string;
  valuationAmount: string;
  purchasePrice?: string;
  targetSellingPrice?: string;
  createdBy?: string;
}

export interface RecordRechargeInput {
  tenantId: string;
  branchId?: string;
  operator: 'GP' | 'ROBI' | 'BANGLALINK' | 'TELETALK' | 'BKASH' | 'NAGAD' | 'ROCKET';
  serviceType?: 'FLEXILOAD' | 'CASH_IN' | 'CASH_OUT' | 'BILL_PAY';
  recipientPhone: string;
  amount: number;
  commission?: number;
  createdBy?: string;
}

export class TelecomService {
  // ==========================================
  // DEVICE & IMEI LIFECYCLE
  // ==========================================

  public static async registerDevice(input: RegisterDeviceInput) {
    const cleanImei = input.imei1.trim();

    // Check IMEI uniqueness
    const existing = await db.query.devices.findFirst({
      where: and(eq(devices.tenantId, input.tenantId), eq(devices.imei1, cleanImei)),
    });

    if (existing) {
      throw new AppError(
        ErrorCodes.IMEI_ALREADY_EXISTS,
        `Device with IMEI '${cleanImei}' is already registered in inventory`,
        400
      );
    }

    const deviceId = `dev-${crypto.randomUUID().slice(0, 10)}`;

    const [newDevice] = await db
      .insert(devices)
      .values({
        id: deviceId,
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        productId: input.productId,
        variantId: input.variantId || null,
        imei1: cleanImei,
        imei2: input.imei2?.trim() || null,
        serialNumber: input.serialNumber?.trim() || null,
        model: input.model || '',
        color: input.color || '',
        storage: input.storage || '',
        batteryHealth: input.batteryHealth || null,
        costPrice: input.costPrice || '0.00',
        sellingPrice: input.sellingPrice || '0.00',
        warrantyMonths: input.warrantyMonths || 12,
        condition: input.condition || 'NEW',
        status: 'IN_STOCK',
        notes: input.notes || '',
      } as any)
      .returning();

    return newDevice;
  }

  public static async findDeviceByImeiOrSerial(tenantId: string, query: string) {
    const q = query.trim();
    const device = await db.query.devices.findFirst({
      where: and(
        eq(devices.tenantId, tenantId),
        or(eq(devices.imei1, q), eq(devices.imei2, q), eq(devices.serialNumber, q))
      ),
    });

    if (!device) {
      throw new AppError(ErrorCodes.DEVICE_NOT_FOUND, `No device found with IMEI/Serial '${q}'`, 404);
    }

    const [product, warranty] = await Promise.all([
      db.query.products.findFirst({ where: eq(products.id, device.productId) }),
      db.query.warranties.findFirst({ where: eq(warranties.deviceId, device.id) }),
    ]);

    return {
      ...device,
      product: product || null,
      warranty: warranty || null,
    };
  }

  public static async getDevices(tenantId: string, filters: { branchId?: string; status?: string; search?: string; page?: number; limit?: number } = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [eq(devices.tenantId, tenantId)];
    if (filters.branchId) conditions.push(eq(devices.branchId, filters.branchId));
    if (filters.status) conditions.push(eq(devices.status, filters.status));
    if (filters.search) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(or(ilike(devices.imei1, q), ilike(devices.model, q), ilike(devices.serialNumber, q))!);
    }

    const whereClause = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.devices.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (d, { desc }) => [desc(d.createdAt)],
      }),
      db.select({ count: count() }).from(devices).where(whereClause),
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

  // ==========================================
  // REPAIRS & SERVICE WORKFLOW
  // ==========================================

  public static async createRepairJob(input: CreateRepairJobInput) {
    const tokenNo = await SequenceService.generateNextNumber(input.tenantId, 'REPAIR', input.branchId);
    const jobId = `rep-${crypto.randomUUID().slice(0, 10)}`;

    const advance = Number(input.advancePaid || 0);
    const est = Number(input.estimatedCost || 0);
    const due = Math.max(0, est - advance);

    const [newJob] = await db
      .insert(repairJobs)
      .values({
        id: jobId,
        tenantId: input.tenantId,
        branchId: input.branchId,
        tokenNo,
        customerId: input.customerId || null,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        deviceModel: input.deviceModel.trim(),
        imei: input.imei || null,
        passcode: input.passcode || '',
        problemDescription: input.problemDescription,
        diagnosticNotes: input.diagnosticNotes || '',
        technicianId: input.technicianId || null,
        estimatedCost: est.toFixed(2),
        finalCost: est.toFixed(2),
        advancePaid: advance.toFixed(2),
        dueAmount: due.toFixed(2),
        status: 'RECEIVED',
        expectedDeliveryDate: input.expectedDeliveryDate || null,
        createdBy: input.createdBy || null,
      } as any)
      .returning();

    // Record initial status history
    await db.insert(repairStatusHistory).values({
      id: `rsh-${crypto.randomUUID().slice(0, 10)}`,
      repairJobId: jobId,
      status: 'RECEIVED',
      notes: 'Device received at repair desk',
      changedBy: input.createdBy || null,
    } as any);

    return newJob;
  }

  public static async updateRepairStatus(jobId: string, tenantId: string, status: string, notes?: string, changedBy?: string) {
    const job = await db.query.repairJobs.findFirst({
      where: and(eq(repairJobs.id, jobId), eq(repairJobs.tenantId, tenantId)),
    });
    if (!job) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Repair job not found', 404);
    }

    const [updated] = await db
      .update(repairJobs)
      .set({
        status,
        deliveredAt: status === 'DELIVERED' ? new Date() : job.deliveredAt,
        updatedAt: new Date(),
      } as any)
      .where(eq(repairJobs.id, jobId))
      .returning();

    await db.insert(repairStatusHistory).values({
      id: `rsh-${crypto.randomUUID().slice(0, 10)}`,
      repairJobId: jobId,
      status,
      notes: notes || `Status updated to ${status}`,
      changedBy: changedBy || null,
    } as any);

    return updated;
  }

  public static async getRepairJobs(tenantId: string, filters: { branchId?: string; status?: string; search?: string; page?: number; limit?: number } = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [eq(repairJobs.tenantId, tenantId)];
    if (filters.branchId) conditions.push(eq(repairJobs.branchId, filters.branchId));
    if (filters.status) conditions.push(eq(repairJobs.status, filters.status));
    if (filters.search) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(or(ilike(repairJobs.tokenNo, q), ilike(repairJobs.customerPhone, q), ilike(repairJobs.customerName, q))!);
    }

    const whereClause = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.repairJobs.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (r, { desc }) => [desc(r.createdAt)],
      }),
      db.select({ count: count() }).from(repairJobs).where(whereClause),
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

  // ==========================================
  // TRADE-IN / EXCHANGE
  // ==========================================

  public static async createTradeIn(input: CreateTradeInInput) {
    const tradeInNo = await SequenceService.generateNextNumber(input.tenantId, 'TRADE_IN', input.branchId);
    const tradeInId = `trd-${crypto.randomUUID().slice(0, 10)}`;

    const [newTradeIn] = await db
      .insert(tradeIns)
      .values({
        id: tradeInId,
        tenantId: input.tenantId,
        branchId: input.branchId,
        tradeInNo,
        customerId: input.customerId || null,
        sellerName: input.sellerName.trim(),
        sellerPhone: input.sellerPhone.trim(),
        sellerNid: input.sellerNid.trim(),
        deviceModel: input.deviceModel.trim(),
        imei1: input.imei1.trim(),
        imei2: input.imei2?.trim() || null,
        condition: input.condition || 'USED',
        evaluationNotes: input.evaluationNotes || '',
        valuationAmount: input.valuationAmount,
        purchasePrice: input.purchasePrice || input.valuationAmount,
        targetSellingPrice: input.targetSellingPrice || '0.00',
        status: 'EVALUATED',
        createdBy: input.createdBy || null,
      } as any)
      .returning();

    return newTradeIn;
  }

  public static async getTradeIns(tenantId: string) {
    return db.query.tradeIns.findMany({
      where: eq(tradeIns.tenantId, tenantId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }

  // ==========================================
  // OPERATOR RECHARGES & FLEXILOAD
  // ==========================================

  public static async recordRecharge(input: RecordRechargeInput) {
    const rechargeId = `rec-${crypto.randomUUID().slice(0, 10)}`;

    const [newRecharge] = await db
      .insert(recharges)
      .values({
        id: rechargeId,
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        operator: input.operator,
        serviceType: input.serviceType || 'FLEXILOAD',
        recipientPhone: input.recipientPhone.trim(),
        amount: input.amount.toFixed(2),
        commission: (input.commission || 0).toFixed(2),
        status: 'SUCCESS',
        createdBy: input.createdBy || null,
      } as any)
      .returning();

    return newRecharge;
  }

  public static async getRecharges(tenantId: string, limit = 50) {
    return db.query.recharges.findMany({
      where: eq(recharges.tenantId, tenantId),
      limit,
      orderBy: (r, { desc }) => [desc(r.transactionDate)],
    });
  }
}
