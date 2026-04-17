import { Router } from 'express';
import categoryController from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { cachePublic } from '../middleware/cache.middleware';

const router = Router();

// Public
router.get('/', cachePublic(120), categoryController.getAll);
router.get('/:slug', cachePublic(60), categoryController.getBySlug);

// Admin
router.post('/', authenticate, isAdmin, categoryController.create);
router.put('/:id', authenticate, isAdmin, categoryController.update);
router.delete('/:id', authenticate, isAdmin, categoryController.delete);

export default router;
