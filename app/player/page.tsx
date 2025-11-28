"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PlayerDashboard } from '@/components/dashboard/player-dashboard'

export default function PlayerPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isPlayer, setIsPlayer] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkPlayerStatus = async () => {
      // Si admin en mode impersonation, considérer comme joueur
      if (isAdmin && sessionStorage.getItem('impersonatePlayerId')) {
        setIsPlayer(true)
        setChecking(false)
        return
      }

      if (!user?.email) {
        setChecking(false)
        return
      }

      try {
        // Utiliser l'API route optimisée avec cache
        const response = await fetch(`/api/player/status?email=${encodeURIComponent(user.email)}`)
        if (response.ok) {
          const data = await response.json()
          setIsPlayer(data.isPlayer || false)
        } else {
          setIsPlayer(false)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut joueur:', error)
        setIsPlayer(false)
      } finally {
        setChecking(false)
      }
    }

    if (!authLoading) {
      checkPlayerStatus()
    }
  }, [user, authLoading, isAdmin])

  useEffect(() => {
    if (!authLoading && !checking) {
      if (!user) {
        router.push('/login')
      } else if (isAdmin && !sessionStorage.getItem('impersonatePlayerId')) {
        // Rediriger vers admin seulement si pas en mode impersonation
        router.push('/admin')
      } else if (isPlayer === false && !isAdmin) {
        // Pas un joueur, rediriger vers public (sauf si admin en impersonation)
        router.push('/public')
      }
    }
  }, [user, isAdmin, authLoading, checking, isPlayer, router])

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || isPlayer === false) {
    return null
  }

  return <PlayerDashboard />
}
