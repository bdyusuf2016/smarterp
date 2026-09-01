import express, { Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import { corsMiddleware } from './config/cors';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { rootRouter } from './routes/index';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

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

  // Mount Root Routes
  app.use(rootRouter);

  // 404 Route Not Found Handler
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
