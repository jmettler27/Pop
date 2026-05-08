/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '4mb',
        },
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        domains: ['firebasestorage.googleapis.com', 'localhost', '127.0.0.1'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                port: '',
                pathname: '/image/upload/**',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '9199',
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
