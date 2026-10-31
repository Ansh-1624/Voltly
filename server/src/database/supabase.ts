import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import {
  User,
  HostProfile,
  HostPod,
  GuestProfile,
  GuestVehicle,
  VehicleModel,
  ChargingSession,
  SessionBill,
} from '../types';

export const DEFAULT_DATABASE_URL =
  'postgresql://postgres.tficwfvajwthwoqqvaqy:mahiiaaruu%401624@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

let pool: Pool | null = null;

export function getSupabasePool(): Pool | null {
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
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

/**
 * Sync entire dataset from Supabase PostgreSQL
 */
export async function syncAllFromSupabase(): Promise<{
  users: User[];
  host_profiles: HostProfile[];
  host_pods: HostPod[];
  guest_profiles: GuestProfile[];
  guest_vehicles: GuestVehicle[];
  vehicle_models: VehicleModel[];
  charging_sessions: ChargingSession[];
  session_bills: SessionBill[];
} | null> {
  const p = getSupabasePool();
  if (!p) return null;

  try {
    const client = await p.connect();
    try {
      const [
        usersRes,
        hostsRes,
        podsRes,
        guestsRes,
        vehiclesRes,
        modelsRes,
        sessionsRes,
        billsRes,
      ] = await Promise.all([
        client.query('SELECT * FROM users'),
        client.query('SELECT * FROM host_profiles'),
        client.query('SELECT * FROM host_pods'),
        client.query('SELECT * FROM guest_profiles'),
        client.query('SELECT * FROM guest_vehicles'),
        client.query('SELECT * FROM vehicle_models'),
        client.query('SELECT * FROM charging_sessions'),
        client.query('SELECT * FROM session_bills'),
      ]);

      const users: User[] = usersRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone || undefined,
        google_id: r.google_id || undefined,
        role: r.role,
        role_selected: r.role_selected !== false,
        created_at: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      }));

      const host_profiles: HostProfile[] = hostsRes.rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        household_location: r.household_location,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        electricity_supply_type: r.electricity_supply_type,
        sanctioned_load_kw: Number(r.sanctioned_load_kw),
        electricity_tariff: Number(r.electricity_tariff),
        max_simultaneous_sessions: Number(r.max_simultaneous_sessions),
        verification_status: r.verification_status,
        earthing_confirmed: Boolean(r.earthing_confirmed),
        checked_by_electrician: Boolean(r.checked_by_electrician),
        notes: r.notes || undefined,
        created_at: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      }));

      const host_pods: HostPod[] = podsRes.rows.map((r) => ({
        id: r.id,
        host_id: r.host_id,
        pod_name: r.pod_name,
        socket_type: r.socket_type,
        rated_current_a: Number(r.rated_current_a),
        rated_voltage_v: Number(r.rated_voltage_v),
        verified_safe_power_kw: Number(r.verified_safe_power_kw),
        earthing_status: r.earthing_status,
        availability_schedule: r.availability_schedule,
        status: r.status,
        verification_status: r.verification_status,
        admin_notes: r.admin_notes || undefined,
        created_at: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      }));

      const guest_profiles: GuestProfile[] = guestsRes.rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        vehicle_category: r.vehicle_category,
        created_at: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      }));

      const guest_vehicles: GuestVehicle[] = vehiclesRes.rows.map((r) => ({
        id: r.id,
        guest_id: r.guest_id,
        vehicle_model_id: r.vehicle_model_id || undefined,
        custom_manufacturer: r.custom_manufacturer || undefined,
        custom_model: r.custom_model || undefined,
        battery_capacity_kwh: Number(r.battery_capacity_kwh),
        vehicle_connector: r.vehicle_connector,
        max_ac_power_kw: Number(r.max_ac_power_kw),
        ac_charging_supported: Boolean(r.ac_charging_supported),
        evse_make_model: r.evse_make_model,
        evse_supply_plug: r.evse_supply_plug,
        evse_rated_power_kw: Number(r.evse_rated_power_kw),
        evse_vehicle_connector: r.evse_vehicle_connector,
        created_at: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      }));

      const vehicle_models: VehicleModel[] = modelsRes.rows.map((r) => ({
        id: r.id,
        manufacturer: r.manufacturer,
        model: r.model,
        variant: r.variant,
        category: r.category,
        battery_capacity_kwh: Number(r.battery_capacity_kwh),
        ac_charging_supported: Boolean(r.ac_charging_supported),
        max_ac_charging_power_kw: Number(r.max_ac_charging_power_kw),
        vehicle_connector: r.vehicle_connector,
        specification_verified: Boolean(r.specification_verified),
        typical_range_km: Number(r.typical_range_km),
        image_url: r.image_url || undefined,
      }));

      const charging_sessions: ChargingSession[] = sessionsRes.rows.map((r) => ({
        id: r.id,
        guest_id: r.guest_id,
        host_id: r.host_id,
        pod_id: r.pod_id,
        qr_token_id: r.qr_token_id || `qr-${r.id}`,
        status: r.status,
        effective_power_kw: Number(r.authorized_max_power_kw || r.effective_power_kw || 3.3),
        max_duration_minutes: Number(r.max_duration_minutes || 120),
        locked_price_per_minute: Number(r.locked_price_per_minute || 1.5),
        started_at: r.start_time?.toISOString ? r.start_time.toISOString() : (r.started_at || String(r.start_time || new Date().toISOString())),
        ended_at: r.end_time?.toISOString ? r.end_time.toISOString() : (r.ended_at || (r.end_time ? String(r.end_time) : undefined)),
        host_shutdown_confirmed_at: r.host_shutdown_confirmed_at || undefined,
        created_at: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      }));

      const session_bills: SessionBill[] = billsRes.rows.map((r) => ({
        id: r.id,
        session_id: r.session_id,
        duration_minutes: Number(r.duration_minutes || 60),
        estimated_energy_kwh: Number(r.estimated_energy_kwh || r.energy_delivered_kwh || 3.3),
        measured_energy_kwh: r.measured_energy_kwh ? Number(r.measured_energy_kwh) : undefined,
        final_amount: Number(r.final_amount || r.total_amount_inr || 150),
        payment_status: r.payment_status || 'PAID',
        payment_method: r.payment_method || 'UPI',
        payment_marked_by: r.payment_marked_by || undefined,
        created_at: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      }));

      return {
        users,
        host_profiles,
        host_pods,
        guest_profiles,
        guest_vehicles,
        vehicle_models,
        charging_sessions,
        session_bills,
      };
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('Supabase syncAll failed, relying on local seed store:', err);
    return null;
  }
}

