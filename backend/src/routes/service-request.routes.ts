import { Router } from 'express';
import serviceRequestController from '../controllers/service-request.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessServiceEngineer, isAdmin } from '../middleware/role.middleware';

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

// Admin & Service Engineer routes (view and update)
router.get('/', authenticate, canAccessServiceEngineer, serviceRequestController.getAll);
router.get('/stats', authenticate, canAccessServiceEngineer, serviceRequestController.getStats);
router.get('/:id', authenticate, canAccessServiceEngineer, serviceRequestController.getById);
router.patch('/:id/status', authenticate, canAccessServiceEngineer, serviceRequestController.updateStatus);

// Admin-only routes (delete)
router.delete('/:id', authenticate, isAdmin, serviceRequestController.delete);

export default router;
