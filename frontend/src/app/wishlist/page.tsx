'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HiOutlineHeart, HiOutlineTrash, HiOutlineShoppingBag } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice } from '@/lib/utils';

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore();
  const { items, isLoading, fetchWishlist, removeFromWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();

  useEffect(() => {
    if (isAuthenticated) fetchWishlist();
  }, [isAuthenticated, fetchWishlist]);

  if (!isAuthenticated) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-32 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 mx-auto">
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Login Required</h2>
        <p className="mt-2 text-sm text-gray-500">Please sign in to view your wishlist.</p>
        <Link href="/login" className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white hover:bg-primary-500">
          Sign In
        </Link>
      </div>
    );
  }

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleMoveToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
      await removeFromWishlist(productId);
      toast.success('Moved to cart!');
    } catch {
      toast.error('Failed to move to cart');
    }
  };

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            My <span className="gradient-text">Wishlist</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card-sm overflow-hidden">
              <div className="aspect-square shimmer-bg bg-surface-200" />
              <div className="space-y-3 p-3"><div className="h-4 w-full rounded shimmer-bg bg-surface-200" /><div className="h-6 w-24 rounded shimmer-bg bg-surface-200" /></div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.filter((i) => i.product).map((item) => (
            <div key={item._id} className="glass-card-sm group overflow-hidden">
              <Link href={`/product/${item.product?.slug || '#'}`} className="relative block aspect-square overflow-hidden bg-gray-100 dark:bg-white/5">
                <Image
                  src={item.product?.thumbnail || '/images/no-product.svg'}
                  alt={item.product?.name || 'Product'}
                  fill
                 
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {(item.product?.discount ?? 0) > 0 && (
                  <span className="absolute left-2 top-2 badge-discount">{item.product?.discount}% OFF</span>
                )}
              </Link>
              <div className="p-3 sm:p-4">
                <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400">{item.product?.brand || ''}</p>
                <Link href={`/product/${item.product?.slug || '#'}`} className="mt-1 block text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-primary-400 transition-colors">
                  {item.product?.name || 'Product'}
                </Link>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.product?.price ?? 0)}</span>
                  {(item.product?.originalPrice ?? 0) > (item.product?.price ?? 0) && (
                    <span className="text-xs text-gray-500 line-through">{formatPrice(item.product?.originalPrice ?? 0)}</span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleMoveToCart(item.product?._id || '')}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-600 py-2.5 text-xs font-semibold text-white transition-all hover:bg-primary-500"
                  >
                    <HiOutlineShoppingBag className="h-3.5 w-3.5" />
                    Move to Cart
                  </button>
                  <button
                    onClick={() => handleRemove(item.product?._id || '')}
                    className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-3 py-2.5 text-gray-500 dark:text-gray-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <HiOutlineTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
            <HiOutlineHeart className="h-10 w-10 text-gray-600" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">Your wishlist is empty</h3>
          <p className="mt-1 text-sm text-gray-500">Save items you love to buy them later.</p>
          <Link href="/products" className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow">
            Browse Mobiles
          </Link>
        </div>
      )}
    </div>
  );
}
