import { HostPod, HostProfile, GuestVehicle } from '../types';

export interface CompatibilityResult {
  compatible: boolean;
  reasons: string[];
  effectivePowerKw: number;
  checks: {
    podApproved: boolean;
    earthingSafe: boolean;
    electricianVerified: boolean;
    socketMatched: boolean;
    connectorMatched: boolean;
    acChargingSupported: boolean;
    powerLimitValid: boolean;
  };
}

/**
 * Validates the full electrical chain:
 * Household socket -> Portable EVSE supply plug -> EVSE electronics -> EVSE vehicle plug -> Vehicle AC inlet
 */
export function evaluateCompatibility(
  host: HostProfile,
  pod: HostPod,
  vehicle: GuestVehicle
): CompatibilityResult {
  const reasons: string[] = [];

  // 1. Pod Verification Status
  const podApproved = pod.verification_status === 'APPROVED' && host.verification_status === 'APPROVED';
  if (!podApproved) {
    reasons.push(`Host pod or host profile has not completed admin electrical safety approval (Status: ${pod.verification_status})`);
  }

  // 2. Earthing & Electrical Safety
  const earthingSafe = host.earthing_confirmed && pod.earthing_status === 'PROPER';
  if (!earthingSafe) {
    reasons.push('Host earthing is unverified, missing, or marked uncertain. Grounding is mandatory for EV charging safety.');
  }

  // 3. Electrician Check
  const electricianVerified = host.checked_by_electrician === true;
  if (!electricianVerified) {
    reasons.push('Host installation has not been certified by a qualified electrician.');
  }

  // 4. Socket Compatibility (Host Socket -> EVSE Supply Plug)
  // Both must match. 16A_3PIN household socket requires a 16A_3PIN supply plug on EVSE.
  const socketMatched = Boolean(
    pod.socket_type &&
    vehicle.evse_supply_plug &&
    pod.socket_type === vehicle.evse_supply_plug &&
    vehicle.evse_supply_plug !== 'NOT_SURE' as any
  );
  if (!socketMatched) {
    reasons.push(`Socket mismatch: Host supplies ${pod.socket_type || 'Unknown'} but EVSE requires ${vehicle.evse_supply_plug || 'Unknown'}`);
  }

  // 5. Vehicle AC Charging Support
  const acChargingSupported = Boolean(vehicle.ac_charging_supported);
  if (!acChargingSupported) {
    reasons.push('Vehicle does not support AC destination charging.');
  }

  // 6. Connector Compatibility (EVSE Vehicle End -> Vehicle Inlet)
  const connectorMatched = Boolean(
    vehicle.vehicle_connector &&
    vehicle.evse_vehicle_connector &&
    vehicle.vehicle_connector === vehicle.evse_vehicle_connector
  );
  if (!connectorMatched) {
    reasons.push(`Connector mismatch: EVSE outputs ${vehicle.evse_vehicle_connector} but vehicle accepts ${vehicle.vehicle_connector}`);
  }

  // 7. Power Limit Enforcement
  // P_effective = min(P_vehicle_AC, P_EVSE, P_host_supply)
  const hostPower = pod.verified_safe_power_kw || 0;
  const evsePower = vehicle.evse_rated_power_kw || 0;
  const vehiclePower = vehicle.max_ac_power_kw || 0;

  const powerLimitValid = hostPower > 0 && evsePower > 0 && vehiclePower > 0;
  if (!powerLimitValid) {
    reasons.push('Incomplete or invalid electrical power specifications.');
  }

  const effectivePowerKw = powerLimitValid ? Math.min(hostPower, evsePower, vehiclePower) : 0;

  const compatible =
    podApproved &&
    earthingSafe &&
    electricianVerified &&
    socketMatched &&
    acChargingSupported &&
    connectorMatched &&
    powerLimitValid &&
    effectivePowerKw > 0;

  return {
    compatible,
    reasons,
    effectivePowerKw: Number(effectivePowerKw.toFixed(2)),
    checks: {
      podApproved,
      earthingSafe,
      electricianVerified,
      socketMatched,
      connectorMatched,
      acChargingSupported,
      powerLimitValid,
    },
  };
}
