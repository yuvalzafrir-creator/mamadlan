const { i18n } = require('./next-i18next.config')
/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  eslint: {
    // Lint is run separately (and locally); don't block production builds on it.
    ignoreDuringBuilds: true,
  },
}
module.exports = nextConfig
