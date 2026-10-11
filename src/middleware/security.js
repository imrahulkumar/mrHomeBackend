import rateLimit from 'express-rate-limit';

/**
 * Removes keys that start with "$" or contain "." from JSON bodies, so a value like
 * { "email": { "$ne": null } } can never reach a MongoDB query as an operator.
 * (Express 5's default query parser never builds nested objects, so only the body needs this.)
 */
function stripOperators(value) {
  if (Array.isArray(value)) return value.map(stripOperators);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith('$') && !key.includes('.'))
        .map(([key, v]) => [key, stripOperators(v)]),
    );
  }
  return value;
}

export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = stripOperators(req.body);
  next();
}

const tooMany = { message: 'Too many requests. Please slow down and try again shortly.' };

// Broad per-IP ceiling for the whole API; the auth routes have their own, much stricter limits.
export const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany });
