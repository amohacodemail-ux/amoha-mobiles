import { Router } from 'express';
import brandController from '../controllers/brand.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';

const router = Router();

// Public
router.get('/', brandController.getAll);
router.get('/:slug', brandController.getBySlug);

// Admin
router.post('/', authenticate, isAdmin, brandController.create);
router.put('/:id', authenticate, isAdmin, brandController.update);
router.delete('/:id', authenticate, isAdmin, brandController.delete);

export default router;
