import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Safe __dirname polyfill that works in both ESM and CJS (esbuild/Vercel) contexts.
// Vercel's @vercel/node compiles TypeScript with esbuild to CJS by default.
// In CJS output, import.meta.url is undefined, so fileURLToPath(import.meta.url)
// throws ERR_INVALID_ARG_TYPE at module init time, crashing the entire Lambda
// (FUNCTION_INVOCATION_FAILED) before any request can be handled.
// The try/catch falls through to __dirname which esbuild/Node injects in CJS.
let _moduleDir: string;
try {
  _moduleDir = path.dirname(fileURLToPath(import.meta.url));
} catch {
  // CJS context (Vercel esbuild bundle): __dirname is available
  // eslint-disable-next-line no-undef
  _moduleDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
}

let pool: Pool | null = null;

/**
 * Resolves the PostgreSQL connection string.
 *
 * Previously this treated "SUPABASE_URL is set" as "we are in production" and,
 * whenever DATABASE_URL pointed at localhost, replaced it with a *guessed*
 * Supabase pooler URL — using SUPABASE_SERVICE_ROLE_KEY as the database
 * password. That key is a JWT, not a database credential, so the override
 * could only ever fail, and it silently discarded a working local connection
 * on any machine that had both set.
 *
 * An explicitly configured DATABASE_URL is now always honoured. The pooler URL
 * is only assembled when DATABASE_URL is absent altogether, and only from
 * SUPABASE_DB_PASSWORD — never from the service-role key.
 */
export function resolveConnectionString(): string {
  const explicit = (process.env.DATABASE_URL || '').trim();
  if (explicit) return explicit;

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const dbPassword = (process.env.SUPABASE_DB_PASSWORD || '').trim();

  if (supabaseUrl && dbPassword) {
    const ref = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    const region = process.env.SUPABASE_POOLER_REGION || 'ap-northeast-1';
    console.log(`[DB] DATABASE_URL is not set; using the Supabase pooler for project ${ref}.`);
    return `postgresql://postgres.${ref}:${encodeURIComponent(dbPassword)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
  }

  if (supabaseUrl) {
    console.error(
      '[DB] SUPABASE_URL is set but DATABASE_URL is not. Set DATABASE_URL to your ' +
      'Supabase Transaction Pooler connection string (Dashboard -> Project Settings -> ' +
      'Database -> Connection string -> Transaction pooler), or set SUPABASE_DB_PASSWORD. ' +
      'The service-role key is not a database password.'
    );
  }

  return 'postgresql://autopart_user:autopart_password@localhost:5432/autopart_db';
}

export function getDatabasePool(): Pool {
  if (!pool) {
    const connectionString = resolveConnectionString();

    // Enable SSL for any remote database (Supabase, AWS RDS, etc.)
    const isRemoteDb =
      !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

    pool = new Pool({
      connectionString,
      // In serverless (Vercel), keep the pool small — each invocation is its
      // own container.
      max: isRemoteDb ? 3 : 20,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ...(isRemoteDb ? { ssl: { rejectUnauthorized: false } } : {}),
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }
  return pool;
}

export function setDatabasePool(customPool: Pool) {
  pool = customPool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getDatabasePool();
  return p.query<T>(text, params);
}

export async function runTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const p = getDatabasePool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function runMigrations(): Promise<void> {
  const p = getDatabasePool();
  const client = await p.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_migrations" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) UNIQUE NOT NULL,
        "appliedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = path.join(_moduleDir, '../prisma/migrations');
    if (!fs.existsSync(migrationsDir)) return;

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const res = await client.query('SELECT 1 FROM "_migrations" WHERE "name" = $1', [file]);
      if (res.rowCount === 0) {
        console.log(`Applying migration: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO "_migrations" ("name") VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Successfully applied: ${file}`);
      }
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
