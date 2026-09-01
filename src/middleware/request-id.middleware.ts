import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import '../shared/types/context';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingHeader = req.headers['x-request-id'];
  const requestId = typeof existingHeader === 'string' && existingHeader.trim().length > 0
    ? existingHeader
    : crypto.randomUUID();

  req.context = {
    requestId,
  };

  res.setHeader('X-Request-ID', requestId);
  next();
}
