/**
 * RoleGuard component
 * Redirects users to /dashboard if their role is not in the allowedRoles list.
 * Use this to protect admin-only pages from being accessed by non-admin roles.
 *
 * Usage:
 *   <RoleGuard allowedRoles={['admin']}>
 *     <YourAdminPage />
 *   </RoleGuard>
 */
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { normalizeRole } from '@/lib/permissions';
import type { UserRole } from '@/lib/permissions';

interface RoleGuardProps {
  /** Roles that ARE allowed to access this page */
  allowedRoles: UserRole[];
  /** Where to redirect unauthorized users (default: /dashboard) */
  redirectTo?: string;
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, redirectTo = '/dashboard', children }: RoleGuardProps) {
  const { user } = useAuthStore();
  const router = useRouter();

  const userRole = user?.role ? normalizeRole(user.role as UserRole) : null;
  const isAllowed = userRole ? allowedRoles.map(r => normalizeRole(r)).includes(userRole as UserRole) : false;

  useEffect(() => {
    if (user && !isAllowed) {
      router.replace(redirectTo);
    }
  }, [user, isAllowed, router, redirectTo]);

  // Don't render while checking / if not allowed
  if (!user || !isAllowed) return null;

  return <>{children}</>;
}

/**
 * withRoleGuard HOC — use to wrap an entire page component.
 *
 * Usage:
 *   export default withRoleGuard(MyPage, ['admin']);
 */
export function withRoleGuard<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  allowedRoles: UserRole[],
  redirectTo = '/dashboard',
) {
  return function GuardedPage(props: T) {
    return (
      <RoleGuard allowedRoles={allowedRoles} redirectTo={redirectTo}>
        <WrappedComponent {...props} />
      </RoleGuard>
    );
  };
}
