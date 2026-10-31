import dotenv from 'dotenv';
dotenv.config();

import { testSupabaseConnection } from '../database/supabase';

async function main() {
  console.log('🔍 Testing connection to Supabase PostgreSQL...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configured (hidden for safety)' : 'Not set');

  const res = await testSupabaseConnection();
  if (res.connected) {
    console.log('✅ Connected to Supabase successfully!');
    console.log('📦 PostgreSQL Version:', res.version);
    console.log('🌍 PostGIS Extension Enabled:', res.hasPostgis ? 'YES' : 'NO (Run CREATE EXTENSION postgis;)');
  } else {
    console.error('❌ Connection failed:', res.error);
    console.log('\nMake sure you have set DATABASE_URL in your server/.env:');
    console.log('DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres');
  }
}

main().catch(console.error);

