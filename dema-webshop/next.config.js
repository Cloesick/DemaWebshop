/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Disable turbopack (the new experimental bundler)
  experimental: {
    // Disable turbopack
    turbopack: false,
    // Enable better image optimization
    optimizeCss: true,
  },

  // Handle WebSocket connections for HMR
  webpack: (config, { isServer, dev }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        ignored: ['node_modules/**', '.git/**'],
      }
    }
    return config
  },

  // Handle images from external sources
  images: {
    // No external domains needed as we're using SVG placeholders
    domains: [],
    remotePatterns: [],
    // Disable image optimization in development for better performance
    unoptimized: true,
  },
  
  // Add production browser source maps for better debugging
  productionBrowserSourceMaps: true,
}

module.exports = nextConfig