export type UserRole = 'HOST' | 'GUEST' | 'ADMIN';

export type VehicleCategory = 'TWO_WHEELER' | 'FOUR_WHEELER';

export type ElectricitySupplyType = 'SINGLE_PHASE' | 'THREE_PHASE' | 'NOT_SURE';

export type VerificationStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED';

export type PodStatus = 'AVAILABLE' | 'OCCUPIED' | 'TEMPORARILY_UNAVAILABLE' | 'PENDING_VERIFICATION' | 'REJECTED';

export type EarthingStatus = 'PROPER' | 'UNCERTAIN' | 'NONE';

export type SocketType = '16A_3PIN' | '6A_3PIN' | 'IEC_60309_INDUSTRIAL' | 'OTHER';

export type VehicleConnector = 'IEC_62196_TYPE_2' | 'TYPE_1' | 'GB_T' | 'PROPRIETARY' | '16A_3PIN';

export type RecommendationStatus = 'RECOMMENDED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type RejectionReason =
  | 'OUTSIDE_REACHABLE_RANGE'
  | 'TOO_FAR_DETOUR'
  | 'TOO_EXPENSIVE'
  | 'INCOMPATIBLE_CONNECTOR'
  | 'SPEED_TOO_SLOW'
  | 'WAITING_TIME_TOO_LONG'
  | 'UNCOMFORTABLE_LOCATION'
  | 'OTHER';

export type SessionStatus = 'ACTIVE' | 'LIMIT_REACHED' | 'STOPPED_BY_HOST' | 'COMPLETED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'DISPUTED';

export type PaymentMethod = 'UPI' | 'CASH' | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  google_id?: string;
  role: UserRole;
  role_selected?: boolean;
  created_at: string;
}

export interface HostProfile {
  id: string;
  user_id: string;
  household_location: string;
  latitude: number;
  longitude: number;
  electricity_supply_type: ElectricitySupplyType;
  sanctioned_load_kw: number;
  electricity_tariff: number; // in ₹/kWh
  max_simultaneous_sessions: number; // 1 or 2
  verification_status: VerificationStatus;
  earthing_confirmed: boolean;
  checked_by_electrician: boolean;
  notes?: string;
  created_at: string;
}

export interface HostPod {
  id: string;
  host_id: string;
  pod_name: string;
  socket_type: SocketType;
  rated_current_a: number;
  rated_voltage_v: number;
  verified_safe_power_kw: number;
  earthing_status: EarthingStatus;
  availability_schedule: string;
  status: PodStatus;
  verification_status: VerificationStatus;
  admin_notes?: string;
  created_at: string;
}

export interface GuestProfile {
  id: string;
  user_id: string;
  vehicle_category: VehicleCategory;
  created_at: string;
}

export interface VehicleModel {
  id: string;
  manufacturer: string;
  model: string;
  variant: string;
  category: VehicleCategory;
  battery_capacity_kwh: number;
  ac_charging_supported: boolean;
  max_ac_charging_power_kw: number;
  vehicle_connector: VehicleConnector;
  specification_verified: boolean;
  typical_range_km: number;
  image_url?: string;
}

export interface GuestVehicle {
  id: string;
  guest_id: string;
  vehicle_model_id?: string;
  custom_manufacturer?: string;
  custom_model?: string;
  battery_capacity_kwh: number;
  vehicle_connector: VehicleConnector;
  max_ac_power_kw: number;
  ac_charging_supported: boolean;
  evse_make_model?: string;
  evse_supply_plug: SocketType;
  evse_rated_power_kw: number;
  evse_vehicle_connector: VehicleConnector;
  created_at: string;
}

export interface Recommendation {
  id: string;
  guest_id: string;
  selected_pod_id: string;
  guest_lat: number;
  guest_lng: number;
  initial_battery_pct: number;
  estimated_range_km: number;
  estimated_distance_km: number;
  estimated_eta_minutes: number;
  status: RecommendationStatus;
  why_selected_reason: string;
  ranking_score: number;
  created_at: string;
  pod?: HostPod;
  host?: HostProfile;
}

export interface RecommendationFeedback {
  id: string;
  recommendation_id: string;
  guest_id: string;
  rejection_reason: RejectionReason;
  custom_notes?: string;
  created_at: string;
}

export interface QRToken {
  id: string;
  token_hash: string;
  raw_token_demo?: string;
  guest_id: string;
  host_id: string;
  pod_id: string;
  recommendation_id: string;
  expires_at: string;
  used_at?: string | null;
  created_at: string;
}

export interface ChargingSession {
  id: string;
  guest_id: string;
  host_id: string;
  pod_id: string;
  qr_token_id: string;
  started_at: string;
  ended_at?: string | null;
  max_duration_minutes: number;
  locked_price_per_minute: number;
  effective_power_kw: number;
  status: SessionStatus;
  host_shutdown_confirmed_at?: string | null;
  created_at: string;
}

export interface SessionBill {
  id: string;
  session_id: string;
  duration_minutes: number;
  estimated_energy_kwh: number;
  measured_energy_kwh?: number;
  final_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_marked_by?: string;
  created_at: string;
}

