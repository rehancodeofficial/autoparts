/**
 * Integration-test harness backed by a real PostgreSQL database.
 *
 * The commerce code uses SELECT … FOR UPDATE, conditional UPDATE … WHERE
 * guards, COUNT(*) FILTER, ON CONFLICT … DO NOTHING and = ANY($1::text[]).
 * These are exactly the constructs that make the concurrency and idempotency
 * guarantees real, and pg-mem implements none of them — so testing them
 * against a stub would prove nothing. These tests therefore run on the same
 * engine as production (PostgreSQL / Supabase).
 *
 * Set TEST_DATABASE_URL to point at a scratch database. The suite refuses to
 * run against a URL that does not look like a test database.
 */
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { setDatabasePool, closeDatabase } from '../../packages/db/src/db';

// Resolved from the repository root so this works under both the Vitest CJS
// transform and plain ESM (tsx).
const MIGRATIONS_DIR = path.resolve(
  process.cwd(),
  'packages/db/prisma/migrations'
);

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://autopart_user:autopart_password@localhost:5432/autopart_test';

let pool: Pool | null = null;

export async function isPostgresAvailable(): Promise<boolean> {
  if (!/test/i.test(TEST_DATABASE_URL)) {
    throw new Error(
      `Refusing to run destructive tests against "${TEST_DATABASE_URL}". ` +
      'TEST_DATABASE_URL must name a test database.'
    );
  }
  const probe = new Pool({ connectionString: TEST_DATABASE_URL, connectionTimeoutMillis: 3000 });
  try {
    await probe.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await probe.end().catch(() => {});
  }
}

/** Drops the public schema and replays every migration from scratch. */
export async function resetDatabase(): Promise<Pool> {
  pool = new Pool({ connectionString: TEST_DATABASE_URL, max: 5 });
  setDatabasePool(pool);

  await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await pool.query('CREATE SCHEMA public');

  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await pool.query(sql);
    } catch (err: any) {
      throw new Error(`Migration ${file} failed: ${err.message}`);
    }
  }

  return pool;
}

export async function teardownDatabase(): Promise<void> {
  if (pool) {
    await pool.end().catch(() => {});
    pool = null;
  }
  await closeDatabase().catch(() => {});
}

export function getPool(): Pool {
  if (!pool) throw new Error('Test database not initialised.');
  return pool;
}

/** Truncates the transactional tables between tests, keeping the catalogue. */
export async function clearOrders(): Promise<void> {
  await getPool().query(`
    TRUNCATE "OrderEvent", "OrderItem", "Refund", "Payment", "WebhookEvent",
             "DiscountRedemption", "InventoryMovement", "Order"
    RESTART IDENTITY CASCADE
  `);
}
