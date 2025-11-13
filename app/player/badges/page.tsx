"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Trophy, Target, TrendingUp } from 'lucide-react'
import { calculatePlayerBadges, PlayerStats, getAllPossibleBadges } from '@/lib/player-badges'
import { PlayerBadges } from '@/components/player/player-badges'

interface PlayerData {
  position: string
  stats: PlayerStats
  firstName: string
  lastName: string
}

export default function BadgesPage() {
  const { user, isAdmin } = useAuth()
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        let playerDoc
        let playerDataRaw

        // Vérifier si on est en mode impersonation
        const impersonatePlayerId = sessionStorage.getItem('impersonatePlayerId')
        
        if (isAdmin && impersonatePlayerId) {
          const playerDocRef = doc(db, 'playerAccounts', impersonatePlayerId)
          const playerDocSnap = await getDoc(playerDocRef)
          
          if (!playerDocSnap.exists()) {
            setLoading(false)
            return
          }
          
          playerDoc = playerDocSnap
          playerDataRaw = playerDocSnap.data()
        } else {
          if (!user?.email) {
            setLoading(false)
            return
          }

          const playerAccountsQuery = query(
            collection(db, 'playerAccounts'),
            where('email', '==', user.email)
          )
          const playerAccountsSnap = await getDocs(playerAccountsQuery)

          if (playerAccountsSnap.empty) {
            setLoading(false)
            return
          }

          playerDoc = playerAccountsSnap.docs[0]
          playerDataRaw = playerDoc.data()
        }
        
        setPlayerData({
          position: playerDataRaw.position,
          firstName: playerDataRaw.firstName,
          lastName: playerDataRaw.lastName,
          stats: playerDataRaw.stats || {
            matchesPlayed: 0,
            minutesPlayed: 0,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0
          }
        })
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayerData()
  }, [user, isAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!playerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Aucune donnée joueur trouvée</p>
        </div>
      </div>
    )
  }

  const badges = calculatePlayerBadges(playerData.stats, playerData.position)
  const allPossibleBadges = getAllPossibleBadges(playerData.position)
  const stats = playerData.stats

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏆 Mes Badges
          </h1>
          <p className="text-gray-600">
            Débloquez des badges en accomplissant des exploits sur le terrain
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{badges.length}</div>
                <div className="text-xs text-gray-600">Badges</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.goals}</div>
                <div className="text-xs text-gray-600">Buts</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.assists}</div>
                <div className="text-xs text-gray-600">Passes</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-lg">⚽</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.matchesPlayed}</div>
                <div className="text-xs text-gray-600">Matchs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Badges Débloqués ({badges.length}/{allPossibleBadges.length})
          </h2>
          <PlayerBadges 
            badges={badges} 
            showAll={true} 
            allPossibleBadges={allPossibleBadges}
            showLocked={true}
          />
        </div>

        {/* Motivation Message */}
        {badges.length === 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Commencez votre collection!
            </h3>
            <p className="text-blue-700 text-sm">
              Jouez des matchs, marquez des buts et accomplissez des exploits pour débloquer vos premiers badges!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
