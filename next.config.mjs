/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Capacitor mobile app
  output: 'export',

  // Image optimization must be disabled for static export
  images: {
    unoptimized: true,
  },

  // Skip type checking during build (faster builds)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Production optimizations
  swcMinify: true,

  // Reduce source map size in production
  productionBrowserSourceMaps: false,

  // Webpack config for sql.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['zustand', 'idb-keyval'],
  },
};
export default nextConfig;
