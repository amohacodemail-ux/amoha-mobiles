'use client';

import { memo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineHeart, HiHeart, HiOutlineShoppingCart, HiOutlineShieldCheck } from 'react-icons/hi';
import type { Product } from '@/types';
import { formatPrice, safeImageSrc } from '@/lib/utils';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const PLACEHOLDER_IMG = '/images/no-product.svg';

interface ProductCardProps {
  product: Product;
}

function ListingProductCard({ product }: ProductCardProps) {
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const wishlisted = useWishlistStore((s) => s.items.some((item) => item?.product?._id === product._id));
  const addToCart = useCartStore((s) => s.addToCart);
  const isProductPending = useCartStore((s) => s.isProductPending);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  
  const inStock = typeof (product as any).inStock === 'boolean' ? (product as any).inStock : (product.stock ?? 0) > 0;
  const addPending = isProductPending(product._id);

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
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white p-2 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-white/10 dark:bg-surface-50 w-full">
      
      {/* Top Image Section */}
      <Link href={`/product/${product.slug}`} prefetch={true} className="relative block w-full overflow-hidden bg-[#F4F4F4] dark:bg-surface-100 rounded-[16px]">
        <div className="relative w-full h-[120px] sm:h-[140px] flex items-center justify-center">
          <Image
            src={safeImageSrc(product.thumbnail || product.images?.[0], PLACEHOLDER_IMG)}
            alt={product.name}
            fill
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          />
        </div>

        {/* Discount Badge */}
        {discountPercent > 0 && inStock && (
          <div className="absolute left-2 top-2 z-10 rounded-full bg-[#5264F9] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:left-2.5 sm:top-2.5 sm:px-2.5 sm:py-1 sm:text-[11px]">
            -{discountPercent}%
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={`absolute right-2 top-2 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-200 hover:scale-110 dark:bg-surface-200 sm:right-2.5 sm:top-2.5 ${
            wishlisted ? 'text-red-500' : 'text-gray-900 hover:text-red-500 dark:text-gray-100'
          }`}
        >
          {wishlisted ? <HiHeart className="h-4 w-4" /> : <HiOutlineHeart className="h-4 w-4 stroke-[2]" />}
        </button>
      </Link>

      {/* Product Details */}
      <div className="flex flex-col pt-2 px-1 pb-1">
        {/* Badges Row */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {/* Warranty Badge */}
          <span className="flex items-center gap-1 rounded-full bg-[#EEEDFF] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#6D63FF] dark:bg-purple-900/30 dark:text-purple-300">
            <HiOutlineShieldCheck className="h-2.5 w-2.5 stroke-[2]" />
            Warranty
          </span>
          {/* Stock Badge */}
          {inStock ? (
            <span className="flex items-center rounded-full bg-[#E5F8ED] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#00A859] dark:bg-green-900/30 dark:text-green-400">
              In Stock
            </span>
          ) : (
            <span className="flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
              Out of Stock
            </span>
          )}
        </div>

        {/* Product Name */}
        <Link href={`/product/${product.slug}`} prefetch={true} className="mb-1">
          <h3 className="line-clamp-2 text-[12px] sm:text-[13px] font-bold leading-tight text-gray-900 dark:text-white">
            {product.name}
          </h3>
        </Link>

        {/* Price Row (Now naturally sitting under the title) */}
        <div className="mb-3 flex flex-wrap items-baseline gap-1 sm:gap-1.5">
          <span className="text-[16px] sm:text-[17px] font-extrabold text-gray-900 dark:text-white">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <div className="mt-2">
          <button
            onClick={handleAddToCart}
            disabled={addPending || !inStock}
            className="group/btn flex w-full h-[36px] sm:h-[40px] items-center justify-center gap-1.5 rounded-full bg-[#5264F9] text-[11px] sm:text-[12px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-[#4352D4] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HiOutlineShoppingCart className="h-4 w-4 stroke-[2]" />
            {addPending ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ListingProductCard);
