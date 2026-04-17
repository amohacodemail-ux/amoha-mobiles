import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Products',
  description: 'Compare smartphones side by side - specs, prices, features. Find the best mobile phone for you at AMOHA Mobiles.',
  openGraph: {
    title: 'Compare Products | AMOHA Mobiles',
    description: 'Compare smartphones side by side at AMOHA Mobiles.',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
