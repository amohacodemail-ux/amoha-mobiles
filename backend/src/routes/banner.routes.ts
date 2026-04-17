import { Router } from 'express';
import bannerController from '../controllers/banner.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { cachePublic } from '../middleware/cache.middleware';

const router = Router();

// Public
router.get('/', cachePublic(120), bannerController.getAll);

// Admin
router.get('/admin', authenticate, isAdmin, bannerController.getAllAdmin);
router.post('/', authenticate, isAdmin, bannerController.create);
router.put('/:id', authenticate, isAdmin, bannerController.update);
router.delete('/:id', authenticate, isAdmin, bannerController.delete);

export default router;
