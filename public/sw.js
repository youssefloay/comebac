// Service Worker avec cache busting pour le logo
const CACHE_VERSION = 'v2'
const LOGO_CACHE_NAME = `comebac-logo-${CACHE_VERSION}`

self.addEventListener('install', (event) => {
  console.log('Service Worker installé', CACHE_VERSION)
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activé', CACHE_VERSION)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('comebac-logo-') && cacheName !== LOGO_CACHE_NAME)
          .map((cacheName) => {
            console.log('🗑️ Suppression ancien cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Invalider le cache pour le logo si un paramètre de version est présent
  if (url.pathname.includes('comebac.png') || url.pathname.includes('comebac-logo.svg')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        return caches.match(event.request)
      })
    )
    return
  }
  
  // Pour les autres requêtes, laisser passer normalement
  event.respondWith(fetch(event.request))
})
