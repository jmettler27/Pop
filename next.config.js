/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '4mb',
        },
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
    // Externalize Firebase packages from the server bundle so Node.js resolves
    // them natively. This allows gRPC to work properly (it breaks when bundled).
    serverExternalPackages: ['firebase', '@firebase/firestore', '@firebase/app', '@firebase/component', '@firebase/util', '@firebase/logger', '@grpc/grpc-js', '@grpc/proto-loader'],
    turbopack: {},
}
module.exports = nextConfig
