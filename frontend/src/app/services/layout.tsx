import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Services',
  description: 'AMOHA Mobiles services - mobile repair, screen replacement, battery replacement, software updates and more. Expert technicians in Coimbatore.',
  openGraph: {
    title: 'Our Services | AMOHA Mobiles',
    description: 'Expert mobile repair and service at AMOHA Mobiles.',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
