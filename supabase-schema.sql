-- ========================================================
-- VOLTLY — SUPABASE POSTGRESQL + POSTGIS PRODUCTION SCHEMA
-- ========================================================

-- Enable PostGIS & UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drop existing tables to refresh with flexible TEXT IDs
DROP TABLE IF EXISTS session_bills CASCADE;
DROP TABLE IF EXISTS charging_sessions CASCADE;
DROP TABLE IF EXISTS qr_tokens CASCADE;
DROP TABLE IF EXISTS recommendation_feedback CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS guest_vehicles CASCADE;
DROP TABLE IF EXISTS guest_profiles CASCADE;
DROP TABLE IF EXISTS vehicle_models CASCADE;
DROP TABLE IF EXISTS host_pods CASCADE;
DROP TABLE IF EXISTS host_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  google_id VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'GUEST' CHECK (role IN ('HOST', 'GUEST', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Host Profiles Table
CREATE TABLE IF NOT EXISTS host_profiles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_location TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_geog GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
  electricity_supply_type VARCHAR(50) NOT NULL DEFAULT 'SINGLE_PHASE',
  sanctioned_load_kw NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  electricity_tariff NUMERIC(6,2) NOT NULL DEFAULT 8.50,
  max_simultaneous_sessions INT NOT NULL DEFAULT 1 CHECK (max_simultaneous_sessions IN (1, 2)),
  verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('DRAFT', 'PENDING', 'APPROVED', 'NEEDS_REVIEW', 'REJECTED')),
  earthing_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  checked_by_electrician BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for sub-millisecond PostGIS bounding box queries
CREATE INDEX IF NOT EXISTS idx_host_profiles_geog ON host_profiles USING GIST (location_geog);

-- 3. Host Charging Pods (Max 2 pods per host)
CREATE TABLE IF NOT EXISTS host_pods (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  host_id TEXT NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  pod_name VARCHAR(255) NOT NULL,
  socket_type VARCHAR(50) NOT NULL DEFAULT '16A_3PIN',
  rated_current_a INT NOT NULL DEFAULT 16,
  rated_voltage_v INT NOT NULL DEFAULT 230,
  verified_safe_power_kw NUMERIC(4,2) NOT NULL DEFAULT 3.3,
  earthing_status VARCHAR(30) NOT NULL DEFAULT 'PROPER' CHECK (earthing_status IN ('PROPER', 'UNCERTAIN', 'NONE')),
  availability_schedule TEXT NOT NULL DEFAULT 'All days, 06:00 AM - 11:00 PM',
  status VARCHAR(40) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'TEMPORARILY_UNAVAILABLE', 'PENDING_VERIFICATION', 'REJECTED')),
  verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('DRAFT', 'PENDING', 'APPROVED', 'NEEDS_REVIEW', 'REJECTED')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Vehicle Models Catalogue
CREATE TABLE IF NOT EXISTS vehicle_models (
  id TEXT PRIMARY KEY,
  manufacturer VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  variant VARCHAR(100) NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('TWO_WHEELER', 'FOUR_WHEELER')),
  battery_capacity_kwh NUMERIC(5,2) NOT NULL,
  ac_charging_supported BOOLEAN NOT NULL DEFAULT TRUE,
  max_ac_charging_power_kw NUMERIC(4,2) NOT NULL DEFAULT 3.3,
  vehicle_connector VARCHAR(50) NOT NULL DEFAULT 'IEC_62196_TYPE_2',
  specification_verified BOOLEAN NOT NULL DEFAULT TRUE,
  typical_range_km INT NOT NULL,
  image_url TEXT
);

