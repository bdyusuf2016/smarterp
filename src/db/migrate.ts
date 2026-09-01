import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool, testDatabaseConnection } from '../config/database';
import { logger } from '../config/logger';

export async function runMigrations() {
  logger.info('🚀 Running Drizzle database migrations for Dokan Manager V2...');

  const isConnected = await testDatabaseConnection();
  if (!isConnected) {
    logger.error('❌ Cannot run migrations: PostgreSQL connection failed');
    process.exit(1);
  }

  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    logger.info('✅ Drizzle migrations executed successfully!');
  } catch (err) {
    logger.error({ err }, '❌ Migration execution failed');
    throw err;
  }
}

if (process.argv[1]?.includes('migrate')) {
  runMigrations()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, 'Migration crashed');
      await pool.end();
      process.exit(1);
    });
}
