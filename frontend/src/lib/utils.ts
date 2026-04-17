import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function safeImageSrc(src: string | null | undefined, fallback: string): string {
  if (!src || typeof src !== 'string') return fallback;

  const trimmed = src.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return fallback;

  const lower = trimmed.toLowerCase();
  const blockedPatterns = [
    'example.com',
    'placehold.co',
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

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function calculateDiscount(originalPrice: number, price: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getStockStatus(stock: number): {
  label: string;
  color: string;
} {
  if (stock === 0) return { label: 'Out of Stock', color: 'text-red-400' };
  if (stock <= 5) return { label: `Only ${stock} left!`, color: 'text-amber-400' };
  if (stock <= 20) return { label: 'Limited Stock', color: 'text-yellow-400' };
  return { label: 'In Stock', color: 'text-emerald-400' };
}

export function getRatingColor(rating: number): string {
  if (rating >= 4) return 'bg-emerald-500';
  if (rating >= 3) return 'bg-yellow-500';
  if (rating >= 2) return 'bg-orange-500';
  return 'bg-red-500';
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
