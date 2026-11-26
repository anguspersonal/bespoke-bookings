/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@bespoke/ui', '@bespoke/types', '@bespoke/database', '@bespoke/email', '@bespoke/auth'],
};

module.exports = nextConfig;
