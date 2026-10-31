import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { HostProfile, HostPod, PodStatus, VerificationStatus } from '../types';

export const hostRouter = Router();

// Protect all host routes
hostRouter.use(authMiddleware);
hostRouter.use(requireRole(['HOST', 'ADMIN']));

/**
 * Get Host Dashboard overview
 */
hostRouter.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const host = db.getHostProfileByUserId(req.user!.id);
  if (!host) {
    return res.json({
      profileComplete: false,
      message: 'Host profile not initialized. Please complete onboarding.',
    });
  }

  const pods = db.getPodsByHostId(host.id);
  const activeSessions = db.getActiveSessionsForHost(host.id);

  // All completed sessions for this host
  const allHostSessions = db
    .getSessions()
    .filter((s) => s.host_id === host.id && (s.status === 'COMPLETED' || s.status === 'STOPPED_BY_HOST'));

  const totalEarnings = allHostSessions.reduce((acc, sess) => {
    const bill = db.getBillBySessionId(sess.id);
    return acc + (bill?.final_amount || 0);
  }, 0);

  const availablePodsCount = pods.filter(
    (p) => p.status === 'AVAILABLE' && p.verification_status === 'APPROVED'
  ).length;

  const occupiedPodsCount = pods.filter((p) => p.status === 'OCCUPIED').length;
  const pendingPodsCount = pods.filter((p) => p.verification_status === 'PENDING' || p.verification_status === 'NEEDS_REVIEW').length;

  return res.json({
    profileComplete: true,
    host,
    pods,
    activeSessions,
    stats: {
      totalPods: pods.length,
      availablePods: availablePodsCount,
      occupiedPods: occupiedPodsCount,
      pendingPods: pendingPodsCount,
      activeSessionsCount: activeSessions.length,
      completedSessionsCount: allHostSessions.length,
      totalEarnings: Number(totalEarnings.toFixed(2)),
    },
    recentSessions: allHostSessions.slice(-5).map((s) => ({
      ...s,
      bill: db.getBillBySessionId(s.id),
      pod: db.getPodById(s.pod_id),
      guest: db.getUserById(s.guest_id),
    })),
  });
});

/**
 * Create or update Host Profile during onboarding
 */
hostRouter.post('/profile', (req: AuthenticatedRequest, res: Response) => {
  const {
    household_location,
    latitude,
    longitude,
    electricity_supply_type = 'SINGLE_PHASE',
    sanctioned_load_kw = 5.0,
    electricity_tariff = 8.5,
    earthing_confirmed = false,
    checked_by_electrician = false,
    notes,
  } = req.body;

  if (!household_location || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Household location and coordinates are required.' });
  }

  if (electricity_tariff <= 0) {
    return res.status(400).json({ error: 'Electricity tariff must be greater than zero.' });
  }

  let host = db.getHostProfileByUserId(req.user!.id);
  const now = new Date().toISOString();

  // Verification status logic:
  // If earthing or electrician check is false/uncertain, trigger review rather than approval
  let initialVerification: VerificationStatus = 'PENDING';
  if (!earthing_confirmed || !checked_by_electrician) {
    initialVerification = 'NEEDS_REVIEW';
  }

  if (host) {
    host = db.updateHostProfile(host.id, {
      household_location,
      latitude: Number(latitude),
      longitude: Number(longitude),
      electricity_supply_type,
      sanctioned_load_kw: Number(sanctioned_load_kw),
      electricity_tariff: Number(electricity_tariff),
      earthing_confirmed: Boolean(earthing_confirmed),
      checked_by_electrician: Boolean(checked_by_electrician),
      notes,
    })!;
  } else {
    host = {
      id: crypto.randomUUID(),
      user_id: req.user!.id,
      household_location,
      latitude: Number(latitude),
      longitude: Number(longitude),
      electricity_supply_type,
      sanctioned_load_kw: Number(sanctioned_load_kw),
      electricity_tariff: Number(electricity_tariff),
      max_simultaneous_sessions: 1, // Default 1
      verification_status: initialVerification,
      earthing_confirmed: Boolean(earthing_confirmed),
      checked_by_electrician: Boolean(checked_by_electrician),
      notes,
      created_at: now,
    };
    db.addHostProfile(host);
  }

  return res.json({
    message: 'Host profile saved successfully',
    host,
  });
});

