'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HiOutlineMail, HiOutlineArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setIsSent(true);
      toast.success('Reset link sent to your email!');
    } catch {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary-600/20 to-accent-600/20 blur-3xl" />
        <div className="glass-card relative p-8 sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-lg font-bold text-white shadow-glow">
              A
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Forgot Password?</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isSent
                ? 'Check your email for the reset link'
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {isSent ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                <p className="text-3xl"></p>
                <p className="mt-2 text-sm font-medium text-emerald-400">
                  Reset link sent successfully!
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Please check your inbox at <span className="text-gray-900 dark:text-white">{email}</span>
                </p>
              </div>
              <button
                onClick={() => { setIsSent(false); setEmail(''); }}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 transition-all hover:bg-gray-200 dark:hover:bg-white/10"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Email Address</label>
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

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-primary-400"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
