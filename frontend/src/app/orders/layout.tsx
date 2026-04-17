import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Orders',
  description: 'View and track your orders from AMOHA Mobiles.',
  robots: { index: false, follow: false },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
