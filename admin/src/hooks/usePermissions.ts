/**
 * RBAC Hooks
 * AMOHA Mobiles Admin System
 */

import { useAuthStore } from '@/store/auth.store';
import {
  hasPermission,
  canAccessModule,
  isAdmin,
  hasRole,
  getAccessibleModules,
  normalizeRole,
  getRoleDisplayName,
  getRoleBadgeColor,
  MODULES,
  ACTIONS,
  type Module,
  type Action,
  type UserRole,
} from '@/lib/permissions';

// Re-export utility functions for convenience
export {
  getRoleDisplayName,
  getRoleBadgeColor,
  normalizeRole,
  MODULES,
  ACTIONS,
  type Module,
  type Action,
  type UserRole,
} from '@/lib/permissions';

/**
 * Hook for checking permissions
 */
export function usePermissions() {
  const { user } = useAuthStore();

  return {
    // Permission checks
    hasPermission: (module: Module, action?: Action) =>
      hasPermission(user, module, action),
    canAccess: (module: Module) => canAccessModule(user, module),
    canCreate: (module: Module) => hasPermission(user, module, ACTIONS.CREATE),
    canEdit: (module: Module) => hasPermission(user, module, ACTIONS.EDIT),
    canDelete: (module: Module) => hasPermission(user, module, ACTIONS.DELETE),

    // Role checks
    isAdmin: () => isAdmin(user),
    hasRole: (...roles: UserRole[]) => hasRole(user, ...roles),
    role: user?.role,
    normalizedRole: user ? normalizeRole(user.role as UserRole) : null,

    // User info
    user,
    isAuthenticated: !!user,

    // Helpers
    accessibleModules: getAccessibleModules(user),
    roleDisplayName: user ? getRoleDisplayName(user.role as UserRole) : '',
    roleBadgeColor: user ? getRoleBadgeColor(user.role as UserRole) : '',
  };
}

/**
 * Hook for module-specific permissions
 */
export function useModulePermissions(module: Module) {
  const { user } = useAuthStore();

  return {
    canAccess: canAccessModule(user, module),
    canCreate: hasPermission(user, module, ACTIONS.CREATE),
    canEdit: hasPermission(user, module, ACTIONS.EDIT),
    canDelete: hasPermission(user, module, ACTIONS.DELETE),
    canRead: hasPermission(user, module, ACTIONS.READ),
  };
}

/**
 * Hook for checking if current user is admin
 */
export function useIsAdmin() {
  const { user } = useAuthStore();
  return isAdmin(user);
}

/**
 * Hook for getting role info
 */
export function useRoleInfo() {
  const { user } = useAuthStore();

  if (!user) {
    return {
      role: null,
      displayName: '',
      badgeColor: '',
      isAdmin: false,
    };
  }

  const role = user.role as UserRole;

  return {
    role,
    normalizedRole: normalizeRole(role),
    displayName: getRoleDisplayName(role),
    badgeColor: getRoleBadgeColor(role),
    isAdmin: normalizeRole(role) === 'admin',
  };
}

