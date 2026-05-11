'use client';

import { ReactNode } from 'react';
import { usePermissions, type Module } from '@/hooks/usePermissions';
import { AccessDenied } from './access-denied';

interface WithAuthProps {
  children: ReactNode;
  module: Module;
  fallback?: ReactNode;
}

/**
 * Component-level authorization wrapper
 * Use this to wrap components that require specific module access
 */
export function WithAuth({ children, module, fallback }: WithAuthProps) {
  const { canAccess, roleDisplayName } = usePermissions();

  if (!canAccess(module)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AccessDenied module={module} requiredRole={roleDisplayName} />;
  }

  return <>{children}</>;
}

interface WithPermissionProps {
  children: ReactNode;
  module: Module;
  action: 'create' | 'edit' | 'delete';
  fallback?: ReactNode;
}

/**
 * Permission-level authorization wrapper
 * Use this for specific actions (create, edit, delete)
 */
export function WithPermission({ children, module, action, fallback }: WithPermissionProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(module, action)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

interface WithAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Admin-only wrapper
 */
export function WithAdmin({ children, fallback }: WithAdminProps) {
  const { isAdmin } = usePermissions();

  if (!isAdmin()) {
    return fallback ? <>{fallback}</> : <AccessDenied requiredRole="Administrator" />;
  }

  return <>{children}</>;
}
