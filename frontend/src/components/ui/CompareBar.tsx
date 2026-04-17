'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HiOutlineX, HiOutlineSwitchHorizontal } from 'react-icons/hi';
import { useCompareStore } from '@/store/compare.store';

const PLACEHOLDER_IMG = '/images/no-product.png';

export default function CompareBar() {
  const { items, removeFromCompare, clearCompare } = useCompareStore();

  const count = useMemo(() => items.length, [items]);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-100/95 dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <div className="page-container flex items-center gap-3 py-2.5 sm:py-3">
        {/* Icon + Count */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
            <HiOutlineSwitchHorizontal className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 dark:text-white">{count} of 4</p>
            <p className="text-[11px] text-gray-600 dark:text-gray-400">Products</p>
          </div>
        </div>

        {/* Product Thumbnails */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide">
          {items.map((product) => (
            <div key={product._id} className="group relative flex-shrink-0">
              <div className="relative h-12 w-12 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 sm:h-14 sm:w-14">
                <Image
                  src={product.thumbnail || PLACEHOLDER_IMG}
                  alt={product.name}
                  fill
                 
                  className="object-cover p-0.5"
                  sizes="56px"
                />
              </div>
              <button
                onClick={() => removeFromCompare(product._id)}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <HiOutlineX className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: 4 - count }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-white/10 sm:h-14 sm:w-14"
            >
              <span className="text-[10px] text-gray-300 dark:text-gray-600">+</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearCompare}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 dark:hover:bg-white/5 dark:hover:text-red-400 sm:px-3"
          >
            Clear
          </button>
          <Link
            href="/compare"
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Compare
            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
