"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Trophy, Target, TrendingUp } from 'lucide-react'
import { calculatePlayerBadges, PlayerStats, getAllPossibleBadges } from '@/lib/player-badges'
import { PlayerBadges } from '@/components/player/player-badges'
import { motion } from 'framer-motion'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!playerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Aucune donnée joueur trouvée</p>
        </div>
      </div>
    )
  }

  const badges = calculatePlayerBadges(playerData.stats, playerData.position)
  const allPossibleBadges = getAllPossibleBadges(playerData.position)
  const stats = playerData.stats

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            🏆 Mes Badges
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Débloquez des badges en accomplissant des exploits sur le terrain
          </p>
        </motion.div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-4 md:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{badges.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Badges</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-green-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-4 md:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.goals}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Buts</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-purple-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-4 md:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.assists}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Passes</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-orange-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-4 md:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">⚽</span>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{stats.matchesPlayed}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Matchs</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6 md:p-8"
        >
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Badges Débloqués ({badges.length}/{allPossibleBadges.length})
          </h2>
          <PlayerBadges 
            badges={badges} 
            showAll={true} 
            allPossibleBadges={allPossibleBadges}
            showLocked={true}
          />
        </motion.div>

        {/* Motivation Message */}
        {badges.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 md:p-8 text-center shadow-xl"
          >
            <div className="text-4xl md:text-5xl mb-3">🎯</div>
            <h3 className="text-lg md:text-xl font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Commencez votre collection!
            </h3>
            <p className="text-blue-700 dark:text-blue-400 text-sm md:text-base">
              Jouez des matchs, marquez des buts et accomplissez des exploits pour débloquer vos premiers badges!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
