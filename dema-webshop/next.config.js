/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Opt in to Turbopack with proper root configuration
  turbopack: {
    root: __dirname,
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