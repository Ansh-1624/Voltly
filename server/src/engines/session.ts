import crypto from 'crypto';
import { Database } from '../database';
import { ChargingSession, SessionBill, SessionStatus } from '../types';

export interface StopSessionResult {
  session: ChargingSession;
  bill: SessionBill;
  message: string;
}

/**
 * Checks session duration against category maximums.
 * If elapsed time exceeded max_duration_minutes, marks session as LIMIT_REACHED.
 */
export function checkSessionLimits(database: Database, session: ChargingSession): ChargingSession {
  if (session.status !== 'ACTIVE') {
    return session;
  }

  const startTime = new Date(session.started_at).getTime();
  const now = Date.now();
  const elapsedMinutes = (now - startTime) / (60 * 1000);

  if (elapsedMinutes >= session.max_duration_minutes) {
    const updated = database.updateSession(session.id, {
      status: 'LIMIT_REACHED',
    });
    return updated || session;
  }

  return session;
}

/**
 * Host physically confirms shutdown and stops the charging session.
 * Calculates duration, energy, final bill, and frees the pod.
 */
export async function stopChargingSession(
  database: Database,
  sessionId: string,
  hostUserId: string,
  isLimitShutdown: boolean = false
): Promise<StopSessionResult> {
  return await database.transaction<StopSessionResult>((db) => {
    const session = db.getSessionById(sessionId);
    if (!session) {
      throw new Error('Charging session not found');
    }

    if (session.status === 'COMPLETED' || session.status === 'STOPPED_BY_HOST') {
      const existingBill = db.getBillBySessionId(sessionId);
      if (existingBill) {
        return {
          session,
          bill: existingBill,
          message: 'Charging session was already stopped.',
        };
      }
    }

    // Verify host ownership
    const hostProfile = db.getHostProfileByUserId(hostUserId);
    if (!hostProfile || hostProfile.id !== session.host_id) {
      throw new Error('Unauthorized: Only the host can stop this charging session.');
    }

    const nowIso = new Date().toISOString();
    const startTime = new Date(session.started_at).getTime();
    const endTime = new Date(nowIso).getTime();

    // Duration in minutes (at least 1 minute, rounded to nearest minute)
    const rawMinutes = (endTime - startTime) / (60 * 1000);
    const durationMinutes = Math.max(1, Math.round(rawMinutes));

    // Cap at max duration if limit was reached
    const billedMinutes = Math.min(durationMinutes, session.max_duration_minutes);

    // Energy calculation: (P_kW * minutes) / 60
    const estimatedEnergyKwh = Number(
      ((session.effective_power_kw * billedMinutes) / 60).toFixed(2)
    );

    // Final amount: billedMinutes * lockedPricePerMinute
    const finalAmount = Number((billedMinutes * session.locked_price_per_minute).toFixed(2));

    const finalStatus: SessionStatus = isLimitShutdown ? 'COMPLETED' : 'STOPPED_BY_HOST';

    // Update session
    const updatedSession = db.updateSession(session.id, {
      status: finalStatus,
      ended_at: nowIso,
      host_shutdown_confirmed_at: nowIso,
    })!;

    // Return pod to AVAILABLE
    db.updatePod(session.pod_id, {
      status: 'AVAILABLE',
    });

    // Create or update SessionBill
    let bill = db.getBillBySessionId(session.id);
    if (!bill) {
      bill = {
        id: crypto.randomUUID(),
        session_id: session.id,
        duration_minutes: billedMinutes,
        estimated_energy_kwh: estimatedEnergyKwh,
        final_amount: finalAmount,
        payment_status: 'PENDING',
        payment_method: 'UPI',
        created_at: nowIso,
      };
      db.addBill(bill);
    }

    return {
      session: updatedSession,
      bill,
      message: `Session terminated. Final bill: ₹${finalAmount.toFixed(2)} (${billedMinutes} min, ~${estimatedEnergyKwh} kWh).`,
    };
  });
}
