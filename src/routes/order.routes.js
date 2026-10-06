import { Router } from 'express';
import { createOrder, getOrder, listOrders, myOrders, updateOrderStatus } from '../controllers/order.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createOrder);
router.get('/mine', requireAuth, myOrders);
router.get('/', requireAdmin, listOrders);
router.get('/:id', requireAuth, getOrder);
router.patch('/:id/status', requireAdmin, updateOrderStatus);

export default router;
