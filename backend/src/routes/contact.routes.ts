import { Router } from 'express';
import contactController from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';

const router = Router();

// Public: submit contact message
router.post('/', contactController.create);

// Admin routes
router.get('/', authenticate, isAdmin, contactController.getAll);
router.get('/unread-count', authenticate, isAdmin, contactController.getUnreadCount);
router.patch('/:id/read', authenticate, isAdmin, contactController.markRead);
router.delete('/:id', authenticate, isAdmin, contactController.delete);

export default router;
