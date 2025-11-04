/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Opt in to Turbopack by providing an empty config (required when no webpack config is present)
  turbopack: {},

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