-- 5. Guest Profiles
CREATE TABLE IF NOT EXISTS guest_profiles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_category VARCHAR(30) NOT NULL CHECK (vehicle_category IN ('TWO_WHEELER', 'FOUR_WHEELER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Guest Registered Vehicles & Portable EVSE Details
CREATE TABLE IF NOT EXISTS guest_vehicles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  guest_id TEXT NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
  vehicle_model_id TEXT REFERENCES vehicle_models(id),
  custom_manufacturer VARCHAR(100),
  custom_model VARCHAR(100),
  battery_capacity_kwh NUMERIC(5,2) NOT NULL,
  vehicle_connector VARCHAR(50) NOT NULL DEFAULT 'IEC_62196_TYPE_2',
  max_ac_power_kw NUMERIC(4,2) NOT NULL DEFAULT 3.3,
  ac_charging_supported BOOLEAN NOT NULL DEFAULT TRUE,
  evse_make_model VARCHAR(255),
  evse_supply_plug VARCHAR(50) NOT NULL DEFAULT '16A_3PIN',
  evse_rated_power_kw NUMERIC(4,2) NOT NULL DEFAULT 3.3,
  evse_vehicle_connector VARCHAR(50) NOT NULL DEFAULT 'IEC_62196_TYPE_2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  guest_id TEXT NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
  selected_pod_id TEXT NOT NULL REFERENCES host_pods(id) ON DELETE CASCADE,
  guest_lat DOUBLE PRECISION NOT NULL,
  guest_lng DOUBLE PRECISION NOT NULL,
  initial_battery_pct INT NOT NULL,
  estimated_range_km NUMERIC(5,1) NOT NULL,
  estimated_distance_km NUMERIC(5,2) NOT NULL,
  estimated_eta_minutes INT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'RECOMMENDED' CHECK (status IN ('RECOMMENDED', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  why_selected_reason TEXT NOT NULL,
  ranking_score NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Recommendation Adaptive Feedback
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  recommendation_id TEXT NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  guest_id TEXT NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
  rejection_reason VARCHAR(60) NOT NULL,
  custom_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Single-Use Cryptographic QR Tokens
CREATE TABLE IF NOT EXISTS qr_tokens (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  guest_id TEXT NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
  host_id TEXT NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  pod_id TEXT NOT NULL REFERENCES host_pods(id) ON DELETE CASCADE,
  recommendation_id TEXT NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Charging Sessions
CREATE TABLE IF NOT EXISTS charging_sessions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  guest_id TEXT NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
  host_id TEXT NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  pod_id TEXT NOT NULL REFERENCES host_pods(id) ON DELETE CASCADE,
  qr_token_id TEXT REFERENCES qr_tokens(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  max_duration_minutes INT NOT NULL,
  locked_price_per_minute NUMERIC(8,4) NOT NULL,
  effective_power_kw NUMERIC(4,2) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LIMIT_REACHED', 'STOPPED_BY_HOST', 'COMPLETED')),
  host_shutdown_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Session Bills
CREATE TABLE IF NOT EXISTS session_bills (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  session_id TEXT NOT NULL REFERENCES charging_sessions(id) ON DELETE CASCADE,
  duration_minutes INT NOT NULL,
  estimated_energy_kwh NUMERIC(6,2) NOT NULL,
  measured_energy_kwh NUMERIC(6,2),
  final_amount NUMERIC(8,2) NOT NULL,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'DISPUTED')),
  payment_method VARCHAR(30) NOT NULL DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'CASH', 'OTHER')),
  payment_marked_by VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- SEED INITIAL VEHICLES
-- ========================================================
INSERT INTO vehicle_models (id, manufacturer, model, variant, category, battery_capacity_kwh, ac_charging_supported, max_ac_charging_power_kw, vehicle_connector, specification_verified, typical_range_km)
VALUES
  ('vm-nexon-ev', 'Tata Motors', 'Nexon EV', 'Empowered Plus LR', 'FOUR_WHEELER', 40.5, true, 3.3, 'IEC_62196_TYPE_2', true, 320),
  ('vm-mg-zs', 'MG', 'ZS EV', 'Exclusive Pro', 'FOUR_WHEELER', 50.3, true, 3.3, 'IEC_62196_TYPE_2', true, 380),
  ('vm-tiago-ev', 'Tata Motors', 'Tiago EV', 'XT LR', 'FOUR_WHEELER', 24.0, true, 3.3, 'IEC_62196_TYPE_2', true, 210),
  ('vm-ather-450x', 'Ather Energy', '450X', 'Gen 3 Apex', 'TWO_WHEELER', 3.7, true, 1.4, 'IEC_62196_TYPE_2', true, 110),
  ('vm-ola-s1-pro', 'Ola Electric', 'S1 Pro', 'Gen 2', 'TWO_WHEELER', 4.0, true, 1.5, '16A_3PIN', true, 145),
  ('vm-tvs-iqube', 'TVS', 'iQube', 'ST 5.1 kWh', 'TWO_WHEELER', 5.1, true, 1.0, '16A_3PIN', true, 150)
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- SEED DEMO USERS
-- ========================================================
INSERT INTO users (id, name, email, phone, role)
VALUES
  ('user-admin-1', 'Voltly Compliance Officer', 'admin@voltly.com', '+91 98765 00000', 'ADMIN'),
  ('user-host-1', 'Rajesh Sharma', 'rajesh.host@voltly.com', '+91 98801 12345', 'HOST'),
  ('user-host-2', 'Priya Patel', 'priya.host@voltly.com', '+91 98802 23456', 'HOST'),
  ('user-host-3', 'Arun Mehta (Pending Host)', 'arun.host@voltly.com', '+91 98803 34567', 'HOST'),
  ('user-guest-1', 'Vikram Rao (Nexon EV)', 'vikram.guest@voltly.com', '+91 99001 45678', 'GUEST'),
  ('user-guest-2', 'Ananya Iyer (Ather 450X)', 'ananya.guest@voltly.com', '+91 99002 56789', 'GUEST')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- SEED DEMO HOST PROFILES
-- ========================================================
INSERT INTO host_profiles (id, user_id, household_location, latitude, longitude, electricity_supply_type, sanctioned_load_kw, electricity_tariff, max_simultaneous_sessions, verification_status, earthing_confirmed, checked_by_electrician, notes)
VALUES
  ('hp-1', 'user-host-1', '12th Main, HAL 2nd Stage, Indiranagar, Bengaluru', 12.9716, 77.6412, 'SINGLE_PHASE', 5.0, 8.5, 1, 'APPROVED', true, true, 'Ground floor covered garage with dedicated MCB switch and heavy-duty 16A earthing.'),
  ('hp-2', 'user-host-2', '4th Cross, Koramangala 4th Block, Bengaluru', 12.9345, 77.6265, 'SINGLE_PHASE', 6.0, 9.0, 1, 'APPROVED', true, true, 'Porch outlet with 16A socket and rain shelter canopy.'),
  ('hp-3', 'user-host-3', 'Outer Ring Road, Marathahalli, Bengaluru', 12.9569, 77.7011, 'NOT_SURE', 3.0, 8.0, 1, 'PENDING', false, false, 'Awaiting electrician confirmation and earthing check.')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- SEED DEMO HOST PODS
-- ========================================================
INSERT INTO host_pods (id, host_id, pod_name, socket_type, rated_current_a, rated_voltage_v, verified_safe_power_kw, earthing_status, availability_schedule, status, verification_status)
VALUES
  ('pod-1a', 'hp-1', 'Indiranagar Driveway Pod #1', '16A_3PIN', 16, 230, 3.3, 'PROPER', 'All days, 06:00 AM - 11:00 PM', 'AVAILABLE', 'APPROVED'),
  ('pod-1b', 'hp-1', 'Indiranagar Garage Pod #2', '16A_3PIN', 16, 230, 3.0, 'PROPER', 'Weekends only, 09:00 AM - 06:00 PM', 'AVAILABLE', 'APPROVED'),
  ('pod-2a', 'hp-2', 'Koramangala Green Port #1', '16A_3PIN', 16, 230, 3.3, 'PROPER', '24/7 Available', 'AVAILABLE', 'APPROVED'),
  ('pod-3a', 'hp-3', 'Marathahalli Balcony Pod', '16A_3PIN', 16, 230, 2.8, 'UNCERTAIN', 'Evenings 07:00 PM - 10:00 PM', 'PENDING_VERIFICATION', 'NEEDS_REVIEW')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- SEED DEMO GUEST PROFILES & VEHICLES
-- ========================================================
INSERT INTO guest_profiles (id, user_id, vehicle_category)
VALUES
  ('gp-1', 'user-guest-1', 'FOUR_WHEELER'),
  ('gp-2', 'user-guest-2', 'TWO_WHEELER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO guest_vehicles (id, guest_id, vehicle_model_id, battery_capacity_kwh, vehicle_connector, max_ac_power_kw, ac_charging_supported, evse_make_model, evse_supply_plug, evse_rated_power_kw, evse_vehicle_connector)
VALUES
  ('gv-1', 'gp-1', 'vm-nexon-ev', 40.5, 'IEC_62196_TYPE_2', 3.3, true, 'Tata Portable AC EVSE Cable', '16A_3PIN', 3.3, 'IEC_62196_TYPE_2'),
  ('gv-2', 'gp-2', 'vm-ather-450x', 3.7, 'IEC_62196_TYPE_2', 1.4, true, 'Ather Portable Dot Charger', '16A_3PIN', 1.4, 'IEC_62196_TYPE_2')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- SEED REALISTIC PAST SESSION & BILL
-- ========================================================
INSERT INTO recommendations (id, guest_id, selected_pod_id, guest_lat, guest_lng, initial_battery_pct, estimated_range_km, estimated_distance_km, estimated_eta_minutes, status, why_selected_reason, ranking_score)
VALUES
  ('rec-past-1', 'gp-1', 'pod-1a', 12.9716, 77.6412, 60, 150, 4.2, 12, 'ACCEPTED', 'Optimal match', 95)
ON CONFLICT (id) DO NOTHING;

INSERT INTO qr_tokens (id, token_hash, guest_id, host_id, pod_id, recommendation_id, expires_at, used_at)
VALUES
  ('qr-past-1', 'hash-past-1', 'gp-1', 'hp-1', 'pod-1a', 'rec-past-1', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO charging_sessions (id, guest_id, host_id, pod_id, qr_token_id, started_at, ended_at, max_duration_minutes, locked_price_per_minute, effective_power_kw, status, host_shutdown_confirmed_at)
VALUES
  ('sess-past-1', 'gp-1', 'hp-1', 'pod-1a', 'qr-past-1', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', 120, 0.4675, 3.3, 'COMPLETED', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO session_bills (id, session_id, duration_minutes, estimated_energy_kwh, final_amount, payment_status, payment_method, payment_marked_by)
VALUES
  ('bill-past-1', 'sess-past-1', 60, 3.3, 28.05, 'PAID', 'UPI', 'GUEST')
ON CONFLICT (id) DO NOTHING;
