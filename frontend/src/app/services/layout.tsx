import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mobile Repair Services in Coimbatore – Amohamobiles Idikarai',
  description: 'Professional mobile repair in Coimbatore at Amohamobiles, Idikarai. Screen, battery, charging port & more. Fast turnaround, genuine parts & warranty.',
  keywords: ['mobile repair coimbatore', 'phone repair idikarai', 'screen replacement coimbatore', 'battery replacement mobile coimbatore', 'mobile service centre idikarai', 'phone repair shop coimbatore', 'mobile repair near me coimbatore'],
  openGraph: {
    title: 'Mobile Repair Services in Coimbatore – Amohamobiles Idikarai',
    description: 'Professional mobile repair in Coimbatore at Amohamobiles – screen, battery, charging port & more. Genuine parts, warranty included.',
  },
  alternates: { canonical: 'https://amohamobiles.com/services' },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
