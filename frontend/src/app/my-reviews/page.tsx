'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineStar, HiOutlineRefresh, HiOutlineCube, HiOutlineCog } from 'react-icons/hi';
import { reviewService, type Review, type ProductReview, type ServiceReview } from '@/services/review.service';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MyReviewsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'product' | 'service'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/my-reviews');
      return;
    }
    loadReviews();
  }, [user, router]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getMyReviews();
      setReviews(data);
    } catch (error: any) {
      toast.error('Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'product') return (review as ProductReview).productId != null || (review as any).reviewType === 'product';
    if (activeTab === 'service') return (review as ServiceReview).serviceRequestId != null || (review as any).reviewType === 'service';
    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <HiOutlineRefresh className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">My Reviews</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View all the product and service reviews you've shared.
        </p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-white/10 pb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5'
          }`}
        >
          All Reviews
        </button>
        <button
          onClick={() => setActiveTab('product')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'product'
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5'
          }`}
        >
          <HiOutlineCube className="w-4 h-4" /> Products
        </button>
        <button
          onClick={() => setActiveTab('service')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'service'
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5'
          }`}
        >
          <HiOutlineCog className="w-4 h-4" /> Services
        </button>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <HiOutlineStar className="h-16 w-16 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">No reviews found</h3>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {activeTab === 'all'
              ? "You haven't submitted any reviews yet."
              : `You don't have any ${activeTab} reviews yet.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReviews.map((review) => {
            const pReview = review as ProductReview;
            const sReview = review as ServiceReview;
            const isProduct = pReview.productId != null || (review as any).reviewType === 'product';

            return (
              <div
                key={review.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-surface-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <HiOutlineStar
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    review.isApproved 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                      : review.isApproved === false
                      ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                      : 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                  }`}>
                    {review.isApproved ? 'Approved' : review.isApproved === false ? 'Rejected' : 'Pending'}
                  </span>
                </div>

                <div className="mb-4">
                  {review.title && (
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">{review.title}</h4>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                    "{review.comment}"
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                  {isProduct ? (
                    <>
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5">
                        <img
                          src={pReview.product?.thumbnail || '/placeholder.png'}
                          alt={pReview.product?.name || 'Product'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${pReview.product?.slug}`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-primary-600 truncate block">
                          {pReview.product?.name || 'Unknown Product'}
                        </Link>
                        <span className="text-xs text-slate-500">Product Review • {formatDate(review.createdAt)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <HiOutlineCog className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate block">
                          {sReview.service?.serviceType || 'Service'}
                        </span>
                        <span className="text-xs text-slate-500 truncate block">
                          {sReview.service?.device}
                        </span>
                        <span className="text-xs text-slate-500">Service Review • {formatDate(review.createdAt)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
