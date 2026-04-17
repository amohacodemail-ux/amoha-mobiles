import { NextResponse } from 'next/server';

const BASE_URL = 'https://amohamobiles.com';
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const API_URL = !rawApiUrl || rawApiUrl.includes('amoha-backend.onrender.com')
  ? 'https://amoha-backend-v2.onrender.com/api'
  : rawApiUrl;

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: string;
  priority: number;
}

function toXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastModified.toISOString()}</lastmod>
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export async function GET() {
  const staticPages: SitemapEntry[] = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/track-order`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/return-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/shipping-info`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  let productPages: SitemapEntry[] = [];
  let categoryPages: SitemapEntry[] = [];

  try {
    const productsRes = await fetch(`${API_URL}/products?limit=1000`, { next: { revalidate: 3600 } });
    if (productsRes.ok) {
      const productsJson = await productsRes.json();
      const products = productsJson.data?.products || productsJson.data || [];
      productPages = products.map((p: { slug: string; updatedAt?: string }) => ({
        url: `${BASE_URL}/product/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch {
    // API unavailable during build
  }

  try {
    const categoriesRes = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } });
    if (categoriesRes.ok) {
      const categoriesJson = await categoriesRes.json();
      const categories = categoriesJson.data || [];
      categoryPages = categories.map((c: { slug: string }) => ({
        url: `${BASE_URL}/products?category=${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch {
    // API unavailable during build
  }

  const allEntries = [...staticPages, ...productPages, ...categoryPages];
  const xml = toXml(allEntries);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
