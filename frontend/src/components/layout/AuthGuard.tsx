'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CompareFloatingBar from '@/components/ui/CompareFloatingBar';
import MobileBottomNav from '@/components/ui/MobileBottomNav';
import { SafeComponent } from '@/components/ui/SafeComponent';

// Pages accessible without login (auth pages like login/register - no header/footer)
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

// Pages that REQUIRE authentication - only these will redirect to login
const PROTECTED_PATHS = ['/cart', '/checkout', '/orders', '/profile', '/wishlist'];

// Check if a pathname requires authentication
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

// Check if a pathname is an auth page (login/register)
function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.includes(pathname);
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token, fetchProfile } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Wait for zustand to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Fetch profile on mount if token exists
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          await fetchProfile();
        } catch {
          // Token invalid — silently continue as guest
        }
      }
      setIsCheckingAuth(false);
    };

    if (hydrated) {
      checkAuth();
    }
  }, [token, fetchProfile, hydrated]);

  // Redirect authenticated users away from auth pages (login/register)
  useEffect(() => {
    if (hydrated && !isCheckingAuth && isAuthenticated && isAuthPath(pathname)) {
      router.replace('/');
    }
  }, [hydrated, isCheckingAuth, isAuthenticated, pathname, router]);

  // Redirect unauthenticated users to login ONLY for protected pages
  useEffect(() => {
    if (hydrated && !isCheckingAuth && !isAuthenticated && isProtectedPath(pathname)) {
      router.replace('/login');
    }
  }, [hydrated, isCheckingAuth, isAuthenticated, pathname, router]);

  // Don't render anything until hydrated and auth check is complete — BUT ONLY for protected pages
  if (!hydrated || isCheckingAuth) {
    // Auth pages (login/register) — full-screen spinner, no layout
    if (isAuthPath(pathname)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-lg font-bold text-white shadow-glow">
              A
            </div>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        </div>
      );
    }
    // Protected pages — show full layout (header + footer) with spinner in content area
    // so the logo and navigation remain visible while auth resolves
    if (isProtectedPath(pathname)) {
      return (
        <>
          <SafeComponent><Header /></SafeComponent>
          <main className="flex flex-1 items-center justify-center" style={{ minHeight: '60vh' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          </main>
          <SafeComponent><Footer /></SafeComponent>
          <div className="mobile-nav-spacer" />
          <SafeComponent><MobileBottomNav /></SafeComponent>
        </>
      );
    }
    // Public pages: render immediately, auth resolves in background
  }

  // Auth pages (login/register) - no header/footer
  if (isAuthPath(pathname)) {
    if (isAuthenticated) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-lg font-bold text-white shadow-glow">
              A
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting...</p>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  // Protected pages - if not authenticated, show layout with redirect message
  if (isProtectedPath(pathname) && !isAuthenticated) {
    return (
      <>
        <SafeComponent><Header /></SafeComponent>
        <main className="flex flex-1 items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to login...</p>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        </main>
      </>
    );
  }

  // All other pages (public + authenticated) - show header + content + footer
  return (
    <>
      <SafeComponent><Header /></SafeComponent>
      <main className="flex-1">{children}</main>
      <SafeComponent><Footer /></SafeComponent>
      <div className="mobile-nav-spacer" />
      <SafeComponent><MobileBottomNav /></SafeComponent>
      <SafeComponent><CompareFloatingBar /></SafeComponent>
    </>
  );
}
