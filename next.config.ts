import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Silence "multiple lockfiles" warning — our project root is platform/
  turbopack: {
    root: __dirname,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent the page from being embedded in iframes (clickjacking protection)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Only send referrer for same-origin requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable access to device APIs
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  // sharp runs server-side; must be listed as an external package
  serverExternalPackages: ['sharp'],

  // Allow Next.js <Image> to load from Google Drive
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      // Placeholder for development (Phase 8)
      {
        protocol: 'https',
        hostname: 'placeholder.dev',
      },
    ],
  },
}

export default nextConfig
