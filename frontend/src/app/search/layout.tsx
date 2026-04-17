import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Products',
  description: 'Search for smartphones, mobile phones, and accessories at AMOHA Mobiles.',
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
