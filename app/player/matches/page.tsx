"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar, Trophy, Clock } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Match {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeam: string
  awayTeam: string
  date: Date
  homeTeamScore?: number
  awayTeamScore?: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  round: number
}

export default function PlayerMatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    const loadMatches = async () => {
      if (!user?.email) return

      try {
        // Trouver l'équipe du joueur
        const playerAccountsQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', user.email)
        )
        const playerAccountsSnap = await getDocs(playerAccountsQuery)

        if (playerAccountsSnap.empty) {
          setLoading(false)
          return
        }

        const playerData = playerAccountsSnap.docs[0].data()
        const playerTeamId = playerData.teamId
        setTeamId(playerTeamId)

        // Charger tous les matchs
        const matchesSnap = await getDocs(collection(db, 'matches'))
        
        // Charger les équipes
        const teamsSnap = await getDocs(collection(db, 'teams'))
        const teamsMap = new Map()
        teamsSnap.docs.forEach(doc => {
          teamsMap.set(doc.id, doc.data().name)
        })

        // Filtrer les matchs de l'équipe du joueur
        const teamMatches = matchesSnap.docs
          .map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              homeTeamId: data.homeTeamId,
              awayTeamId: data.awayTeamId,
              homeTeam: teamsMap.get(data.homeTeamId) || 'Équipe inconnue',
              awayTeam: teamsMap.get(data.awayTeamId) || 'Équipe inconnue',
              date: data.date?.toDate() || new Date(),
              homeTeamScore: data.homeTeamScore,
              awayTeamScore: data.awayTeamScore,
              status: data.status,
              round: data.round
            }
          })
          .filter(match => 
            match.homeTeamId === playerTeamId || match.awayTeamId === playerTeamId
          )
          .sort((a, b) => b.date.getTime() - a.date.getTime())

        setMatches(teamMatches)
      } catch (error) {
        console.error('Erreur lors du chargement des matchs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const upcomingMatches = matches.filter(m => m.status === 'scheduled')
  const completedMatches = matches.filter(m => m.status === 'completed')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Mes Matchs</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Calendrier et résultats de mon équipe</p>
        </motion.div>

        {/* Prochains matchs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Prochains Matchs ({upcomingMatches.length})
          </h2>
          
          {upcomingMatches.length === 0 ? (
            <div className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-xl text-center">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Aucun match à venir</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {upcomingMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Link
                    href={`/player/matches/${match.id}`}
                    className="block bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 md:p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all backdrop-blur-xl cursor-pointer"
                  >
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold border border-blue-200 dark:border-blue-800">
                      Journée {match.round}
                    </span>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {match.date.toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className={`flex-1 text-right ${match.homeTeamId === teamId ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                      {match.homeTeam}
                    </div>
                    <div className="px-6 text-gray-400 dark:text-gray-500 font-bold text-lg">VS</div>
                    <div className={`flex-1 text-left ${match.awayTeamId === teamId ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                      {match.awayTeam}
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Voir les détails →
                    </span>
                  </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Matchs terminés */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            Matchs Terminés ({completedMatches.length})
          </h2>
          
          {completedMatches.length === 0 ? (
            <div className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-xl text-center">
              <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Aucun match terminé</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {completedMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Link
                    href={`/player/matches/${match.id}`}
                    className="block bg-gradient-to-br from-white via-white to-green-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 md:p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all backdrop-blur-xl cursor-pointer"
                  >
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold border border-green-200 dark:border-green-800">
                      Journée {match.round}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {match.date.toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className={`flex-1 text-right ${match.homeTeamId === teamId ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                      {match.homeTeam}
                    </div>
                    <div className="px-6">
                      <div className="flex items-center gap-3 text-2xl md:text-3xl font-bold">
                        <span className={match.homeTeamScore! > match.awayTeamScore! ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}>
                          {match.homeTeamScore ?? 0}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                        <span className={match.awayTeamScore! > match.homeTeamScore! ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}>
                          {match.awayTeamScore ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className={`flex-1 text-left ${match.awayTeamId === teamId ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                      {match.awayTeam}
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Voir les détails →
                    </span>
                  </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
