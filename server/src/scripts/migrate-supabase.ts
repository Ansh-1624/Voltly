import dotenv from 'dotenv';
dotenv.config();

import { applySupabaseSchema, testSupabaseConnection } from '../database/supabase';

async function main() {
  console.log('🚀 Running Voltly Schema Migration on Supabase...');
  const conn = await testSupabaseConnection();
  if (!conn.connected) {
    console.error('❌ Cannot run migration. Database connection failed:', conn.error);
    process.exit(1);
  }

  const success = await applySupabaseSchema();
  if (success) {
    console.log('🎉 Migration complete! All 11 Voltly tables and initial models are active in Supabase.');
  } else {
    console.error('❌ Migration encountered errors.');
    process.exit(1);
  }
}

main().catch(console.error);

