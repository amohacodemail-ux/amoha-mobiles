import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import type { OrderStatus, PaymentStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeImageSrc(src: string | null | undefined, fallback = '/images/no-image.svg'): string {
  if (!src || typeof src !== 'string') return fallback;

  const trimmed = src.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return fallback;

  const lower = trimmed.toLowerCase();
  const blockedPatterns = [
    'placehold.co',
    'example.com',
    'via.placeholder.com',
    'dummyimage.com',
    'images.unsplash.com',
    '/api/upload/',
    'amoha-backend.onrender.com',
    'amoha-backend-v2.onrender.com',
  ];

  if (blockedPatterns.some((pattern) => lower.includes(pattern))) return fallback;

  if (trimmed.startsWith('/') || trimmed.startsWith('data:image/') || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return format(d, 'dd MMM yyyy');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return format(d, 'dd MMM yyyy, hh:mm a');
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export function getOrderStatusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    placed: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    confirmed: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    processing: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    shipped: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    out_for_delivery: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    delivered: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    returned: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30',
  };
  return map[status] ?? 'bg-muted text-muted-foreground';
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    paid: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
    failed: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    refunded: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  };
  return map[status] ?? 'bg-muted text-muted-foreground';
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.set(k, String(v));
  });
  return query.toString();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
