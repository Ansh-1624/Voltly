import { db, Database } from '../database';
import { evaluateCompatibility } from './compatibility';
import { calculatePricing } from './pricing';
import { calculateRouteDistanceAndEta } from './geo';
import {
  HostPod,
  HostProfile,
  GuestVehicle,
  VehicleCategory,
  RejectionReason,
} from '../types';

export interface CandidatePod {
  pod: HostPod;
  host: HostProfile;
  distanceKm: number;
  durationMinutes: number;
  effectivePowerKw: number;
  pricePerMinute: number;
  estimatedTotalCost: number;
  maxSessionMinutes: number;
  score: number;
  matchReasons: string[];
  safetyReserveKm: number;
}

export interface RecommendationEngineResult {
  hasRecommendation: boolean;
  bestOption?: CandidatePod;
  candidatesEvaluated: number;
  filterSummary: {
    totalPods: number;
    approvedPods: number;
    availablePods: number;
    electricallyCompatible: number;
    reachablePods: number;
  };
  explanation?: string;
  unavailabilityReason?: string;
}

export async function findBestRecommendation(
  database: Database,
  guestId: string,
  guestLat: number,
  guestLng: number,
  batteryPct: number,
  estimatedRangeKm: number,
  vehicle: GuestVehicle,
  vehicleCategory: VehicleCategory
): Promise<RecommendationEngineResult> {
  const allPods = database.getPods();
  const allHosts = database.getHostProfiles();
  const rejectionFeedback = database.getRejectionFeedbackForGuest(guestId);

  // Exclude pods that the guest explicitly rejected in recent feedback
  const rejectedPodIds = new Set<string>();
  const recentRejections = rejectionFeedback.slice(-10);
  for (const feedback of recentRejections) {
    const rec = database.getRecommendationById(feedback.recommendation_id);
    if (rec) {
      rejectedPodIds.add(rec.selected_pod_id);
    }
  }

  // Soft preference weights adjusted based on rejection history
  let distanceWeight = 1.0;
  let costWeight = 1.0;
  let speedWeight = 1.0;

  for (const fb of rejectionFeedback) {
    switch (fb.rejection_reason) {
      case 'TOO_EXPENSIVE':
        costWeight += 1.5;
        break;
      case 'SPEED_TOO_SLOW':
        speedWeight += 1.5;
        break;
      case 'TOO_FAR_DETOUR':
      case 'OUTSIDE_REACHABLE_RANGE':
        distanceWeight += 2.0;
        break;
    }
  }

  const filterSummary = {
    totalPods: allPods.length,
    approvedPods: 0,
    availablePods: 0,
    electricallyCompatible: 0,
    reachablePods: 0,
  };

  const validCandidates: CandidatePod[] = [];

  for (const pod of allPods) {
    const host = allHosts.find((h) => h.id === pod.host_id);
    if (!host) continue;

    // Hard Constraint 1: Must be APPROVED
    if (pod.verification_status !== 'APPROVED' || host.verification_status !== 'APPROVED') {
      continue;
    }
    filterSummary.approvedPods++;

    // Hard Constraint 2: Must be AVAILABLE and not occupied
    if (pod.status !== 'AVAILABLE') {
      continue;
    }

    // Hard Constraint 3: Host simultaneous sessions limit
    const activeSessions = database.getActiveSessionsForHost(host.id);
    if (activeSessions.length >= host.max_simultaneous_sessions) {
      continue;
    }
    filterSummary.availablePods++;

    // Hard Constraint 4: Electrical compatibility
    const compat = evaluateCompatibility(host, pod, vehicle);
    if (!compat.compatible) {
      continue;
    }
    filterSummary.electricallyCompatible++;

    // Hard Constraint 5: Route calculation and reachability
    const route = await calculateRouteDistanceAndEta(
      guestLat,
      guestLng,
      host.latitude,
      host.longitude
    );

    // 20% safety reserve on estimated range
    const requiredRangeWithReserve = route.distanceKm * 1.2;
    if (requiredRangeWithReserve > estimatedRangeKm) {
      // Unreachable
      continue;
    }
    filterSummary.reachablePods++;

    // If this pod was explicitly rejected earlier in the search session, skip unless no other options exist
    const isPreviouslyRejected = rejectedPodIds.has(pod.id);

    // Calculate dynamic pricing
    const pricing = calculatePricing(
      compat.effectivePowerKw,
      host.electricity_tariff,
      vehicleCategory
    );

    // Ranking algorithm:
    // Base score starts at 100
    // Higher is better:
    // - Distance penalty: -(distanceKm * 3.5 * distanceWeight)
    // - Power bonus: +(effectivePowerKw * 10 * speedWeight)
    // - Tariff penalty: -(host.electricity_tariff * 2.5 * costWeight)
    // - Rejection penalty: -50 if previously rejected
    let score =
      100 -
      route.distanceKm * 3.5 * distanceWeight +
      compat.effectivePowerKw * 10 * speedWeight -
      host.electricity_tariff * 2.5 * costWeight;

    if (isPreviouslyRejected) {
      score -= 50;
    }

    const matchReasons: string[] = [
      `Fully verified ${pod.socket_type} household socket matching your EVSE plug.`,
      `Verified continuous safe output: ${compat.effectivePowerKw} kW.`,
      `Reachable within safe range: ${route.distanceKm} km away (~${route.durationMinutes} min ETA), with ${Math.round(
        estimatedRangeKm - requiredRangeWithReserve
      )} km reserve remaining.`,
      `Electricity tariff: ₹${host.electricity_tariff.toFixed(2)}/kWh (Est. ₹${pricing.pricePerMinute.toFixed(
        2
      )}/min).`,
    ];

    validCandidates.push({
      pod,
      host,
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      effectivePowerKw: compat.effectivePowerKw,
      pricePerMinute: pricing.pricePerMinute,
      estimatedTotalCost: pricing.estimatedTotalMaxCost,
      maxSessionMinutes: pricing.maxSessionMinutes,
      score,
      matchReasons,
      safetyReserveKm: Number(requiredRangeWithReserve.toFixed(1)),
    });
  }

  if (validCandidates.length === 0) {
    let unavailabilityReason = 'No suitable charging pod currently meets all criteria.';
    if (filterSummary.approvedPods === 0) {
      unavailabilityReason = 'No approved charging pods are currently active in your region.';
    } else if (filterSummary.availablePods === 0) {
      unavailabilityReason = 'All compatible charging pods are currently occupied or unavailable.';
    } else if (filterSummary.electricallyCompatible === 0) {
      unavailabilityReason =
        'No charging pods are electrically compatible with your vehicle connector and portable EVSE plug.';
    } else if (filterSummary.reachablePods === 0) {
      unavailabilityReason = `Nearby compatible chargers are outside your estimated remaining range (${estimatedRangeKm} km with a 20% safety reserve).`;
    }

    return {
      hasRecommendation: false,
      candidatesEvaluated: allPods.length,
      filterSummary,
      unavailabilityReason,
    };
  }

  // Sort descending by score to pick the single best recommendation
  validCandidates.sort((a, b) => b.score - a.score);
  const best = validCandidates[0];

  const feedbackNotes =
    rejectionFeedback.length > 0
      ? ` Adapted to your preferences based on ${rejectionFeedback.length} previous feedback signal(s).`
      : '';

  const explanation =
    `Guardian Angel selected Pod "${best.pod.pod_name}" as your optimal charging match.${feedbackNotes} ` +
    `It offers verified 16A earthing, ${best.effectivePowerKw} kW effective charging speed, ` +
    `and is conveniently located ${best.distanceKm} km away (~${best.durationMinutes} min travel time). ` +
    `Rate is locked at ₹${best.pricePerMinute.toFixed(2)}/min (₹${best.host.electricity_tariff}/kWh).`;

  return {
    hasRecommendation: true,
    bestOption: best,
    candidatesEvaluated: allPods.length,
    filterSummary,
    explanation,
  };
}

