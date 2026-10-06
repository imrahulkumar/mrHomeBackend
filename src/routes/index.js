import { Router } from 'express';
import { getStats } from '../controllers/dashboard.controller.js';
import { uploadImage as handleUpload } from '../controllers/upload.controller.js';
import { requireAdmin } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import orderRoutes from './order.routes.js';
import productRoutes from './product.routes.js';
import settingRoutes from './setting.routes.js';
import subCategoryRoutes from './subCategory.routes.js';
import userRoutes from './user.routes.js';
import videoRoutes from './video.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/settings', settingRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subCategoryRoutes);
router.use('/products', productRoutes);
router.use('/videos', videoRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.get('/dashboard', requireAdmin, getStats);
router.post('/uploads', requireAdmin, uploadImage.single('image'), handleUpload);

export default router;
