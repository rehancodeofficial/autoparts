import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool: Pool | null = null;

export function getDatabasePool(): Pool {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL || 'postgresql://autopart_user:autopart_password@localhost:5432/autopart_db';

    // If DATABASE_URL still points to localhost but we're in production,
    // fail fast with a clear error rather than a cryptic ECONNREFUSED.
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    if (isLocalhost && process.env.NODE_ENV === 'production') {
      console.error(
        '[DB] DATABASE_URL is pointing to localhost in production! ' +
        'Set DATABASE_URL to the Supabase Transaction Pooler connection string in Vercel environment variables.'
      );
      // Use Supabase direct connection as last-resort fallback
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (supabaseRef && serviceKey) {
        connectionString = `postgresql://postgres.${supabaseRef}:${serviceKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
        console.log('[DB] Using Supabase pooler as fallback connection.');
      }
    }
    
    // Check if connecting to Supabase or remote cloud PostgreSQL that requires SSL
    const isRemoteDb = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1') &&
                       (
                         connectionString.includes('supabase.co') || 
                         connectionString.includes('pooler.supabase.com') ||
                         connectionString.includes('aws.') ||
                         process.env.NODE_ENV === 'production'
                       );

    pool = new Pool({
      connectionString,
      max: process.env.NODE_ENV === 'production' ? 5 : 20,
      idleTimeoutMillis: 30000,
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

    const migrationsDir = path.join(__dirname, '../prisma/migrations');
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
