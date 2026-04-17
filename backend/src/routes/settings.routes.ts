import { Router } from 'express';
import settingsController from '../controllers/settings.controller';
import { cachePublic } from '../middleware/cache.middleware';

const router = Router();

// Public: get site settings (no auth required)
router.get('/', cachePublic(120), settingsController.get);

export default router;
