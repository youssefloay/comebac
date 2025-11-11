"use client"

import { useEffect } from 'react'

export function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker enregistré:', registration)
        })
        .catch((error) => {
          console.error('❌ Erreur Service Worker:', error)
        })
    }
  }, [])

  return null
}
