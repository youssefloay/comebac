/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mode normal - Capacitor chargera l'app depuis le serveur de production
  // Pour un export statique (sans API routes), décommentez: output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    MATCH_SCHEDULE_ENABLED: "true",
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com wss://*.firebaseio.com wss://*.firestore.googleapis.com https://*.google-analytics.com https://region1.google-analytics.com"
          }
        ]
      }
    ]
  }
}

export default nextConfig