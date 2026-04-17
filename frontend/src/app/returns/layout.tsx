import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Returns',
  description: 'Track and manage your return and replacement requests.',
  robots: { index: false, follow: false },
};

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
