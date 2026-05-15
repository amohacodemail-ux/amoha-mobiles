'use client';

import { memo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineHeart, HiHeart, HiStar, HiOutlineShoppingCart, HiOutlineSwitchHorizontal } from 'react-icons/hi';
import type { Product } from '@/types';
import { formatPrice, getRatingColor, safeImageSrc } from '@/lib/utils';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useCompareStore } from '@/store/compare.store';
import toast from 'react-hot-toast';

const PLACEHOLDER_IMG = '/images/no-product.svg';

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const wishlisted = useWishlistStore((s) => s.items.some((item) => item?.product?._id === product._id));
  const addToCart = useCartStore((s) => s.addToCart);
  const isProductPending = useCartStore((s) => s.isProductPending);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToCompare = useCompareStore((s) => s.addToCompare);
  const removeFromCompare = useCompareStore((s) => s.removeFromCompare);
  const isInCompare = useCompareStore((s) => s.isInCompare);
  const router = useRouter();
  const inStock = typeof (product as any).inStock === 'boolean' ? (product as any).inStock : (product.stock ?? 0) > 0;
  const ratingValue = Number((product as any).ratings ?? (product as any).averageRating ?? 0);
  const reviewCount = Number((product as any).numReviews ?? (product as any).reviewCount ?? 0);
  const compared = isInCompare(product._id);
  const addPending = isProductPending(product._id);

  const handleCompare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (compared) {
      removeFromCompare(product._id);
      toast.success('Removed from compare');
    } else {
      addToCompare(product);
      toast.success('Added to compare');
    }
  }, [compared, product, removeFromCompare, addToCompare]);

  const handleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent('/product/' + product.slug));
      return;
    }
    try {
      if (wishlisted) {
        toast.success('Removed from wishlist');
        await removeFromWishlist(product._id);
      } else {
        toast.success('Added to wishlist');
        await addToWishlist(product._id, product);
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  }, [isAuthenticated, wishlisted, product._id, product.slug, removeFromWishlist, addToWishlist, router]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent('/product/' + product.slug));
      return;
    }
    try {
      await addToCart(product._id);
      toast.success('Added to cart');
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || 'Failed to add to cart';
      toast.error(errMsg);
    }
  }, [isAuthenticated, product._id, product.slug, addToCart, router]);

  const discountPercent = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link href={`/product/${product.slug}`} prefetch={true} className="group flex h-full flex-col">
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card transition-all duration-200 hover:border-slate-300 hover:shadow-card-hover dark:border-white/[0.06] dark:bg-surface-50 dark:shadow-[var(--shadow-card)] dark:hover:border-white/[0.10] dark:hover:shadow-[var(--shadow-card-hover)]">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-slate-50/60 dark:bg-surface-100">
          <Image
            src={safeImageSrc(product.thumbnail || product.images?.[0], PLACEHOLDER_IMG)}
            alt={product.name}
            fill
            className="object-cover p-2 sm:p-3 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          />

          {/* Discount badge */}
          {discountPercent > 0 && inStock && (
            <div className="absolute left-2 top-2 rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              -{discountPercent}%
            </div>
          )}

          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm dark:bg-black/70">
              <span className="rounded-lg bg-gray-900 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white dark:bg-white dark:text-gray-900">
                Out of Stock
              </span>
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
              wishlisted
                ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400'
                : 'bg-white/90 text-slate-400 max-sm:opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-white hover:text-rose-500 dark:bg-surface-100/80 dark:text-slate-400 dark:hover:bg-surface-100 dark:hover:text-rose-400'
            }`}
          >
            {wishlisted ? (
              <HiHeart className="h-4 w-4" />
            ) : (
              <HiOutlineHeart className="h-4 w-4" />
            )}
          </button>

          {/* Compare */}
          <button
            onClick={handleCompare}
            className={`absolute right-2 top-12 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
              compared
                ? 'bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400'
                : 'bg-white/90 text-slate-400 max-sm:opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-white hover:text-accent-600 dark:bg-surface-100/80 dark:text-slate-400 dark:hover:bg-surface-100 dark:hover:text-accent-400'
            }`}
          >
            <HiOutlineSwitchHorizontal className="h-4 w-4" />
          </button>

          {/* Add to cart on hover */}
          {inStock && (
            <button
              onClick={handleAddToCart}
              disabled={addPending}
              className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 bg-slate-800 py-2.5 text-xs font-semibold text-white opacity-0 transition-all duration-200 translate-y-full group-hover:translate-y-0 group-hover:opacity-100 hover:bg-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-accent-600 dark:hover:bg-accent-700"
            >
              <HiOutlineShoppingCart className="h-3.5 w-3.5" />
              {addPending ? 'Adding...' : 'Add to Cart'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {product.brand}
          </p>

          <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-900 dark:text-white sm:text-[15px]">
            {product.name}
          </h3>

          {/* Specs — always reserve one row of height */}
          <div className="mt-2 flex min-h-[1.5rem] flex-wrap gap-1">
            {product.specifications?.ram && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-surface-200 dark:text-slate-400">
                {product.specifications.ram}
              </span>
            )}
            {product.specifications?.storage && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-surface-200 dark:text-slate-400">
                {product.specifications.storage}
              </span>
            )}
          </div>

          {/* Rating — always reserve one row of height */}
          <div className="mt-2 flex min-h-[1.5rem] items-center gap-1.5">
            {reviewCount > 0 && (
              <>
                <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white ${getRatingColor(ratingValue)}`}>
                  {ratingValue.toFixed(1)} <HiStar className="h-2.5 w-2.5" />
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">({reviewCount})</span>
              </>
            )}
          </div>

          <div className="mt-auto pt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-[12px] text-slate-400 dark:text-slate-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default memo(ProductCard);
