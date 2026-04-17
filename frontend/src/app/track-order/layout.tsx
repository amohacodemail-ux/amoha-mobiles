import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Order',
  description: 'Track your order status and delivery at AMOHA Mobiles.',
  robots: { index: false, follow: false },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
