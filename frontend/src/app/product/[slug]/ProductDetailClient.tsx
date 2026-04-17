'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  HiStar,
  HiOutlineHeart,
  HiHeart,
  HiOutlineShoppingBag,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineRefresh,
  HiOutlineChevronRight,
  HiOutlineShare,
  HiOutlineChevronLeft,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import type { Product } from '@/types';
import { productService } from '@/services/product.service';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useAuthStore } from '@/store/auth.store';
import { useCompareStore } from '@/store/compare.store';
import { formatPrice, getStockStatus, getRatingColor, formatDate } from '@/lib/utils';
import ProductCard from '@/components/ui/ProductCard';
import { ProductDetailSkeleton } from '@/components/ui/Skeletons';
import { HiOutlineSwitchHorizontal } from 'react-icons/hi';

const ProductQA = dynamic(() => import('@/components/ui/ProductQA'), {
  loading: () => <div className="h-48 animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" />,
  ssr: false,
});

const RecentlyViewed = dynamic(() => import('@/components/ui/RecentlyViewed'), {
  loading: () => null,
  ssr: false,
});

const PLACEHOLDER_IMG = '/images/no-product.svg';

export default function ProductDetailClient() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews' | 'qa'>('specs');
  const [imageZoomed, setImageZoomed] = useState(false);
  const [showStickyCart, setShowStickyCart] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const addToCart = useCartStore((s) => s.addToCart);
  const cartLoading = useCartStore((s) => s.isLoading);
  const wishlisted = useWishlistStore((s) => s.items.some((item) => item?.product?._id === (product?._id ?? '')));
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToCompare = useCompareStore((s) => s.addToCompare);
  const removeFromCompare = useCompareStore((s) => s.removeFromCompare);
  const isInCompare = useCompareStore((s) => s.isInCompare);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const data = await productService.getBySlug(slug);
        setProduct(data);
        if (data.colors?.length) setSelectedColor(data.colors[0]);
        const relatedData = await productService.getRelated(data._id);
        setRelated(relatedData);
      } catch {
        toast.error('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
    setSelectedImage(0);
    setQuantity(1);
    setActiveTab('specs');
  }, [slug]);

  // Track product view for logged-in users
  useEffect(() => {
    if (product && isAuthenticated) {
      productService.trackView(product._id).catch(() => {});
    }
  }, [product?._id, isAuthenticated]);

  // Sticky cart bar: show when main CTA scrolls out of view on mobile
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCart(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  const navigateImage = useCallback(
    (dir: 1 | -1) => {
      if (!product) return;
      setSelectedImage((prev) => {
        const totalImages = Array.isArray(product.images) && product.images.length > 0 ? product.images.length : 1;
        const next = prev + dir;
        if (next < 0) return totalImages - 1;
        if (next >= totalImages) return 0;
        return next;
      });
    },
    [product],
  );

  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent('/product/' + slug));
      return;
    }
    try {
      toast.success('Added to cart!');
      await addToCart(product._id, quantity, selectedColor);
    } catch {
      toast.error('Failed to add to cart');
    }
  }, [product, isAuthenticated, slug, addToCart, quantity, selectedColor, router]);

  const handleWishlist = useCallback(async () => {
    if (!product) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent('/product/' + slug));
      return;
    }
    try {
      if (wishlisted) {
        toast.success('Removed from wishlist');
        await removeFromWishlist(product._id);
      } else {
        toast.success('Added to wishlist!');
        await addToWishlist(product._id, product);
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  }, [product, isAuthenticated, slug, wishlisted, removeFromWishlist, addToWishlist, router]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} at ${formatPrice(product.price)}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch {
      // User cancelled share or clipboard failed
    }
  }, [product]);

  const handleCompare = useCallback(() => {
    if (!product) return;
    const compared = isInCompare(product._id);
    if (compared) {
      removeFromCompare(product._id);
      toast.success('Removed from compare');
    } else {
      addToCompare(product);
      toast.success('Added to compare');
    }
  }, [product, isInCompare, removeFromCompare, addToCompare]);

  const handleSubmitReview = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!reviewComment.trim()) {
      toast.error('Please write a review comment');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await productService.submitReview(product._id, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      toast.success('Review submitted successfully!');
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      const updated = await productService.getBySlug(slug);
      setProduct(updated);
    } catch {
      toast.error('Failed to submit review. You may have already reviewed this product.');
    } finally {
      setIsSubmittingReview(false);
    }
  }, [product, reviewComment, reviewRating, reviewTitle, slug]);

  if (isLoading) {
    return <div className="page-container py-10"><ProductDetailSkeleton /></div>;
  }

  if (!product) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-32 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5">
          <HiOutlineShoppingBag className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Product Not Found</h2>
        <p className="mt-2 text-gray-500">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/products" className="mt-6 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-500">
          Browse Shop
        </Link>
      </div>
    );
  }

  const compared = isInCompare(product._id);
  const ratingValue = Number((product as any).ratings ?? (product as any).averageRating ?? 0);
  const reviewCount = Number((product as any).numReviews ?? (product as any).reviewCount ?? 0);
  const inStock = typeof (product as any).inStock === 'boolean' ? (product as any).inStock : product.stock > 0;
  const productImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.thumbnail || PLACEHOLDER_IMG];
  const stockStatus = getStockStatus(product.stock);
  const savings = product.originalPrice > product.price ? product.originalPrice - product.price : 0;
  const specEntries = product.specifications
    ? Object.entries(product.specifications).filter(([, v]) => v && v !== '')
    : [];
  const safeReviews = Array.isArray(product.reviews)
    ? product.reviews.filter((review) => review && review.user && review.user.name)
    : [];
  const safeRelated = Array.isArray(related)
    ? related.filter((item) => item && item._id && item.slug && item.name)
    : [];

  return (
    <main className="min-h-screen">
      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="border-b border-gray-200 dark:border-white/5 bg-surface-50/50">
        <div className="page-container flex items-center gap-2 py-3 text-xs text-gray-500">
          <Link href="/" className="transition-colors hover:text-primary-400">Home</Link>
          <HiOutlineChevronRight className="h-3 w-3 flex-shrink-0" />
          <Link href="/products" className="transition-colors hover:text-primary-400">Products</Link>
          <HiOutlineChevronRight className="h-3 w-3 flex-shrink-0" />
          <span className="truncate text-gray-500 dark:text-gray-400">{product.name}</span>
        </div>
      </nav>

      <div className="page-container py-6 sm:py-8 lg:py-10">
        {/* ══════════════════ Product Hero ══════════════════ */}
        <div className="grid gap-6 md:gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12 xl:gap-16">

          {/* ── Image Gallery ── */}
          <section className="flex flex-col gap-3 sm:gap-4">
            {/* Main Image */}
            <div className="glass-card group relative overflow-hidden">
              <div
                className={`relative aspect-square cursor-zoom-in transition-transform duration-500 ${imageZoomed ? 'scale-150 cursor-zoom-out origin-center' : ''}`}
                onClick={() => setImageZoomed((z) => !z)}
                style={imageZoomed ? { overflow: 'hidden' } : undefined}
              >
                <Image
                  src={productImages[selectedImage] || product.thumbnail || PLACEHOLDER_IMG}
                  alt={`${product.name} – image ${selectedImage + 1}`}
                  fill
                  priority
                  className="object-contain p-4 sm:p-6 lg:p-8"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 45vw"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                />
              </div>

              {/* Discount badge */}
              {product.discount > 0 && (
                <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg sm:text-sm">
                  {product.discount}% OFF
                </span>
              )}

              {/* Image pagination arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateImage(-1); }}
                    className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-black/40 text-white/70 opacity-0 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-gray-900 dark:hover:text-white group-hover:opacity-100 sm:h-12 sm:w-12"
                    aria-label="Previous image"
                  >
                    <HiOutlineChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateImage(1); }}
                    className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-black/40 text-white/70 opacity-0 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-gray-900 dark:hover:text-white group-hover:opacity-100 sm:h-12 sm:w-12"
                    aria-label="Next image"
                  >
                    <HiOutlineChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Image dots (mobile) */}
              {productImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:hidden">
                  {productImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                      className={`rounded-full p-1 transition-all ${selectedImage === idx ? 'h-2.5 w-7 bg-primary-500' : 'h-2.5 w-2.5 bg-white/40'}`}
                      aria-label={`View image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails (tablet+) */}
            {productImages.length > 1 && (
              <div className="hidden gap-2 overflow-x-auto scrollbar-hide pb-1 sm:flex">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 md:h-20 md:w-20 ${
                      selectedImage === idx
                        ? 'border-primary-500 ring-2 ring-primary-500/30'
                        : 'border-gray-200 dark:border-white/10 opacity-60 hover:border-white/25 hover:opacity-100'
                    }`}
                    aria-label={`Select image ${idx + 1}`}
                  >
                    <Image
                      src={img || PLACEHOLDER_IMG}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── Product Info ── */}
          <section className="flex flex-col lg:sticky lg:top-4 lg:self-start">
            {/* Brand + Share */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">{product.brand}</p>
              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white"
                aria-label="Share product"
              >
                <HiOutlineShare className="h-4 w-4" />
              </button>
            </div>

            {/* Title */}
            <h1 className="mt-2 text-xl font-bold leading-tight text-gray-900 dark:text-white sm:text-2xl lg:text-3xl">
              {product.name}
            </h1>

            {/* Rating + Stock */}
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold text-white ${getRatingColor(ratingValue)}`}>
                <HiStar className="h-4 w-4" /> {ratingValue.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span>
              <span className="hidden h-4 w-px bg-gray-200 dark:bg-white/10 sm:block" />
              <span className={`text-sm font-medium ${stockStatus.color}`}>{stockStatus.label}</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-base text-gray-500 line-through sm:text-lg">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {savings > 0 && (
              <p className="mt-1.5 text-sm font-semibold text-emerald-400">
                You save {formatPrice(savings)} ({product.discount}% off)
              </p>
            )}

            {/* Description */}
            <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base sm:leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            {/* Key Highlights */}
            {specEntries.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Key Highlights</p>
                <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {specEntries.slice(0, 6).map(([key, value]) => (
                    <li key={key} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <span>
                        <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                        {String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* EMI & Delivery Info */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-4">
              {product.price >= 3000 && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-3 py-2">
                  <HiOutlineCreditCard className="h-4 w-4 flex-shrink-0 text-primary-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    EMI from <span className="font-bold text-gray-900 dark:text-white">{formatPrice(Math.round(product.price / 12))}/mo</span>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-3 py-2">
                <HiOutlineClock className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Delivery by <span className="font-bold text-gray-900 dark:text-white">{new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </span>
              </div>
            </div>

            {/* Divider */}
            <hr className="my-5 border-gray-100 dark:border-white/[0.06] sm:my-6" />

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Color: <span className="font-semibold text-gray-900 dark:text-white">{selectedColor}</span>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-200 sm:px-5 sm:py-2.5 sm:text-sm ${
                        selectedColor === color
                          ? 'border-primary-500 bg-primary-500/10 text-primary-400 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                          : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:bg-white/[0.06]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className={product.colors?.length > 0 ? 'mt-5' : ''}>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Quantity</p>
              <div className="mt-2 inline-flex items-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="px-5 py-3 text-lg text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white disabled:opacity-30 sm:px-4 sm:py-2.5"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-bold text-gray-900 dark:text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="px-5 py-3 text-lg text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white disabled:opacity-30 sm:px-4 sm:py-2.5"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div ref={ctaRef} className="mt-6 flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || cartLoading}
                className="flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-primary-600 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-primary-500 hover:shadow-[0_0_24px_rgba(99,102,241,0.25)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base"
              >
                <HiOutlineShoppingBag className="h-5 w-5" />
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button
                onClick={handleCompare}
                className={`flex h-auto w-14 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 sm:w-16 ${
                  compared
                    ? 'border-primary-500/30 bg-primary-500/10 text-primary-400 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                    : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-label={compared ? 'Remove from compare' : 'Add to compare'}
              >
                <HiOutlineSwitchHorizontal className="h-5 w-5" />
              </button>
              <button
                onClick={handleWishlist}
                className={`flex h-auto w-14 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 sm:w-16 ${
                  wishlisted
                    ? 'border-pink-500/30 bg-pink-500/10 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.15)]'
                    : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {wishlisted ? <HiHeart className="h-5 w-5" /> : <HiOutlineHeart className="h-5 w-5" />}
              </button>
            </div>

            {/* Assurance badges */}
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { icon: HiOutlineTruck, label: 'Free Delivery', sub: 'On orders above ₹999' },
                { icon: HiOutlineShieldCheck, label: product.warranty || 'Warranty', sub: 'Brand warranty' },
                { icon: HiOutlineRefresh, label: '7 Day Returns', sub: 'Easy returns' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-3 text-center transition-colors hover:bg-gray-50 dark:bg-white/[0.04] sm:gap-1.5 sm:p-4"
                >
                  <item.icon className="h-5 w-5 text-primary-400 sm:h-6 sm:w-6" />
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 sm:text-xs">{item.label}</span>
                  <span className="hidden text-[11px] text-gray-500 dark:text-gray-400 sm:block">{item.sub}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ══════════════════ Tabs ══════════════════ */}
        <section className="mt-10 sm:mt-14 lg:mt-16">
          {/* Tab Buttons */}
          <div className="flex border-b border-gray-200 dark:border-white/10">
            {(['specs', 'reviews', 'qa'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-3.5 text-sm font-semibold transition-colors sm:px-8 sm:text-base ${
                  activeTab === tab
                    ? 'text-primary-400'
                    : 'text-gray-500 hover:text-gray-600 dark:text-gray-300'
                }`}
              >
                {tab === 'specs' ? 'Specifications' : tab === 'reviews' ? `Reviews (${reviewCount})` : 'Q&A'}
                {activeTab === tab && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary-500" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-6 sm:mt-8">
            {activeTab === 'specs' ? (
              /* ── Specifications Table ── */
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-sm">
                    <tbody>
                      {specEntries.map(([key, value], idx) => (
                        <tr
                          key={key}
                          className={`border-b border-gray-100 dark:border-white/[0.04] last:border-0 ${
                            idx % 2 === 0 ? 'bg-gray-50 dark:bg-white/[0.015]' : ''
                          }`}
                        >
                          <td className="whitespace-normal px-3 py-3 font-semibold capitalize text-gray-600 dark:text-gray-300 w-[35%] sm:w-2/5 sm:px-5 sm:py-3.5">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </td>
                          <td className="px-3 py-3 text-gray-900 dark:text-white sm:px-5 sm:py-3.5">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* ── Reviews ── */
              <div className="space-y-4 sm:space-y-5">
                {safeReviews.length > 0 ? (
                  safeReviews.map((review) => (
                    <article key={review._id} className="glass-card-sm p-4 sm:p-6">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-sm font-bold text-primary-400">
                          {(review.user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{review.user.name}</p>
                            <span
                              className={`inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold text-white ${getRatingColor(review.rating)}`}
                            >
                              <HiStar className="h-3 w-3" /> {review.rating}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      {review.title && (
                        <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">{review.title}</p>
                      )}
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{review.comment}</p>
                    </article>
                  ))
                ) : (
                  <div className="glass-card flex flex-col items-center py-14 text-center">
                    <p className="mt-3 text-sm text-gray-500">No reviews yet. Be the first to review!</p>
                  </div>
                )}

                {/* ── Review Form ── */}
                {isAuthenticated ? (
                  <div className="glass-card p-4 sm:p-6">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Write a Review</h3>
                    <form onSubmit={handleSubmitReview} className="mt-5 space-y-5">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Rating
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="transition-transform hover:scale-110"
                              aria-label={`Rate ${star} stars`}
                            >
                              <HiStar
                                className={`h-8 w-8 transition-colors ${
                                  star <= (hoverRating || reviewRating) ? 'text-amber-400' : 'text-gray-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="review-title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Title <span className="normal-case tracking-normal text-gray-600">(optional)</span>
                        </label>
                        <input
                          id="review-title"
                          type="text"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          className="glass-input py-3 text-sm"
                          placeholder="Brief summary of your review"
                        />
                      </div>
                      <div>
                        <label htmlFor="review-comment" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Your Review
                        </label>
                        <textarea
                          id="review-comment"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="glass-input py-3 text-sm min-h-[100px] resize-none"
                          placeholder="Share your experience with this product..."
                          rows={4}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-primary-500 hover:shadow-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmittingReview ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Review'
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="glass-card-sm p-5 text-center">
                    <p className="text-sm text-gray-500">
                      <Link href="/login" className="font-semibold text-primary-400 transition-colors hover:text-primary-300">
                        Sign in
                      </Link>{' '}
                      to write a review
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'qa' && (
              <ProductQA productId={product._id} />
            )}
          </div>
        </section>

        {/* ══════════════════ Recently Viewed ══════════════════ */}
        <RecentlyViewed />

        {/* ══════════════════ Related Products ══════════════════ */}
        {safeRelated.length > 0 && (
          <section className="mt-12 sm:mt-16">
            <div className="flex items-center justify-between">
              <h2 className="section-title">You May Also Like</h2>
              <Link
                href="/products"
                className="hidden items-center gap-1 text-sm font-semibold text-primary-400 transition-colors hover:text-primary-300 sm:inline-flex"
              >
                View All <HiOutlineChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {safeRelated.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile Add-to-Cart bar */}
      {showStickyCart && inStock && (
        <div className="fixed inset-x-0 bottom-[4rem] z-40 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-primary-950/95 backdrop-blur-xl px-4 py-3 sm:bottom-0 sm:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
              <p className="text-base font-bold text-primary-600 dark:text-primary-400">{formatPrice(product.price)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={cartLoading}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-primary-500 active:scale-[0.98] disabled:opacity-50"
            >
              <HiOutlineShoppingBag className="h-4 w-4" />
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
