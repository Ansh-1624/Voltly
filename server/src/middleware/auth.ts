import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import { User, UserRole } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'voltly_super_secure_jwt_secret_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: UserRole;
      email?: string;
      name?: string;
    };

    let user = db.getUserById(decoded.userId);
    if (!user) {
      user = (await db.getUserByIdAsync(decoded.userId)) || undefined;
    }

    // Serverless cold-start resilience: reconstruct from cryptographically verified token claims
    if (!user && decoded.userId && decoded.email) {
      user = {
        id: decoded.userId,
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email,
        role: decoded.role,
        role_selected: true,
        created_at: new Date().toISOString(),
      };
      db.addUser(user);
    }

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }
    next();
  };
}

export function generateToken(user: User): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

