import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about AMOHA Mobiles - your trusted premium smartphones store in Coimbatore, Tamil Nadu. Quality phones, genuine warranty, and exceptional customer service.',
  openGraph: {
    title: 'About Us | AMOHA Mobiles',
    description: 'Your trusted premium smartphones store in Coimbatore, Tamil Nadu.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
