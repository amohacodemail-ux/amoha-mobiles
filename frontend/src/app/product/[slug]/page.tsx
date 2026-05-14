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

  const title = `Buy ${product.name} in Coimbatore – ${price} | Amohamobiles`;
  const description =
    product.shortDescription ||
    product.description ||
    `Buy ${product.name} at best price in Coimbatore. ${product.brand} smartphone available at Amohamobiles, Idikarai – genuine warranty, fast delivery.`;

  const imageAlt = `${product.name} – Buy at Amohamobiles Coimbatore`;

  return {
    title,
    description,
    keywords: [
      `${product.name} coimbatore`,
      `buy ${product.name} idikarai`,
      `${product.brand} phones coimbatore`,
      `${product.name} price coimbatore`,
      `${product.name} amohamobiles`,
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Amohamobiles',
      images: product.images?.[0]
        ? [{ url: product.images[0], width: 800, height: 800, alt: imageAlt }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
    alternates: {
      canonical: `https://amohamobiles.com/product/${slug}`,
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

  const productJsonLd = product
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
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          availability: product.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'LocalBusiness',
            name: 'Amohamobiles',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Therveethi, Idikarai',
              addressLocality: 'Coimbatore',
              addressRegion: 'Tamil Nadu',
              addressCountry: 'IN',
            },
          },
          areaServed: 'Coimbatore',
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
            shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'INR' },
          },
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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://amohamobiles.com' },
      { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://amohamobiles.com/products' },
      { '@type': 'ListItem', position: 3, name: product?.name || 'Product', item: `https://amohamobiles.com/product/${slug}` },
    ],
  };

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient />
    </>
  );
}
