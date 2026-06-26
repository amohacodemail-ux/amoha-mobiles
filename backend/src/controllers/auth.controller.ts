import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendMessage } from '../utils/response.util';
import { sendWelcomeEmail, sendLoginEmail } from '../utils/email.util';
import logger from '../utils/logger.util';
import activityLogService from '../services/activity-log.service';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, password } = req.body;
      const result = await authService.register({ name, email, phone, password });
      sendWelcomeEmail(email, name).catch((err) => logger.error('Failed to send welcome email:', err?.message));
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      activityLogService.log({ userId: result.user._id, action: 'login', entity: 'user', entityId: result.user._id, details: `User logged in: ${email}`, ipAddress: req.ip }).catch(() => {});
      sendLoginEmail(email, result.user.name).catch((err) => logger.error('Failed to send login email:', err?.message));
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.userId);
      sendMessage(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      sendSuccess(res, user, 'Profile fetched');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, user, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      sendMessage(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, portal } = req.body;
      await authService.forgotPassword(email, portal === 'admin' ? 'admin' : 'store');
      sendMessage(res, 'If the email exists, a password reset link has been sent');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      sendMessage(res, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
