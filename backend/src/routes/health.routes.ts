import { Router, Request, Response } from 'express';
import { version } from '../../package.json';

const router = Router();

// Health check with deployment info
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: version || '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    deploymentId: 'DELETE_SYSTEM_v2' // Change this to verify new deployment
  });
});

// Test delete endpoint (diagnostic only)
router.get('/delete-test/:id', (req: Request, res: Response) => {
  res.json({
    message: 'Delete endpoint test',
    receivedId: req.params.id,
    isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id),
    timestamp: new Date().toISOString()
  });
});

export default router;
