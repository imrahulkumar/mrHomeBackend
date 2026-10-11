import { Router } from 'express';
import { getIcon, getManifest } from '../controllers/pwa.controller.js';

const router = Router();

router.get('/manifest.webmanifest', getManifest);
router.get('/icon/:file', getIcon);

export default router;
