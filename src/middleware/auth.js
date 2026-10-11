import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

// `v` is the user's tokenVersion: bumping it (password change, role change, disable) logs out every old token.
export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, v: user.tokenVersion ?? 0 }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: user.role === 'admin' ? env.adminJwtExpiresIn : env.jwtExpiresIn,
  });

/**
 * Runs on every request: if a valid Bearer token is present, loads the user into req.user.
 * Never rejects — use requireAuth / requireAdmin on routes that need a user.
 */
export async function attachUser(req, _res, next) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const { id, v = 0 } = jwt.verify(header.slice(7), env.jwtSecret, { algorithms: ['HS256'] });
    const user = await User.findById(id).lean();
    if (user?.isActive && (user.tokenVersion ?? 0) === v) req.user = user;
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
