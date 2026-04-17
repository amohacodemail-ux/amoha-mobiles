'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();

  useEffect(() => {
    const verify = async () => {
      // Skip if already verified and user exists
      if (isAuthenticated && user?.role === 'admin') {
        setChecking(false);
        return;
      }

      if (!authService.isAuthenticated()) {
        router.replace('/login');
        return;
      }
      try {
        const profile = await authService.getProfile();
        if (profile.role !== 'admin') {
          router.replace('/login');
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
  }, []); // Only run once on mount

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
