'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productService } from '@/services/product.service';
import { Product } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice } from '@/lib/utils';

export default function RecentlyViewed() {
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated) {
      setLoading(false);
      return;
    }
    productService
      .getRecentlyViewed(10)
      .then((data) => setProducts(Array.isArray(data) ? data.filter(Boolean) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, mounted]);

  if (!mounted || !isAuthenticated || (!loading && products.length === 0)) return null;

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-44 shrink-0 animate-pulse">
              <div className="h-44 bg-gray-100 rounded-lg" />
              <div className="h-4 bg-gray-100 rounded mt-2 w-3/4" />
              <div className="h-4 bg-gray-100 rounded mt-1 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {products.filter((p) => p && p._id).map((product) => (
          <Link
            key={product._id}
            href={`/product/${product.slug || '#'}`}
            className="w-44 shrink-0 group"
          >
            <div className="relative h-44 bg-gray-50 rounded-lg overflow-hidden">
              <Image
                src={product.thumbnail || '/images/no-product.svg'}
                alt={product.name || 'Product'}
                fill
                className="object-contain p-2 group-hover:scale-105 transition-transform"
                sizes="176px"
              />
              {(product.discount ?? 0) > 0 && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {product.discount}% OFF
                </span>
              )}
            </div>
            <h3 className="text-xs font-medium text-gray-800 mt-2 line-clamp-2 group-hover:text-primary transition-colors">
              {product.name || 'Product'}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-sm font-semibold">{formatPrice(product.price ?? 0)}</span>
              {(product.originalPrice ?? 0) > (product.price ?? 0) && (
                <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice ?? 0)}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
