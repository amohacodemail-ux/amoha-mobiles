'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
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
  const { isAuthenticated, token, fetchProfile, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Wait for zustand to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Validate auth whenever protected route changes to prevent stale session rendering.
  useEffect(() => {
    const checkAuth = async () => {
      const protectedPath = isProtectedPath(pathname);
      if (!protectedPath) {
        setIsCheckingAuth(false);
        return;
      }

      setIsCheckingAuth(true);
      const cookieToken = Cookies.get('token');
      if (!token || !cookieToken) {
        logout();
        setIsCheckingAuth(false);
        return;
      }

      try {
        await fetchProfile();
      } catch {
        logout();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    if (hydrated) {
      checkAuth();
    }
  }, [pathname, token, fetchProfile, hydrated, logout]);

  // Enforce auth when navigating browser history/back-forward cache.
  useEffect(() => {
    if (!hydrated) return;

    const enforceProtectedRouteAuth = () => {
      const currentPath = window.location.pathname;
      if (!isProtectedPath(currentPath)) return;
      const hasToken = !!Cookies.get('token');
      if (!hasToken) {
        logout();
        const redirect = encodeURIComponent(`${currentPath}${window.location.search || ''}`);
        window.location.replace(`/login?redirect=${redirect}`);
      }
    };

    const onPageShow = () => enforceProtectedRouteAuth();
    const onPopState = () => enforceProtectedRouteAuth();

    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('popstate', onPopState);
    };
  }, [hydrated, logout]);

  // Background profile refresh on public/auth pages when a token exists.
  useEffect(() => {
    const checkAuth = async () => {
      if (isProtectedPath(pathname)) return;
      if (token && Cookies.get('token')) {
        try {
          await fetchProfile();
        } catch {
          logout();
        }
      }
    };

    if (hydrated) {
      checkAuth();
    }
  }, [pathname, token, fetchProfile, hydrated, logout]);

  // Redirect authenticated users away from auth pages (login/register)
  useEffect(() => {
    if (hydrated && !isCheckingAuth && isAuthenticated && isAuthPath(pathname)) {
      router.replace('/');
    }
  }, [hydrated, isCheckingAuth, isAuthenticated, pathname, router]);

  // Redirect unauthenticated users to login ONLY for protected pages
  useEffect(() => {
    if (hydrated && !isCheckingAuth && !isAuthenticated && isProtectedPath(pathname)) {
      router.replace('/login?redirect=' + encodeURIComponent(pathname));
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
