import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

/**
 * Runs on every request: if a valid Bearer token is present, loads the user into req.user.
 * Never rejects — use requireAuth / requireAdmin on routes that need a user.
 */
export async function attachUser(req, _res, next) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const { id } = jwt.verify(header.slice(7), env.jwtSecret);
    const user = await User.findById(id).lean();
    if (user?.isActive) req.user = user;
  } catch {
    // invalid / expired token: treat as anonymous
  }
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized('Please log in to continue.'));
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized('Please log in to continue.'));
  if (req.user.role !== 'admin') return next(ApiError.forbidden('Admin access required.'));
  next();
}
