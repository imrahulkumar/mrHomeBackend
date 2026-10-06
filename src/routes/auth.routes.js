import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, me, register, updateProfile } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, message: { message: 'Too many attempts, please try again later.' } });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, updateProfile);

export default router;
