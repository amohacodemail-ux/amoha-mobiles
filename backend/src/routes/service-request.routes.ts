import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import serviceRequestController from '../controllers/service-request.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessServiceEngineer, isAdmin } from '../middleware/role.middleware';

const router = Router();

// Setup local storage for walk-in service request photos
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const dir = path.join(__dirname, '../../public/uploads/service-requests');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

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
router.get('/my-requests/:id', authenticate, serviceRequestController.getMyRequestById);

// Admin & Service Engineer routes (view and update)
router.get('/', authenticate, canAccessServiceEngineer, serviceRequestController.getAll);
router.get('/stats', authenticate, canAccessServiceEngineer, serviceRequestController.getStats);
router.get('/:id', authenticate, canAccessServiceEngineer, serviceRequestController.getById);
router.patch('/:id/status', authenticate, canAccessServiceEngineer, serviceRequestController.updateStatus);

// Admin-only routes (delete)
router.delete('/:id', authenticate, isAdmin, serviceRequestController.delete);

// Admin: upload photos for walk-in request
router.post(
  '/upload-photos',
  authenticate,
  canAccessServiceEngineer,
  upload.fields([
    { name: 'customerPhoto', maxCount: 1 },
    { name: 'devicePhoto', maxCount: 1 }
  ]),
  serviceRequestController.uploadPhotos
);

// Admin: generate invoice
router.get('/:id/invoice', authenticate, canAccessServiceEngineer, serviceRequestController.generateInvoice);

export default router;
