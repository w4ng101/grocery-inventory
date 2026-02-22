/**
 * Direct PostgreSQL connection (bypasses PostgREST + schema cache entirely).
 * Used as a reliable fallback for auth when the RPC schema cache is stale.
 *
 * Set DATABASE_URL in .env.local:
 *   Supabase Dashboard → Settings → Database → "Connection string" (URI tab)
 *   e.g. postgresql://postgres:[PASSWORD]@db.jkprzjadvuuihlndyszv.supabase.co:5432/postgres
 */
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'your_database_url') {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  }

  return pool;
}

export async function queryDirect<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL not configured');
  const result = await p.query(sql, params);
  return result.rows as T[];
}
