import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with AMOHA Mobiles. We are here to help with your queries about products, orders, returns, and service requests.',
  openGraph: {
    title: 'Contact Us | AMOHA Mobiles',
    description: 'Get in touch with AMOHA Mobiles for any queries.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
