import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy Smartphones & Mobiles in Coimbatore – Amohamobiles',
  description: 'Buy smartphones in Coimbatore at Amohamobiles. Samsung, iPhone, OnePlus, Xiaomi & more – best prices, genuine warranty. Serving Idikarai & Coimbatore.',
  keywords: [
    'buy smartphones coimbatore', 'mobile phones coimbatore', 'best smartphones idikarai',
    'Samsung mobiles coimbatore', 'iPhone coimbatore shop', 'OnePlus coimbatore',
    'Xiaomi phones coimbatore', 'Realme phones coimbatore', 'Vivo mobiles coimbatore',
    'Oppo phones coimbatore', 'Nothing phone coimbatore', 'Motorola coimbatore',
    'budget smartphones coimbatore', '5G phones coimbatore', 'mobile phones with warranty coimbatore',
    'buy phone online coimbatore', 'new mobile coimbatore', 'latest mobile 2025 coimbatore',
    'cheap mobile phones coimbatore', 'mobile under 10000 coimbatore', 'mobile under 20000 coimbatore',
    'best mobile deals coimbatore', 'mobile emi coimbatore', 'smartphone shop gandhipuram',
    'mobile shop saravanampatti', 'mobile shop peelamedu', 'mobile shop rs puram coimbatore',
  ],
  openGraph: {
    title: 'Buy Smartphones & Mobiles in Coimbatore – Amohamobiles',
    description: 'Buy Samsung, iPhone, OnePlus, Xiaomi & more at Amohamobiles Coimbatore. Best prices, genuine warranty, fast delivery.',
  },
  alternates: { canonical: 'https://amohamobiles.com/products' },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
