import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { ResponseUtil } from '../shared/utils/response';
import { ErrorCodes } from '../shared/errors/error-codes';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestMap.entries()) {
    if (now > record.resetTime) {
      ipRequestMap.delete(ip);
    }
  }
}, 60000);

export function rateLimitMiddleware(
  options: { windowMs?: number; max?: number } = {}
) {
  const windowMs = options.windowMs || env.RATE_LIMIT_WINDOW_MS;
  const max = options.max || env.RATE_LIMIT_MAX_REQUESTS;

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, allow bypassing rate limits
    if (env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = ipRequestMap.get(ip);

    if (!record || now > record.resetTime) {
      ipRequestMap.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    record.count += 1;

    if (record.count > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      ResponseUtil.error(
        res,
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Too many requests from this IP, please try again later',
        429
      );
      return;
    }

    next();
  };
}
