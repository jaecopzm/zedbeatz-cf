// Add to next.config.js for Cloudflare Workers
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable edge runtime for API routes
  experimental: {
    runtime: 'edge',
  },
}
