/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Lint is run separately (and locally); don't block production builds on it.
    ignoreDuringBuilds: true,
  },
}
module.exports = nextConfig
