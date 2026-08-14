'use client';

import Link from 'next/link';
import Image from 'next/image';
import { safeImageSrc } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryCarouselProps {
  categories: Category[];
}

export default function CategoryCarousel({ categories }: CategoryCarouselProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 border-t border-gray-50 dark:border-white/5">
      <div className="page-container">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Shop by Category</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-4">
          {categories.map((category) => (
            <Link
              key={category._id || category.slug}
              href={`/products?category=${category.slug}`}
              className="group flex flex-col items-center gap-3 snap-start min-w-[100px] sm:min-w-[120px]"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-white/5 relative border border-slate-200 dark:border-white/10 flex-shrink-0 transition-transform group-hover:scale-105 group-hover:shadow-md">
                <Image
                  src={safeImageSrc(category.image, '/images/no-category.svg')}
                  alt={category.name || 'Category'}
                  fill
                  sizes="(max-width: 640px) 80px, 96px"
                  className="object-cover"
                />
              </div>
              <span className="text-xs sm:text-sm font-medium text-center text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
