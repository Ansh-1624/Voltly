import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let pool: Pool | null = null;

export function getSupabasePool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Required for Supabase pooler & SSL connections
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected Supabase PostgreSQL error on idle client:', err);
    });
  }

  return pool;
}

/**
 * Tests connection to Supabase and verifies PostGIS extension
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  version?: string;
  hasPostgis?: boolean;
  error?: string;
}> {
  const p = getSupabasePool();
  if (!p) {
    return {
      connected: false,
      error: 'DATABASE_URL is not defined in environment variables.',
    };
  }

  try {
    const client = await p.connect();
    try {
      const res = await client.query('SELECT version();');
      const postgisRes = await client.query(
        "SELECT default_version, installed_version FROM pg_available_extensions WHERE name = 'postgis';"
      );

      const hasPostgis = Boolean(postgisRes.rows[0]?.installed_version);

      return {
        connected: true,
        version: res.rows[0].version,
        hasPostgis,
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Failed to connect to Supabase database',
    };
  }
}

/**
 * Applies the supabase-schema.sql to the database if tables are missing
 */
export async function applySupabaseSchema(): Promise<boolean> {
  const p = getSupabasePool();
  if (!p) return false;

  const schemaPath = path.join(__dirname, '../../../supabase-schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.warn('supabase-schema.sql not found at:', schemaPath);
    return false;
  }

  try {
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    const client = await p.connect();
    try {
      await client.query(sql);
      console.log('✅ Supabase PostgreSQL schema and initial seeds applied successfully.');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to execute supabase-schema.sql on Supabase:', err);
    return false;
  }
}

