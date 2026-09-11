import { Router, Request, Response } from 'express';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool, testConnectionWithDiagnostics } from '../../config/database';
import { logger } from '../../config/logger';
import { ResponseUtil } from '../../shared/utils/response';
import { runSeed } from '../../db/seed';
import { env } from '../../config/env';
import path from 'path';

export const systemDbRouter = Router();

/**
 * GET /api/v1/system/db/status
 * Returns current PostgreSQL connection status, latency, server version, and table counts.
 */
systemDbRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const diagnostics = await testConnectionWithDiagnostics();

    let counts: Record<string, number> = {};
    if (diagnostics.connected) {
      try {
        const client = await pool.connect();
        try {
          const querySafeCount = async (tableName: string) => {
            try {
              const res = await client.query(`SELECT COUNT(*)::int as cnt FROM "${tableName}"`);
              return res.rows[0]?.cnt || 0;
            } catch {
              return 0;
            }
          };

          counts = {
            tenants: await querySafeCount('tenants'),
            products: await querySafeCount('products'),
            customers: await querySafeCount('customers'),
            suppliers: await querySafeCount('suppliers'),
            sales: await querySafeCount('sales_orders'),
            users: await querySafeCount('users'),
            categories: await querySafeCount('business_categories'),
          };
        } finally {
          client.release();
        }
      } catch (e: any) {
        logger.warn({ err: e?.message }, 'Failed to fetch table counts');
      }
    }

    return ResponseUtil.success(
      res,
      {
        ...diagnostics,
        counts,
        config: {
          databaseUrl: env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'), // masked password
          nodeEnv: env.NODE_ENV,
          port: env.PORT,
        },
      },
      diagnostics.connected
        ? `PostgreSQL ডেটাবেজ সক্রিয় এবং সংযুক্ত! লেটেন্সি: ${diagnostics.latencyMs}ms`
        : `PostgreSQL ডেটাবেজ এখনো কানেক্ট করা যায়নি (${diagnostics.error})`
    );
  } catch (err: any) {
    return ResponseUtil.error(res, 'DB_STATUS_ERROR', err?.message || 'Failed to inspect database');
  }
});

/**
 * POST /api/v1/system/db/test
 * Tests a custom connection string or the default one.
 */
systemDbRouter.post('/test', async (req: Request, res: Response) => {
  try {
    const { connectionString } = req.body || {};
    const diagnostics = await testConnectionWithDiagnostics(connectionString);

    if (diagnostics.connected) {
      return ResponseUtil.success(
        res,
        diagnostics,
        `সফলভাবে কানেক্ট হয়েছে! ডেটাবেজ: ${diagnostics.database} (লেটেন্সি: ${diagnostics.latencyMs}ms)`
      );
    } else {
      return ResponseUtil.error(
        res,
        'DB_CONNECTION_FAILED',
        diagnostics.error || 'PostgreSQL ডেটাবেজে কানেক্ট করা সম্ভব হয়নি',
        400,
        diagnostics
      );
    }
  } catch (err: any) {
    return ResponseUtil.error(res, 'DB_TEST_ERROR', err?.message || 'Database test failed');
  }
});

/**
 * POST /api/v1/system/db/migrate
 * Executes Drizzle migrations programmatically to create/update all tables.
 */
systemDbRouter.post('/migrate', async (_req: Request, res: Response) => {
  logger.info('🚀 Initiating programmatic database migration from API...');
  try {
    const migrationsFolder = path.resolve(process.cwd(), 'src/db/migrations');
    await migrate(db, { migrationsFolder });

    const diagnostics = await testConnectionWithDiagnostics();

    return ResponseUtil.success(
      res,
      {
        tablesCreated: diagnostics.tableCount,
        tables: diagnostics.tables,
      },
      `সবগুলো ডেটাবেজ স্কিমা ও টেবিল সফলভাবে তৈরি/আপডেট করা হয়েছে! (মোট টেবিল: ${diagnostics.tableCount})`
    );
  } catch (err: any) {
    logger.error({ err }, 'Programmatic migration failed');
    return ResponseUtil.error(
      res,
      'MIGRATION_FAILED',
      `মাইগ্রেশন ব্যর্থ হয়েছে: ${err?.message || 'Unknown migration error'}`
    );
  }
});

/**
 * POST /api/v1/system/db/seed
 * Executes database seed to populate initial business categories, roles, and demo shop.
 */
systemDbRouter.post('/seed', async (_req: Request, res: Response) => {
  logger.info('🌱 Initiating programmatic database seed from API...');
  try {
    await runSeed();
    const diagnostics = await testConnectionWithDiagnostics();

    return ResponseUtil.success(
      res,
      diagnostics,
      'প্রাথমিক সিস্টেম ও ডেমো ডেটা সফলভাবে PostgreSQL ডেটাবেজে সিড করা হয়েছে!'
    );
  } catch (err: any) {
    logger.error({ err }, 'Programmatic seed failed');
    return ResponseUtil.error(
      res,
      'SEED_FAILED',
      `ডেটা সিডিং ব্যর্থ হয়েছে: ${err?.message || 'Unknown seed error'}`
    );
  }
});

