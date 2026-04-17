'use client';

import { HiOutlineRefresh } from 'react-icons/hi';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col bg-[#0a0a1a] text-gray-700 dark:text-gray-200 antialiased">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="absolute -inset-8 rounded-full bg-red-600/10 blur-3xl" />
              <h1 className="relative text-[100px] font-black leading-none text-red-500 sm:text-[140px]">
                500
              </h1>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Critical Error</h2>
            <p className="mt-2 max-w-md mx-auto text-sm text-gray-500 dark:text-gray-400">
              Something went seriously wrong. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500"
            >
              <HiOutlineRefresh className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
