import { Router } from 'express';
import wishlistController from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', wishlistController.getAll);
router.post('/', wishlistController.add);
router.delete('/:productId', wishlistController.remove);
router.get('/check/:productId', wishlistController.check);

export default router;
