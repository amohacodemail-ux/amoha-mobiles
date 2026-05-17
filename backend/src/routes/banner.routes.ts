import { Router } from 'express';
import bannerController from '../controllers/banner.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessMarketing } from '../middleware/role.middleware';
import { cachePublic } from '../middleware/cache.middleware';

const router = Router();

// Public
router.get('/', cachePublic(120), bannerController.getAll);

// Admin
router.get('/admin', authenticate, canAccessMarketing, bannerController.getAllAdmin);
router.post('/', authenticate, canAccessMarketing, bannerController.create);
router.put('/:id', authenticate, canAccessMarketing, bannerController.update);
router.delete('/:id', authenticate, canAccessMarketing, bannerController.delete);

export default router;
