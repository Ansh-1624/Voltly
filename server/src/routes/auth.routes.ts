import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { User, UserRole } from '../types';

export const authRouter = Router();

/**
 * Demo Login: One-click sign-in for pre-seeded host, guest, or admin accounts
 */
authRouter.post('/demo-login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found in demo database' });
  }

  const token = generateToken(user);
  return res.json({
    user,
    token,
    message: `Signed in as ${user.name} (${user.role})`,
  });
});

/**
 * Google OAuth Login or Register
 */
authRouter.post('/google', (req, res) => {
  const { credential, email, name, role = 'GUEST' } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  let user = db.getUserByEmail(email);
  if (!user) {
    // Create new user
    user = {
      id: crypto.randomUUID(),
      name,
      email,
      role: role as UserRole,
      google_id: credential ? `google-${email}` : undefined,
      created_at: new Date().toISOString(),
    };
    db.addUser(user);
  }

  const token = generateToken(user);
  return res.json({
    user,
    token,
  });
});

/**
 * Get current user with associated host/guest profile
 */
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const hostProfile = db.getHostProfileByUserId(user.id);
  const guestProfile = db.getGuestProfileByUserId(user.id);
  const guestVehicle = guestProfile ? db.getGuestVehicleByGuestId(guestProfile.id) : null;

  return res.json({
    user,
    hostProfile,
    guestProfile,
    guestVehicle,
  });
});

/**
 * Role selection or switching
 */
authRouter.patch('/role', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.body;
  if (!role || !['HOST', 'GUEST', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Valid role (HOST, GUEST, ADMIN) is required' });
  }

  const updatedUser = db.updateUser(req.user!.id, { role: role as UserRole });
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const token = generateToken(updatedUser);
  return res.json({
    user: updatedUser,
    token,
    message: `Role switched to ${role}`,
  });
});

