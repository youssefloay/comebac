// Service Worker placeholder
// Ce fichier est requis pour éviter les erreurs 404
// Il peut être étendu plus tard pour ajouter des fonctionnalités PWA

self.addEventListener('install', (event) => {
  console.log('Service Worker installé')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activé')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Pour l'instant, on laisse passer toutes les requêtes normalement
  event.respondWith(fetch(event.request))
})
