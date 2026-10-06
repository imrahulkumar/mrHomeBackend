import { Router } from 'express';
import { createCategory, deleteCategory, getCategory, listCategories, updateCategory } from '../controllers/category.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', listCategories);
router.get('/:idOrSlug', getCategory);
router.post('/', requireAdmin, createCategory);
router.put('/:id', requireAdmin, updateCategory);
router.delete('/:id', requireAdmin, deleteCategory);

export default router;
