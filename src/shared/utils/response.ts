import { Response } from 'express';
import { ApiErrorResponse, ApiMeta, ApiSuccessResponse } from '../types/api';

export class ResponseUtil {
  public static success<T>(
    res: Response,
    data: T,
    message: string | null = null,
    statusCode: number = 200,
    meta?: ApiMeta
  ): Response<ApiSuccessResponse<T>> {
    const payload: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      ...(meta ? { meta } : {}),
    };
    return res.status(statusCode).json(payload);
  }

  public static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully',
    meta?: ApiMeta
  ): Response<ApiSuccessResponse<T>> {
    return this.success(res, data, message, 201, meta);
  }

  public static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    totalCount: number,
    message: string = 'Data retrieved successfully'
  ): Response<ApiSuccessResponse<T[]>> {
    return this.success(res, data, message, 200, {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    });
  }

  public static error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = 500,
    details?: unknown
  ): Response<ApiErrorResponse> {
    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    };
    return res.status(statusCode).json(payload);
  }
}
