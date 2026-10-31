import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { findBestRecommendation } from '../engines/recommendation';
import { Recommendation, RejectionReason } from '../types';

export const recommendationRouter = Router();

recommendationRouter.use(authMiddleware);
recommendationRouter.use(requireRole(['GUEST', 'ADMIN']));

/**
 * Guardian Angel: Request the best compatible, reachable charging pod
 */
recommendationRouter.post('/find', async (req: AuthenticatedRequest, res: Response) => {
  const {
    guestLat = 12.9716, // Default to Bengaluru city center if GPS unavailable
    guestLng = 77.5946,
    batteryPct = 35,
    estimatedRangeKm = 45,
  } = req.body;

  const guestProfile = db.getGuestProfileByUserId(req.user!.id);
  if (!guestProfile) {
    return res.status(400).json({ error: 'Please register your vehicle before searching for chargers.' });
  }

  const guestVehicle = db.getGuestVehicleByGuestId(guestProfile.id);
  if (!guestVehicle) {
    return res.status(400).json({ error: 'No vehicle specifications found. Please complete onboarding.' });
  }

  const result = await findBestRecommendation(
    db,
    guestProfile.id,
    Number(guestLat),
    Number(guestLng),
    Number(batteryPct),
    Number(estimatedRangeKm),
    guestVehicle,
    guestProfile.vehicle_category
  );

  if (!result.hasRecommendation || !result.bestOption) {
    return res.json({
      hasRecommendation: false,
      filterSummary: result.filterSummary,
      unavailabilityReason: result.unavailabilityReason,
      message: 'No compatible charging pod is currently reachable.',
    });
  }

  const best = result.bestOption;

  // Persist recommendation record
  const newRec: Recommendation = {
    id: crypto.randomUUID(),
    guest_id: guestProfile.id,
    selected_pod_id: best.pod.id,
    guest_lat: Number(guestLat),
    guest_lng: Number(guestLng),
    initial_battery_pct: Number(batteryPct),
    estimated_range_km: Number(estimatedRangeKm),
    estimated_distance_km: best.distanceKm,
    estimated_eta_minutes: best.durationMinutes,
    status: 'RECOMMENDED',
    why_selected_reason: result.explanation || '',
    ranking_score: Number(best.score.toFixed(2)),
    created_at: new Date().toISOString(),
  };

  db.addRecommendation(newRec);

  return res.json({
    hasRecommendation: true,
    recommendation: {
      ...newRec,
      pod: best.pod,
      host: {
        id: best.host.id,
        household_location: best.host.household_location,
        latitude: best.host.latitude,
        longitude: best.host.longitude,
        electricity_tariff: best.host.electricity_tariff,
      },
      pricing: {
        effectivePowerKw: best.effectivePowerKw,
        pricePerMinute: best.pricePerMinute,
        estimatedTotalCost: best.estimatedTotalCost,
        maxSessionMinutes: best.maxSessionMinutes,
      },
      matchReasons: best.matchReasons,
      safetyReserveKm: best.safetyReserveKm,
      filterSummary: result.filterSummary,
      explanation: result.explanation,
    },
  });
});

/**
 * Accept recommendation: Guest expresses intent to travel
 * Pod is NOT reserved until host verifies QR!
 */
