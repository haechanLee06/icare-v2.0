/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 减少不必要的重定向
  trailingSlash: false,
  // 优化静态资源
  compress: true,
}

export default nextConfig
