import { Router } from 'express';
import categoryController from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessPurchase } from '../middleware/role.middleware';
import { cachePublic } from '../middleware/cache.middleware';

const router = Router();

// Public
router.get('/', cachePublic(120), categoryController.getAll);
router.get('/:slug', cachePublic(60), categoryController.getBySlug);

// Admin
router.post('/', authenticate, canAccessPurchase, categoryController.create);
router.put('/:id', authenticate, canAccessPurchase, categoryController.update);
router.delete('/:id', authenticate, canAccessPurchase, categoryController.delete);

export default router;
