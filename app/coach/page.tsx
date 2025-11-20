"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CoachDashboard } from '@/components/dashboard/coach-dashboard'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function CoachPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isCoach, setIsCoach] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkCoachStatus = async () => {
      // Si admin en mode impersonation, considérer comme coach
      if (isAdmin && sessionStorage.getItem('impersonateCoachId')) {
        setIsCoach(true)
        setChecking(false)
        return
      }

      if (!user?.email) {
        setChecking(false)
        return
      }

      try {
        // Vérifier si l'utilisateur a des données dans coachAccounts
        const coachAccountsQuery = query(
          collection(db, 'coachAccounts'),
          where('email', '==', user.email)
        )
        const coachAccountsSnap = await getDocs(coachAccountsQuery)
        
        const hasCoachAccount = !coachAccountsSnap.empty
        
        // Si pas de compte coach, vérifier si c'est un coach intérimaire (joueur avec isActingCoach)
        if (!hasCoachAccount) {
          const playerAccountsQuery = query(
            collection(db, 'playerAccounts'),
            where('email', '==', user.email),
            where('isActingCoach', '==', true)
          )
          const playerAccountsSnap = await getDocs(playerAccountsQuery)
          setIsCoach(!playerAccountsSnap.empty)
        } else {
          setIsCoach(true)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut entraîneur:', error)
        setIsCoach(false)
      } finally {
        setChecking(false)
      }
    }

    if (!authLoading) {
      checkCoachStatus()
    }
  }, [user, authLoading, isAdmin])

  useEffect(() => {
    if (!authLoading && !checking) {
      if (!user) {
        router.push('/login')
      } else if (isAdmin) {
        // Les admins peuvent accéder à l'espace coach
        setIsCoach(true)
      } else if (isCoach === false) {
        // Pas un entraîneur, rediriger vers public
        router.push('/public')
      }
    }
  }, [user, isAdmin, authLoading, checking, isCoach, router])

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || isCoach === false) {
    return null
  }

  return <CoachDashboard />
}