/**
 * Query user by email from Supabase
 */
export async function findUserByEmailInSupabase(email: string): Promise<User | null> {
  const p = getSupabasePool();
  if (!p) return null;
  try {
    const res = await p.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email.trim()]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone || undefined,
      google_id: r.google_id || undefined,
      role: r.role,
      role_selected: r.role_selected !== false,
      created_at: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
    };
  } catch (err) {
    console.warn('findUserByEmailInSupabase error:', err);
    return null;
  }
}

/**
 * Query user by id from Supabase
 */
export async function findUserByIdInSupabase(id: string): Promise<User | null> {
  const p = getSupabasePool();
  if (!p) return null;
  try {
    const res = await p.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone || undefined,
      google_id: r.google_id || undefined,
      role: r.role,
      role_selected: r.role_selected !== false,
      created_at: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
    };
  } catch (err) {
    console.warn('findUserByIdInSupabase error:', err);
    return null;
  }
}

/**
 * Save / Upsert user to Supabase
 */
export async function saveUserToSupabase(user: User): Promise<void> {
  const p = getSupabasePool();
  if (!p) return;
  try {
    await p.query(
      `INSERT INTO users (id, name, email, phone, google_id, role, role_selected, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) 
       DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, role_selected = EXCLUDED.role_selected;`,
      [
        user.id,
        user.name,
        user.email.toLowerCase().trim(),
        user.phone || null,
        user.google_id || null,
        user.role,
        user.role_selected !== false,
        user.created_at || new Date().toISOString(),
      ]
    );
  } catch (err) {
    console.warn('saveUserToSupabase error:', err);
  }
}

