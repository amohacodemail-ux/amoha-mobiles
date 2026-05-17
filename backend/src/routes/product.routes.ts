import { Router } from 'express';
import productController from '../controllers/product.controller';
import productViewController from '../controllers/product-view.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessPurchase } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createProductSchema, updateProductSchema, reviewSchema } from '../validators/product.validator';
import { cachePublic } from '../middleware/cache.middleware';

const router = Router();

// Public routes - order matters: specific routes before parameterized ones
router.get('/featured', cachePublic(60), productController.getFeatured);
router.get('/trending', cachePublic(60), productController.getTrending);
router.get('/reviews/top', cachePublic(120), productController.getTopReviews);
router.get('/search/suggestions', productController.searchSuggestions);
router.get('/category/:categorySlug', cachePublic(30), productController.getByCategory);
router.get('/:id/related', cachePublic(60), productController.getRelated);

// Protected route must be before /:slug so Express doesn't swallow it as a slug match
router.get('/recently-viewed', authenticate, productController.getRecentlyViewed);

router.get('/:slug', cachePublic(30), productController.getBySlug);
router.get('/', cachePublic(30), productController.getAll);
router.post('/track-view', authenticate, productViewController.track);
router.post('/:id/reviews', authenticate, validate(reviewSchema), productController.addReview);
router.delete('/:id/reviews/:reviewId', authenticate, productController.deleteReview);

// Admin routes
router.post('/bulk', authenticate, canAccessPurchase, productController.bulkCreate);
router.post('/', authenticate, canAccessPurchase, validate(createProductSchema), productController.create);
router.put('/:id', authenticate, canAccessPurchase, validate(updateProductSchema), productController.update);
router.delete('/:id', authenticate, canAccessPurchase, productController.delete);
router.patch('/:id/stock', authenticate, canAccessPurchase, productController.updateStock);

export default router;
