import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Amohamobiles – Trusted Mobile Shop in Idikarai, Coimbatore',
  description: 'Learn about Amohamobiles – the most trusted mobile shop in Idikarai, Coimbatore. Genuine smartphones, accessories, and expert repairs since day one. Visit us in Coimbatore.',
  keywords: ['about amohamobiles', 'mobile shop coimbatore history', 'trusted mobile store idikarai', 'best mobile shop coimbatore about'],
  openGraph: {
    title: 'About Amohamobiles – Trusted Mobile Shop in Idikarai, Coimbatore',
    description: 'Learn about Amohamobiles – trusted mobile shop in Idikarai, Coimbatore offering genuine smartphones, accessories & expert repairs.',
  },
  alternates: { canonical: 'https://amohamobiles.com/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
