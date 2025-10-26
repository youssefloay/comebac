/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    MATCH_SCHEDULE_ENABLED: "true", // Activer ou désactiver la planification des matchs
  },
  async headers() {
    return [
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