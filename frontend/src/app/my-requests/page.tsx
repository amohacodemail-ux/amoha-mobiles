'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HiOutlineDocumentText, HiOutlineRefresh, HiOutlineChevronRight } from 'react-icons/hi';
import { serviceRequestService, ServiceRequest } from '@/services/service.service';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', label: 'Pending' },
  accepted: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', label: 'Approved' },
  in_progress: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10', label: 'In Process' },
  completed: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', label: 'Completed' },
  cancelled: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', label: 'Cancelled' },
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadRequests();
    }
  }, [isAuthenticated]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await serviceRequestService.getMyRequests();
      setRequests(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">My Requests</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track your mobile service and repair requests</p>
        </div>
        <button
          onClick={loadRequests}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white sm:w-auto sm:px-4 sm:gap-2"
        >
          <HiOutlineRefresh className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden font-medium sm:block">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <HiOutlineRefresh className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-20 text-center dark:border-white/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5">
            <HiOutlineDocumentText className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">No requests found</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You haven't submitted any service requests yet.</p>
          <Link
            href="/services"
            className="mt-6 inline-flex items-center rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-700"
          >
            Submit Request
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => {
            const meta = STATUS_META[req.status] || STATUS_META.pending;
            return (
              <div key={req._id} className="glass-card flex flex-col justify-between p-5 transition-all hover:shadow-lg sm:flex-row sm:items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 dark:text-white">{req.requestNumber}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.bg} ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-medium">{req.deviceBrand} {req.deviceModel}</span>
                    <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                    <span>{req.serviceType}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Requested on {formatDate(req.createdAt)}
                  </div>
                </div>
                
                <Link 
                  href={`/my-requests/${req._id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/[0.05] sm:w-auto"
                >
                  View Details
                  <HiOutlineChevronRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
