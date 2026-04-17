'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { HiOutlineCheckCircle, HiOutlineShoppingBag, HiOutlineClipboardList } from 'react-icons/hi';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  return (
    <div className="page-container flex flex-col items-center justify-center py-20 text-center sm:py-32">
      <div className="relative">
        <div className="absolute -inset-6 rounded-full bg-emerald-500/10 blur-2xl" />
        <HiOutlineCheckCircle className="relative h-24 w-24 text-emerald-400 animate-pulse-glow" />
      </div>

      <h1 className="mt-8 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Order Placed!</h1>
      <p className="mt-3 max-w-md text-sm text-gray-500 dark:text-gray-400">
        Thank you for your purchase. Your order has been confirmed and will be shipped soon.
      </p>

      {orderId && (
        <div className="mt-6 glass-card-sm inline-flex items-center gap-2 px-5 py-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">Order ID:</span>
          <span className="text-sm font-mono font-semibold text-primary-400">{orderId}</span>
        </div>
      )}

      <div className="mt-8 glass-card max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
            <span className="text-lg">1</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Order Confirmed</p>
            <p className="text-xs text-gray-500">We&apos;re preparing your order</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
            <span className="text-lg">2</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Shipping</p>
            <p className="text-xs text-gray-600">Estimated delivery in 3-5 days</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
            <span className="text-lg">3</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivered</p>
            <p className="text-xs text-gray-600">Your doorstep awaits</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/orders"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow"
        >
          <HiOutlineClipboardList className="h-4 w-4" />
          View My Orders
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-8 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white"
        >
          <HiOutlineShoppingBag className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="page-container py-32 text-center"><div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}