/**
 * Get all pods belonging to this host
 */
hostRouter.get('/pods', (req: AuthenticatedRequest, res: Response) => {
  const host = db.getHostProfileByUserId(req.user!.id);
  if (!host) {
    return res.status(400).json({ error: 'Host profile must be created first.' });
  }
  const pods = db.getPodsByHostId(host.id);
  return res.json({ pods });
});

/**
 * Add a new physical charging pod (Max 2 pods per host strictly enforced!)
 */
hostRouter.post('/pods', (req: AuthenticatedRequest, res: Response) => {
  const host = db.getHostProfileByUserId(req.user!.id);
  if (!host) {
    return res.status(400).json({ error: 'Host profile must be created first.' });
  }

  const existingPods = db.getPodsByHostId(host.id);
  if (existingPods.length >= 2) {
    return res.status(400).json({
      error: 'Host pod limit reached. Each host household may list a maximum of 2 physical charging pods.',
    });
  }

  const {
    pod_name,
    socket_type = '16A_3PIN',
    rated_current_a = 16,
    rated_voltage_v = 230,
    verified_safe_power_kw = 3.3,
    earthing_status = 'PROPER',
    availability_schedule = 'All days, 06:00 AM - 11:00 PM',
  } = req.body;

  if (!pod_name) {
    return res.status(400).json({ error: 'Pod name is required.' });
  }

  // Safety cap on power: single phase 16A @ 230V is max ~3.68 kW. Enforce safe cap
  const safePower = Math.min(Number(verified_safe_power_kw) || 3.3, 3.68);

  // New pods start as PENDING verification until reviewed by Admin
  const newPod: HostPod = {
    id: crypto.randomUUID(),
    host_id: host.id,
    pod_name,
    socket_type,
    rated_current_a: Number(rated_current_a),
    rated_voltage_v: Number(rated_voltage_v),
    verified_safe_power_kw: Number(safePower.toFixed(2)),
    earthing_status,
    availability_schedule,
    status: 'AVAILABLE',
    verification_status: 'PENDING',
    created_at: new Date().toISOString(),
  };

  db.addPod(newPod);

  return res.status(201).json({
    message: 'Charging pod added. Submitted to Admin for electrical safety review.',
    pod: newPod,
  });
});

/**
 * Update pod details
 */
hostRouter.put('/pods/:id', (req: AuthenticatedRequest, res: Response) => {
  const host = db.getHostProfileByUserId(req.user!.id);
  if (!host) return res.status(400).json({ error: 'Host not found' });

  const pod = db.getPodById(req.params.id);
  if (!pod || pod.host_id !== host.id) {
    return res.status(404).json({ error: 'Pod not found or not owned by host' });
  }

  const { pod_name, availability_schedule, status, socket_type } = req.body;
  const updated = db.updatePod(pod.id, {
    pod_name: pod_name || pod.pod_name,
    availability_schedule: availability_schedule || pod.availability_schedule,
    status: status || pod.status,
    socket_type: socket_type || pod.socket_type,
  });

  return res.json({ message: 'Pod updated', pod: updated });
});

/**
 * Toggle or update pod availability status
 */
hostRouter.patch('/pods/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const host = db.getHostProfileByUserId(req.user!.id);
  if (!host) return res.status(400).json({ error: 'Host not found' });

  const pod = db.getPodById(req.params.id);
  if (!pod || pod.host_id !== host.id) {
    return res.status(404).json({ error: 'Pod not found' });
  }

  const { status } = req.body;
  if (!status || !['AVAILABLE', 'TEMPORARILY_UNAVAILABLE'].includes(status)) {
    return res.status(400).json({ error: 'Status must be AVAILABLE or TEMPORARILY_UNAVAILABLE' });
  }

  // Cannot manually mark available if occupied by active session
  if (status === 'AVAILABLE') {
    const activeSession = db.getActiveSessionForPod(pod.id);
    if (activeSession) {
      return res.status(400).json({ error: 'Cannot set to AVAILABLE while a charging session is active.' });
    }
  }

  const updated = db.updatePod(pod.id, { status: status as PodStatus });
  return res.json({ message: `Pod status updated to ${status}`, pod: updated });
});
