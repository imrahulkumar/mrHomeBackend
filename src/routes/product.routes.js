import { Router } from 'express';
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from '../controllers/product.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', listProducts);
router.get('/:idOrSlug', getProduct);
router.post('/', requireAdmin, createProduct);
router.put('/:id', requireAdmin, updateProduct);
router.delete('/:id', requireAdmin, deleteProduct);

export default router;
