import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error';
import { ErrorCodes } from '../shared/errors/error-codes';
import { ResponseUtil } from '../shared/utils/response';
import { logger } from '../config/logger';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.context?.requestId || 'unknown';

  if (err instanceof AppError) {
    logger.warn(
      {
        requestId,
        errCode: err.code,
        message: err.message,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
      },
      `Operational error: ${err.message}`
    );

    ResponseUtil.error(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle uncaught / unexpected system errors
  logger.error(
    {
      requestId,
      err,
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
    `Unhandled error encountered: ${err.message}`
  );

  const isProd = env.NODE_ENV === 'production';
  ResponseUtil.error(
    res,
    ErrorCodes.INTERNAL_SERVER_ERROR,
    isProd ? 'An unexpected internal server error occurred' : err.message,
    500,
    isProd ? undefined : { stack: err.stack }
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  ResponseUtil.error(
    res,
    ErrorCodes.NOT_FOUND,
    `Route ${req.method} ${req.originalUrl} not found`,
    404
  );
}
