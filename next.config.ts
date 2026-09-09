import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  // Proxy the Go backend (`back-pop`) under a same-origin path so the browser
  // needs no CORS. Active only when `BACKEND_ORIGIN` is set (dev); in prod the
  // client can instead point `NEXT_PUBLIC_BACKEND_URL` straight at the service.
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN;
    if (!backendOrigin) return [];
    return [{ source: '/api/backend/:path*', destination: `${backendOrigin}/:path*` }];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '**',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '**',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  // Externalize firebase-admin (and its transitive gRPC/gax deps) from the server
  // bundle so Node.js resolves them natively — gRPC breaks when bundled.
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@google-cloud/storage',
    'google-gax',
    'farmhash-modern',
    'pino',
    'pino-pretty',
  ],
  turbopack: {},
};

export default nextConfig;
