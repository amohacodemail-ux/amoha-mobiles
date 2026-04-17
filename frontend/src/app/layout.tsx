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
    default: 'AMOHA Mobiles - Premium Smartphones Store | Buy Mobiles Online India',
    template: '%s | AMOHA Mobiles',
  },
  description:
    'Shop the latest smartphones at unbeatable prices. Buy Samsung, Apple iPhone, OnePlus, Xiaomi, Realme & more with fast delivery, easy returns & warranty. Best mobile phone deals online in India.',
  keywords: [
    'buy mobiles online',
    'smartphones',
    'AMOHA Mobiles',
    'mobile phones',
    'best price phones',
    'buy phones online India',
    'Samsung phones',
    'iPhone deals',
    'OnePlus smartphones',
    'Xiaomi mobiles',
    'budget smartphones',
    'flagship phones',
    '5G phones',
    'mobile accessories',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'AMOHA Mobiles',
    title: 'AMOHA Mobiles - Premium Smartphones Store',
    description: 'Shop the latest smartphones at unbeatable prices with fast delivery and easy returns.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AMOHA Mobiles - Premium Smartphones Store',
    description: 'Shop the latest smartphones at unbeatable prices with fast delivery and easy returns.',
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
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AMOHA Mobiles',
    url: 'https://amohamobiles.com',
    logo: 'https://amohamobiles.com/images/logo.png',
    description: 'Premium smartphones store in India. Buy Samsung, Apple iPhone, OnePlus, Xiaomi & more with fast delivery and easy returns.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-6380123183',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Tamil', 'Hindi'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Therveethi, Idikarai',
      addressLocality: 'Coimbatore',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
    sameAs: [],
  };

  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AMOHA Mobiles',
    url: 'https://amohamobiles.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://amohamobiles.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://amoha-backend-v2.onrender.com" />
        <link rel="preconnect" href="https://amoha-backend-v2.onrender.com" crossOrigin="anonymous" />
        <GoogleAnalytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
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
