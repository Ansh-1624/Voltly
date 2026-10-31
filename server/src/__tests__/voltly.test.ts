import { evaluateCompatibility } from '../engines/compatibility';
import { calculatePricing } from '../engines/pricing';
import { findBestRecommendation } from '../engines/recommendation';
import { generateQRToken, verifyAndStartSession } from '../engines/qr';
import { checkSessionLimits, stopChargingSession } from '../engines/session';
import { Database } from '../database';
import { runSeed } from '../database/seed';
import { HostProfile, HostPod, GuestVehicle } from '../types';

describe('Voltly Engine Test Suite', () => {
  let testDb: Database;

  beforeEach(() => {
    testDb = new Database(undefined, true); // In-memory database for clean isolated tests
    runSeed(testDb);
  });

  // ==========================================
  // 1. COMPATIBILITY TESTS
  // ==========================================
  describe('Electrical Compatibility Engine', () => {
    const validHost: HostProfile = {
      id: 'h-1',
      user_id: 'u-1',
      household_location: 'Indiranagar',
      latitude: 12.9716,
      longitude: 77.6412,
      electricity_supply_type: 'SINGLE_PHASE',
      sanctioned_load_kw: 5.0,
      electricity_tariff: 8.5,
      max_simultaneous_sessions: 1,
      verification_status: 'APPROVED',
      earthing_confirmed: true,
      checked_by_electrician: true,
      created_at: new Date().toISOString(),
    };

    const validPod: HostPod = {
      id: 'p-1',
      host_id: 'h-1',
      pod_name: 'Pod A',
      socket_type: '16A_3PIN',
      rated_current_a: 16,
      rated_voltage_v: 230,
      verified_safe_power_kw: 3.3,
      earthing_status: 'PROPER',
      availability_schedule: '24/7',
      status: 'AVAILABLE',
      verification_status: 'APPROVED',
      created_at: new Date().toISOString(),
    };

    const validVehicle: GuestVehicle = {
      id: 'v-1',
      guest_id: 'g-1',
      battery_capacity_kwh: 40.5,
      vehicle_connector: 'IEC_62196_TYPE_2',
      max_ac_power_kw: 3.3,
      ac_charging_supported: true,
      evse_supply_plug: '16A_3PIN',
      evse_rated_power_kw: 3.3,
      evse_vehicle_connector: 'IEC_62196_TYPE_2',
      created_at: new Date().toISOString(),
    };

    it('should approve fully compatible socket, EVSE, and vehicle', () => {
      const res = evaluateCompatibility(validHost, validPod, validVehicle);
      expect(res.compatible).toBe(true);
      expect(res.effectivePowerKw).toBe(3.3);
      expect(res.reasons.length).toBe(0);
    });

    it('should reject incompatible socket and EVSE supply plug', () => {
      const mismatchEVSE = { ...validVehicle, evse_supply_plug: '6A_3PIN' as any };
      const res = evaluateCompatibility(validHost, validPod, mismatchEVSE);
      expect(res.compatible).toBe(false);
      expect(res.reasons.some((r) => r.includes('Socket mismatch'))).toBe(true);
    });

    it('should reject connector mismatch between EVSE output and vehicle inlet', () => {
      const mismatchConnector = { ...validVehicle, vehicle_connector: 'TYPE_1' as any };
      const res = evaluateCompatibility(validHost, validPod, mismatchConnector);
      expect(res.compatible).toBe(false);
      expect(res.reasons.some((r) => r.includes('Connector mismatch'))).toBe(true);
    });

    it('should reject vehicle when AC charging is unsupported', () => {
      const noAcVehicle = { ...validVehicle, ac_charging_supported: false };
      const res = evaluateCompatibility(validHost, validPod, noAcVehicle);
      expect(res.compatible).toBe(false);
      expect(res.reasons.some((r) => r.includes('does not support AC'))).toBe(true);
    });

    it('should reject unverified host installation and uncertain earthing', () => {
      const unverifiedHost = { ...validHost, verification_status: 'PENDING' as any };
      const res = evaluateCompatibility(unverifiedHost, validPod, validVehicle);
      expect(res.compatible).toBe(false);

      const uncertainEarthingPod = { ...validPod, earthing_status: 'UNCERTAIN' as any };
      const res2 = evaluateCompatibility(validHost, uncertainEarthingPod, validVehicle);
      expect(res2.compatible).toBe(false);
      expect(res2.reasons.some((r) => r.includes('earthing is unverified'))).toBe(true);
    });

    it('should enforce the lowest power bottleneck: min(P_vehicle, P_evse, P_host)', () => {
      const lowerHostPod = { ...validPod, verified_safe_power_kw: 2.5 };
      const res = evaluateCompatibility(validHost, lowerHostPod, validVehicle);
      expect(res.compatible).toBe(true);
      expect(res.effectivePowerKw).toBe(2.5);
    });
  });

  // ==========================================
  // 2. PRICING TESTS
  // ==========================================
  describe('Dynamic Pricing Engine', () => {
    it('should correctly calculate energy per minute, price per minute, and session limits', () => {
      // 3.3 kW power at ₹8.50/kWh tariff for 4-wheeler
      const p = calculatePricing(3.3, 8.5, 'FOUR_WHEELER');
      expect(p.effectivePowerKw).toBe(3.3);
      expect(p.energyPerMinuteKwh).toBeCloseTo(3.3 / 60, 4);
      expect(p.pricePerMinute).toBeCloseTo((3.3 / 60) * 8.5, 4);
      expect(p.maxSessionMinutes).toBe(120); // 4W max 120 min
      expect(p.estimatedTotalMaxCost).toBeCloseTo(p.pricePerMinute * 120, 2);
    });

    it('should enforce 60 minute duration limit for two-wheelers', () => {
      const p = calculatePricing(1.4, 9.0, 'TWO_WHEELER');
      expect(p.maxSessionMinutes).toBe(60);
      expect(p.estimatedTotalEnergyKwh).toBeCloseTo((1.4 / 60) * 60, 2);
    });

    it('should throw error on invalid power or negative tariff', () => {
      expect(() => calculatePricing(0, 8.5, 'FOUR_WHEELER')).toThrow();
      expect(() => calculatePricing(3.3, -5, 'FOUR_WHEELER')).toThrow();
    });
  });

  // ==========================================
  // 3. GUARDIAN ANGEL RECOMMENDATION TESTS
  // ==========================================
  describe('Guardian Angel Recommendation Engine', () => {
    it('should recommend the best compatible option for guest', async () => {
      const guestVehicle = testDb.getGuestVehicleByGuestId('gp-1')!;
      const res = await findBestRecommendation(
        testDb,
        'gp-1',
        12.9716, // Near Indiranagar
        77.6412,
        60, // 60% battery
        150, // 150 km estimated range
        guestVehicle,
        'FOUR_WHEELER'
      );

      expect(res.hasRecommendation).toBe(true);
      expect(res.bestOption).toBeDefined();
      expect(res.bestOption?.pod.verification_status).toBe('APPROVED');
      expect(res.bestOption?.pod.status).toBe('AVAILABLE');
      expect(res.explanation).toContain('Guardian Angel');
    });

    it('should exclude unreachable options exceeding remaining range + 20% reserve', async () => {
      const guestVehicle = testDb.getGuestVehicleByGuestId('gp-1')!;
      // Coordinates located in Yelahanka (far north of Bangalore), ~25 km away
      const res = await findBestRecommendation(
        testDb,
        'gp-1',
        13.1000,
        77.5900,
        5,
        5.0, // 5 km remaining range (cannot reach Indiranagar 25 km away)
        guestVehicle,
        'FOUR_WHEELER'
      );

      expect(res.hasRecommendation).toBe(false);
      expect(res.unavailabilityReason).toContain('remaining range');
    });

    it('should exclude occupied and unapproved pods', async () => {
      // Mark pod-1a as OCCUPIED
      testDb.updatePod('pod-1a', { status: 'OCCUPIED' });

      const guestVehicle = testDb.getGuestVehicleByGuestId('gp-1')!;
      const res = await findBestRecommendation(
        testDb,
        'gp-1',
        12.9716,
        77.6412,
        60,
        150,
        guestVehicle,
        'FOUR_WHEELER'
      );

      // Should pick pod-2a (Koramangala) instead of pod-1a
      expect(res.hasRecommendation).toBe(true);
      expect(res.bestOption?.pod.id).toBe('pod-2a');
    });

    it('should adapt ranking based on accumulated rejection feedback', async () => {
      const guestVehicle = testDb.getGuestVehicleByGuestId('gp-1')!;

      // Add feedback that a previous pod was too expensive
      testDb.addRejectionFeedback({
        id: 'rf-1',
        recommendation_id: 'dummy',
        guest_id: 'gp-1',
        rejection_reason: 'TOO_EXPENSIVE',
        created_at: new Date().toISOString(),
      });

      const res = await findBestRecommendation(
        testDb,
        'gp-1',
        12.9716,
        77.6412,
        60,
        150,
        guestVehicle,
        'FOUR_WHEELER'
      );

      expect(res.hasRecommendation).toBe(true);
      expect(res.explanation).toContain('Adapted to your preferences');
    });
  });

  // ==========================================
  // 4. QR VERIFICATION & SESSION TESTS
  // ==========================================
  describe('QR Generation and Session Authorization', () => {
    it('should generate valid QR and atomically initiate charging session on host scan', async () => {
      // Create accepted recommendation
      const rec = testDb.addRecommendation({
        id: 'rec-test-1',
        guest_id: 'gp-1',
        selected_pod_id: 'pod-1a',
        guest_lat: 12.9716,
        guest_lng: 77.6412,
        initial_battery_pct: 50,
        estimated_range_km: 100,
        estimated_distance_km: 2.5,
        estimated_eta_minutes: 8,
        status: 'ACCEPTED',
        why_selected_reason: 'Optimal match',
        ranking_score: 95,
        created_at: new Date().toISOString(),
      });

      // Guest generates QR
      const qrRes = await generateQRToken(testDb, {
        guestId: 'gp-1',
        recommendationId: rec.id,
        skipProximityCheck: true,
      });

      expect(qrRes.token).toBeDefined();

      // Host scans QR
      const hostUser = testDb.getUserById('user-host-1')!;
      const scanRes = await verifyAndStartSession(testDb, hostUser.id, qrRes.token);

      expect(scanRes.success).toBe(true);
      expect(scanRes.session).toBeDefined();
      expect(scanRes.session?.status).toBe('ACTIVE');
      expect(scanRes.session?.locked_price_per_minute).toBeGreaterThan(0);

      // Verify pod is now OCCUPIED in database
      const podAfter = testDb.getPodById('pod-1a')!;
      expect(podAfter.status).toBe('OCCUPIED');
    });

    it('should reject reused QR tokens (single-use guarantee)', async () => {
      const rec = testDb.addRecommendation({
        id: 'rec-test-2',
        guest_id: 'gp-1',
        selected_pod_id: 'pod-2a',
        guest_lat: 12.9345,
        guest_lng: 77.6265,
        initial_battery_pct: 50,
        estimated_range_km: 100,
        estimated_distance_km: 2.0,
        estimated_eta_minutes: 6,
        status: 'ACCEPTED',
        why_selected_reason: 'Optimal',
        ranking_score: 95,
        created_at: new Date().toISOString(),
      });

      const qrRes = await generateQRToken(testDb, {
        guestId: 'gp-1',
        recommendationId: rec.id,
        skipProximityCheck: true,
      });

      const hostUser = testDb.getUserById('user-host-2')!;

      // First scan succeeds
      const firstScan = await verifyAndStartSession(testDb, hostUser.id, qrRes.token);
      expect(firstScan.success).toBe(true);

      // Second scan MUST fail
      const secondScan = await verifyAndStartSession(testDb, hostUser.id, qrRes.token);
      expect(secondScan.success).toBe(false);
      expect(secondScan.message).toContain('already been used');
    });

    it('should reject scan from unauthorized host (wrong host)', async () => {
      const rec = testDb.addRecommendation({
        id: 'rec-test-3',
        guest_id: 'gp-1',
        selected_pod_id: 'pod-1a', // Rajesh's pod
        guest_lat: 12.9716,
        guest_lng: 77.6412,
        initial_battery_pct: 50,
        estimated_range_km: 100,
        estimated_distance_km: 2.0,
        estimated_eta_minutes: 6,
        status: 'ACCEPTED',
        why_selected_reason: 'Optimal',
        ranking_score: 95,
        created_at: new Date().toISOString(),
      });

      const qrRes = await generateQRToken(testDb, {
        guestId: 'gp-1',
        recommendationId: rec.id,
        skipProximityCheck: true,
      });

      // Priya Patel (user-host-2) tries to scan Rajesh Sharma's guest QR
      const wrongHost = testDb.getUserById('user-host-2')!;
      const res = await verifyAndStartSession(testDb, wrongHost.id, qrRes.token);
      expect(res.success).toBe(false);
      expect(res.message).toContain('not authorized to scan');
    });

    it('should reject expired QR tokens', async () => {
      const rec = testDb.addRecommendation({
        id: 'rec-test-4',
        guest_id: 'gp-1',
        selected_pod_id: 'pod-1a',
        guest_lat: 12.9716,
        guest_lng: 77.6412,
        initial_battery_pct: 50,
        estimated_range_km: 100,
        estimated_distance_km: 2.0,
        estimated_eta_minutes: 6,
        status: 'ACCEPTED',
        why_selected_reason: 'Optimal',
        ranking_score: 95,
        created_at: new Date().toISOString(),
      });

      const qrRes = await generateQRToken(testDb, {
        guestId: 'gp-1',
        recommendationId: rec.id,
        skipProximityCheck: true,
      });

      // Expire token manually
      testDb.updateQRToken(qrRes.qrToken.id, {
        expires_at: new Date(Date.now() - 60000).toISOString(),
      });

      const hostUser = testDb.getUserById('user-host-1')!;
      const scanRes = await verifyAndStartSession(testDb, hostUser.id, qrRes.token);
      expect(scanRes.success).toBe(false);
      expect(scanRes.message).toContain('expired');
    });
  });

  // ==========================================
  // 5. BILLING AND SESSION STOP TESTS
  // ==========================================
  describe('Session Stop and Billing Engine', () => {
    it('should stop charging session and accurately compute bill and energy', async () => {
      // Create active session started 30 minutes ago
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const activeSession = testDb.addSession({
        id: 'sess-test-1',
        guest_id: 'gp-1',
        host_id: 'hp-1',
        pod_id: 'pod-1a',
        qr_token_id: 'qr-1',
        started_at: thirtyMinsAgo,
        ended_at: null,
        max_duration_minutes: 120,
        locked_price_per_minute: 0.4675,
        effective_power_kw: 3.3,
        status: 'ACTIVE',
        host_shutdown_confirmed_at: null,
        created_at: thirtyMinsAgo,
      });

      testDb.updatePod('pod-1a', { status: 'OCCUPIED' });

      // Host stops session
      const hostUser = testDb.getUserById('user-host-1')!;
      const stopRes = await stopChargingSession(testDb, activeSession.id, hostUser.id, false);

      expect(stopRes.session.status).toBe('STOPPED_BY_HOST');
      expect(stopRes.bill).toBeDefined();
      expect(stopRes.bill.duration_minutes).toBe(30);
      expect(stopRes.bill.estimated_energy_kwh).toBeCloseTo((3.3 * 30) / 60, 2);
      expect(stopRes.bill.final_amount).toBeCloseTo(30 * 0.4675, 2);

      // Verify pod status reset to AVAILABLE
      const podAfter = testDb.getPodById('pod-1a')!;
      expect(podAfter.status).toBe('AVAILABLE');
    });

    it('should transition to LIMIT_REACHED when maximum duration is reached', () => {
      // Two-wheeler with 60 min limit started 65 mins ago
      const sixtyFiveMinsAgo = new Date(Date.now() - 65 * 60 * 1000).toISOString();
      const session = testDb.addSession({
        id: 'sess-test-limit',
        guest_id: 'gp-2',
        host_id: 'hp-1',
        pod_id: 'pod-1a',
        qr_token_id: 'qr-limit',
        started_at: sixtyFiveMinsAgo,
        ended_at: null,
        max_duration_minutes: 60, // 2W limit
        locked_price_per_minute: 0.20,
        effective_power_kw: 1.4,
        status: 'ACTIVE',
        created_at: sixtyFiveMinsAgo,
      });

      const checked = checkSessionLimits(testDb, session);
      expect(checked.status).toBe('LIMIT_REACHED');
    });
  });
});
