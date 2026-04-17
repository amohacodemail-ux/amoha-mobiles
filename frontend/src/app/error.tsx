'use client';

import { useEffect } from 'react';
import { HiOutlineRefresh, HiOutlineHome } from 'react-icons/hi';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="absolute -inset-8 rounded-full bg-red-600/10 blur-3xl" />
          <h1 className="relative text-[100px] font-black leading-none text-red-500 sm:text-[140px]">
            500
          </h1>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Something Went Wrong</h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-gray-500">
          An unexpected error occurred. Please try again or go back to the home page.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow"
          >
            <HiOutlineRefresh className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-8 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white"
          >
            <HiOutlineHome className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

