import { Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/app-error';
import { AuthenticatedRequest, UserRole } from '../types';

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError('Access denied'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
};

// Convenience role helpers
export const isAdmin = authorize('admin');
export const isUser = authorize('user', 'admin');
export const isInternalUser = authorize('admin', 'digital_marketing', 'sales', 'marketing', 'purchase_inventory', 'logistics');
export const isSalesOrAdmin = authorize('admin', 'sales');
export const isMarketingOrAdmin = authorize('admin', 'digital_marketing', 'marketing');
export const isLogisticsOrAdmin = authorize('admin', 'logistics');
export const isPurchaseOrAdmin = authorize('admin', 'purchase_inventory');
export const isSupplier = authorize('supplier');
export const isSupplierOrAdmin = authorize('admin', 'supplier');
