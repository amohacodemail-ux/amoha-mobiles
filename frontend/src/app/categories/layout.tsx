import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop by Category',
  description: 'Browse smartphones by category - Samsung, Apple iPhone, OnePlus, Xiaomi, Realme & more. Find the perfect mobile phone at AMOHA Mobiles.',
  openGraph: {
    title: 'Shop by Category | AMOHA Mobiles',
    description: 'Browse smartphones by category at AMOHA Mobiles.',
  },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
