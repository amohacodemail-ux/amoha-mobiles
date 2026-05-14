import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy Smartphones & Mobiles in Coimbatore – Amohamobiles',
  description: 'Buy smartphones in Coimbatore at Amohamobiles. Samsung, iPhone, OnePlus, Xiaomi & more – best prices, genuine warranty. Serving Idikarai & Coimbatore.',
  keywords: ['buy smartphones coimbatore', 'mobile phones coimbatore', 'best smartphones idikarai', 'Samsung mobiles coimbatore', 'iPhone coimbatore shop', 'OnePlus coimbatore', 'Xiaomi phones coimbatore', 'budget smartphones coimbatore', '5G phones coimbatore', 'mobile phones with warranty coimbatore'],
  openGraph: {
    title: 'Buy Smartphones & Mobiles in Coimbatore – Amohamobiles',
    description: 'Buy Samsung, iPhone, OnePlus, Xiaomi & more at Amohamobiles Coimbatore. Best prices, genuine warranty, fast delivery.',
  },
  alternates: { canonical: 'https://amohamobiles.com/products' },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
