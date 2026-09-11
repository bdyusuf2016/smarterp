import express, { Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import path from 'path';
import fs from 'fs';
import { logger } from './config/logger';
import { corsMiddleware } from './config/cors';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { rootRouter } from './routes/index';

export function createApp(): Express {
  const app = express();

  // Security Headers (relaxed CSP so UI assets, QR codes, icons load properly)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Whitelist
  app.use(corsMiddleware);

  // Request ID generator
  app.use(requestIdMiddleware);

  // Rate Limiting
  app.use(rateLimitMiddleware());

  // JSON and URL-encoded Body Parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP Request Logging with Pino
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers['x-request-id'] as string,
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          query: req.query,
          params: req.params,
          remoteAddress: req.remoteAddress,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
    })
  );

  // Mount API & System Routes
  app.use(rootRouter);

  // Real Server Production Static SPA Serving
  const candidates = [
    path.resolve(process.cwd(), 'dist/public'),
    path.resolve(process.cwd(), 'dist'),
  ];
  const staticDir = candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html')));

  if (staticDir && process.env.NODE_ENV !== 'test') {
    logger.info(`📦 Serving production SPA assets from: ${staticDir}`);
    app.use(express.static(staticDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  // 404 Route Not Found Handler (for unmatched API routes)
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
