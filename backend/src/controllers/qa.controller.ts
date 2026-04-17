import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import qaService from '../services/qa.service';
import { sendSuccess, sendCreated, sendPaginated, sendMessage } from '../utils/response.util';

class QAController {
  async getByProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await qaService.getByProduct(productId, page, limit);
      sendPaginated(res, result.questions, result.pagination, 'Q&A fetched');
    } catch (error) {
      next(error);
    }
  }

  async askQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { question } = req.body;
      const userId = req.user!.userId;
      const qa = await qaService.askQuestion(productId, userId, question);
      sendCreated(res, qa, 'Question posted');
    } catch (error) {
      next(error);
    }
  }

  async addAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { questionId } = req.params;
      const { answer } = req.body;
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'admin';
      const qa = await qaService.addAnswer(questionId, userId, answer, isAdmin);
      sendCreated(res, qa, 'Answer posted');
    } catch (error) {
      next(error);
    }
  }

  async upvoteQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { questionId } = req.params;
      const userId = req.user!.userId;
      const qa = await qaService.upvoteQuestion(questionId, userId);
      sendSuccess(res, qa, 'Vote updated');
    } catch (error) {
      next(error);
    }
  }

  async upvoteAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { questionId, answerId } = req.params;
      const userId = req.user!.userId;
      const qa = await qaService.upvoteAnswer(questionId, answerId, userId);
      sendSuccess(res, qa, 'Vote updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { questionId } = req.params;
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'admin';
      await qaService.deleteQuestion(questionId, userId, isAdmin);
      sendMessage(res, 'Question deleted');
    } catch (error) {
      next(error);
    }
  }

  async deleteAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { questionId, answerId } = req.params;
      const userId = req.user!.userId;
      const isAdmin = req.user!.role === 'admin';
      await qaService.deleteAnswer(questionId, answerId, userId, isAdmin);
      sendMessage(res, 'Answer deleted');
    } catch (error) {
      next(error);
    }
  }
}

export default new QAController();
