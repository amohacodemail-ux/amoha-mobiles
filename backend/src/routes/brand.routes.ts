import { Router } from 'express';
import brandController from '../controllers/brand.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessPurchase } from '../middleware/role.middleware';

const router = Router();

// Public
router.get('/', brandController.getAll);
router.get('/:slug', brandController.getBySlug);

// Admin
router.post('/', authenticate, canAccessPurchase, brandController.create);
router.put('/:id', authenticate, canAccessPurchase, brandController.update);
router.delete('/:id', authenticate, canAccessPurchase, brandController.delete);

export default router;
