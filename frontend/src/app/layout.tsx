import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ClientAuthGuard from '@/components/layout/ClientAuthGuard';
import { LoadingBar } from '@/components/ui/LoadingBar';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Amohamobiles – Best Mobile Shop in Coimbatore & Idikarai',
    template: '%s | Amohamobiles Coimbatore',
  },
  description:
    'Amohamobiles – best mobile shop in Idikarai, Coimbatore. Buy latest smartphones, accessories & get expert repairs. Best prices, warranty & fast delivery.',
  keywords: [
    'mobile shop in coimbatore',
    'mobile shop in idikarai',
    'amohamobiles coimbatore',
    'mobile store near me',
    'best mobile shop in coimbatore',
    'mobile accessories coimbatore',
    'phone shop idikarai',
    'smartphone store coimbatore',
    'buy mobile phones coimbatore',
    'latest smartphones coimbatore',
    'budget smartphones India',
    'mobile deals coimbatore',
    'phone accessories online',
    'android phones shop',
    'best mobile shop near idikarai coimbatore',
    'affordable smartphones in coimbatore store',
    'where to buy mobile phones in idikarai',
    'mobile shop with warranty in coimbatore',
    'Samsung phones coimbatore',
    'iPhone shop coimbatore',
    'OnePlus smartphones coimbatore',
    'Xiaomi mobiles coimbatore',
    'mobile repair coimbatore',
    'phone repair idikarai',
    '5G phones coimbatore',
    'AMOHA Mobiles',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Amohamobiles',
    url: 'https://amohamobiles.com',
    title: 'Amohamobiles – Best Mobile Shop in Coimbatore & Idikarai',
    description: 'Buy latest smartphones & accessories at Amohamobiles – trusted mobile shop in Idikarai, Coimbatore. Best prices, warranty & expert service.',
    images: [
      {
        url: 'https://amohamobiles.com/images/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Amohamobiles – Mobile Shop in Idikarai, Coimbatore',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@amohamobiles',
    title: 'Amohamobiles – Best Mobile Shop in Coimbatore & Idikarai',
    description: 'Buy latest smartphones & accessories at Amohamobiles – trusted mobile shop in Idikarai, Coimbatore.',
    images: ['https://amohamobiles.com/images/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://amohamobiles.com',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  other: {
    'geo.region': 'IN-TN',
    'geo.placename': 'Idikarai, Coimbatore, Tamil Nadu',
    'geo.position': '11.1085;76.9974',
    'ICBM': '11.1085, 76.9974',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MobilePhoneStore',
    '@id': 'https://amohamobiles.com/#localbusiness',
    name: 'Amohamobiles',
    alternateName: 'AMOHA Mobiles',
    url: 'https://amohamobiles.com',
    logo: 'https://amohamobiles.com/images/logo.png',
    image: 'https://amohamobiles.com/images/og-image.svg',
    description: 'Amohamobiles is the best mobile shop in Idikarai, Coimbatore offering latest smartphones, mobile accessories, and expert phone repair services at affordable prices.',
    priceRange: '₹₹',
    telephone: '+91-6380123183',
    email: 'support@amoha.in',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Therveethi, Idikarai',
      addressLocality: 'Coimbatore',
      addressRegion: 'Tamil Nadu',
      postalCode: '641020',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 11.1085,
      longitude: 76.9974,
    },
    hasMap: 'https://maps.google.com/?q=Idikarai,Coimbatore,Tamil+Nadu',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '20:00',
      },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-6380123183',
      contactType: 'customer service',
      areaServed: ['Coimbatore', 'Idikarai', 'Tamil Nadu', 'IN'],
      availableLanguage: ['English', 'Tamil'],
    },
    areaServed: [
      { '@type': 'City', name: 'Coimbatore' },
      { '@type': 'City', name: 'Idikarai' },
    ],
    sameAs: [],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Smartphones & Mobile Accessories',
      itemListElement: [
        { '@type': 'OfferCatalog', name: 'Smartphones' },
        { '@type': 'OfferCatalog', name: 'Mobile Accessories' },
        { '@type': 'OfferCatalog', name: 'Mobile Repair Services' },
      ],
    },
  };

  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://amohamobiles.com/#website',
    name: 'Amohamobiles',
    url: 'https://amohamobiles.com',
    description: 'Best mobile shop in Idikarai, Coimbatore – buy smartphones, accessories & get phone repairs.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://amohamobiles.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@id': 'https://amohamobiles.com/#localbusiness',
    },
  };

  return (
    <html lang="en-IN" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://amoha-backend-v2.onrender.com" />
        <link rel="preconnect" href="https://amoha-backend-v2.onrender.com" crossOrigin="anonymous" />
        <GoogleAnalytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <ThemeProvider>
          <LoadingBar />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              className: '!bg-white !text-gray-900 !border-gray-200 dark:!bg-[#1a1a2e] dark:!text-[#e2e8f0] dark:!border-gray-200 dark:border-white/10',
            }}
          />
          <ClientAuthGuard>
            {children}
          </ClientAuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
