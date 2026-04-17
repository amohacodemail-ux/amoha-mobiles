import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import walletService from '../services/wallet.service';
import { sendSuccess, sendPaginated } from '../utils/response.util';

class WalletController {
  async getBalance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await walletService.getBalance(req.user!.userId);
      sendSuccess(res, result, 'Wallet balance fetched');
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await walletService.getTransactions(req.user!.userId, page, limit);
      sendSuccess(res, { balance: result.balance, transactions: result.transactions, ...result.pagination }, 'Wallet transactions fetched');
    } catch (error) {
      next(error);
    }
  }

  // Admin
  async getAllWallets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await walletService.getAllWallets(page, limit);
      sendPaginated(res, result.wallets, result.pagination, 'Wallets fetched');
    } catch (error) {
      next(error);
    }
  }

  async adminCredit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId, amount, description } = req.body;
      const result = await walletService.adminCredit(userId, amount, description, req.user!.userId);
      sendSuccess(res, result, 'Wallet credited');
    } catch (error) {
      next(error);
    }
  }
}

export default new WalletController();
