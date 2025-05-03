/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Build sırasında ESLint hatalarını görmezden gel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Build sırasında TypeScript hatalarını görmezden gel
    ignoreBuildErrors: true,
  },
  // Build sürecini optimize etmek için bazı klasörleri hariç tut
  webpack: (config, { isServer }) => {
    // Telegram bot API'sini sadece sunucu tarafında kullan
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        request: false,
      }
    }

    return config
  },
  // Bazı dosyaları build sürecinden hariç tut
  experimental: {
    outputFileTracingIgnores: [
      "node_modules/node-telegram-bot-api/**/*",
      "node_modules/request/**/*",
      "node_modules/debug/**/*",
    ],
  },
  // Statik optimizasyonu devre dışı bırak (build sürecini basitleştirir)
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
