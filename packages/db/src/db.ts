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

export function getDatabasePool(): Pool {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL || 'postgresql://autopart_user:autopart_password@localhost:5432/autopart_db';

    // Guard: if DATABASE_URL points to localhost but a cloud DB is configured,
    // use the Supabase pooler as fallback. We check for SUPABASE_URL (set by
    // Vercel env vars) rather than relying solely on NODE_ENV, because Vercel
    // does NOT automatically set NODE_ENV=production unless you add it yourself.
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const hasSupabaseConfig = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    const isProduction = process.env.NODE_ENV === 'production' || hasSupabaseConfig;

    if (isLocalhost && isProduction) {
      console.error(
        '[DB] DATABASE_URL is pointing to localhost but SUPABASE_URL is configured. ' +
        'Set DATABASE_URL to your Supabase Transaction Pooler connection string in Vercel env vars. ' +
        'Example: postgresql://postgres.REF:DB_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres'
      );
      // Last-resort fallback: build the Supabase pooler URL from env vars.
      // NOTE: The password here must be your Supabase DATABASE password (not the service role JWT).
      // Set SUPABASE_DB_PASSWORD in Vercel env vars, or better: just set DATABASE_URL directly.
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
      const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (supabaseRef && dbPassword) {
        connectionString = `postgresql://postgres.${supabaseRef}:${encodeURIComponent(dbPassword)}@aws-0-me-central-1.pooler.supabase.com:6543/postgres`;
        console.log('[DB] Using Supabase pooler fallback connection.');
      }
    }
    
    // Enable SSL for any remote database (Supabase, AWS RDS, etc.)
    const isRemoteDb = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

    pool = new Pool({
      connectionString,
      // In serverless (Vercel), keep pool small — each Lambda invocation is independent
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
