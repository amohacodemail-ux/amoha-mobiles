import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://amohamobiles.com/products' },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
