import { Router, Response } from 'express';
import { db } from '../database';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { checkSessionLimits, stopChargingSession } from '../engines/session';

export const sessionRouter = Router();

sessionRouter.use(authMiddleware);

/**
 * Get details of a session (with live status & duration limit check)
 */
sessionRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  let session = db.getSessionById(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Check limits
  session = checkSessionLimits(db, session);

  const pod = db.getPodById(session.pod_id);
  const host = db.getHostProfileById(session.host_id);
  const hostUser = host ? db.getUserById(host.user_id) : null;
  const guest = db.getGuestProfiles().find((g) => g.id === session.guest_id);
  const guestUser = guest ? db.getUserById(guest.user_id) : null;
  const bill = db.getBillBySessionId(session.id);

  // Live elapsed calculations
  const now = Date.now();
  const startTime = new Date(session.started_at).getTime();
  const endTime = session.ended_at ? new Date(session.ended_at).getTime() : now;
  const elapsedMinutes = Math.max(1, Math.ceil((endTime - startTime) / (60 * 1000)));
  const billedMinutes = Math.min(elapsedMinutes, session.max_duration_minutes);
  const currentEstimatedCost = Number((billedMinutes * session.locked_price_per_minute).toFixed(2));
  const currentEstimatedEnergyKwh = Number(
    ((session.effective_power_kw * billedMinutes) / 60).toFixed(2)
  );

  return res.json({
    session,
    pod,
    host: {
      ...host,
      name: hostUser?.name,
      phone: hostUser?.phone,
    },
    guest: {
      name: guestUser?.name,
      phone: guestUser?.phone,
    },
    liveStats: {
      elapsedMinutes,
      billedMinutes,
      remainingMinutes: Math.max(0, session.max_duration_minutes - elapsedMinutes),
      currentEstimatedCost,
      currentEstimatedEnergyKwh,
    },
    bill,
  });
});

/**
 * Host manually stops the charging session
 */
sessionRouter.post('/:id/stop', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await stopChargingSession(db, req.params.id, req.user!.id, false);
    return res.json({
      message: result.message,
      session: result.session,
      bill: result.bill,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to stop charging session' });
  }
});

/**
 * Host physically confirms shutdown after LIMIT_REACHED
 */
sessionRouter.post('/:id/confirm-shutdown', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await stopChargingSession(db, req.params.id, req.user!.id, true);
    return res.json({
      message: 'Physical shutdown confirmed. Charging session safely concluded.',
      session: result.session,
      bill: result.bill,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to confirm shutdown' });
  }
});

/**
 * Get bill for a completed session
 */
sessionRouter.get('/:id/bill', (req: AuthenticatedRequest, res: Response) => {
  const bill = db.getBillBySessionId(req.params.id);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not generated or session still in progress.' });
  }

  const session = db.getSessionById(bill.session_id);
  const pod = session ? db.getPodById(session.pod_id) : null;
  const host = session ? db.getHostProfileById(session.host_id) : null;
  const hostUser = host ? db.getUserById(host.user_id) : null;
  const guest = session ? db.getGuestProfiles().find((g) => g.id === session.guest_id) : null;
  const guestUser = guest ? db.getUserById(guest.user_id) : null;

  return res.json({
    bill,
    session,
    pod,
    host: {
      name: hostUser?.name,
      phone: hostUser?.phone,
      location: host?.household_location,
      tariff: host?.electricity_tariff,
    },
    guest: {
      name: guestUser?.name,
      phone: guestUser?.phone,
    },
  });
});

/**
 * Update self-reported payment status (UPI, Cash)
 */
sessionRouter.patch('/:id/payment', (req: AuthenticatedRequest, res: Response) => {
  const { payment_status = 'PAID', payment_method = 'UPI' } = req.body;

  const bill = db.getBillBySessionId(req.params.id);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found' });
  }

  const updatedBill = db.updateBill(bill.id, {
    payment_status,
    payment_method,
    payment_marked_by: req.user!.role,
  });

  return res.json({
    message: `Payment status marked as ${payment_status} via ${payment_method} (self-reported).`,
    bill: updatedBill,
  });
});
