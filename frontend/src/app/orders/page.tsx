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
  { key: 'placed',           label: 'Order Placed',     icon: HiOutlineClipboardList },
  { key: 'confirmed',        label: 'Confirmed',        icon: HiOutlineCheckCircle   },
  { key: 'processing',       label: 'Packed',           icon: HiOutlineCube          },
  { key: 'shipped',          label: 'Shipped',          icon: HiOutlineTruck         },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: HiOutlineLocationMarker },
  { key: 'delivered',        label: 'Delivered',        icon: HiOutlineHome          },
];

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  placed:           { color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10',    label: 'Order Placed'     },
  confirmed:        { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', label: 'Confirmed'       },
  processing:       { color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10',   label: 'Packed'          },
  shipped:          { color: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-50 dark:bg-cyan-500/10',     label: 'Shipped'         },
  out_for_delivery: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', label: 'Out for Delivery'},
  delivered:        { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Delivered'   },
  cancelled:        { color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-500/10',       label: 'Cancelled'       },
  returned:         { color: 'text-gray-500 dark:text-gray-400',     bg: 'bg-gray-100 dark:bg-gray-500/10',    label: 'Returned'        },
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
      <div className="relative flex items-center justify-between">
        {/* connector line behind icons */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gray-200 dark:bg-white/10" />
        <div
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary-500 transition-all duration-500"
          style={{ width: currentIdx <= 0 ? '0%' : `${(currentIdx / (ORDER_STEPS.length - 1)) * 100}%` }}
        />
        {ORDER_STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all
                ${done    ? 'border-primary-500 bg-primary-500 text-white'
                : active  ? 'border-primary-500 bg-white dark:bg-gray-900 text-primary-500 shadow-md shadow-primary-500/30'
                :           'border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-300 dark:text-gray-600'}`}>
                {done
                  ? <HiOutlineCheckCircle className="h-4 w-4" />
                  : <Icon className="h-4 w-4" />}
              </div>
              <span className={`hidden sm:block text-[10px] font-medium leading-tight text-center max-w-[56px]
                ${done || active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
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
  const activeCount    = allOrders.filter((o) => !['delivered', 'cancelled', 'returned'].includes(o.orderStatus)).length;
  const totalSpent     = allOrders.filter((o) => o.orderStatus !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0);

  // ── Filter tabs ────────────────────────────────────────────────────────────
  const FILTERS = [
    { key: 'all',      label: 'All Orders' },
    { key: 'active',   label: 'Active'     },
    { key: 'delivered',label: 'Delivered'  },
    { key: 'cancelled',label: 'Cancelled'  },
  ];

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'all')       return true;
    if (activeFilter === 'active')    return !['delivered', 'cancelled', 'returned'].includes(o.orderStatus);
    if (activeFilter === 'delivered') return o.orderStatus === 'delivered';
    if (activeFilter === 'cancelled') return o.orderStatus === 'cancelled' || o.orderStatus === 'returned';
    return true;
  });

  return (
    <div className="page-container py-6 sm:py-10">
      {/* ── Page header ── */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">My Orders</h1>
          {user?.name && (
            <p className="mt-0.5 text-sm text-gray-500">Welcome back, <span className="font-medium text-gray-700 dark:text-gray-300">{user.name.split(' ')[0]}</span></p>
          )}
        </div>
        {totalOrders > 0 && (
          <p className="text-xs text-gray-400">{totalOrders} order{totalOrders !== 1 ? 's' : ''} in history</p>
        )}
      </div>

      {/* ── Stats strip ── */}
      {!isLoading && allOrders.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="glass-card p-3 sm:p-4 text-center">
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{totalOrders}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 text-center">
            <p className="text-xs text-gray-500">Active</p>
            <p className="mt-1 text-xl font-bold text-primary-500">{activeCount}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 text-center">
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(totalSpent)}</p>
          </div>
        </div>
      )}

      {/* ── Filter tabs ── */}
      {!isLoading && orders.length > 0 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeFilter === f.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
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
                <div key={order._id} className="glass-card overflow-hidden">
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
                            <Image src={item.product?.thumbnail || '/images/no-product.svg'} alt={item.product?.name || 'Product'} fill className="object-cover" sizes="48px" />
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
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Items Ordered</p>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-3 rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                            <Link href={`/product/${item.product?.slug || '#'}`} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/10">
                              <Image src={item.product?.thumbnail || '/images/no-product.svg'} alt={item.product?.name || 'Product'} fill className="object-cover" sizes="64px" />
                            </Link>
                            <div className="min-w-0 flex-1">
                              <Link href={`/product/${item.product?.slug || '#'}`} className="block text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-500 line-clamp-2">
                                {item.product?.name || 'Product'}
                              </Link>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                                <span>Qty: {item.quantity}</span>
                                {item.color && <span>· {item.color}</span>}
                              </div>
                              <p className="mt-1 text-sm font-bold text-primary-500">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Delivery + Payment row */}
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Delivery Address</p>
                          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">{order.shippingAddress.fullName}</span><br />
                            {order.shippingAddress.addressLine1}<br />
                            {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
                          </p>
                        </div>
                        <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Payment</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                            {order.paymentMethod === 'razorpay'
                              ? <HiOutlineCreditCard className="h-4 w-4 text-primary-400" />
                              : <HiOutlineCash className="h-4 w-4 text-amber-400" />}
                            <span>{order.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : 'Cash on Delivery'}</span>
                          </div>
                          <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : order.paymentStatus === 'failed'
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {order.paymentStatus}
                          </span>
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
                      <div className="mt-4 rounded-xl bg-gray-50 dark:bg-white/5 p-3 space-y-1.5">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Bill Summary</p>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Subtotal</span><span className="text-gray-700 dark:text-gray-300">{formatPrice(order.subtotal)}</span></div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <HiOutlineTag className="h-3 w-3" /> Discount
                              {order.coupon?.code && <span className="font-mono">({order.coupon.code})</span>}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400">−{formatPrice(order.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Delivery</span>
                          <span className={order.deliveryCharge === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}>
                            {order.deliveryCharge === 0 ? 'FREE' : formatPrice(order.deliveryCharge)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 dark:border-white/10 pt-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">Total Paid</span>
                          <span className="text-sm font-bold gradient-text">{formatPrice(order.totalAmount)}</span>
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
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                          <HiOutlineClipboardList className="h-4 w-4" />
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
