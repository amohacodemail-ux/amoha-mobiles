import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Smartphones & Mobiles',
  description: 'Browse our complete collection of smartphones. Filter by brand, price, RAM, storage & more. Samsung, Apple, OnePlus, Xiaomi at best prices with warranty.',
  openGraph: {
    title: 'All Smartphones & Mobiles | AMOHA Mobiles',
    description: 'Browse our complete collection of smartphones at best prices.',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
