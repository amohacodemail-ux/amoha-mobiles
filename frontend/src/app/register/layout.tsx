import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your AMOHA Mobiles account for exclusive deals, order tracking, and more.',
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
