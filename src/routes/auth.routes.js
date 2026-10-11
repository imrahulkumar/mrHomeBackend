import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, me, register, updateProfile } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const message = { message: 'Too many attempts, please try again later.' };
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message });

// Per-account brake on password guessing, even when the attacker rotates IP addresses.
const loginPerEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `login:${String(req.body?.email ?? '').toLowerCase().trim()}`,
  message: { message: 'Too many failed logins for this account. Please wait 15 minutes and try again.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, loginPerEmailLimiter, login);
router.get('/me', requireAuth, me);
router.patch('/me', authLimiter, requireAuth, updateProfile);

export default router;
