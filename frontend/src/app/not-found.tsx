import Link from 'next/link';
import { HiOutlineHome, HiOutlineShoppingBag } from 'react-icons/hi';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="absolute -inset-8 rounded-full bg-primary-600/10 blur-3xl" />
          <h1 className="relative text-[120px] font-black leading-none gradient-text sm:text-[160px]">
            404
          </h1>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Page Not Found</h2>
        <p className="mt-2 text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow"
          >
            <HiOutlineHome className="h-4 w-4" />
            Go Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-8 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white"
          >
            <HiOutlineShoppingBag className="h-4 w-4" />
            Browse Shop
          </Link>
        </div>
      </div>
    </div>
  );
}

