/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore ESLint errors during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript build errors
  typescript: {
    ignoreBuildErrors: true,
  },
};
module.exports = nextConfig;