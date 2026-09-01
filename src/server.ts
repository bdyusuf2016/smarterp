import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { testDatabaseConnection, pool } from './config/database';

const app = createApp();

const server = app.listen(env.PORT, async () => {
  logger.info(`🚀 Dokan Manager V2 Backend active on port ${env.PORT} in [${env.NODE_ENV}] mode`);
  logger.info(`🔗 API Gateway: http://localhost:${env.PORT}/api/v1`);
  logger.info(`🩺 Health Check: http://localhost:${env.PORT}/health`);

  if (env.NODE_ENV !== 'test') {
    await testDatabaseConnection();
  }
});

// Graceful shutdown handling
const handleGracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully shutting down Dokan Manager V2 backend...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await pool.end();
      logger.info('PostgreSQL connection pool closed.');
    } catch (err) {
      logger.error({ err }, 'Error closing PostgreSQL connection pool');
    }
    process.exit(0);
  });

  // Force close after 10s if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
