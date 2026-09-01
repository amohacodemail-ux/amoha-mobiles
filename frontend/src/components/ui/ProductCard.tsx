'use client';

import { memo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineHeart, HiHeart, HiStar, HiOutlineShoppingCart, HiOutlineSwitchHorizontal, HiShieldCheck } from 'react-icons/hi';
import type { Product } from '@/types';
import { formatPrice, safeImageSrc } from '@/lib/utils';
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
    <div className="group relative flex h-full flex-col rounded-[24px] border border-gray-100 dark:border-white/10 bg-white dark:bg-[#121212] p-2 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 md:hover:-translate-y-1 md:hover:shadow-lg dark:md:hover:border-white/20">
      
      {/* Image Section Wrapper */}
      <div className="relative h-[130px] sm:h-[160px] w-full rounded-[20px] bg-gray-50 dark:bg-white/5 flex items-center justify-center overflow-hidden">
        {/* Top Left Badge */}
        {discountPercent > 0 && (
          <div className="absolute left-2.5 top-2.5 z-10 rounded-full bg-[#3b82f6] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            -{discountPercent}%
          </div>
        )}

        {/* Top Right Wishlist */}
        <button
          onClick={handleWishlist}
          className={`absolute right-2.5 top-2.5 z-10 flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm transition-all duration-200 md:hover:scale-110 ${
            wishlisted ? 'text-red-500' : 'text-gray-400 md:hover:text-red-500'
          }`}
          title="Wishlist"
        >
          {wishlisted ? <HiHeart className="h-[14px] w-[14px]" /> : <HiOutlineHeart className="h-[14px] w-[14px]" />}
        </button>

        <Link href={`/product/${product.slug}`} prefetch={true} className="absolute inset-0 flex items-center justify-center">
          <Image
            src={safeImageSrc(product.thumbnail || product.images?.[0], PLACEHOLDER_IMG)}
            alt={product.name}
            fill
            className="object-contain p-2 sm:p-3 transition-transform duration-500 md:group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          />
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1">
        
        {/* Badges (Vertical Stack) */}
        <div className="flex flex-col items-start gap-1.5 mb-2">
          {/* Warranty Badge */}
          <div className="flex items-center gap-1 rounded-full border border-purple-100 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-600 dark:text-purple-400">
            <HiShieldCheck className="h-2.5 w-2.5" />
            Warranty
          </div>
          {/* Stock Status */}
          {inStock && (
            <div className="rounded-full bg-green-50 dark:bg-green-500/10 px-2 py-0.5 text-[9px] font-bold text-green-600 dark:text-green-400">
              In Stock
            </div>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/product/${product.slug}`} prefetch={true} className="md:group-hover:text-blue-600 transition-colors">
          <h3 className="line-clamp-2 text-[12px] sm:text-[13px] font-bold leading-snug text-gray-900 dark:text-white">
            {product.name}
          </h3>
        </Link>

        {/* Price (Stacked) & Add to Cart */}
        <div className="flex flex-col flex-1 pt-1.5">
          <div className="flex flex-col">
            <span className="text-[16px] sm:text-[17px] font-extrabold text-black dark:text-white">
              {formatPrice(product.price)}
            </span>
            <div className="min-h-[16px] mb-2">
              {product.originalPrice > product.price && (
                <span className="text-[11px] font-semibold text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={addPending || !inStock}
            className="mt-auto w-full h-[36px] flex items-center justify-center gap-1.5 rounded-full bg-[#4F46E5] text-[12px] font-bold text-white transition-all duration-300 hover:bg-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-blue-400"
          >
            <HiOutlineShoppingCart className="h-[14px] w-[14px]" />
            {addPending ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard);

