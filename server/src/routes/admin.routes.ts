import { Router, Response } from 'express';
import { db } from '../database';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth';

export const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(requireRole(['ADMIN']));

/**
 * Admin Platform Overview
 */
adminRouter.get('/overview', (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  const hosts = db.getHostProfiles();
  const pods = db.getPods();
  const sessions = db.getSessions();
  const bills = db.getBills();

  const pendingPods = pods.filter(
    (p) => p.verification_status === 'PENDING' || p.verification_status === 'NEEDS_REVIEW'
  );

  const activeSessions = sessions.filter(
    (s) => s.status === 'ACTIVE' || s.status === 'LIMIT_REACHED'
  );

  const totalRevenue = bills.reduce((acc, b) => acc + (b.final_amount || 0), 0);

  return res.json({
    metrics: {
      totalUsers: users.length,
      totalHosts: hosts.length,
      totalPods: pods.length,
      approvedPods: pods.filter((p) => p.verification_status === 'APPROVED').length,
      pendingVerifications: pendingPods.length,
      activeSessions: activeSessions.length,
      completedSessions: sessions.filter((s) => s.status === 'COMPLETED' || s.status === 'STOPPED_BY_HOST').length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
    },
    pendingPods: pendingPods.map((p) => {
      const host = db.getHostProfileById(p.host_id);
      const hostUser = host ? db.getUserById(host.user_id) : null;
      return {
        ...p,
        host,
        hostUser,
      };
    }),
    recentSessions: sessions.slice(-10).map((s) => ({
      ...s,
      pod: db.getPodById(s.pod_id),
      bill: db.getBillBySessionId(s.id),
      host: db.getHostProfileById(s.host_id),
    })),
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
    })),
  });
});

/**
 * Approve a charging pod and host installation
 */
adminRouter.post('/pods/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const pod = db.getPodById(req.params.id);
  if (!pod) return res.status(404).json({ error: 'Pod not found' });

  const host = db.getHostProfileById(pod.host_id);
  if (!host) return res.status(404).json({ error: 'Host not found' });

  // Update pod and host verification status
  const updatedPod = db.updatePod(pod.id, {
    verification_status: 'APPROVED',
    status: 'AVAILABLE',
    admin_notes: 'Electrical safety review passed by Voltly Compliance Admin.',
  });

  db.updateHostProfile(host.id, {
    verification_status: 'APPROVED',
    earthing_confirmed: true,
    checked_by_electrician: true,
  });

  return res.json({
    message: `Pod "${pod.pod_name}" approved successfully. It is now eligible for Guardian Angel recommendations.`,
    pod: updatedPod,
  });
});

/**
 * Reject a charging pod with specific reason
 */
adminRouter.post('/pods/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  const { reason = 'Unsafe wiring or non-compliant earthing declaration.' } = req.body;

  const pod = db.getPodById(req.params.id);
  if (!pod) return res.status(404).json({ error: 'Pod not found' });

  const updatedPod = db.updatePod(pod.id, {
    verification_status: 'REJECTED',
    admin_notes: reason,
    status: 'REJECTED',
  });

  return res.json({
    message: `Pod "${pod.pod_name}" rejected.`,
    pod: updatedPod,
  });
});

/**
 * Flag pod as needing review
 */
adminRouter.patch('/pods/:id/flag', (req: AuthenticatedRequest, res: Response) => {
  const { notes = 'Physical inspection or certificate upload required.' } = req.body;

  const pod = db.getPodById(req.params.id);
  if (!pod) return res.status(404).json({ error: 'Pod not found' });

  const updatedPod = db.updatePod(pod.id, {
    verification_status: 'NEEDS_REVIEW',
    admin_notes: notes,
  });

  return res.json({
    message: `Pod "${pod.pod_name}" flagged for review.`,
    pod: updatedPod,
  });
});

