import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    title: `Buy ${name} Mobiles in Coimbatore – Amohamobiles`,
    description: `Shop ${name} smartphones and mobile phones at Amohamobiles, Idikarai, Coimbatore. Best prices, genuine warranty, fast delivery across Tamil Nadu.`,
    keywords: [
      `${name.toLowerCase()} phones coimbatore`,
      `buy ${name.toLowerCase()} coimbatore`,
      `${name.toLowerCase()} mobile shop idikarai`,
      `${name.toLowerCase()} smartphones coimbatore`,
    ],
    openGraph: {
      title: `${name} Mobiles in Coimbatore – Amohamobiles`,
      description: `Shop ${name} smartphones at Amohamobiles Coimbatore – best prices, genuine warranty.`,
    },
    alternates: {
      canonical: `https://amohamobiles.com/products?category=${slug}`,
    },
  };
}

export default function CategorySlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
