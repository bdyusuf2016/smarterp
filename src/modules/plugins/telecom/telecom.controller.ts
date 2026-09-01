import { Request, Response, NextFunction } from 'express';
import { TelecomService } from './telecom.service';
import { ResponseUtil } from '../../../shared/utils/response';
import { AppError } from '../../../shared/errors/app-error';
import { ErrorCodes } from '../../../shared/errors/error-codes';

export class TelecomController {
  // Devices
  public static async getDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const result = await TelecomService.getDevices(tenantId, req.query as any);
      ResponseUtil.paginated(res, result.items, result.meta.page, result.meta.limit, result.meta.totalCount, 'Devices retrieved');
    } catch (err) {
      next(err);
    }
  }

  public static async registerDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const device = await TelecomService.registerDevice({ ...req.body, tenantId, branchId });
      ResponseUtil.success(res, device, 'Device registered with IMEI successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  public static async findByImei(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { imei } = req.params;
      if (!tenantId || !imei) throw new AppError(ErrorCodes.BAD_REQUEST, 'IMEI parameter required', 400);

      const device = await TelecomService.findDeviceByImeiOrSerial(tenantId, imei);
      ResponseUtil.success(res, device, 'Device found', 200);
    } catch (err) {
      next(err);
    }
  }

  // Repairs
  public static async getRepairJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const result = await TelecomService.getRepairJobs(tenantId, req.query as any);
      ResponseUtil.paginated(res, result.items, result.meta.page, result.meta.limit, result.meta.totalCount, 'Repair jobs retrieved');
    } catch (err) {
      next(err);
    }
  }

  public static async createRepairJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;
      if (!tenantId || !branchId) throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);

      const job = await TelecomService.createRepairJob({ ...req.body, tenantId, branchId, createdBy: userId });
      ResponseUtil.success(res, job, 'Repair job created with token number', 201);
    } catch (err) {
      next(err);
    }
  }

  public static async updateRepairStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.user?.id;
      const { id } = req.params;
      if (!tenantId || !id) throw new AppError(ErrorCodes.NOT_FOUND, 'Job ID missing', 400);

      const updated = await TelecomService.updateRepairStatus(id, tenantId, req.body.status, req.body.notes, userId);
      ResponseUtil.success(res, updated, 'Repair status updated', 200);
    } catch (err) {
      next(err);
    }
  }

  // Trade-Ins
  public static async getTradeIns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const list = await TelecomService.getTradeIns(tenantId);
      ResponseUtil.success(res, list, 'Trade-ins retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async createTradeIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;
      if (!tenantId || !branchId) throw new AppError(ErrorCodes.BRANCH_NOT_FOUND, 'Branch context required', 400);

      const tradeIn = await TelecomService.createTradeIn({ ...req.body, tenantId, branchId, createdBy: userId });
      ResponseUtil.success(res, tradeIn, 'Trade-in evaluated successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  // Recharges
  public static async getRecharges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const list = await TelecomService.getRecharges(tenantId);
      ResponseUtil.success(res, list, 'Recharge transactions retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  public static async recordRecharge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      const userId = req.context?.user?.id;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const rec = await TelecomService.recordRecharge({ ...req.body, tenantId, branchId, createdBy: userId });
      ResponseUtil.success(res, rec, 'Recharge recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}
