import { Request, Response, NextFunction } from 'express';
import reviewService from '../services/review.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendCreated } from '../utils/response.util';
import { notifyReview } from '../utils/notify';

class ReviewController {
  async getMyReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.getUserReviews(req.user!.userId);
      sendSuccess(res, reviews, 'User reviews fetched');
    } catch (error) {
      next(error);
    }
  }

  async getServiceReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const reviews = await reviewService.getPublicServiceReviews(limit);
      sendSuccess(res, reviews, 'Service reviews fetched');
    } catch (error) {
      next(error);
    }
  }

  async getServiceStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await reviewService.getServiceStats();
      sendSuccess(res, stats, 'Service stats fetched');
    } catch (error) {
      next(error);
    }
  }

  async addServiceReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.addServiceReview(
        req.params.requestId,
        req.user!.userId,
        req.body
      );
      // Optional: notify admin about new service review
      notifyReview('Service Request', req.body.rating, req.user!.userId, review._id);
      sendCreated(res, review, 'Service review submitted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