/**
 * POST /api/v1/system/db/sync-from-storage
 * Takes browser localStorage state (tenants, products, customers, suppliers, sales)
 * and safely writes them into PostgreSQL.
 */
systemDbRouter.post('/sync-from-storage', async (req: Request, res: Response) => {
  try {
    const { tenants, products, customers, suppliers, sales } = req.body || {};
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let insertedTenants = 0;
      if (Array.isArray(tenants)) {
        for (const t of tenants) {
          if (!t.id || !t.name) continue;
          await client.query(
            `INSERT INTO tenants (id, name, code, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (id) DO UPDATE SET 
               name = EXCLUDED.name, 
               code = EXCLUDED.code,
               updated_at = NOW()`,
            [t.id, t.name, t.code || 'MAIN', t.is_active !== false]
          );
          insertedTenants++;
        }
      }

      let insertedCustomers = 0;
      if (Array.isArray(customers)) {
        for (const c of customers) {
          if (!c.id || !c.name) continue;
          await client.query(
            `INSERT INTO customers (id, tenant_id, name, phone, email, address, total_due, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               phone = EXCLUDED.phone,
               email = EXCLUDED.email,
               address = EXCLUDED.address,
               total_due = EXCLUDED.total_due,
               updated_at = NOW()`,
            [c.id, c.tenant_id || tenants?.[0]?.id || 'tenant-telecom', c.name, c.phone || '', c.email || null, c.address || null, Number(c.due || c.total_due || 0)]
          );
          insertedCustomers++;
        }
      }

      let insertedSuppliers = 0;
      if (Array.isArray(suppliers)) {
        for (const s of suppliers) {
          if (!s.id || !s.name) continue;
          await client.query(
            `INSERT INTO suppliers (id, tenant_id, name, phone, email, address, payable_amount, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               phone = EXCLUDED.phone,
               email = EXCLUDED.email,
               address = EXCLUDED.address,
               payable_amount = EXCLUDED.payable_amount,
               updated_at = NOW()`,
            [s.id, s.tenant_id || tenants?.[0]?.id || 'tenant-telecom', s.name, s.phone || '', s.email || null, s.address || null, Number(s.payable || s.payable_amount || 0)]
          );
          insertedSuppliers++;
        }
      }

      let insertedProducts = 0;
      if (Array.isArray(products)) {
        for (const p of products) {
          if (!p.id || !p.name) continue;
          await client.query(
            `INSERT INTO products (id, tenant_id, name, sku, barcode, cost_price, selling_price, tracking_mode, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               sku = EXCLUDED.sku,
               barcode = EXCLUDED.barcode,
               cost_price = EXCLUDED.cost_price,
               selling_price = EXCLUDED.selling_price,
               updated_at = NOW()`,
            [
              p.id,
              p.tenant_id || tenants?.[0]?.id || 'tenant-telecom',
              p.name,
              p.sku || p.barcode || `SKU-${p.id.slice(0, 8)}`,
              p.barcode || null,
              Number(p.cost_price || p.purchase_price || 0),
              Number(p.selling_price || p.sale_price || 0),
              p.tracking_mode || 'TRACKING_QUANTITY',
              p.is_active !== false,
            ]
          );
          insertedProducts++;
        }
      }

      await client.query('COMMIT');

      return ResponseUtil.success(
        res,
        {
          synced: {
            tenants: insertedTenants,
            customers: insertedCustomers,
            suppliers: insertedSuppliers,
            products: insertedProducts,
          },
        },
        'ব্রাউজার থেকে লোকাল PostgreSQL ডেটাবেজে সফলভাবে ডেটা সংরক্ষণ ও সিঙ্ক হয়েছে!'
      );
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    logger.error({ err }, 'Sync from storage failed');
    return ResponseUtil.error(res, 'SYNC_FAILED', `সিঙ্কিং ব্যর্থ হয়েছে: ${err?.message || 'Database error'}`);
  }
});

/**
 * GET /api/v1/system/db/export-to-storage
 * Reads data from PostgreSQL and returns it formatted for browser storage.
 */
systemDbRouter.get('/export-to-storage', async (_req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    try {
      const tenantsRes = await client.query('SELECT * FROM tenants ORDER BY created_at ASC');
      const productsRes = await client.query('SELECT * FROM products ORDER BY created_at ASC');
      const customersRes = await client.query('SELECT * FROM customers ORDER BY created_at ASC');
      const suppliersRes = await client.query('SELECT * FROM suppliers ORDER BY created_at ASC');

      return ResponseUtil.success(res, {
        tenants: tenantsRes.rows,
        products: productsRes.rows,
        customers: customersRes.rows,
        suppliers: suppliersRes.rows,
        exportedAt: new Date().toISOString(),
      }, 'PostgreSQL ডেটাবেজ থেকে তথ্য সফলভাবে প্রস্তুত করা হয়েছে');
    } finally {
      client.release();
    }
  } catch (err: any) {
    return ResponseUtil.error(res, 'EXPORT_FAILED', `এক্সপোর্ট ব্যর্থ হয়েছে: ${err?.message}`);
  }
});
