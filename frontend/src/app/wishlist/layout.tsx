import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'View your saved products and wishlist items.',
  robots: { index: false, follow: false },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
