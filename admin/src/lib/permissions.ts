/**
 * RBAC (Role-Based Access Control) System - Frontend
 * AMOHA Mobiles Admin System
 */

import { AdminUser } from '@/types';

// Standardized roles (matching backend)
export type UserRole =
  | 'user'
  | 'admin'
  | 'sales'
  | 'purchase'
  | 'marketing'
  | 'logistics'
  | 'supplier'
  | 'service_engineer'    // Service center operations
  | 'digital_marketing'  // Legacy - mapped to marketing
  | 'purchase_inventory'; // Legacy - mapped to purchase

// Legacy role mapping for compatibility
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

// Module definitions
export const MODULES = {
  // Sales modules
  DASHBOARD: 'dashboard',
  ORDERS: 'orders',
  BILLING: 'billing',
  REPORTS: 'reports',
  BARCODE_POS: 'barcode_pos',
  RETURNS: 'returns',
  WALLETS: 'wallets',

  // Purchase modules
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  INVENTORY: 'inventory',
  SUPPLIERS: 'suppliers',
  SUPPLIER_ENTRIES: 'supplier_entries',
  RFQ: 'rfq',
  PURCHASE_REQUESTS: 'purchase_requests',

  // Marketing modules
  COUPONS: 'coupons',
  BANNERS: 'banners',
  REVIEWS: 'reviews',
  CONTACT_MESSAGES: 'contact_messages',
  PRODUCT_VIEWS: 'product_views',
  ABANDONED_CARTS: 'abandoned_carts',
  CRM: 'crm',

  // Admin-only modules
  USERS: 'users',
  SERVICE_REQUESTS: 'service_requests',
  NOTIFICATIONS: 'notifications',
  ACTIVITY_LOGS: 'activity_logs',
  POLICIES: 'policies',
  SETTINGS: 'settings',

  // Supplier portal
  SUPPLIER_PORTAL: 'supplier_portal',
} as const;

export type Module = typeof MODULES[keyof typeof MODULES];

// Permission actions
export const ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
} as const;

export type Action = typeof ACTIONS[keyof typeof ACTIONS];

