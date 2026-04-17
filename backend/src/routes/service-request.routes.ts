import { Router } from 'express';
import serviceRequestController from '../controllers/service-request.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';

const router = Router();

// Public: submit service request (auth optional - user field set if logged in)
router.post('/', (req, res, next) => {
  // Try to authenticate but don't fail if no token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, () => {
      serviceRequestController.create(req, res, next);
    });
  }
  serviceRequestController.create(req, res, next);
});

// Authenticated: get my requests
router.get('/my-requests', authenticate, serviceRequestController.getMyRequests);

// Admin routes
router.get('/', authenticate, isAdmin, serviceRequestController.getAll);
router.get('/stats', authenticate, isAdmin, serviceRequestController.getStats);
router.get('/:id', authenticate, isAdmin, serviceRequestController.getById);
router.patch('/:id/status', authenticate, isAdmin, serviceRequestController.updateStatus);
router.delete('/:id', authenticate, isAdmin, serviceRequestController.delete);

export default router;
