import { Router } from 'express';
import { createVideo, deleteVideo, listVideos, updateVideo } from '../controllers/video.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', listVideos);
router.post('/', requireAdmin, createVideo);
router.put('/:id', requireAdmin, updateVideo);
router.delete('/:id', requireAdmin, deleteVideo);

export default router;