// Role-based module permissions
const ROLE_PERMISSIONS: Record<UserRole, Record<Module, Action[]>> = {
  admin: {
    // Sales
    [MODULES.DASHBOARD]: [ACTIONS.READ],
    [MODULES.ORDERS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.BILLING]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.REPORTS]: [ACTIONS.READ],
    [MODULES.BARCODE_POS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.RETURNS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.WALLETS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    // Purchase
    [MODULES.PRODUCTS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.CATEGORIES]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.BRANDS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.INVENTORY]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.SUPPLIERS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.SUPPLIER_ENTRIES]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.RFQ]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.PURCHASE_REQUESTS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    // Marketing
    [MODULES.COUPONS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.BANNERS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.REVIEWS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.CONTACT_MESSAGES]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.PRODUCT_VIEWS]: [ACTIONS.READ],
    [MODULES.ABANDONED_CARTS]: [ACTIONS.READ],
    [MODULES.CRM]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    // Admin-only
    [MODULES.USERS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.SERVICE_REQUESTS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.NOTIFICATIONS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.ACTIVITY_LOGS]: [ACTIONS.READ],
    [MODULES.POLICIES]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.SETTINGS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.SUPPLIER_PORTAL]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
  },

  sales: {
    // Sales modules - full access except delete
    [MODULES.DASHBOARD]: [ACTIONS.READ],
    [MODULES.ORDERS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT],
    [MODULES.BILLING]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT],
    [MODULES.REPORTS]: [ACTIONS.READ],
    [MODULES.BARCODE_POS]: [ACTIONS.READ, ACTIONS.CREATE],
    [MODULES.RETURNS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT],
    [MODULES.WALLETS]: [ACTIONS.READ, ACTIONS.CREATE],
    // No access to purchase, marketing, admin modules
    [MODULES.PRODUCTS]: [ACTIONS.READ],
    [MODULES.CATEGORIES]: [ACTIONS.READ],
    [MODULES.BRANDS]: [ACTIONS.READ],
    [MODULES.INVENTORY]: [ACTIONS.READ],
    [MODULES.SUPPLIERS]: [],
    [MODULES.SUPPLIER_ENTRIES]: [],
    [MODULES.RFQ]: [],
    [MODULES.PURCHASE_REQUESTS]: [],
    [MODULES.COUPONS]: [],
    [MODULES.BANNERS]: [],
    [MODULES.REVIEWS]: [],
    [MODULES.CONTACT_MESSAGES]: [],
    [MODULES.PRODUCT_VIEWS]: [],
    [MODULES.ABANDONED_CARTS]: [],
    [MODULES.CRM]: [],
    [MODULES.USERS]: [],
    [MODULES.SERVICE_REQUESTS]: [ACTIONS.READ],
    [MODULES.NOTIFICATIONS]: [ACTIONS.READ],
    [MODULES.ACTIVITY_LOGS]: [],
    [MODULES.POLICIES]: [ACTIONS.READ],
    [MODULES.SETTINGS]: [],
    [MODULES.SUPPLIER_PORTAL]: [],
  },

  purchase: {
    // Purchase modules - full access including delete
    [MODULES.DASHBOARD]: [ACTIONS.READ],
    [MODULES.PRODUCTS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.CATEGORIES]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.BRANDS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.INVENTORY]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.SUPPLIERS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.SUPPLIER_ENTRIES]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.RFQ]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.PURCHASE_REQUESTS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.REPORTS]: [ACTIONS.READ],
    [MODULES.NOTIFICATIONS]: [ACTIONS.READ],
    [MODULES.BARCODE_POS]: [ACTIONS.READ],
    [MODULES.POLICIES]: [ACTIONS.READ],
    // No access to sales-specific, marketing, admin modules
    [MODULES.ORDERS]: [],
    [MODULES.BILLING]: [],
    [MODULES.RETURNS]: [],
    [MODULES.WALLETS]: [],
    [MODULES.COUPONS]: [],
    [MODULES.BANNERS]: [],
    [MODULES.REVIEWS]: [],
    [MODULES.CONTACT_MESSAGES]: [],
    [MODULES.PRODUCT_VIEWS]: [],
    [MODULES.ABANDONED_CARTS]: [],
    [MODULES.CRM]: [],
    [MODULES.USERS]: [],
    [MODULES.SERVICE_REQUESTS]: [],
    [MODULES.ACTIVITY_LOGS]: [],
    [MODULES.SETTINGS]: [],
    [MODULES.SUPPLIER_PORTAL]: [],
  },

  marketing: {
    // Marketing modules - full access
    [MODULES.DASHBOARD]: [ACTIONS.READ],
    [MODULES.COUPONS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.BANNERS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.REVIEWS]: [ACTIONS.READ, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.CONTACT_MESSAGES]: [ACTIONS.READ, ACTIONS.EDIT],
    [MODULES.PRODUCT_VIEWS]: [ACTIONS.READ],
    [MODULES.ABANDONED_CARTS]: [ACTIONS.READ],
    [MODULES.CRM]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EDIT],
    [MODULES.NOTIFICATIONS]: [ACTIONS.READ],
    [MODULES.POLICIES]: [ACTIONS.READ],
    // No access to sales, purchase, admin modules
    [MODULES.ORDERS]: [],
    [MODULES.BILLING]: [],
    [MODULES.REPORTS]: [],
    [MODULES.BARCODE_POS]: [],
    [MODULES.RETURNS]: [],
    [MODULES.WALLETS]: [],
    [MODULES.PRODUCTS]: [ACTIONS.READ],
    [MODULES.CATEGORIES]: [],
    [MODULES.BRANDS]: [],
    [MODULES.INVENTORY]: [],
    [MODULES.SUPPLIERS]: [],
    [MODULES.SUPPLIER_ENTRIES]: [],
    [MODULES.RFQ]: [],
    [MODULES.PURCHASE_REQUESTS]: [],
    [MODULES.USERS]: [],
    [MODULES.SERVICE_REQUESTS]: [],
    [MODULES.ACTIVITY_LOGS]: [],
    [MODULES.SETTINGS]: [],
    [MODULES.SUPPLIER_PORTAL]: [],
  },

  logistics: {
    // Logistics - order tracking only
    [MODULES.DASHBOARD]: [ACTIONS.READ],
    [MODULES.ORDERS]: [ACTIONS.READ, ACTIONS.EDIT], // For tracking updates
    [MODULES.NOTIFICATIONS]: [ACTIONS.READ],
    [MODULES.POLICIES]: [ACTIONS.READ],
    // No access to other modules
    [MODULES.BILLING]: [],
    [MODULES.REPORTS]: [],
    [MODULES.BARCODE_POS]: [],
    [MODULES.RETURNS]: [],
    [MODULES.WALLETS]: [],
    [MODULES.PRODUCTS]: [],
    [MODULES.CATEGORIES]: [],
    [MODULES.BRANDS]: [],
    [MODULES.INVENTORY]: [],
    [MODULES.SUPPLIERS]: [],
    [MODULES.SUPPLIER_ENTRIES]: [],
    [MODULES.RFQ]: [],
    [MODULES.PURCHASE_REQUESTS]: [],
    [MODULES.COUPONS]: [],
    [MODULES.BANNERS]: [],
    [MODULES.REVIEWS]: [],
    [MODULES.CONTACT_MESSAGES]: [],
    [MODULES.PRODUCT_VIEWS]: [],
    [MODULES.ABANDONED_CARTS]: [],
    [MODULES.CRM]: [],
    [MODULES.USERS]: [],
    [MODULES.SERVICE_REQUESTS]: [],
    [MODULES.ACTIVITY_LOGS]: [],
    [MODULES.SETTINGS]: [],
    [MODULES.SUPPLIER_PORTAL]: [],
  },

  supplier: {
    // Supplier - portal access only
    [MODULES.DASHBOARD]: [],
    [MODULES.RFQ]: [ACTIONS.READ, ACTIONS.EDIT],
    [MODULES.NOTIFICATIONS]: [ACTIONS.READ],
    [MODULES.SUPPLIER_PORTAL]: [ACTIONS.READ, ACTIONS.CREATE],
    [MODULES.SUPPLIER_ENTRIES]: [ACTIONS.READ, ACTIONS.CREATE],
    // No access to other modules
    [MODULES.ORDERS]: [],
    [MODULES.BILLING]: [],
    [MODULES.REPORTS]: [],
    [MODULES.BARCODE_POS]: [],
    [MODULES.RETURNS]: [],
    [MODULES.WALLETS]: [],
    [MODULES.PRODUCTS]: [],
    [MODULES.CATEGORIES]: [],
    [MODULES.BRANDS]: [],
    [MODULES.INVENTORY]: [],
    [MODULES.SUPPLIERS]: [],
    [MODULES.PURCHASE_REQUESTS]: [],
    [MODULES.COUPONS]: [],
    [MODULES.BANNERS]: [],
    [MODULES.REVIEWS]: [],
    [MODULES.CONTACT_MESSAGES]: [],
    [MODULES.PRODUCT_VIEWS]: [],
    [MODULES.ABANDONED_CARTS]: [],
    [MODULES.CRM]: [],
    [MODULES.USERS]: [],
    [MODULES.SERVICE_REQUESTS]: [],
    [MODULES.ACTIVITY_LOGS]: [],
    [MODULES.POLICIES]: [],
    [MODULES.SETTINGS]: [],
  },

  user: {
    // Regular users - no admin access
    [MODULES.DASHBOARD]: [],
    [MODULES.ORDERS]: [],
    [MODULES.BILLING]: [],
    [MODULES.REPORTS]: [],
    [MODULES.BARCODE_POS]: [],
    [MODULES.RETURNS]: [],
    [MODULES.WALLETS]: [],
    [MODULES.PRODUCTS]: [],
    [MODULES.CATEGORIES]: [],
    [MODULES.BRANDS]: [],
    [MODULES.INVENTORY]: [],
    [MODULES.SUPPLIERS]: [],
    [MODULES.SUPPLIER_ENTRIES]: [],
    [MODULES.RFQ]: [],
    [MODULES.PURCHASE_REQUESTS]: [],
    [MODULES.COUPONS]: [],
    [MODULES.BANNERS]: [],
    [MODULES.REVIEWS]: [],
    [MODULES.CONTACT_MESSAGES]: [],
    [MODULES.PRODUCT_VIEWS]: [],
    [MODULES.ABANDONED_CARTS]: [],
    [MODULES.CRM]: [],
    [MODULES.USERS]: [],
    [MODULES.SERVICE_REQUESTS]: [],
    [MODULES.NOTIFICATIONS]: [],
    [MODULES.ACTIVITY_LOGS]: [],
    [MODULES.POLICIES]: [],
    [MODULES.SETTINGS]: [],
    [MODULES.SUPPLIER_PORTAL]: [],
  },

  service_engineer: {
    // Service engineers - access to service requests only
    [MODULES.DASHBOARD]: [ACTIONS.READ],
    [MODULES.SERVICE_REQUESTS]: [ACTIONS.READ, ACTIONS.EDIT],
    [MODULES.NOTIFICATIONS]: [ACTIONS.READ],
    [MODULES.POLICIES]: [ACTIONS.READ],
    // No access to other modules
    [MODULES.ORDERS]: [],
    [MODULES.BILLING]: [],
    [MODULES.REPORTS]: [],
    [MODULES.BARCODE_POS]: [],
    [MODULES.RETURNS]: [],
    [MODULES.WALLETS]: [],
    [MODULES.PRODUCTS]: [],
    [MODULES.CATEGORIES]: [],
    [MODULES.BRANDS]: [],
    [MODULES.INVENTORY]: [],
    [MODULES.SUPPLIERS]: [],
    [MODULES.SUPPLIER_ENTRIES]: [],
    [MODULES.RFQ]: [],
    [MODULES.PURCHASE_REQUESTS]: [],
    [MODULES.COUPONS]: [],
    [MODULES.BANNERS]: [],
    [MODULES.REVIEWS]: [],
    [MODULES.CONTACT_MESSAGES]: [],
    [MODULES.PRODUCT_VIEWS]: [],
    [MODULES.ABANDONED_CARTS]: [],
    [MODULES.CRM]: [],
    [MODULES.USERS]: [],
    [MODULES.ACTIVITY_LOGS]: [],
    [MODULES.SETTINGS]: [],
    [MODULES.SUPPLIER_PORTAL]: [],
  },

  // Legacy roles - mapped to standard roles
  digital_marketing: {} as Record<Module, Action[]>,
  purchase_inventory: {} as Record<Module, Action[]>,
};

