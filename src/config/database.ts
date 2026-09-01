import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from './env';
import { logger } from './logger';
import * as schema from '../db/schema';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.NODE_ENV === 'production' ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL connection pool error');
});

export const db = drizzle(pool, {
  schema,
  logger: false,
});

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW() as current_time, current_database() as db_name');
      logger.info(
        { database: res.rows[0].db_name, time: res.rows[0].current_time },
        '✅ PostgreSQL database connection established successfully'
      );
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error({ err }, '❌ Failed to connect to PostgreSQL database');
    return false;
  }
}
