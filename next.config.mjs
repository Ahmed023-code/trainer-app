/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Capacitor mobile app (disable for server mode)
  // Use NEXT_BUILD_MODE=server to run as a web server instead of static export
  output: process.env.NEXT_BUILD_MODE === 'server' ? undefined : 'export',

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

  // Webpack config for sql.js and Capacitor plugins
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // Ignore Capacitor plugins during web build
      // They will be dynamically imported only on native platforms
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /@capacitor-mlkit\/barcode-scanning/,
        })
      );
    }
    return config;
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['zustand', 'idb-keyval'],
  },
};
export default nextConfig;
