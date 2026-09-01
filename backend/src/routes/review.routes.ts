import { Router } from 'express';
import reviewController from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

const serviceReviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(1, 'Review text is required'),
    title: z.string().optional(),
  }),
});

// Get user's own reviews (both product and service)
router.get('/me', authenticate, reviewController.getMyReviews);

// Get service reviews for public display
router.get('/service', reviewController.getServiceReviews);

// Get service reviews stats
router.get('/service/stats', reviewController.getServiceStats);

// Add a service review
router.post(
  '/service/:requestId',
  authenticate,
  validate(serviceReviewSchema),
  reviewController.addServiceReview
);

export default router;
