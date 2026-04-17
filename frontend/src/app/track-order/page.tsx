'use client';

import { useState } from 'react';
import { HiOutlineSearch, HiOutlineTruck, HiCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { orderService } from '@/services/order.service';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

const statusSteps = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
const statusLabels: Record<string, string> = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      toast.error('Please enter both order number and phone number');
      return;
    }
    setLoading(true);
    try {
      const data = await orderService.publicTrackOrder(orderNumber.trim(), phone.trim());
      setTracking(data);
    } catch {
      toast.error('Order not found. Please check your details.');
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = tracking ? statusSteps.indexOf(tracking.orderStatus) : -1;

  return (
    <div className="page-container py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-500/10 mb-4">
            <HiOutlineTruck className="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Track Your Order</h1>
          <p className="mt-2 text-sm text-gray-500">Enter your order number and phone number to track shipment</p>
        </div>

        <form onSubmit={handleTrack} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Order Number</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="e.g. AMH-XXXXXX"
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <HiOutlineSearch className="h-4 w-4" />
            )}
            Track Order
          </button>
        </form>

        {tracking && (
          <div className="mt-8 space-y-6">
            {/* Order Summary */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order #{tracking.orderNumber}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  tracking.orderStatus === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                  tracking.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                }`}>
                  {statusLabels[tracking.orderStatus] || tracking.orderStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Amount</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(tracking.totalAmount)}</p>
                </div>
                {tracking.estimatedDelivery && (
                  <div>
                    <p className="text-gray-500">Est. Delivery</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{new Date(tracking.estimatedDelivery).toLocaleDateString('en-IN')}</p>
                  </div>
                )}
                {tracking.trackingNumber && (
                  <div>
                    <p className="text-gray-500">Tracking Number</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{tracking.trackingNumber}</p>
                  </div>
                )}
                {tracking.logisticsPartner && (
                  <div>
                    <p className="text-gray-500">Courier Partner</p>
                    <p className="font-semibold capitalize text-gray-900 dark:text-white">{tracking.logisticsPartner.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {tracking.courierAwbNumber && (
                  <div>
                    <p className="text-gray-500">AWB Number</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{tracking.courierAwbNumber}</p>
                  </div>
                )}
              </div>
              {tracking.trackingUrl && (
                <a href={tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500">
                  Track on courier website
                </a>
              )}
            </div>

            {/* Status Timeline */}
            {tracking.orderStatus !== 'cancelled' && tracking.orderStatus !== 'returned' && (
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">Shipment Progress</h3>
                <div className="flex items-center justify-between">
                  {statusSteps.map((step, idx) => (
                    <div key={step} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          idx <= currentStepIndex
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                        }`}>
                          {idx <= currentStepIndex ? <HiCheck className="h-4 w-4" /> : idx + 1}
                        </div>
                        <p className={`mt-2 text-center text-[11px] leading-tight ${
                          idx <= currentStepIndex ? 'font-semibold text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {statusLabels[step]}
                        </p>
                      </div>
                      {idx < statusSteps.length - 1 && (
                        <div className={`mx-1 h-0.5 flex-1 ${
                          idx < currentStepIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-white/10'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Items */}
            {tracking.items?.length > 0 && (
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Order Items</h3>
                <div className="space-y-3">
                  {tracking.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      {item.product?.thumbnail && (
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                          <Image src={item.product?.thumbnail || '/images/no-product.svg'} alt={item.product?.name || 'Product'} fill className="object-cover" sizes="48px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product?.name || 'Product'}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} x {formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status History */}
            {tracking.statusHistory?.length > 0 && (
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Status History</h3>
                <div className="space-y-3">
                  {tracking.statusHistory.map((h: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{statusLabels[h.status] || h.status}</p>
                        {h.message && <p className="text-xs text-gray-500">{h.message}</p>}
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(h.date).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
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
