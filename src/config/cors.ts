import cors, { CorsOptions } from 'cors';
import { env } from './env';

const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) in development/testing
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} is not allowed by CORS whitelist`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Tenant-ID', 'X-Branch-ID'],
  exposedHeaders: ['X-Request-ID'],
};

export const corsMiddleware = cors(corsOptions);
