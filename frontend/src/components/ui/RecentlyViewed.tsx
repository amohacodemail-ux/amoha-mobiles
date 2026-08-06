'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  ArrowRightLeft, 
  Eye, 
  Share2, 
  ShoppingCart, 
  CreditCard,
  Star
} from 'lucide-react';
import { productService } from '@/services/product.service';
import { Product } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function RecentlyViewed() {
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Scroll tracking for indicator
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);

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

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    
    // Calculate current item index based on scroll position (approximate)
    const cardWidth = 280 + 24; // Width + gap
    const index = Math.round(scrollLeft / cardWidth);
    setCurrentScrollIndex(Math.min(index, products.length - 1));
  };

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const cardWidth = 280 + 24; // Width + gap
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -cardWidth : cardWidth,
      behavior: 'smooth'
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (!carouselRef.current) return;
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleActionClick = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success(`${action} feature coming soon!`, {
      icon: '✨',
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
  };

  if (!mounted || !isAuthenticated || (!loading && products.length === 0)) return null;

  const validProducts = products.filter((p) => p && p._id).filter((product, index, self) => index === self.findIndex((p) => p._id === product._id));

  if (validProducts.length === 0 && !loading) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        
        {/* Floating Premium Container */}
        <div className="relative overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-white/5 dark:bg-[#0f0f13] dark:shadow-none sm:p-10 p-6">
          
          {/* Subtle Radial Gradient Background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white dark:from-blue-900/10 dark:via-[#0f0f13] dark:to-[#0f0f13]" />

          {/* Header */}
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end mb-10">
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[32px]"
              >
                Recently Viewed
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-2 text-sm text-gray-500 dark:text-gray-400 sm:text-[15px]"
              >
                Continue shopping from where you left off.
              </motion.p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 mr-2">
                {String(currentScrollIndex + 1).padStart(2, '0')} / {String(validProducts.length || 4).padStart(2, '0')}
              </span>
              
              <button 
                onClick={() => scrollByAmount('left')}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => scrollByAmount('right')}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
              <Link href="/products" className="ml-2 hidden sm:inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100">
                View All
              </Link>
            </div>
          </div>

          {/* Carousel */}
          <div 
            ref={carouselRef}
            className={`relative z-10 flex gap-6 overflow-x-auto pb-8 pt-4 scrollbar-hide sm:snap-x sm:snap-mandatory ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onScroll={handleScroll}
            style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
          >
            {loading ? (
              // Skeletons
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-[420px] w-[280px] shrink-0 animate-pulse rounded-[28px] bg-gray-100 dark:bg-white/5" />
              ))
            ) : (
              validProducts.map((product, idx) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group relative h-[420px] w-[280px] shrink-0 sm:snap-start"
                >
                  <Link href={`/product/${product.slug || '#'}`} className="block h-full w-full outline-none">
                    <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-[#EEF2F7] bg-white/90 backdrop-blur-md transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-[#1a1a24]/90 dark:group-hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]">
                      
                      {/* Top Badges (Left) */}
                      {(product.discount ?? 0) > 0 && (
                        <div className="absolute left-3 top-3 z-20">
                          <span className="inline-flex rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                            {product.discount}% OFF
                          </span>
                        </div>
                      )}

                      {/* Top Actions (Right) - Reveal on Hover */}
                      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 translate-x-10 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                        <button onClick={(e) => handleActionClick(e, 'Wishlist')} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-red-500 dark:bg-black/50 dark:text-gray-300 dark:hover:bg-black/80 dark:hover:text-red-400">
                          <Heart className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => handleActionClick(e, 'Compare')} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-blue-500 dark:bg-black/50 dark:text-gray-300 dark:hover:bg-black/80 dark:hover:text-blue-400">
                          <ArrowRightLeft className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => handleActionClick(e, 'Quick View')} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-purple-500 dark:bg-black/50 dark:text-gray-300 dark:hover:bg-black/80 dark:hover:text-purple-400">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => handleActionClick(e, 'Share')} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-green-500 dark:bg-black/50 dark:text-gray-300 dark:hover:bg-black/80 dark:hover:text-green-400">
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Image Area - ~65% height */}
                      <div className="relative h-[60%] w-full bg-gradient-to-b from-gray-50 to-white dark:from-white/5 dark:to-transparent">
                        <Image
                          src={product.thumbnail || '/images/no-product.svg'}
                          alt={product.name || 'Product'}
                          fill
                          className="object-contain p-12 sm:p-14 transition-transform duration-500 group-hover:scale-[1.08]"
                          sizes="280px"
                        />
                      </div>

                      {/* Product Details - ~35% height */}
                      <div className="flex h-[40%] flex-col justify-between p-5 pt-2 relative overflow-hidden bg-white dark:bg-transparent">
                        
                        {/* Static Content */}
                        <div className="transition-transform duration-300 group-hover:-translate-y-[60px]">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                            {product.brand || 'Brand'}
                          </p>
                          <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 dark:text-white">
                            {product.name || 'Premium Smartphone'}
                          </h3>
                          
                          <div className="mt-2 flex items-center gap-1">
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-current" />
                              ))}
                            </div>
                            <span className="text-[11px] text-gray-500">(124)</span>
                          </div>

                          <div className="mt-3 flex items-end gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {formatPrice(product.price ?? 0)}
                            </span>
                            {(product.originalPrice ?? 0) > (product.price ?? 0) && (
                              <span className="mb-0.5 text-xs font-medium text-gray-400 line-through">
                                {formatPrice(product.originalPrice ?? 0)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions - Slide up on hover */}
                        <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-2 translate-y-[120px] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 bg-white dark:bg-[#1a1a24] pt-2">
                          <button onClick={(e) => handleActionClick(e, 'Add to Cart')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:from-blue-700 hover:to-indigo-700">
                            <ShoppingCart className="h-4 w-4" />
                            Add to Cart
                          </button>
                          <button onClick={(e) => handleActionClick(e, 'Buy Now')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white">
                            <CreditCard className="h-4 w-4" />
                            Buy Now
                          </button>
                        </div>
                        
                      </div>

                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>

          <div className="mt-4 flex justify-center sm:hidden">
            <Link href="/products" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100">
              View All Products
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
