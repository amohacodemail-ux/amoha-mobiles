/** @type {import('next').NextConfig} */
// v2
const nextConfig = {
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', 'date-fns'],
  },
  ...(process.env.NODE_ENV === 'production' ? {
    compiler: {
      removeConsole: { exclude: ['error', 'warn'] },
    },
  } : {}),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: 'amoha-backend-v2.onrender.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: 'cdn.dummyjson.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  reactStrictMode: true,
  compress: true,
  generateEtags: true,
  poweredByHeader: false,
  async rewrites() {
    const backendUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://amoha-backend-v2.onrender.com'
        : `http://localhost:${process.env.BACKEND_PORT || 10000}`;
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