recommendationRouter.post('/:id/accept', (req: AuthenticatedRequest, res: Response) => {
  const rec = db.getRecommendationById(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

  const pod = db.getPodById(rec.selected_pod_id);
  if (!pod || pod.status !== 'AVAILABLE') {
    return res.status(400).json({
      error: 'This charging pod has just become unavailable or occupied. Please search for an updated recommendation.',
    });
  }

  const updated = db.updateRecommendation(rec.id, { status: 'ACCEPTED' });
  const host = db.getHostProfileById(pod.host_id);

  return res.json({
    message: 'Recommendation accepted. Remember: the pod is not reserved until verified via QR upon arrival.',
    recommendation: updated,
    pod,
    host,
  });
});

/**
 * Reject recommendation with adaptive reason
 */
recommendationRouter.post('/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  const { reason, notes } = req.body;
  const validReasons: RejectionReason[] = [
    'OUTSIDE_REACHABLE_RANGE',
    'TOO_FAR_DETOUR',
    'TOO_EXPENSIVE',
    'INCOMPATIBLE_CONNECTOR',
    'SPEED_TOO_SLOW',
    'WAITING_TIME_TOO_LONG',
    'UNCOMFORTABLE_LOCATION',
    'OTHER',
  ];

  if (!reason || !validReasons.includes(reason)) {
    return res.status(400).json({ error: 'Valid rejection reason is required.' });
  }

  const rec = db.getRecommendationById(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

  // Update status
  db.updateRecommendation(rec.id, { status: 'REJECTED' });

  // Record feedback
  db.addRejectionFeedback({
    id: crypto.randomUUID(),
    recommendation_id: rec.id,
    guest_id: rec.guest_id,
    rejection_reason: reason as RejectionReason,
    custom_notes: notes,
    created_at: new Date().toISOString(),
  });

  // Automatically compute next adaptive recommendation
  const guestProfile = db.getGuestProfiles().find((g) => g.id === rec.guest_id);
  const guestVehicle = db.getGuestVehicleByGuestId(rec.guest_id);

  if (!guestProfile || !guestVehicle) {
    return res.json({ message: 'Feedback recorded.' });
  }

  const nextResult = await findBestRecommendation(
    db,
    rec.guest_id,
    rec.guest_lat,
    rec.guest_lng,
    rec.initial_battery_pct,
    rec.estimated_range_km,
    guestVehicle,
    guestProfile.vehicle_category
  );

  let nextRecommendation = null;
  if (nextResult.hasRecommendation && nextResult.bestOption) {
    const best = nextResult.bestOption;
    const newRec: Recommendation = {
      id: crypto.randomUUID(),
      guest_id: rec.guest_id,
      selected_pod_id: best.pod.id,
      guest_lat: rec.guest_lat,
      guest_lng: rec.guest_lng,
      initial_battery_pct: rec.initial_battery_pct,
      estimated_range_km: rec.estimated_range_km,
      estimated_distance_km: best.distanceKm,
      estimated_eta_minutes: best.durationMinutes,
      status: 'RECOMMENDED',
      why_selected_reason: nextResult.explanation || '',
      ranking_score: Number(best.score.toFixed(2)),
      created_at: new Date().toISOString(),
    };
    db.addRecommendation(newRec);

    nextRecommendation = {
      ...newRec,
      pod: best.pod,
      host: best.host,
      pricing: {
        effectivePowerKw: best.effectivePowerKw,
        pricePerMinute: best.pricePerMinute,
        estimatedTotalCost: best.estimatedTotalCost,
        maxSessionMinutes: best.maxSessionMinutes,
      },
      matchReasons: best.matchReasons,
      explanation: nextResult.explanation,
    };
  }

  return res.json({
    message: 'Feedback recorded. Adapted next best recommendation generated.',
    hasNext: Boolean(nextRecommendation),
    nextRecommendation,
    unavailabilityReason: nextResult.unavailabilityReason,
  });
});

/**
 * Recheck availability of accepted pod
 */
recommendationRouter.get('/:id/recheck', (req: AuthenticatedRequest, res: Response) => {
  const rec = db.getRecommendationById(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

  const pod = db.getPodById(rec.selected_pod_id);
  if (!pod) return res.status(404).json({ error: 'Pod not found' });

  const isAvailable = pod.status === 'AVAILABLE' && pod.verification_status === 'APPROVED';

  return res.json({
    isAvailable,
    podStatus: pod.status,
    podName: pod.pod_name,
    message: isAvailable
      ? 'Pod is still available and ready for QR check-in.'
      : `Pod status changed to ${pod.status}. Please request an alternate recommendation.`,
  });
});

