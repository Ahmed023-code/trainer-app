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

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['zustand', 'idb-keyval'],
  },
};
export default nextConfig;
