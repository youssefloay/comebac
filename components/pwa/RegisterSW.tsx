"use client"

import { useEffect } from 'react'

export function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register in both dev and production for testing
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker enregistré:', registration.scope)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('🔄 Mise à jour du Service Worker détectée')
          })
        })
        .catch((error) => {
          console.error('❌ Erreur Service Worker:', error.message)
          console.error('Vérifiez que /sw.js est accessible')
        })
    } else {
      console.warn('⚠️ Service Workers non supportés par ce navigateur')
    }
  }, [])

  return null
}
