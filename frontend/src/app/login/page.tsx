'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { login, isLoading, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(user?.role === 'supplier' ? '/supplier/profile' : redirectTo);
    }
  }, [isAuthenticated, router, redirectTo, user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill all fields'); return; }
    try {
      await login(email, password);
      toast.success('Welcome back!');
      // Navigation handled by the isAuthenticated useEffect below
    } catch (err: unknown) {
      const message = (err as Error).message || 'Login failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-3 sm:px-4 py-8 sm:py-12">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary-600/20 to-accent-600/20 blur-3xl" />
        <div className="glass-card relative p-5 sm:p-8 md:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-lg font-bold text-white shadow-glow">
              A
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Welcome to AMOHA</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in to continue. Suppliers can also use this login.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-10 py-3 text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-10 pr-10 py-3 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                >
                  {showPassword ? <HiOutlineEyeOff className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/5 text-primary-500 focus:ring-primary-500/20" />
                <span className="text-xs text-gray-500">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-xs font-medium text-primary-400 hover:text-primary-300">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-primary-400 hover:text-primary-300">Create one</Link>
            </p>
            <p>
              Supplier access?{' '}
              <Link href="/supplier/login" className="font-semibold text-primary-400 hover:text-primary-300">Open supplier login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

