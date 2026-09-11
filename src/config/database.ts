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
  } catch (err: any) {
    logger.warn({ err: err?.message || err }, '⚠️ PostgreSQL connection is not available yet');
    return false;
  }
}

export interface DbDiagnostics {
  connected: boolean;
  latencyMs: number;
  database?: string;
  serverTime?: string;
  version?: string;
  tableCount?: number;
  tables?: string[];
  error?: string;
}

export async function testConnectionWithDiagnostics(customUrl?: string): Promise<DbDiagnostics> {
  const targetUrl = customUrl?.trim() || env.DATABASE_URL;
  const startTime = Date.now();
  
  const testPool = customUrl && customUrl.trim() !== env.DATABASE_URL 
    ? new Pool({ connectionString: targetUrl, connectionTimeoutMillis: 4000 })
    : pool;

  try {
    const client = await testPool.connect();
    try {
      const infoRes = await client.query(`
        SELECT 
          current_database() as db_name, 
          NOW() as server_time,
          version() as pg_version
      `);
      
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name ASC
      `);

      const latencyMs = Date.now() - startTime;
      const tables = tablesRes.rows.map((r: any) => r.table_name);

      return {
        connected: true,
        latencyMs,
        database: infoRes.rows[0]?.db_name,
        serverTime: infoRes.rows[0]?.server_time,
        version: infoRes.rows[0]?.pg_version?.split(' ')?.[0] + ' ' + (infoRes.rows[0]?.pg_version?.split(' ')?.[1] || ''),
        tableCount: tables.length,
        tables,
      };
    } finally {
      client.release();
      if (testPool !== pool) {
        await testPool.end().catch(() => {});
      }
    }
  } catch (err: any) {
    if (testPool !== pool) {
      await testPool.end().catch(() => {});
    }
    return {
      connected: false,
      latencyMs: Date.now() - startTime,
      error: err?.message || 'Failed to establish connection to PostgreSQL',
    };
  }
}

