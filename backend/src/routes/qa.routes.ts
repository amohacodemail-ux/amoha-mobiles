import { Router } from 'express';
import qaController from '../controllers/qa.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { askQuestionSchema, addAnswerSchema } from '../validators/qa.validator';

const router = Router();

// Public: Get Q&A for a product
router.get('/product/:productId', qaController.getByProduct);

// Protected: Ask a question
router.post('/product/:productId', authenticate, validate(askQuestionSchema), qaController.askQuestion);

// Protected: Add an answer
router.post('/:questionId/answer', authenticate, validate(addAnswerSchema), qaController.addAnswer);

// Protected: Upvote question
router.post('/:questionId/upvote', authenticate, qaController.upvoteQuestion);

// Protected: Upvote answer
router.post('/:questionId/answer/:answerId/upvote', authenticate, qaController.upvoteAnswer);

// Protected: Delete question (owner or admin)
router.delete('/:questionId', authenticate, qaController.deleteQuestion);

// Protected: Delete answer (owner or admin)
router.delete('/:questionId/answer/:answerId', authenticate, qaController.deleteAnswer);

export default router;
