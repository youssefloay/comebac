import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mode normal - Capacitor chargera l'app depuis le serveur de production
  // Pour un export statique (sans API routes), décommentez: output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configuration Turbopack pour résoudre le problème de workspace root
  turbopack: {
    root: __dirname,
  },
  webpack: (config, { isServer }) => {
    // Exclure @aws-sdk/client-s3 du bundling (package optionnel)
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3'
      })
    }
    return config
  },
  images: {
    // Optimisation des images activée pour de meilleures performances
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // Configuration pour permettre les query strings dans les chemins d'images locales
    localPatterns: [
      {
        pathname: '/comebac.png',
        // Omettre 'search' permet n'importe quelle query string
      },
    ],
    // Garder unoptimized pour les images externes si nécessaire
    // unoptimized: true,
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
        source: '/ads.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
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
      },
      // Cache pour les assets statiques
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/comebac.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/comebac-logo.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      }
    ]
  }
}

export default nextConfig