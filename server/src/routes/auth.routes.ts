import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../database';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { User, UserRole } from '../types';

export const authRouter = Router();

/**
 * Email Sign In or Register
 */
authRouter.post('/login', (req, res) => {
  const { email, name, role = 'GUEST' } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const isAdmin = normalizedEmail === 'admin@voltly.com' || normalizedEmail.endsWith('@voltly-admin.com');

  let user = db.getUserByEmail(normalizedEmail);
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      name: isAdmin ? (name || 'Voltly Compliance Officer') : (name || normalizedEmail.split('@')[0]),
      email: normalizedEmail,
      role: isAdmin ? 'ADMIN' : (role as UserRole),
      created_at: new Date().toISOString(),
    };
    db.addUser(user);
  } else if (isAdmin && user.role !== 'ADMIN') {
    user = db.updateUser(user.id, { role: 'ADMIN' }) || user;
  }

  const token = generateToken(user);
  return res.json({
    user,
    token,
  });
});

/**
 * Admin Credentials Login: Validates admin email & security passcode
 */
authRouter.post('/admin-login', (req, res) => {
  const { email, password, passcode } = req.body;
  const key = (password || passcode || '').trim();

  if (!email || !key) {
    return res.status(400).json({ error: 'Admin email and security passcode are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const validPasscodes = [
    process.env.ADMIN_SECURITY_KEY,
    'voltly2026',
    'admin123',
    'admin2026',
  ].filter(Boolean);

  if (!validPasscodes.includes(key)) {
    return res.status(401).json({ error: 'Invalid admin security passcode. Access denied.' });
  }

  let user = db.getUserByEmail(normalizedEmail);
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      name: 'Voltly Compliance Officer',
      email: normalizedEmail,
      role: 'ADMIN',
      created_at: new Date().toISOString(),
    };
    db.addUser(user);
  } else if (user.role !== 'ADMIN') {
    user = db.updateUser(user.id, { role: 'ADMIN' }) || user;
  }

  const token = generateToken(user);
  return res.json({
    user,
    token,
    message: 'Admin authorization granted',
  });
});

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
  const { credential, email, name, role, mode } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const isAdmin = normalizedEmail === 'admin@voltly.com' || normalizedEmail.endsWith('@voltly-admin.com');

  let user = db.getUserByEmail(normalizedEmail);
  let isNewUser = false;

  if (!user) {
    // If user clicked "Log In" specifically and the account doesn't exist yet
    if (mode === 'login') {
      return res.status(404).json({
        error: 'No Voltly account found for this email. Please switch to Sign Up to create an account.',
        notFound: true,
      });
    }

    // Brand new user registration
    isNewUser = true;
    user = {
      id: crypto.randomUUID(),
      name: isAdmin ? (name || 'Voltly Compliance Officer') : (name || normalizedEmail.split('@')[0]),
      email: normalizedEmail,
      role: isAdmin ? 'ADMIN' : (role ? (role as UserRole) : 'GUEST'),
      role_selected: isAdmin ? true : (role ? true : false),
      google_id: credential ? `google-${normalizedEmail}` : undefined,
      created_at: new Date().toISOString(),
    };
    db.addUser(user);
  } else {
    // If user is trying to Sign Up with an account that already exists, prompt them to Log In
    if (mode === 'signup') {
      return res.status(409).json({
        error: 'This account already exists. Please log in instead.',
        alreadyExists: true,
      });
    }

    // Existing (pre-registered) user logging in:
    // Retain their registered role and prevent asking Host/Guest again
    if (user.role_selected === undefined) {
      user.role_selected = true;
      db.updateUser(user.id, { role_selected: true });
    }
    if (isAdmin && user.role !== 'ADMIN') {
      user = db.updateUser(user.id, { role: 'ADMIN', role_selected: true }) || user;
    }
  }

  const token = generateToken(user);
  return res.json({
    user,
    token,
    isNewUser,
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

  const updatedUser = db.updateUser(req.user!.id, {
    role: role as UserRole,
    role_selected: true,
  });
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

