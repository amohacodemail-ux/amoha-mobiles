import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { UnauthorizedError } from '../errors/app-error';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger.util';

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }

    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid access token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Access token has expired'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = verifyAccessToken(token);
        req.user = {
          userId: decoded.userId,
          role: decoded.role,
        };
      }
    }
    next();
  } catch (error: any) {
    // Expected auth errors (expired/invalid) are fine for optional auth - just proceed as anonymous
    if (error.name !== 'TokenExpiredError' && error.name !== 'JsonWebTokenError') {
      logger.warn('Unexpected error in optionalAuth:', error.message);
    }
    next();
  }
};
