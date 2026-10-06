import { Router } from 'express';
import { createUser, listUsers, updateUser } from '../controllers/user.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);
router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);

export default router;
