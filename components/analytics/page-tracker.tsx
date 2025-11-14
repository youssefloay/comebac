"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function PageTracker() {
  const pathname = usePathname()
  const { user } = useAuth()
  const startTimeRef = useRef<number>(Date.now())
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random()}`)

  useEffect(() => {
    // Réinitialiser le temps de début quand la page change
    startTimeRef.current = Date.now()

    // Fonction pour envoyer les données
    const trackPageView = async () => {
      try {
        await fetch('/api/track-page-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.uid || 'anonymous',
            userEmail: user?.email || 'anonymous',
            page: pathname,
            sessionId: sessionIdRef.current,
            timestamp: new Date().toISOString()
          })
        })
      } catch (error) {
        console.error('Erreur tracking page:', error)
      }
    }

    // Fonction pour envoyer le temps passé
    const trackTimeSpent = async () => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000) // en secondes
      
      // Ne tracker que si au moins 3 secondes
      if (timeSpent < 3) return

      try {
        await fetch('/api/track-time-spent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.uid || 'anonymous',
            userEmail: user?.email || 'anonymous',
            page: pathname,
            timeSpent,
            sessionId: sessionIdRef.current
          })
        })
      } catch (error) {
        console.error('Erreur tracking temps:', error)
      }
    }

    // Tracker la vue de page
    trackPageView()

    // Tracker le temps passé quand l'utilisateur quitte la page
    const handleBeforeUnload = () => {
      trackTimeSpent()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackTimeSpent()
      } else {
        // Réinitialiser le temps quand l'utilisateur revient
        startTimeRef.current = Date.now()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      trackTimeSpent()
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname, user])

  return null // Ce composant ne rend rien
}
