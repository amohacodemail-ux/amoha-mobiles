import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop by Category – Amohamobiles Coimbatore',
  description: 'Browse mobile phones by category at Amohamobiles, Coimbatore. Samsung, Apple, OnePlus, Xiaomi & more.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://amohamobiles.com/products' },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
