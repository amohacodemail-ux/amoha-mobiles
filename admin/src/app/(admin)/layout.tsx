'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { normalizeRole, type UserRole } from '@/lib/permissions';
import { cn } from '@/lib/utils';

// Allowed roles for admin panel access
const ALLOWED_ROLES: UserRole[] = ['admin', 'sales', 'purchase', 'marketing', 'logistics', 'supplier', 'service_engineer', 'digital_marketing', 'purchase_inventory'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, setUser } = useAuthStore();

  useEffect(() => {
    const verify = async () => {
      // Skip if already verified and user exists with valid role
      if (isAuthenticated && user?.role) {
        const normalizedRole = normalizeRole(user.role as UserRole);
        if (ALLOWED_ROLES.includes(normalizedRole)) {
          setChecking(false);
          return;
        }
      }

      if (!authService.isAuthenticated()) {
        router.replace('/login');
        return;
      }

      try {
        const profile = await authService.getProfile();
        const normalizedRole = normalizeRole(profile.role as UserRole);

        // Check if user has an allowed admin panel role
        if (!ALLOWED_ROLES.includes(normalizedRole)) {
          // User is authenticated but not authorized for admin panel
          authService.logout();
          router.replace('/login?error=unauthorized');
          return;
        }

        setUser(profile);
      } catch {
        router.replace('/login');
      } finally {
        setChecking(false);
      }
    };
    verify();
  }, [pathname]); // Re-verify on route change

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((p) => !p)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Header
        onMobileMenuOpen={() => setMobileOpen(true)}
        collapsed={collapsed}
      />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          collapsed ? 'lg:pl-16' : 'lg:pl-60',
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
