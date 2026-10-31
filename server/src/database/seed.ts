import crypto from 'crypto';
import { db } from './index';
import {
  User,
  HostProfile,
  HostPod,
  GuestProfile,
  VehicleModel,
  GuestVehicle,
  ChargingSession,
  SessionBill,
} from '../types';

export function runSeed(database = db) {
  database.clearAll();

  // 1. Vehicle Catalogue
  const vehicles: VehicleModel[] = [
    {
      id: 'vm-nexon-ev',
      manufacturer: 'Tata Motors',
      model: 'Nexon EV',
      variant: 'Empowered Plus LR',
      category: 'FOUR_WHEELER',
      battery_capacity_kwh: 40.5,
      ac_charging_supported: true,
      max_ac_charging_power_kw: 3.3,
      vehicle_connector: 'IEC_62196_TYPE_2',
      specification_verified: true,
      typical_range_km: 320,
    },
    {
      id: 'vm-mg-zs',
      manufacturer: 'MG',
      model: 'ZS EV',
      variant: 'Exclusive Pro',
      category: 'FOUR_WHEELER',
      battery_capacity_kwh: 50.3,
      ac_charging_supported: true,
      max_ac_charging_power_kw: 3.3,
      vehicle_connector: 'IEC_62196_TYPE_2',
      specification_verified: true,
      typical_range_km: 380,
    },
    {
      id: 'vm-tiago-ev',
      manufacturer: 'Tata Motors',
      model: 'Tiago EV',
      variant: 'XT LR',
      category: 'FOUR_WHEELER',
      battery_capacity_kwh: 24.0,
      ac_charging_supported: true,
      max_ac_charging_power_kw: 3.3,
      vehicle_connector: 'IEC_62196_TYPE_2',
      specification_verified: true,
      typical_range_km: 210,
    },
    {
      id: 'vm-ather-450x',
      manufacturer: 'Ather Energy',
      model: '450X',
      variant: 'Gen 3 Apex',
      category: 'TWO_WHEELER',
      battery_capacity_kwh: 3.7,
      ac_charging_supported: true,
      max_ac_charging_power_kw: 1.4,
      vehicle_connector: 'IEC_62196_TYPE_2',
      specification_verified: true,
      typical_range_km: 110,
    },
    {
      id: 'vm-ola-s1-pro',
      manufacturer: 'Ola Electric',
      model: 'S1 Pro',
      variant: 'Gen 2',
      category: 'TWO_WHEELER',
      battery_capacity_kwh: 4.0,
      ac_charging_supported: true,
      max_ac_charging_power_kw: 1.5,
      vehicle_connector: '16A_3PIN',
      specification_verified: true,
      typical_range_km: 145,
    },
    {
      id: 'vm-tvs-iqube',
      manufacturer: 'TVS',
      model: 'iQube',
      variant: 'ST 5.1 kWh',
      category: 'TWO_WHEELER',
      battery_capacity_kwh: 5.1,
      ac_charging_supported: true,
      max_ac_charging_power_kw: 1.0,
      vehicle_connector: '16A_3PIN',
      specification_verified: true,
      typical_range_km: 150,
    },
  ];

  vehicles.forEach((v) => database.addVehicleModel(v));

  // 2. Users: Admin, Hosts, Guests
  const adminUser: User = {
    id: 'user-admin-1',
    name: 'Voltly Compliance Officer',
    email: 'admin@voltly.com',
    phone: '+91 98765 00000',
    role: 'ADMIN',
    created_at: new Date().toISOString(),
  };

  const hostUser1: User = {
    id: 'user-host-1',
    name: 'Rajesh Sharma',
    email: 'rajesh.host@voltly.com',
    phone: '+91 98801 12345',
    role: 'HOST',
    created_at: new Date().toISOString(),
  };

  const hostUser2: User = {
    id: 'user-host-2',
    name: 'Priya Patel',
    email: 'priya.host@voltly.com',
    phone: '+91 98802 23456',
    role: 'HOST',
    created_at: new Date().toISOString(),
  };

  const hostUser3: User = {
    id: 'user-host-3',
    name: 'Arun Mehta (Pending Host)',
    email: 'arun.host@voltly.com',
    phone: '+91 98803 34567',
    role: 'HOST',
    created_at: new Date().toISOString(),
  };

  const guestUser1: User = {
    id: 'user-guest-1',
    name: 'Vikram Rao (Nexon EV)',
    email: 'vikram.guest@voltly.com',
    phone: '+91 99001 45678',
    role: 'GUEST',
    created_at: new Date().toISOString(),
  };

  const guestUser2: User = {
    id: 'user-guest-2',
    name: 'Ananya Iyer (Ather 450X)',
    email: 'ananya.guest@voltly.com',
    phone: '+91 99002 56789',
    role: 'GUEST',
    created_at: new Date().toISOString(),
  };

  [adminUser, hostUser1, hostUser2, hostUser3, guestUser1, guestUser2].forEach((u) =>
    database.addUser(u)
  );

  // 3. Host Profiles
  // Coordinates centered around Bangalore (Indiranagar: 12.9716, 77.6412)
  const hostProfile1: HostProfile = {
    id: 'hp-1',
    user_id: hostUser1.id,
    household_location: '12th Main, HAL 2nd Stage, Indiranagar, Bengaluru',
    latitude: 12.9716,
    longitude: 77.6412,
    electricity_supply_type: 'SINGLE_PHASE',
    sanctioned_load_kw: 5.0,
    electricity_tariff: 8.5,
    max_simultaneous_sessions: 1,
    verification_status: 'APPROVED',
    earthing_confirmed: true,
    checked_by_electrician: true,
    notes: 'Ground floor covered garage with dedicated MCB switch and heavy-duty 16A earthing.',
    created_at: new Date().toISOString(),
  };

  const hostProfile2: HostProfile = {
    id: 'hp-2',
    user_id: hostUser2.id,
    household_location: '4th Cross, Koramangala 4th Block, Bengaluru',
    latitude: 12.9345,
    longitude: 77.6265,
    electricity_supply_type: 'SINGLE_PHASE',
    sanctioned_load_kw: 6.0,
    electricity_tariff: 9.0,
    max_simultaneous_sessions: 1,
    verification_status: 'APPROVED',
    earthing_confirmed: true,
    checked_by_electrician: true,
    notes: 'Porch outlet with 16A socket and rain shelter canopy.',
    created_at: new Date().toISOString(),
  };

  const hostProfile3: HostProfile = {
    id: 'hp-3',
    user_id: hostUser3.id,
    household_location: 'Outer Ring Road, Marathahalli, Bengaluru',
    latitude: 12.9569,
    longitude: 77.7011,
    electricity_supply_type: 'NOT_SURE',
    sanctioned_load_kw: 3.0,
    electricity_tariff: 8.0,
    max_simultaneous_sessions: 1,
    verification_status: 'PENDING',
    earthing_confirmed: false,
    checked_by_electrician: false,
    notes: 'Awaiting electrician confirmation and earthing check.',
    created_at: new Date().toISOString(),
  };

  [hostProfile1, hostProfile2, hostProfile3].forEach((hp) => database.addHostProfile(hp));

  // 4. Host Pods (up to 2 per host)
  const pod1A: HostPod = {
    id: 'pod-1a',
    host_id: hostProfile1.id,
    pod_name: 'Indiranagar Driveway Pod #1',
    socket_type: '16A_3PIN',
    rated_current_a: 16,
    rated_voltage_v: 230,
    verified_safe_power_kw: 3.3,
    earthing_status: 'PROPER',
    availability_schedule: 'All days, 06:00 AM - 11:00 PM',
    status: 'AVAILABLE',
    verification_status: 'APPROVED',
    created_at: new Date().toISOString(),
  };

  const pod1B: HostPod = {
    id: 'pod-1b',
    host_id: hostProfile1.id,
    pod_name: 'Indiranagar Garage Pod #2',
    socket_type: '16A_3PIN',
    rated_current_a: 16,
    rated_voltage_v: 230,
    verified_safe_power_kw: 3.0,
    earthing_status: 'PROPER',
    availability_schedule: 'Weekends only, 09:00 AM - 06:00 PM',
    status: 'PENDING_VERIFICATION',
    verification_status: 'PENDING',
    admin_notes: 'Under admin review for secondary wiring safety.',
    created_at: new Date().toISOString(),
  };

  const pod2A: HostPod = {
    id: 'pod-2a',
    host_id: hostProfile2.id,
    pod_name: 'Koramangala Green Port #1',
    socket_type: '16A_3PIN',
    rated_current_a: 16,
    rated_voltage_v: 230,
    verified_safe_power_kw: 3.3,
    earthing_status: 'PROPER',
    availability_schedule: '24/7 Available',
    status: 'AVAILABLE',
    verification_status: 'APPROVED',
    created_at: new Date().toISOString(),
  };

  const pod3A: HostPod = {
    id: 'pod-3a',
    host_id: hostProfile3.id,
    pod_name: 'Marathahalli Balcony Pod',
    socket_type: '16A_3PIN',
    rated_current_a: 16,
    rated_voltage_v: 230,
    verified_safe_power_kw: 2.8,
    earthing_status: 'UNCERTAIN',
    availability_schedule: 'Evenings 07:00 PM - 10:00 PM',
    status: 'PENDING_VERIFICATION',
    verification_status: 'NEEDS_REVIEW',
    admin_notes: 'Earthing self-declaration marked uncertain. Requires professional certificate.',
    created_at: new Date().toISOString(),
  };

  [pod1A, pod1B, pod2A, pod3A].forEach((p) => database.addPod(p));

  // 5. Guest Profiles & Registered Vehicles
  const guestProfile1: GuestProfile = {
    id: 'gp-1',
    user_id: guestUser1.id,
    vehicle_category: 'FOUR_WHEELER',
    created_at: new Date().toISOString(),
  };

  const guestVehicle1: GuestVehicle = {
    id: 'gv-1',
    guest_id: guestProfile1.id,
    vehicle_model_id: 'vm-nexon-ev',
    battery_capacity_kwh: 40.5,
    vehicle_connector: 'IEC_62196_TYPE_2',
    max_ac_power_kw: 3.3,
    ac_charging_supported: true,
    evse_make_model: 'Tata Portable AC EVSE Cable',
    evse_supply_plug: '16A_3PIN',
    evse_rated_power_kw: 3.3,
    evse_vehicle_connector: 'IEC_62196_TYPE_2',
    created_at: new Date().toISOString(),
  };

  const guestProfile2: GuestProfile = {
    id: 'gp-2',
    user_id: guestUser2.id,
    vehicle_category: 'TWO_WHEELER',
    created_at: new Date().toISOString(),
  };

  const guestVehicle2: GuestVehicle = {
    id: 'gv-2',
    guest_id: guestProfile2.id,
    vehicle_model_id: 'vm-ather-450x',
    battery_capacity_kwh: 3.7,
    vehicle_connector: 'IEC_62196_TYPE_2',
    max_ac_power_kw: 1.4,
    ac_charging_supported: true,
    evse_make_model: 'Ather Portable Dot Charger',
    evse_supply_plug: '16A_3PIN',
    evse_rated_power_kw: 1.4,
    evse_vehicle_connector: 'IEC_62196_TYPE_2',
    created_at: new Date().toISOString(),
  };

  database.addGuestProfile(guestProfile1);
  database.addGuestVehicle(guestVehicle1);
  database.addGuestProfile(guestProfile2);
  database.addGuestVehicle(guestVehicle2);

  // 6. Realistic Past Sessions & Bills
  const pastSession: ChargingSession = {
    id: 'sess-past-1',
    guest_id: guestProfile1.id,
    host_id: hostProfile1.id,
    pod_id: pod1A.id,
    qr_token_id: 'qr-past-1',
    started_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    max_duration_minutes: 120,
    locked_price_per_minute: 0.4675,
    effective_power_kw: 3.3,
    status: 'COMPLETED',
    host_shutdown_confirmed_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  };

  const pastBill: SessionBill = {
    id: 'bill-past-1',
    session_id: pastSession.id,
    duration_minutes: 60,
    estimated_energy_kwh: 3.3,
    final_amount: 28.05,
    payment_status: 'PAID',
    payment_method: 'UPI',
    payment_marked_by: 'GUEST',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  };

  database.addSession(pastSession);
  database.addBill(pastBill);

  console.log('✅ Voltly seed data successfully populated.');
}

if (require.main === module) {
  runSeed();
}
