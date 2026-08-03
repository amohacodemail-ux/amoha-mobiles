'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  HiOutlineChevronLeft,
  HiOutlineCheckCircle,
  HiOutlineCog,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineDeviceMobile,
  HiOutlineCurrencyRupee
} from 'react-icons/hi';
import { serviceRequestService, ServiceRequest } from '@/services/service.service';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', label: 'Pending' },
  accepted: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', label: 'Approved' },
  in_progress: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10', label: 'In Process' },
  completed: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', label: 'Completed' },
  cancelled: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', label: 'Cancelled' },
};

const REQUEST_STEPS = [
  { key: 'pending', label: 'Request Submitted', icon: HiOutlineDocumentText },
  { key: 'accepted', label: 'Approved', icon: HiOutlineCheckCircle },
  { key: 'in_progress', label: 'In Process', icon: HiOutlineCog },
  { key: 'completed', label: 'Completed', icon: HiOutlineCheckCircle },
];

function RequestProgressBar({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-500/10">
        <HiOutlineXCircle className="h-5 w-5 text-red-500" />
        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
          This service request was cancelled
        </span>
      </div>
    );
  }

  const currentIdx = REQUEST_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gray-200 dark:bg-white/10" />
        <div
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary-500 transition-all duration-500"
          style={{ width: currentIdx <= 0 ? '0%' : `${(currentIdx / (REQUEST_STEPS.length - 1)) * 100}%` }}
        />
        {REQUEST_STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                  done
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : active
                    ? 'border-primary-500 bg-white text-primary-500 shadow-md shadow-primary-500/30 dark:bg-gray-900'
                    : 'border-gray-200 bg-white text-gray-300 dark:border-white/10 dark:bg-gray-900 dark:text-gray-600'
                }`}
              >
                {done ? <HiOutlineCheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`hidden max-w-[64px] text-center text-[10px] font-medium leading-tight sm:block ${
                  done || active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadRequest(params.id as string);
    }
  }, [params.id]);

  const loadRequest = async (id: string) => {
    try {
      setLoading(true);
      const data = await serviceRequestService.getRequestById(id);
      setRequest(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load request details');
      router.push('/my-requests');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <HiOutlineRefresh className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!request) return null;

  const meta = STATUS_META[request.status] || STATUS_META.pending;

  return (
    <div className="page-container py-6 sm:py-10">
      <Link
        href="/my-requests"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <HiOutlineChevronLeft className="h-4 w-4" /> Back to My Requests
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Request {request.requestNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Submitted on {formatDate(request.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
          <button
            onClick={() => loadRequest(request._id)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
          >
            <HiOutlineRefresh className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-surface-100">
        <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Status Timeline</h2>
        <div className="px-2 sm:px-8">
          <RequestProgressBar status={request.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-surface-100">
          <div className="mb-4 flex items-center gap-2">
            <HiOutlineDeviceMobile className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Device & Service Details</h2>
          </div>
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Device</span>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">{request.deviceBrand} {request.deviceModel}</p>
            </div>
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Service Type</span>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">{request.serviceType}</p>
            </div>
            {request.description && (
              <div>
                <span className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Problem Description</span>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{request.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-surface-100">
          <div className="mb-4 flex items-center gap-2">
            <HiOutlineUser className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Customer Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</span>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">{request.customerName}</p>
            </div>
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact</span>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{request.customerEmail}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{request.customerPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {(request.adminNotes || request.finalPrice) && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-surface-100">
          <div className="mb-4 flex items-center gap-2">
            <HiOutlineDocumentText className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Service Updates</h2>
          </div>
          <div className="space-y-4">
            {request.finalPrice && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Final Price:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{request.finalPrice}</span>
              </div>
            )}
            {request.adminNotes && (
              <div>
                <span className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Admin Remarks</span>
                <div className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300">
                  {request.adminNotes}
                </div>
              </div>
            )}
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Last updated on {formatDate(request.updatedAt)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
