/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  },
  transpilePackages: ['three'],
};

module.exports = nextConfig;
