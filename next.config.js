/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: ['localhost'],
  },
  async rewrites() {
    // Hardcoded Railway backend URL
    return [
      {
        source: '/api/:path*',
        destination: 'https://fashion-shop-production-69c7.up.railway.app/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
