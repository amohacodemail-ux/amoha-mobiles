import { Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/app-error';
import { AuthenticatedRequest, UserRole } from '../types';

/**
 * RBAC (Role-Based Access Control) Middleware
 * AMOHA Mobiles Admin System
 *
 * Roles:
 * - admin: Full system access
 * - sales: Sales operations (orders, billing, POS, returns, wallets)
 * - purchase: Purchase operations (products, inventory, suppliers, RFQ)
 * - marketing: Marketing operations (coupons, banners, reviews, CRM)
 * - logistics: Logistics operations (order tracking, shipping)
 * - supplier: Supplier portal access
 * - service_engineer: Service center operations (view/update service requests)
 * - user: Regular customer (frontend only)
 */

// Core authorization function
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError('Access denied. Please log in.'));
    }

    // Map legacy roles to new standardized roles
    const userRole = normalizeRole(req.user.role);

    // Normalize allowed roles for comparison
    const normalizedRoles = roles.map(normalizeRole);

    if (!normalizedRoles.includes(userRole)) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
};

// Role normalization for legacy compatibility
export function normalizeRole(role: UserRole): UserRole {
  switch (role) {
    case 'digital_marketing':
      return 'marketing';
    case 'purchase_inventory':
      return 'purchase';
    default:
      return role;
  }
}

// ==================== CORE ROLE CHECKS ====================

/** Admin only - Full system access */
export const isAdmin = authorize('admin');

/** Any authenticated user */
export const isAuthenticated = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new ForbiddenError('Access denied. Please log in.'));
  }
  next();
};

// ==================== MODULE-SPECIFIC AUTHORIZERS ====================

// ---- SALES MODULE ----
/** Sales operations: orders, billing, POS, returns, wallets */
export const canAccessSales = authorize('admin', 'sales');

// ---- PURCHASE MODULE ----
/** Purchase operations: products, inventory, suppliers, RFQ, purchase requests */
export const canAccessPurchase = authorize('admin', 'purchase', 'purchase_inventory');

// ---- MARKETING MODULE ----
/** Marketing operations: coupons, banners, reviews, CRM, campaigns */
export const canAccessMarketing = authorize('admin', 'marketing', 'digital_marketing');

// ---- LOGISTICS MODULE ----
/** Logistics operations: order tracking, shipping */
export const canAccessLogistics = authorize('admin', 'logistics');

// ---- SUPPLIER MODULE ----
/** Supplier portal access */
export const canAccessSupplier = authorize('admin', 'supplier');

// ---- SERVICE ENGINEER MODULE ----
/** Service center operations: view and update service requests */
export const canAccessServiceEngineer = authorize('admin', 'service_engineer');

// ---- ADMIN-ONLY MODULES ----
/** System settings, user management, activity logs */
export const canAccessAdminOnly = authorize('admin', 'service_engineer');

// ==================== COMBINED AUTHORIZERS ====================

/** Dashboard - accessible by all internal roles */
export const canAccessDashboard = authorize('admin', 'sales', 'purchase', 'purchase_inventory', 'marketing', 'digital_marketing', 'logistics', 'service_engineer', 'supplier');

/** Reports - accessible by admin, sales, purchase */
export const canAccessReports = authorize('admin', 'sales', 'purchase', 'purchase_inventory');

/** Notifications - accessible by all internal roles */
export const canAccessNotifications = authorize('admin', 'sales', 'purchase', 'purchase_inventory', 'marketing', 'digital_marketing', 'logistics', 'service_engineer', 'supplier');

/** Settings/Profile - accessible by all authenticated users */
export const canAccessSettings = authorize('admin', 'sales', 'purchase', 'purchase_inventory', 'marketing', 'digital_marketing', 'logistics', 'service_engineer', 'supplier');

// ==================== LEGACY COMPATIBILITY ====================

// Keep legacy exports for backward compatibility
export const isUser = authorize('user', 'admin');
export const isInternalUser = authorize('admin', 'digital_marketing', 'sales', 'marketing', 'purchase', 'purchase_inventory', 'logistics', 'service_engineer', 'supplier');
export const isSalesOrAdmin = canAccessSales;
export const isMarketingOrAdmin = canAccessMarketing;
export const isLogisticsOrAdmin = canAccessLogistics;
export const isPurchaseOrAdmin = canAccessPurchase;
export const isSupplier = canAccessSupplier;
export const isSupplierOrAdmin = authorize('admin', 'supplier');

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if a user has a specific role (for use in controllers)
 */
export function hasRole(userRole: UserRole, ...allowedRoles: UserRole[]): boolean {
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
  return normalizedAllowedRoles.includes(normalizedUserRole);
}

/**
 * Check if user is admin
 */
export function isUserAdmin(userRole: UserRole): boolean {
  return normalizeRole(userRole) === 'admin';
}

/**
 * Get all accessible modules for a role
 */
export function getAccessibleModules(role: UserRole): string[] {
  const normalizedRole = normalizeRole(role);

  const modules: Record<string, string[]> = {
    admin: [
      'dashboard', 'products', 'categories', 'brands', 'orders', 'billing',
      'reports', 'users', 'coupons', 'banners', 'reviews', 'service_requests',
      'contact_messages', 'notifications', 'product_views', 'abandoned_carts',
      'crm', 'barcode_pos', 'returns', 'wallets', 'activity_logs', 'suppliers',
      'supplier_entries', 'rfq', 'purchase_requests', 'inventory', 'policies', 'settings'
    ],
    sales: [
      'dashboard', 'orders', 'billing', 'reports', 'barcode_pos',
      'returns', 'wallets', 'notifications', 'policies'
    ],
    purchase: [
      'dashboard', 'products', 'categories', 'brands', 'inventory',
      'suppliers', 'supplier_entries', 'rfq', 'purchase_requests',
      'reports', 'notifications', 'policies', 'barcode_pos'
    ],
    marketing: [
      'dashboard', 'coupons', 'banners', 'reviews', 'contact_messages',
      'product_views', 'abandoned_carts', 'crm', 'notifications', 'policies'
    ],
    logistics: [
      'dashboard', 'orders', 'notifications', 'policies'
    ],
    supplier: [
      'dashboard', 'rfq', 'notifications'
    ],
    service_engineer: [
      'dashboard', 'service_requests', 'notifications', 'policies'
    ],
    user: []
  };

  return modules[normalizedRole] || [];
}

/**
 * Check if user can access a specific module
 */
export function canAccessModule(userRole: UserRole, module: string): boolean {
  const accessibleModules = getAccessibleModules(userRole);
  return accessibleModules.includes(module);
}
