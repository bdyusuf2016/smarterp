import { Request, Response, NextFunction } from 'express';
import { LibraryService } from './library.service';
import { ResponseUtil } from '../../../shared/utils/response';
import { AppError } from '../../../shared/errors/app-error';
import { ErrorCodes } from '../../../shared/errors/error-codes';

export class LibraryController {
  public static async createTitle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const title = await LibraryService.createBookTitle({ ...req.body, tenantId });
      ResponseUtil.success(res, title, 'Book bibliographic title created', 201);
    } catch (err) {
      next(err);
    }
  }

  public static async registerCopy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const copy = await LibraryService.registerBookCopy({ ...req.body, tenantId, branchId });
      ResponseUtil.success(res, copy, 'Physical book copy registered with barcode', 201);
    } catch (err) {
      next(err);
    }
  }

  public static async createMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const member = await LibraryService.createMember({ ...req.body, tenantId });
      ResponseUtil.success(res, member, 'Library member registered', 201);
    } catch (err) {
      next(err);
    }
  }

  public static async issueBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const branchId = req.body.branchId || req.context?.branchId;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const trans = await LibraryService.issueBook({ ...req.body, tenantId, branchId });
      ResponseUtil.success(res, trans, 'Book issued to member successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  public static async returnBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const { borrowTransactionId, lateFeePerDay } = req.body;
      if (!tenantId) throw new AppError(ErrorCodes.TENANT_NOT_FOUND, 'Tenant context missing', 400);

      const result = await LibraryService.returnBook(borrowTransactionId, tenantId, lateFeePerDay);
      ResponseUtil.success(res, result, 'Book returned and restocked to shelf', 200);
    } catch (err) {
      next(err);
    }
  }
}
