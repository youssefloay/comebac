"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PlayerDashboard } from '@/components/dashboard/player-dashboard'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function PlayerPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isPlayer, setIsPlayer] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkPlayerStatus = async () => {
      if (!user?.email) {
        setChecking(false)
        return
      }

      try {
        // Vérifier si l'utilisateur a des données dans playerAccounts
        const playerAccountsQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', user.email)
        )
        const playerAccountsSnap = await getDocs(playerAccountsQuery)
        
        setIsPlayer(!playerAccountsSnap.empty)
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
  }, [user, authLoading])

  useEffect(() => {
    if (!authLoading && !checking) {
      if (!user) {
        router.push('/login')
      } else if (userProfile?.role === 'admin') {
        router.push('/admin')
      } else if (isPlayer === false) {
        // Pas un joueur, rediriger vers public
        router.push('/public')
      }
    }
  }, [user, userProfile, authLoading, checking, isPlayer, router])

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
