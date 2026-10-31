import { Router, Response } from 'express';
import { db } from '../database';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { generateQRToken, verifyAndStartSession } from '../engines/qr';

export const qrRouter = Router();

qrRouter.use(authMiddleware);

/**
 * Guest generates single-use secure QR code upon arrival at host location
 */
qrRouter.post('/generate', requireRole(['GUEST', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const { recommendationId, guestLat, guestLng, skipProximityCheck = false } = req.body;

  if (!recommendationId) {
    return res.status(400).json({ error: 'recommendationId is required.' });
  }

  const guestProfile = db.getGuestProfileByUserId(req.user!.id);
  if (!guestProfile) {
    return res.status(400).json({ error: 'Guest profile not found.' });
  }

  try {
    const result = await generateQRToken(db, {
      guestId: guestProfile.id,
      recommendationId,
      guestLat: guestLat !== undefined ? Number(guestLat) : undefined,
      guestLng: guestLng !== undefined ? Number(guestLng) : undefined,
      skipProximityCheck: Boolean(skipProximityCheck),
    });

    return res.json({
      message: 'QR code generated. Present this to your host to authorize charging.',
      token: result.token,
      expiresAt: result.qrToken.expires_at,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to generate QR token' });
  }
});

/**
 * Host scans guest QR code to verify and atomically initiate charging session
 */
qrRouter.post('/scan', requireRole(['HOST', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'QR token string is required.' });
  }

  try {
    const result = await verifyAndStartSession(db, req.user!.id, token);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
      });
    }

    return res.json({
      success: true,
      message: result.message,
      session: result.session,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal error during QR verification' });
  }
});
