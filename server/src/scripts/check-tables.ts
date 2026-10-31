import dotenv from 'dotenv';
dotenv.config();

import { getSupabasePool } from '../database/supabase';

async function check() {
  const pool = getSupabasePool();
  if (!pool) {
    console.error('No pool');
    return;
  }
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tables in Supabase public schema:');
    console.log(res.rows.map(r => r.table_name));

    const vehicleCount = await client.query('SELECT count(*) FROM vehicle_models;');
    console.log('Vehicle models count in Supabase:', vehicleCount.rows[0].count);
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);

