'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  HiOutlineHeart, HiOutlineTrash, HiOutlineShoppingBag, 
  HiHeart, HiCheck, HiChevronRight, HiOutlineDeviceMobile, 
  HiOutlineDesktopComputer, HiOutlineDeviceTablet, HiOutlineLightningBolt,
  HiOutlineClock
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice } from '@/lib/utils';
import { productService } from '@/services/product.service';
import ProductCard from '@/components/ui/ProductCard';

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore();
  const { items, isLoading, fetchWishlist, removeFromWishlist } = useWishlistStore();
  const { addToCart, isProductPending } = useCartStore();
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchWishlist();
  }, [isAuthenticated, fetchWishlist]);

  // Fetch trending products only when wishlist is empty and not loading
  useEffect(() => {
    if (!isLoading && items.length === 0 && trendingProducts.length === 0) {
      setIsTrendingLoading(true);
      productService.getTrending()
        .then(res => setTrendingProducts(res.slice(0, 4)))
        .catch(() => setTrendingProducts([]))
        .finally(() => setIsTrendingLoading(false));
    }
  }, [isLoading, items.length, trendingProducts.length]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-background flex flex-col items-center justify-center py-32 text-center page-container">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-white/5 shadow-sm mx-auto mb-6">
          <HiOutlineHeart className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Login Required</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">Please sign in to view and manage your saved wishlist items.</p>
        <Link href="/login" className="mt-8 rounded-full bg-gray-900 dark:bg-white px-8 py-3.5 text-sm font-bold text-white dark:text-gray-900 transition-all hover:scale-105 active:scale-95 shadow-md">
          Sign In to Continue
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
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="page-container py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Home</Link>
          <HiChevronRight className="mx-2 h-4 w-4" />
          <Link href="/profile" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">My Account</Link>
          <HiChevronRight className="mx-2 h-4 w-4" />
          <span className="text-gray-900 dark:text-gray-200">Wishlist</span>
        </nav>

        {/* Clean Header */}
        <div className="mb-4 flex flex-col gap-2 border-b border-gray-200/60 dark:border-white/10 pb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl tracking-tight">
            My Wishlist <span className="text-gray-400 font-medium text-2xl ml-2">({items.length} {items.length === 1 ? 'Item' : 'Items'})</span>
          </h1>
          <p className="text-sm font-medium text-gray-500">Save your favorite items and buy them later.</p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[20px] bg-white dark:bg-surface-100 p-4 shadow-sm h-[420px] flex flex-col">
                <div className="h-[65%] w-full rounded-2xl shimmer-bg bg-gray-100 dark:bg-white/5" />
                <div className="mt-4 space-y-3 flex-1">
                  <div className="h-4 w-1/3 rounded shimmer-bg bg-gray-100 dark:bg-white/5" />
                  <div className="h-6 w-3/4 rounded shimmer-bg bg-gray-100 dark:bg-white/5" />
                  <div className="h-5 w-1/2 rounded shimmer-bg bg-gray-100 dark:bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.filter((i) => i.product).map((item, idx) => {
              const productId = item.product?._id || '';
              const addPending = productId ? isProductPending(productId) : false;
              const hasDiscount = (item.product?.discount ?? 0) > 0;
              const price = item.product?.price ?? 0;
              const original = item.product?.originalPrice ?? 0;
              const brandName = item.product?.brand || item.product?.name?.split(' ')[0] || 'Brand';

              return (
                <div 
                  key={item._id} 
                  className="group relative flex flex-row gap-4 sm:gap-5 overflow-hidden rounded-[18px] sm:rounded-[20px] bg-white dark:bg-surface-100 p-3.5 sm:p-5 border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)] animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Heart Quick-Remove Button (Top Right of Card) */}
                  <button
                    onClick={() => handleRemove(productId)}
                    className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 flex h-7 w-7 sm:h-8 sm:w-8 flex-col items-center justify-center rounded-full bg-white/90 dark:bg-surface-100/90 shadow-sm sm:shadow-none text-red-500 hover:scale-110 active:scale-95 transition-all"
                    aria-label="Remove from wishlist"
                  >
                    <HiHeart className="h-4 w-4 sm:h-5 sm:w-5 drop-shadow-sm sm:drop-shadow-none" />
                  </button>

                  {/* Image Section (Always Left) */}
                  <div className="relative h-[110px] w-[110px] sm:h-[150px] sm:w-[130px] flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 dark:bg-surface-200">
                    <Link href={`/product/${item.product?.slug || '#'}`} className="block w-full h-full p-2 sm:p-3">
                      <Image
                        src={item.product?.thumbnail || '/images/no-product.svg'}
                        alt={item.product?.name || 'Product'}
                        fill
                        className="object-contain p-2 sm:p-3 transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 110px, 130px"
                      />
                    </Link>
                    
                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute left-1.5 top-1.5 sm:left-2 sm:top-2 rounded-md bg-red-500 px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-sm z-10">
                        {item.product?.discount}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Details Section (Always Right) */}
                  <div className="flex flex-1 flex-col justify-between py-0.5">
                    
                    <div>
                      {/* Product Name */}
                      <Link href={`/product/${item.product?.slug || '#'}`} className="block pr-8">
                        <h3 className="text-sm sm:text-[15px] font-extrabold text-gray-900 dark:text-white line-clamp-1 leading-tight hover:text-blue-600 transition-colors">
                          {item.product?.name || 'Product'}
                        </h3>
                      </Link>

                      {/* Brand & Subtitle */}
                      <p className="text-[11px] sm:text-[13px] font-bold text-gray-800 dark:text-gray-300 mt-0.5 mb-1 uppercase">
                        ({brandName})
                      </p>

                      {/* Rating Row */}
                      <div className="flex items-center gap-1 text-[10px] sm:text-[12px] font-bold text-gray-700 dark:text-gray-300">
                        <span className="text-yellow-400 text-sm">★</span> 4.6 <span className="text-gray-400 font-normal ml-0.5">(245)</span>
                      </div>

                      {/* Price Row */}
                      <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
                        <span className="text-base sm:text-[18px] font-extrabold text-gray-900 dark:text-white">{formatPrice(price)}</span>
                        {original > price && (
                          <span className="text-xs sm:text-[13px] font-medium text-gray-400 line-through">{formatPrice(original)}</span>
                        )}
                        {hasDiscount && (
                          <span className="text-xs sm:text-[12px] font-bold text-green-600 ml-1">{item.product?.discount}% off</span>
                        )}
                      </div>

                      {/* Stock & Delivery Info */}
                      <div className="mt-2 flex flex-col gap-1 sm:gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-green-500">
                          <div className="flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-green-50 dark:bg-green-500/10">
                            <HiCheck className="h-2 w-2 sm:h-3 sm:w-3" />
                          </div>
                          In Stock
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-gray-600 dark:text-gray-400">
                          <span className="text-sm sm:text-[14px]">🚚</span> Free Delivery Tomorrow
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-3 sm:mt-4 flex gap-2 sm:gap-3">
                      <button
                        onClick={() => handleMoveToCart(productId)}
                        disabled={addPending}
                        className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-[#5264F9] text-[#5264F9] bg-white hover:bg-[#5264F9]/5 py-2 sm:h-[36px] text-xs sm:text-[13px] font-bold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <HiOutlineShoppingBag className="h-4 w-4 sm:h-4 sm:w-4" />
                        {addPending ? 'Moving...' : 'Move to Cart'}
                      </button>
                      <button
                        onClick={() => handleRemove(productId)}
                        className="flex h-[32px] w-[32px] sm:h-[36px] sm:w-[36px] flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-transparent text-gray-500 dark:text-gray-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-[0.95]"
                        aria-label="Delete item"
                      >
                        <HiOutlineTrash className="h-4 w-4 sm:h-4 sm:w-4" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Clean Empty State Matching Requested UI */
          <div className="flex flex-col items-center justify-center animate-fade-in-up pt-12 pb-20 w-full mx-auto">
            <div className="text-center w-full max-w-md mx-auto flex flex-col items-center justify-center">
              
              {/* Circular Graphic */}
              <div className="relative mb-6 flex justify-center">
                {/* Outer light blue circle */}
                <div className="relative flex h-[150px] w-[150px] items-center justify-center rounded-full bg-[#F3F7FC] dark:bg-surface-200">
                  {/* Colored dots */}
                  <div className="absolute top-[20%] right-[25%] h-2 w-2 rounded-full bg-[#82B1FF]"></div>
                  <div className="absolute bottom-[25%] left-[18%] h-2 w-2 rounded-full bg-[#FFD54F]"></div>
                  <div className="absolute top-[50%] right-[10%] h-1.5 w-1.5 rounded-full bg-[#69F0AE]"></div>
                  
                  {/* Inner white circle with shadow */}
                  <div className="relative flex h-[95px] w-[95px] items-center justify-center rounded-full bg-white dark:bg-surface-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                    <HiOutlineHeart className="h-10 w-10 text-blue-600 stroke-[1.5]" />
                    
                    {/* Orange Question mark badge */}
                    <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#FFA000] border-2 border-white dark:border-surface-100 text-white font-bold text-xs shadow-sm">
                      ?
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-[26px] font-extrabold text-[#0F172A] dark:text-white leading-snug mb-3 tracking-tight">Your wishlist is empty</h3>
              <p className="text-[15px] text-[#64748B] dark:text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
                Looks like you haven't added anything yet. Browse items and add them to your wishlist.
              </p>
              
              <Link 
                href="/products" 
                className="flex h-[46px] px-10 items-center justify-center rounded-full bg-[#2563EB] text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.39)] transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
              >
                Start Shopping
              </Link>
            </div>

            {/* Recommended Products Section */}
            {!isTrendingLoading && trendingProducts.length > 0 && (
              <div className="mt-12 w-full max-w-[1400px]">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">Recommended for You</h4>
                  <Link href="/products" className="text-sm font-bold text-[#5264F9] hover:underline flex items-center gap-1">
                    View All <HiChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                  {trendingProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
