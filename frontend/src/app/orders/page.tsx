'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  HiOutlineChevronDown,
  HiOutlineShoppingBag,
  HiOutlineCheckCircle,
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineLocationMarker,
  HiOutlineHome,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineClipboardList,
  HiOutlineCash,
  HiOutlineCreditCard,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineSwitchHorizontal,
} from 'react-icons/hi';
import type { Order, ReturnReason, ReturnType } from '@/types';
import { orderService } from '@/services/order.service';
import returnService from '@/services/return.service';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice, formatDate } from '@/lib/utils';
import { OrderCardSkeleton } from '@/components/ui/Skeletons';
import Pagination from '@/components/ui/Pagination';
import toast from 'react-hot-toast';

// ─── Order progress steps (in order) ────────────────────────────────────────
const ORDER_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: HiOutlineClipboardList },
  { key: 'confirmed', label: 'Confirmed', icon: HiOutlineCheckCircle },
  { key: 'processing', label: 'Packed', icon: HiOutlineCube },
  { key: 'shipped', label: 'Shipped', icon: HiOutlineTruck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: HiOutlineLocationMarker },
  { key: 'delivered', label: 'Delivered', icon: HiOutlineHome },
];

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  placed: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', label: 'Order Placed' },
  confirmed: { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', label: 'Confirmed' },
  processing: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', label: 'Packed' },
  shipped: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10', label: 'Shipped' },
  out_for_delivery: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', label: 'Out for Delivery' },
  delivered: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Delivered' },
  cancelled: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', label: 'Cancelled' },
  returned: { color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-500/10', label: 'Returned' },
};

function OrderProgressBar({ status }: { status: string }) {
  if (status === 'cancelled' || status === 'returned') {
    const isCancelled = status === 'cancelled';
    return (
      <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${isCancelled ? 'bg-red-50 dark:bg-red-500/10' : 'bg-gray-100 dark:bg-gray-500/10'}`}>
        {isCancelled
          ? <HiOutlineXCircle className="h-5 w-5 text-red-500" />
          : <HiOutlineRefresh className="h-5 w-5 text-gray-400" />}
        <span className={`text-sm font-semibold ${isCancelled ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
          {isCancelled ? 'This order was cancelled' : 'Return requested'}
        </span>
      </div>
    );
  }

  const currentIdx = ORDER_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="w-full">
      {/* Step icons row */}
      <div className="relative flex items-center justify-between mt-4 mb-2 px-2 sm:px-6">
        {/* connector line behind icons */}
        <div className="absolute left-6 right-6 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-100 dark:bg-gray-800" />
        <div
          className="absolute left-6 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-out"
          style={{ width: currentIdx <= 0 ? '0%' : `calc(${(currentIdx / (ORDER_STEPS.length - 1)) * 100}% - 3rem)` }}
        />
        {ORDER_STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 group cursor-default">
              <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-[3px] transition-all duration-500
                ${done ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105'
                  : active ? 'border-blue-500 bg-white dark:bg-gray-900 text-blue-500 shadow-xl shadow-blue-500/40 ring-4 ring-blue-500/20 scale-110 animate-pulse'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-300 dark:text-gray-600'}`}>
                {done
                  ? <HiOutlineCheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                  : <Icon className="h-5 w-5 sm:h-6 sm:w-6" />}
              </div>
              <span className={`hidden sm:block text-[11px] font-bold tracking-wide text-center w-20 transition-colors
                ${done ? 'text-indigo-600 dark:text-indigo-400' 
                  : active ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 dark:text-gray-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* mobile: show current step label */}
      <p className="mt-3 text-center text-xs font-semibold text-primary-500 sm:hidden">
        {ORDER_STEPS[currentIdx]?.label ?? status.replace(/_/g, ' ')}
      </p>
    </div>
  );
}

export default function OrdersPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // for stats (page 1 only approximation)
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Return request
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnType, setReturnType] = useState<ReturnType>('return');
  const [returnReason, setReturnReason] = useState<ReturnReason>('defective');
  const [returnDesc, setReturnDesc] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const data = await orderService.getAll(currentPage, 10);
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setTotalOrders(data.totalOrders);
        if (currentPage === 1) setAllOrders(data.orders);
      } catch {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [isAuthenticated, currentPage]);

  const handleReturnSubmit = async () => {
    if (!returnOrderId) return;
    const order = orders.find((o) => o._id === returnOrderId);
    if (!order) return;
    setSubmittingReturn(true);
    try {
      await returnService.create({
        orderId: returnOrderId,
        items: order.items.map((item) => ({
          orderItemId: item._id,
          quantity: item.quantity,
          reason: returnReason,
        })),
        type: returnType,
        description: returnDesc,
      });
      toast.success('Return request submitted successfully!');
      setReturnOrderId(null);
      setReturnDesc('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-32 text-center">
        <HiOutlineShoppingBag className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Login Required</h2>
        <p className="mt-2 text-sm text-gray-500">Please sign in to view your orders.</p>
        <Link href="/login" className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white hover:bg-primary-500">
          Sign In
        </Link>
      </div>
    );
  }

  // ── Derived stats (from loaded page) ──────────────────────────────────────
  const deliveredCount = allOrders.filter((o) => o.orderStatus === 'delivered').length;
  const activeCount = allOrders.filter((o) => !['delivered', 'cancelled', 'returned'].includes(o.orderStatus)).length;
  const totalSpent = allOrders.filter((o) => o.orderStatus !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0);

  // ── Filter tabs ────────────────────────────────────────────────────────────
  const FILTERS = [
    { key: 'all', label: 'All Orders' },
    { key: 'active', label: 'Active' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return !['delivered', 'cancelled', 'returned'].includes(o.orderStatus);
    if (activeFilter === 'delivered') return o.orderStatus === 'delivered';
    if (activeFilter === 'cancelled') return o.orderStatus === 'cancelled' || o.orderStatus === 'returned';
    return true;
  });

  return (
    <div className="page-container py-6 sm:py-10">
      {/* ── Premium Hero Section ── */}
      <div className="relative mb-10 overflow-hidden rounded-[2.5rem] bg-white dark:bg-gray-900 shadow-xl shadow-blue-500/5 ring-1 ring-gray-900/5 dark:ring-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 dark:from-blue-950/40 dark:via-gray-900 dark:to-blue-900/20" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row items-center justify-between p-8 sm:p-12 md:p-14">
          <div className="flex-1 text-center sm:text-left z-10">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl mb-3">
              My Orders
            </h1>
            {user?.name && (
              <p className="text-xl font-medium text-primary-600 dark:text-primary-400">
                Welcome back, {user.name.split(' ')[0]}
              </p>
            )}
            <p className="mt-3 max-w-xl text-base sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
              Track, view and manage all your orders in one place.
            </p>
          </div>
          <div className="mt-8 sm:mt-0 flex-shrink-0 hidden md:block z-10">
            {/* Elegant visual/icon */}
            <div className="relative group cursor-default">
              <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl transition-all duration-500 group-hover:bg-blue-400/30" />
              <div className="relative h-32 w-32 rounded-full bg-gradient-to-tr from-blue-100 to-white dark:from-blue-900/50 dark:to-gray-800 flex items-center justify-center shadow-lg ring-1 ring-white/50 dark:ring-white/10 transition-transform duration-500 group-hover:scale-105">
                <HiOutlineShoppingBag className="h-14 w-14 text-primary-500 drop-shadow-sm transition-transform duration-500 group-hover:-translate-y-1" />
                <div className="absolute -bottom-2 -right-2 h-14 w-14 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-xl ring-1 ring-gray-900/5 transition-transform duration-500 group-hover:scale-110">
                  <HiOutlineTruck className="h-7 w-7 text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Premium Stats strip ── */}
      {!isLoading && allOrders.length > 0 && (
        <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800 group hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-50 dark:bg-blue-900/20 transition-transform duration-500 group-hover:scale-150 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Orders</p>
                <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">{totalOrders}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                <HiOutlineShoppingBag className="h-7 w-7" />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800 group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-50 dark:bg-indigo-900/20 transition-transform duration-500 group-hover:scale-150 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active</p>
                <p className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400">{activeCount}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                <HiOutlineRefresh className="h-7 w-7" />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800 group hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 transition-transform duration-500 group-hover:scale-150 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Spent</p>
                <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatPrice(totalSpent)}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                <HiOutlineCash className="h-7 w-7" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter tabs ── */}
      {!isLoading && orders.length > 0 && (
        <div className="mb-8 flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {FILTERS.map((f) => {
            const FilterIcon = f.icon || HiOutlineClipboardList;
            const isActive = activeFilter === f.key;
            
            // Stats computation for filter badges
            let count = 0;
            if (f.key === 'all') count = totalOrders;
            else if (f.key === 'processing') count = allOrders.filter(o => ['placed', 'confirmed', 'processing'].includes(o.orderStatus)).length;
            else if (f.key === 'shipped') count = allOrders.filter(o => ['shipped', 'out_for_delivery'].includes(o.orderStatus)).length;
            else if (f.key === 'delivered') count = allOrders.filter(o => o.orderStatus === 'delivered').length;
            else if (f.key === 'cancelled') count = allOrders.filter(o => o.orderStatus === 'cancelled').length;
            else if (f.key === 'return') count = allOrders.filter(o => o.orderStatus === 'returned').length;

            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`snap-start group relative flex-shrink-0 flex items-center gap-2.5 rounded-[1.25rem] px-6 py-3.5 transition-all duration-300 overflow-hidden ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 dark:bg-blue-500 dark:text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 shadow-sm border border-gray-200/80 dark:border-gray-700/80 hover:-translate-y-1 hover:shadow-md'
                }`}
              >
                <FilterIcon className={`relative z-10 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'} transition-colors`} />
                <span className="relative z-10 text-[15px] font-bold whitespace-nowrap tracking-wide">{f.label}</span>
                {f.key !== 'all' && (
                  <span className={`relative z-10 ml-1.5 flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[11px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <OrderCardSkeleton key={i} />)}
        </div>
      ) : filteredOrders.length > 0 ? (
        <>
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const meta = STATUS_META[order.orderStatus] ?? STATUS_META.placed;
              const isExpanded = expandedOrder === order._id;
              const isActive = !['delivered', 'cancelled', 'returned'].includes(order.orderStatus);

              return (
                <div key={order._id} className="group/card rounded-3xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm border border-gray-200/80 dark:border-gray-800 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1">
                  {/* ── Card header ── */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                    className="flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5"
                  >
                    {/* Left: thumbnail strip + info */}
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {/* Product thumbnails (up to 3) */}
                      <div className="flex flex-shrink-0 -space-x-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="relative h-12 w-12 overflow-hidden rounded-lg border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-white/5" style={{ zIndex: 3 - idx }}>
                            <Image src={item.product?.thumbnail || '/images/no-product.svg'} alt={item.product?.name || 'Product'} fill className="object-cover transition-transform duration-500 group-hover/card:scale-110" sizes="48px" />
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-white/10 text-xs font-bold text-gray-500 dark:text-gray-400">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Order info */}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {order.items.length === 1
                            ? (order.items[0].product?.name || 'Product')
                            : `${order.items[0].product?.name || 'Product'} + ${order.items.length - 1} more`}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-gray-400">#{order.orderNumber}</span>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                            <HiOutlineCalendar className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.bg} ${meta.color}`}>
                            {isActive && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: amount + chevron */}
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <span className="text-base font-bold text-gray-900 dark:text-white">{formatPrice(order.totalAmount)}</span>
                      <span className="text-[11px] text-gray-400">{order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}</span>
                      <HiOutlineChevronDown className={`mt-1 h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* ── Progress bar (always visible for active orders) ── */}
                  {isActive && (
                    <div className="border-t border-gray-100 dark:border-white/5 px-4 py-4 sm:px-5">
                      <OrderProgressBar status={order.orderStatus} />
                      {order.estimatedDelivery && order.orderStatus !== 'delivered' && (
                        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                          <HiOutlineCalendar className="h-3.5 w-3.5" />
                          Estimated delivery: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatDate(order.estimatedDelivery)}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Expanded details ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-white/5 p-4 sm:p-5">

                      {/* Cancelled/returned also show progress bar when expanded */}
                      {!isActive && (
                        <div className="mb-4">
                          <OrderProgressBar status={order.orderStatus} />
                        </div>
                      )}

                      {/* Products list */}
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <HiOutlineCube className="h-4 w-4" /> Items Ordered
                      </p>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="group/item flex gap-4 rounded-2xl bg-white dark:bg-gray-800 p-3 shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/30">
                            <Link href={`/product/${item.product?.slug || '#'}`} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                              <Image src={item.product?.thumbnail || '/images/no-product.svg'} alt={item.product?.name || 'Product'} fill className="object-cover transition-transform duration-500 group-hover/item:scale-110" sizes="80px" />
                            </Link>
                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                              <Link href={`/product/${item.product?.slug || '#'}`} className="block text-[15px] font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 transition-colors">
                                {item.product?.name || 'Product'}
                              </Link>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-gray-700 dark:text-gray-300">Qty: {item.quantity}</span>
                                {item.color && <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-gray-300" /> {item.color}</span>}
                              </div>
                              <p className="mt-2 text-sm font-black text-blue-600 dark:text-blue-400">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Delivery + Payment row */}
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 shadow-sm border border-gray-100 dark:border-gray-700 group/ticket">
                          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 transition-transform duration-500 group-hover/ticket:scale-110 group-hover/ticket:-rotate-6">
                            <HiOutlineLocationMarker className="h-16 w-16" />
                          </div>
                          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <HiOutlineLocationMarker className="h-4 w-4 text-gray-400" /> Delivery Address
                          </p>
                          <div className="relative z-10 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
                            <p className="font-bold text-gray-900 dark:text-white mb-1">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.addressLine1}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                            <p className="font-medium mt-1 tracking-wide">{order.shippingAddress.pincode}</p>
                          </div>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 shadow-sm border border-gray-100 dark:border-gray-700 group/ticket">
                          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 transition-transform duration-500 group-hover/ticket:scale-110 group-hover/ticket:rotate-6">
                            <HiOutlineCreditCard className="h-16 w-16" />
                          </div>
                          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <HiOutlineCreditCard className="h-4 w-4 text-gray-400" /> Payment
                          </p>
                          <div className="relative z-10 flex flex-col items-start gap-3">
                            <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                              {order.paymentMethod === 'razorpay'
                                ? <HiOutlineCreditCard className="h-5 w-5 text-blue-500" />
                                : <HiOutlineCash className="h-5 w-5 text-emerald-500" />}
                              <span>{order.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : 'Cash on Delivery'}</span>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm ${
                              order.paymentStatus === 'paid'
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                                : order.paymentStatus === 'failed'
                                  ? 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                                  : 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-emerald-500' : order.paymentStatus === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tracking info */}
                      {order.trackingNumber && (
                        <div className="mt-3 rounded-xl border border-cyan-200 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/5 p-3">
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                            <HiOutlineTruck className="h-4 w-4" /> Shipment Tracking
                          </p>
                          <div className="space-y-1 text-xs">
                            {order.logisticsPartner && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Courier</span>
                                <span className="font-medium capitalize text-gray-700 dark:text-gray-300">{order.logisticsPartner.replace(/_/g, ' ')}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-400">AWB / Tracking No.</span>
                              <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{order.trackingNumber}</span>
                            </div>
                          </div>
                          {order.trackingUrl && (
                            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-600 py-2 text-xs font-semibold text-white hover:bg-cyan-500">
                              <HiOutlineTruck className="h-3.5 w-3.5" /> Track on courier site
                            </a>
                          )}
                        </div>
                      )}

                      {/* Status timeline */}
                      {order.statusHistory && order.statusHistory.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Order Timeline</p>
                          <div className="relative space-y-0 pl-5">
                            {[...order.statusHistory].reverse().map((s, idx) => {
                              const isFirst = idx === 0;
                              return (
                                <div key={idx} className="relative pb-4 last:pb-0">
                                  {/* connector */}
                                  {idx < order.statusHistory.length - 1 && (
                                    <div className="absolute left-[-13px] top-[18px] bottom-0 w-0.5 bg-gray-200 dark:bg-white/10" />
                                  )}
                                  {/* dot */}
                                  <div className={`absolute left-[-17px] top-1 h-3 w-3 rounded-full border-2 ${isFirst ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-white/20 bg-white dark:bg-gray-900'}`} />
                                  <p className={`text-xs font-semibold capitalize ${isFirst ? 'text-primary-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {s.status.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-[11px] text-gray-400">{formatDate(s.date)}</p>
                                  {s.message && <p className="text-[11px] text-gray-500">{s.message}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Price summary */}
                      <div className="mt-5 relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        {/* Receipt edge effect */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjQiPgo8cGF0aCBkPSJNMCA0IEw0IDAgTDggNCBMMCA0IiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjQiPgo8cGF0aCBkPSJNMCA0IEw0IDAgTDggNCBMMCA0IiBmaWxsPSIjM2YzZjQ2Ii8+Cjwvc3ZnPg==')] bg-repeat-x opacity-60" />
                        
                        <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                          <HiOutlineClipboardList className="h-4 w-4" /> Bill Summary
                        </p>
                        <div className="space-y-3.5 text-[14px]">
                          <div className="flex justify-between items-center"><span className="text-gray-500 font-medium">Subtotal</span><span className="text-gray-900 dark:text-white font-semibold">{formatPrice(order.subtotal)}</span></div>
                          {order.discount > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                <HiOutlineTag className="h-4 w-4" /> Discount
                                {order.coupon?.code && <span className="font-mono bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">({order.coupon.code})</span>}
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">−{formatPrice(order.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Delivery</span>
                            <span className={`font-semibold ${order.deliveryCharge === 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20' : 'text-gray-900 dark:text-white'}`}>
                              {order.deliveryCharge === 0 ? 'FREE' : formatPrice(order.deliveryCharge)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-5 flex items-center justify-between border-t border-dashed border-gray-200 dark:border-gray-700 pt-5">
                          <span className="text-base font-black text-gray-900 dark:text-white">Total Paid</span>
                          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">{formatPrice(order.totalAmount)}</span>
                        </div>
                      </div>

                      {/* Request Return button - only for delivered orders */}
                      {order.orderStatus === 'delivered' && (
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => {
                              orderService.downloadInvoice(order._id).catch(() => toast.error('Failed to download invoice'));
                            }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                          >
                            <HiOutlineClipboardList className="h-4 w-4" />
                            Download Invoice
                          </button>
                          <button
                            onClick={() => setReturnOrderId(order._id)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                          >
                            <HiOutlineSwitchHorizontal className="h-4 w-4" />
                            Request Return
                          </button>
                        </div>
                      )}

                      {/* Download Invoice for non-cancelled, non-returned orders */}
                      {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned' && (
                        <button
                          onClick={() => {
                            orderService.downloadInvoice(order._id).catch(() => toast.error('Failed to download invoice'));
                          }}
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-3.5 text-[14px] font-bold text-white dark:text-gray-900 shadow-md shadow-gray-900/10 dark:shadow-white/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg active:scale-95"
                        >
                          <HiOutlineClipboardList className="h-5 w-5" />
                          Download Invoice
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </>
      ) : orders.length > 0 ? (
        // filtered to empty
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <HiOutlineClipboardList className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm font-medium text-gray-500">No {activeFilter} orders found</p>
          <button onClick={() => setActiveFilter('all')} className="mt-3 text-xs text-primary-500 hover:underline">Show all orders</button>
        </div>
      ) : (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
          <HiOutlineShoppingBag className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No orders yet</h3>
          <p className="mt-1 text-sm text-gray-500">Your purchase history will appear here after your first order.</p>
          <Link href="/products" className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white hover:bg-primary-500">
            Start Shopping
          </Link>
        </div>
      )}

      {/* ── Return Request Modal ── */}
      {returnOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setReturnOrderId(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Request Return</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Return Type</label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value as ReturnType)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="return">Return & Refund</option>
                  <option value="replacement">Replacement</option>
                  <option value="refund">Refund Only</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="defective">Defective / Not Working</option>
                  <option value="wrong_item">Wrong Item Delivered</option>
                  <option value="not_as_described">Not As Described</option>
                  <option value="damaged_in_transit">Damaged During Shipping</option>
                  <option value="size_fit_issue">Size / Fit Issue</option>
                  <option value="changed_mind">Changed My Mind</option>
                  <option value="better_price_elsewhere">Better Price Elsewhere</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description (optional)</label>
                <textarea
                  value={returnDesc}
                  onChange={(e) => setReturnDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none resize-none"
                  placeholder="Describe the issue..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setReturnOrderId(null)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnSubmit}
                disabled={submittingReturn}
                className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
              >
                {submittingReturn ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
