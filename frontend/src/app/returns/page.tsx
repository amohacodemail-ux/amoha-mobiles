'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiPackage, FiClock, FiCheckCircle, FiXCircle, FiChevronRight } from 'react-icons/fi';
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

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    returnService
      .getAll()
      .then((data) => setReturns(data.items || []))
      .catch(() => toast.error('Failed to load returns'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Returns</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Returns</h1>

      {returns.length === 0 ? (
        <div className="text-center py-16">
          <FiPackage className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-medium text-gray-600 mb-2">No return requests</h2>
          <p className="text-gray-400 mb-6">You haven't made any return requests yet.</p>
          <Link
            href="/orders"
            className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            View Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <div
              key={ret._id}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-gray-900">{ret.returnNumber}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    Order: {ret.order?.orderNumber}
                  </span>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[ret.status] || 'bg-gray-100 text-gray-800'}`}
                >
                  {ret.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                {ret.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={item.product?.thumbnail || '/images/no-product.svg'}
                        alt={item.product?.name || 'Product'}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate max-w-[150px]">
                        {item.product?.name || 'Product'}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span>Type: <span className="font-medium capitalize">{ret.returnType}</span></span>
                  <span>Refund: <span className="font-medium">{formatPrice(ret.refundAmount || 0)}</span></span>
                  <span>{formatDate(ret.createdAt)}</span>
                </div>
                <Link
                  href={`/returns/${ret._id}`}
                  className="text-primary hover:underline flex items-center gap-0.5"
                >
                  Details <FiChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
