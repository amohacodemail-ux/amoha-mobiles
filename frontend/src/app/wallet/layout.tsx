import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wallet',
  description: 'View your wallet balance and transaction history.',
  robots: { index: false, follow: false },
};

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children;
}
