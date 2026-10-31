import crypto from 'crypto';
import { Database } from '../database';
import { QRToken, ChargingSession } from '../types';
import { calculateHaversineDistanceKm } from './geo';
import { evaluateCompatibility } from './compatibility';
import { calculatePricing } from './pricing';

export interface GenerateQRParams {
  guestId: string;
  recommendationId: string;
  guestLat?: number;
  guestLng?: number;
  skipProximityCheck?: boolean; // For testing or demo bypass
}

export interface QRVerificationResult {
  success: boolean;
  message: string;
  session?: ChargingSession;
}

/**
 * Generates a cryptographically random, short-lived, single-use QR token
 */
export async function generateQRToken(
  database: Database,
  params: GenerateQRParams
): Promise<{ token: string; qrToken: QRToken }> {
  const recommendation = database.getRecommendationById(params.recommendationId);
  if (!recommendation) {
    throw new Error('Recommendation not found');
  }

  if (recommendation.guest_id !== params.guestId) {
    throw new Error('Unauthorized recommendation access');
  }

  const pod = database.getPodById(recommendation.selected_pod_id);
  if (!pod) {
    throw new Error('Charging pod not found');
  }

  const host = database.getHostProfileById(pod.host_id);
  if (!host) {
    throw new Error('Host not found');
  }

  // Location-proximity check: guest must be near host (within 0.5 km)
  if (!params.skipProximityCheck && params.guestLat !== undefined && params.guestLng !== undefined) {
    const distanceKm = calculateHaversineDistanceKm(
      params.guestLat,
      params.guestLng,
      host.latitude,
      host.longitude
    );
    if (distanceKm > 0.5) {
      throw new Error(
        `Proximity verification failed: You are ${distanceKm.toFixed(
          2
        )} km from the host. Please generate the QR code upon reaching the host location.`
      );
    }
  }

  // Check if pod is still available
  if (pod.status !== 'AVAILABLE') {
    throw new Error('This pod is no longer available. Please request a new recommendation.');
  }

  // Generate 256-bit secure cryptographic token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiryMinutes = 10;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

  const qrToken: QRToken = {
    id: crypto.randomUUID(),
    token_hash: tokenHash,
    guest_id: params.guestId,
    host_id: host.id,
    pod_id: pod.id,
    recommendation_id: recommendation.id,
    expires_at: expiresAt,
    used_at: null,
    created_at: new Date().toISOString(),
  };

  database.addQRToken(qrToken);

  return { token: rawToken, qrToken };
}

/**
 * Validates the scanned token and atomically starts the charging session
 */
export async function verifyAndStartSession(
  database: Database,
  scanningHostUserId: string,
  rawToken: string
): Promise<QRVerificationResult> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  return await database.transaction<QRVerificationResult>((db) => {
    const qrToken = db.getQRTokenByHash(tokenHash);

    if (!qrToken) {
      return { success: false, message: 'Invalid or unrecognized QR code.' };
    }

    // 1. Single-use status check
    if (qrToken.used_at) {
      return { success: false, message: 'This QR code has already been used and cannot be reused.' };
    }

    // 2. Expiry check
    if (new Date(qrToken.expires_at).getTime() < Date.now()) {
      return { success: false, message: 'This QR code has expired. The guest must generate a fresh one.' };
    }

    // 3. Host authorization check
    const hostProfile = db.getHostProfileByUserId(scanningHostUserId);
    if (!hostProfile || hostProfile.id !== qrToken.host_id) {
      return {
        success: false,
        message: 'Host verification failed: You are not authorized to scan for this charging pod.',
      };
    }

    // 4. Pod existence and availability check
    const pod = db.getPodById(qrToken.pod_id);
    if (!pod) {
      return { success: false, message: 'Designated charging pod not found.' };
    }

    if (pod.status !== 'AVAILABLE') {
      return {
        success: false,
        message: `Charging pod "${pod.pod_name}" is currently ${pod.status}. Session cannot be started.`,
      };
    }

    // 5. Host simultaneous capacity check
    const activeSessions = db.getActiveSessionsForHost(hostProfile.id);
    if (activeSessions.length >= hostProfile.max_simultaneous_sessions) {
      return {
        success: false,
        message: `Maximum simultaneous sessions reached (${hostProfile.max_simultaneous_sessions}). Please complete an existing session first.`,
      };
    }

    // 6. Guest vehicle & pricing lookup
    const guestProfile = db.getGuestProfiles().find((g) => g.id === qrToken.guest_id);
    const guestVehicle = db.getGuestVehicleByGuestId(qrToken.guest_id);
    if (!guestProfile || !guestVehicle) {
      return { success: false, message: 'Guest vehicle specifications not found.' };
    }

    const compat = evaluateCompatibility(hostProfile, pod, guestVehicle);
    if (!compat.compatible) {
      return {
        success: false,
        message: `Electrical compatibility check failed: ${compat.reasons.join(', ')}`,
      };
    }

    const pricing = calculatePricing(
      compat.effectivePowerKw,
      hostProfile.electricity_tariff,
      guestProfile.vehicle_category
    );

    const nowIso = new Date().toISOString();

    // 7. Atomic state updates:
    // a. Mark QR token used
    db.updateQRToken(qrToken.id, { used_at: nowIso });

    // b. Mark pod OCCUPIED
    db.updatePod(pod.id, { status: 'OCCUPIED' });

    // c. Mark recommendation ACCEPTED
    db.updateRecommendation(qrToken.recommendation_id, { status: 'ACCEPTED' });

    // d. Create ChargingSession with locked price and effective power
    const newSession: ChargingSession = {
      id: crypto.randomUUID(),
      guest_id: qrToken.guest_id,
      host_id: hostProfile.id,
      pod_id: pod.id,
      qr_token_id: qrToken.id,
      started_at: nowIso,
      ended_at: null,
      max_duration_minutes: pricing.maxSessionMinutes,
      locked_price_per_minute: pricing.pricePerMinute,
      effective_power_kw: compat.effectivePowerKw,
      status: 'ACTIVE',
      host_shutdown_confirmed_at: null,
      created_at: nowIso,
    };

    db.addSession(newSession);

    return {
      success: true,
      message: `Charging session successfully authorized for pod "${pod.pod_name}".`,
      session: newSession,
    };
  });
}