// Map legacy roles to standard permissions
ROLE_PERMISSIONS.digital_marketing = ROLE_PERMISSIONS.marketing;
ROLE_PERMISSIONS.purchase_inventory = ROLE_PERMISSIONS.purchase;

/**
 * Check if user has permission for a module and action
 */
export function hasPermission(
  user: AdminUser | null | undefined,
  module: Module,
  action: Action = ACTIONS.READ
): boolean {
  if (!user) return false;

  const normalizedRole = normalizeRole(user.role as UserRole);
  const permissions = ROLE_PERMISSIONS[normalizedRole]?.[module] || [];

  // Admin always has all permissions
  if (normalizedRole === 'admin') return true;

  return permissions.includes(action);
}

/**
 * Check if user can access a module (has at least read permission)
 */
export function canAccessModule(
  user: AdminUser | null | undefined,
  module: Module
): boolean {
  return hasPermission(user, module, ACTIONS.READ);
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AdminUser | null | undefined): boolean {
  if (!user) return false;
  return normalizeRole(user.role as UserRole) === 'admin';
}

/**
 * Check if user has a specific role
 */
export function hasRole(
  user: AdminUser | null | undefined,
  ...roles: UserRole[]
): boolean {
  if (!user) return false;
  const normalizedUserRole = normalizeRole(user.role as UserRole);
  return roles.some(role => normalizeRole(role) === normalizedUserRole);
}

