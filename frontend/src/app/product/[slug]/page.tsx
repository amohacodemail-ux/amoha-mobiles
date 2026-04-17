import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

const normalizeApiBase = (value?: string) => {
  if (!value || !value.includes('amoha-backend-v2.onrender.com')) {
    return 'https://amoha-backend-v2.onrender.com/api';
  }

  const trimmed = value.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL = normalizeApiBase(rawApiUrl);
const API_FALLBACK_URL = 'https://amoha-backend-v2.onrender.com/api';

async function fetchProductFrom(baseUrl: string, slug: string) {
  const res = await fetch(`${baseUrl}/products/${slug}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

async function getProduct(slug: string) {
  try {
    const primary = await fetchProductFrom(API_URL, slug);
    if (primary) return primary;
    if (API_URL !== API_FALLBACK_URL) {
      return await fetchProductFrom(API_FALLBACK_URL, slug);
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: 'Product | AMOHA Mobiles' };
  }

  const price = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const title = `${product.name} – Buy at ${price}`;
  const description =
    product.shortDescription ||
    product.description ||
    `Buy ${product.name} online at AMOHA Mobiles. ${product.brand} smartphone with ${product.specifications?.ram || ''} RAM, ${product.specifications?.storage || ''} storage.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: product.images?.[0]
        ? [{ url: product.images[0], width: 800, height: 800, alt: product.name }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
    alternates: {
      canonical: `/product/${slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.shortDescription || product.description,
        image: product.images || [],
        brand: { '@type': 'Brand', name: product.brand },
        sku: product._id,
        offers: {
          '@type': 'Offer',
          url: `https://amohamobiles.com/product/${slug}`,
          priceCurrency: 'INR',
          price: product.price,
          availability: product.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: { '@type': 'Organization', name: 'AMOHA Mobiles' },
        },
        ...(product.ratings > 0 && product.numReviews > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.ratings,
                reviewCount: product.numReviews,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient />
    </>
  );
}
