/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async redirects() {
    return [
      {
        source: '/status',
        destination: '/',
        permanent: false,
      },
      {
        source: '/billing',
        destination: '/dashboard/billing',
        permanent: false,
      },
      {
        source: '/incidents',
        destination: '/dashboard/incidents',
        permanent: false,
      },
      {
        source: '/status-pages',
        destination: '/dashboard/status-pages',
        permanent: false,
      },
      {
        source: '/monitors',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/monitor',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