/**
 * Get all accessible modules for a user
 */
export function getAccessibleModules(user: AdminUser | null | undefined): Module[] {
  if (!user) return [];

  const normalizedRole = normalizeRole(user.role as UserRole);
  const permissions = ROLE_PERMISSIONS[normalizedRole];

  if (!permissions) return [];

  return Object.entries(permissions)
    .filter(([_, actions]) => actions.includes(ACTIONS.READ))
    .map(([module]) => module as Module);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const normalizedRole = normalizeRole(role);
  const displayNames: Record<UserRole, string> = {
    admin: 'Administrator',
    sales: 'Sales',
    purchase: 'Purchase',
    marketing: 'Marketing',
    logistics: 'Logistics',
    supplier: 'Supplier',
    service_engineer: 'Service Engineer',
    user: 'User',
    digital_marketing: 'Digital Marketing',
    purchase_inventory: 'Purchase & Inventory',
  };
  return displayNames[normalizedRole] || normalizedRole;
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
  const normalizedRole = normalizeRole(role);
  const colors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    sales: 'bg-blue-100 text-blue-800 border-blue-200',
    purchase: 'bg-green-100 text-green-800 border-green-200',
    marketing: 'bg-purple-100 text-purple-800 border-purple-200',
    logistics: 'bg-orange-100 text-orange-800 border-orange-200',
    supplier: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    service_engineer: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    user: 'bg-gray-100 text-gray-800 border-gray-200',
    digital_marketing: 'bg-purple-100 text-purple-800 border-purple-200',
    purchase_inventory: 'bg-green-100 text-green-800 border-green-200',
  };
  return colors[normalizedRole] || colors.user;
}