/**
 * Save Guest Profile to Supabase
 */
export async function saveGuestProfileToSupabase(gp: GuestProfile): Promise<void> {
  const p = getSupabasePool();
  if (!p) return;
  try {
    await p.query(
      `INSERT INTO guest_profiles (id, user_id, vehicle_category, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET vehicle_category = EXCLUDED.vehicle_category;`,
      [gp.id, gp.user_id, gp.vehicle_category, gp.created_at || new Date().toISOString()]
    );
  } catch (err) {
    console.warn('saveGuestProfileToSupabase error:', err);
  }
}

/**
 * Save Guest Vehicle to Supabase
 */
export async function saveGuestVehicleToSupabase(gv: GuestVehicle): Promise<void> {
  const p = getSupabasePool();
  if (!p) return;
  try {
    await p.query(
      `INSERT INTO guest_vehicles (
        id, guest_id, vehicle_model_id, custom_manufacturer, custom_model,
        battery_capacity_kwh, vehicle_connector, max_ac_power_kw, ac_charging_supported,
        evse_make_model, evse_supply_plug, evse_rated_power_kw, evse_vehicle_connector, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        vehicle_model_id = EXCLUDED.vehicle_model_id,
        battery_capacity_kwh = EXCLUDED.battery_capacity_kwh,
        vehicle_connector = EXCLUDED.vehicle_connector,
        max_ac_power_kw = EXCLUDED.max_ac_power_kw,
        evse_make_model = EXCLUDED.evse_make_model,
        evse_supply_plug = EXCLUDED.evse_supply_plug,
        evse_rated_power_kw = EXCLUDED.evse_rated_power_kw,
        evse_vehicle_connector = EXCLUDED.evse_vehicle_connector;`,
      [
        gv.id,
        gv.guest_id,
        gv.vehicle_model_id || null,
        gv.custom_manufacturer || null,
        gv.custom_model || null,
        gv.battery_capacity_kwh,
        gv.vehicle_connector,
        gv.max_ac_power_kw,
        gv.ac_charging_supported !== false,
        gv.evse_make_model || null,
        gv.evse_supply_plug,
        gv.evse_rated_power_kw,
        gv.evse_vehicle_connector,
        gv.created_at || new Date().toISOString(),
      ]
    );
  } catch (err) {
    console.warn('saveGuestVehicleToSupabase error:', err);
  }
}

/**
 * Save Host Pod to Supabase
 */
export async function saveHostPodToSupabase(pod: HostPod): Promise<void> {
  const p = getSupabasePool();
  if (!p) return;
  try {
    await p.query(
      `INSERT INTO host_pods (
        id, host_id, pod_name, socket_type, rated_current_a, rated_voltage_v,
        verified_safe_power_kw, earthing_status, availability_schedule, status,
        verification_status, admin_notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        verification_status = EXCLUDED.verification_status,
        admin_notes = EXCLUDED.admin_notes;`,
      [
        pod.id,
        pod.host_id,
        pod.pod_name,
        pod.socket_type,
        pod.rated_current_a,
        pod.rated_voltage_v,
        pod.verified_safe_power_kw,
        pod.earthing_status,
        pod.availability_schedule,
        pod.status,
        pod.verification_status,
        pod.admin_notes || null,
        pod.created_at || new Date().toISOString(),
      ]
    );
  } catch (err) {
    console.warn('saveHostPodToSupabase error:', err);
  }
}
