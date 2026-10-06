import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getSettings);
router.put('/', requireAdmin, updateSettings);

export default router;
