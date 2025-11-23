"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { BarChart3, Target, TrendingUp, Award, Users } from 'lucide-react'
import { motion } from 'framer-motion'

interface PlayerStats {
  id: string
  firstName: string
  lastName: string
  jerseyNumber: number
  position: string
  stats: {
    matchesPlayed: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
  }
}

export default function CoachStatsPage() {
  const { user } = useAuth()
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.email) return

      try {
        let tid = ''
        
        // Vérifier si on est en mode impersonation
        const impersonateCoachId = sessionStorage.getItem('impersonateCoachId')
        
        if (impersonateCoachId) {
          // Mode impersonation: charger les données du coach spécifique
          const coachDoc = await getDoc(doc(db, 'coachAccounts', impersonateCoachId))
          if (coachDoc.exists()) {
            tid = coachDoc.data().teamId
          }
        } else {
          // Utilisateur normal: chercher par email
          const coachQuery = query(
            collection(db, 'coachAccounts'),
            where('email', '==', user.email)
          )
          const coachSnap = await getDocs(coachQuery)

          if (!coachSnap.empty) {
            const coachData = coachSnap.docs[0].data()
            tid = coachData.teamId
          }
        }

        if (tid) {

          // Charger les joueurs avec leurs stats
          const playersQuery = query(
            collection(db, 'playerAccounts'),
            where('teamId', '==', tid)
          )
          const playersSnap = await getDocs(playersQuery)

          const playersData = playersSnap.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              firstName: data.firstName,
              lastName: data.lastName,
              jerseyNumber: data.jerseyNumber,
              position: data.position,
              stats: data.stats || {
                matchesPlayed: 0,
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0
              }
            }
          }) as PlayerStats[]

          // Trier par buts décroissants
          playersData.sort((a, b) => b.stats.goals - a.stats.goals)
          setPlayers(playersData)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Calculer les totaux de l'équipe
  const teamStats = players.reduce((acc, player) => ({
    matchesPlayed: Math.max(acc.matchesPlayed, player.stats.matchesPlayed),
    goals: acc.goals + player.stats.goals,
    assists: acc.assists + player.stats.assists,
    yellowCards: acc.yellowCards + player.stats.yellowCards,
    redCards: acc.redCards + player.stats.redCards
  }), { matchesPlayed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 })

  const topScorer = players[0]
  const topAssister = [...players].sort((a, b) => b.stats.assists - a.stats.assists)[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
            Statistiques de l'Équipe
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Analysez les performances de vos joueurs
          </p>
        </motion.div>

        {/* Team Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">{players.length}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Joueurs</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-green-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">{teamStats.goals}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Buts Totaux</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-purple-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">{teamStats.assists}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Passes Décisives</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-yellow-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-1">
                {teamStats.yellowCards + teamStats.redCards}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Cartons</p>
            </div>
          </motion.div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {topScorer && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 text-white p-6 rounded-2xl shadow-2xl border border-green-500/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">Meilleur Buteur</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl md:text-3xl font-bold">{topScorer.firstName} {topScorer.lastName}</p>
                  <p className="text-green-100 text-sm md:text-base">#{topScorer.jerseyNumber} • {topScorer.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl md:text-5xl font-black">{topScorer.stats.goals}</p>
                  <p className="text-green-100 text-sm md:text-base">Buts</p>
                </div>
              </div>
            </motion.div>
          )}

          {topAssister && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 text-white p-6 rounded-2xl shadow-2xl border border-purple-500/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">Meilleur Passeur</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl md:text-3xl font-bold">{topAssister.firstName} {topAssister.lastName}</p>
                  <p className="text-purple-100 text-sm md:text-base">#{topAssister.jerseyNumber} • {topAssister.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl md:text-5xl font-black">{topAssister.stats.assists}</p>
                  <p className="text-purple-100 text-sm md:text-base">Passes</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Players Stats Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Statistiques Détaillées</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Joueur
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Matchs
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Buts
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Passes
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Cartons
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {players.map((player, index) => (
                  <motion.tr
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mr-3 shadow-lg"
                        >
                          {player.jerseyNumber}
                        </motion.div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {player.firstName} {player.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900 dark:text-white">{player.position}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{player.stats.matchesPlayed}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{player.stats.goals}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{player.stats.assists}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {player.stats.yellowCards > 0 && (
                          <span className="px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-semibold rounded-full border border-yellow-200 dark:border-yellow-800">
                            {player.stats.yellowCards} 🟨
                          </span>
                        )}
                        {player.stats.redCards > 0 && (
                          <span className="px-2 py-1 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-800 dark:text-red-400 text-xs font-semibold rounded-full border border-red-200 dark:border-red-800">
                            {player.stats.redCards} 🟥
                          </span>
                        )}
                        {player.stats.yellowCards === 0 && player.stats.redCards === 0 && (
                          <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
