/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security: Disable X-Powered-By header
  poweredByHeader: false,

  // Experimental features for better compatibility
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },

  // Webpack configuration for better Prisma handling
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': '@prisma/client',
        'prisma': 'prisma'
      });
    }
    return config;
  },

  // Image optimization
  images: {
    // Use remotePatterns instead of deprecated domains for security
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**', // Will be restricted in production
      },
    ],
    // Prevent malicious image uploads
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Enable XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },

  // Redirect insecure requests in production
  async redirects() {
    return [
      {
        source: '/admin/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },

  // Environment variable validation
  env: {
    // Only expose non-sensitive public variables
    NEXT_PUBLIC_APP_NAME: 'Córdoba Shows',
  },
};

module.exports = nextConfig;
