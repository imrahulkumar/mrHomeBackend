import { Router } from 'express';
import { createSubCategory, deleteSubCategory, listSubCategories, updateSubCategory } from '../controllers/subCategory.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', listSubCategories);
router.post('/', requireAdmin, createSubCategory);
router.put('/:id', requireAdmin, updateSubCategory);
router.delete('/:id', requireAdmin, deleteSubCategory);

export default router;
