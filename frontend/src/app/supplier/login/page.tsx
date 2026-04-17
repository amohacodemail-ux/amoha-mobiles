'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

export default function SupplierLoginPage() {
  const router = useRouter();
  const { login, logout, isLoading, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'supplier') {
      router.replace('/supplier/profile');
    }
  }, [isAuthenticated, user?.role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your supplier ID and password');
      return;
    }

    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role;
      if (role !== 'supplier') {
        logout();
        toast.error('This page is only for supplier accounts');
        return;
      }
      toast.success('Supplier login successful');
      router.replace('/supplier/profile');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Supplier login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-3 py-8 sm:px-4 sm:py-12">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary-600/20 to-accent-600/20 blur-3xl" />
        <div className="glass-card relative p-5 sm:p-8 md:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-lg font-bold text-white shadow-glow">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Supplier Portal</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in with the ID and password created by admin</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Supplier ID / Email</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-10 py-3 text-sm"
                  placeholder="supplier@example.com"
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
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                >
                  {showPassword ? <HiOutlineEyeOff className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In as Supplier'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
            <p>Your admin will create the login for you.</p>
            <p>
              Regular customer login?{' '}
              <Link href="/login" className="font-semibold text-primary-400 hover:text-primary-300">Go here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
