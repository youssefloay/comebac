/**
 * Hook pour gérer le statut de coach intérimaire
 * Le capitaine devient coach si l'équipe n'a pas de coach
 */

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface ActingCoachStatus {
  isActingCoach: boolean
  isCaptain: boolean
  hasTeamCoach: boolean
  loading: boolean
}

export function useActingCoach(playerEmail: string | null, teamId: string | null): ActingCoachStatus {
  const [status, setStatus] = useState<ActingCoachStatus>({
    isActingCoach: false,
    isCaptain: false,
    hasTeamCoach: false,
    loading: true
  })

  useEffect(() => {
    const checkActingCoachStatus = async () => {
      if (!playerEmail || !teamId) {
        setStatus({
          isActingCoach: false,
          isCaptain: false,
          hasTeamCoach: false,
          loading: false
        })
        return
      }

      try {
        // 1. Vérifier si le joueur est capitaine
        const playerAccountsQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', playerEmail),
          where('teamId', '==', teamId)
        )
        const playerAccountsSnap = await getDocs(playerAccountsQuery)

        if (playerAccountsSnap.empty) {
          setStatus({
            isActingCoach: false,
            isCaptain: false,
            hasTeamCoach: false,
            loading: false
          })
          return
        }

        const playerData = playerAccountsSnap.docs[0].data()
        
        // Vérifier si c'est le capitaine via players collection
        const playersQuery = query(
          collection(db, 'players'),
          where('email', '==', playerEmail),
          where('teamId', '==', teamId),
          where('isCaptain', '==', true)
        )
        const playersSnap = await getDocs(playersQuery)
        const isCaptain = !playersSnap.empty

        // 2. Vérifier si l'équipe a un coach
        const coachAccountsQuery = query(
          collection(db, 'coachAccounts'),
          where('teamId', '==', teamId)
        )
        const coachAccountsSnap = await getDocs(coachAccountsQuery)
        const hasTeamCoach = !coachAccountsSnap.empty

        // 3. Le capitaine devient coach intérimaire s'il n'y a pas de coach
        const isActingCoach = isCaptain && !hasTeamCoach

        setStatus({
          isActingCoach,
          isCaptain,
          hasTeamCoach,
          loading: false
        })
      } catch (error) {
        console.error('Erreur lors de la vérification du statut de coach intérimaire:', error)
        setStatus({
          isActingCoach: false,
          isCaptain: false,
          hasTeamCoach: false,
          loading: false
        })
      }
    }

    checkActingCoachStatus()
  }, [playerEmail, teamId])

  return status
}
