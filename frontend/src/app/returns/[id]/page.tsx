'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { FiArrowLeft, FiPackage, FiClock, FiCheckCircle, FiXCircle, FiTruck } from 'react-icons/fi';
import returnService from '@/services/return.service';
import { ReturnRequest } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  pickup_scheduled: 'bg-purple-100 text-purple-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  received: 'bg-cyan-100 text-cyan-800',
  inspected: 'bg-teal-100 text-teal-800',
  refund_initiated: 'bg-orange-100 text-orange-800',
  refund_completed: 'bg-green-100 text-green-800',
  replacement_shipped: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<string, string> = {
  requested: 'Return Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  pickup_scheduled: 'Pickup Scheduled',
  picked_up: 'Picked Up',
  received: 'Received at Warehouse',
  inspected: 'Inspected',
  refund_initiated: 'Refund Initiated',
  refund_completed: 'Refund Completed',
  replacement_shipped: 'Replacement Shipped',
  closed: 'Closed',
};

export default function ReturnDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [returnReq, setReturnReq] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    returnService
      .getById(id)
      .then((data) => setReturnReq(data))
      .catch(() => toast.error('Failed to load return details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse mb-6" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!returnReq) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <FiPackage className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-medium text-gray-600 mb-2">Return not found</h2>
        <Link href="/returns" className="text-primary hover:underline text-sm">
          Back to Returns
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/returns" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <FiArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Return Details</h1>
          <p className="text-sm text-gray-500">{returnReq.returnNumber}</p>
        </div>
        <span className={`ml-auto text-xs font-medium px-3 py-1 rounded-full ${statusColors[returnReq.status] || 'bg-gray-100 text-gray-800'}`}>
          {STATUS_LABELS[returnReq.status] || returnReq.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Order reference */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Order Reference</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{returnReq.order?.orderNumber || '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">Requested {formatDate(returnReq.createdAt)}</p>
          </div>
          <Link href={`/orders`} className="text-xs text-primary hover:underline">
            View Order
          </Link>
        </div>
      </div>

      {/* Return info */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Return Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium capitalize mt-0.5">{returnReq.returnType}</p>
          </div>
          <div>
            <p className="text-gray-500">Reason</p>
            <p className="font-medium capitalize mt-0.5">{(returnReq.reason || '').replace(/_/g, ' ')}</p>
          </div>
          {returnReq.refundAmount > 0 && (
            <div>
              <p className="text-gray-500">Refund Amount</p>
              <p className="font-semibold text-green-600 mt-0.5">{formatPrice(returnReq.refundAmount)}</p>
            </div>
          )}
          {returnReq.refundMethod && (
            <div>
              <p className="text-gray-500">Refund Method</p>
              <p className="font-medium capitalize mt-0.5">{returnReq.refundMethod.replace(/_/g, ' ')}</p>
            </div>
          )}
        </div>
        {returnReq.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Description</p>
            <p className="text-sm text-gray-700">{returnReq.description}</p>
          </div>
        )}
      </div>

      {/* Items */}
      {returnReq.items?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Items ({returnReq.items.length})</h2>
          <div className="space-y-3">
            {returnReq.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="relative w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={item.product?.thumbnail || '/images/no-product.svg'}
                    alt={item.product?.name || 'Product'}
                    fill
                    className="object-contain p-1"
                    sizes="48px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.product?.name || 'Product'}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                {item.price > 0 && (
                  <p className="text-sm font-semibold text-gray-700">{formatPrice(item.price)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Timeline */}
      {returnReq.statusHistory?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Status Timeline</h2>
          <div className="space-y-4">
            {[...returnReq.statusHistory].reverse().map((entry, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${idx === 0 ? 'bg-primary' : 'bg-gray-300'}`} />
                  {idx < returnReq.statusHistory.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-medium text-gray-800">
                    {STATUS_LABELS[entry.status] || entry.status.replace(/_/g, ' ')}
                  </p>
                  {entry.message && (
                    <p className="text-xs text-gray-500 mt-0.5">{entry.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
