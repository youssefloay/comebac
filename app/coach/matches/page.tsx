"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar, Trophy, Clock, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  date: Date
  location: string
  status: 'upcoming' | 'live' | 'finished'
}

export default function CoachMatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    const loadMatches = async () => {
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
          setTeamId(tid)

          // Charger les matchs de l'équipe
          const matchesQuery = query(
            collection(db, 'matches'),
            where('teams', 'array-contains', tid)
          )
          const matchesSnap = await getDocs(matchesQuery)

          const matchesData = matchesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date()
          })) as Match[]

          // Trier par date décroissante (plus récent en premier)
          matchesData.sort((a, b) => b.date.getTime() - a.date.getTime())

          setMatches(matchesData)
        }
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

  const upcomingMatches = matches.filter(m => m.status === 'upcoming')
  const pastMatches = matches.filter(m => m.status === 'finished')

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
            <Calendar className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
            Calendrier des Matchs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Gérez vos matchs et consultez les résultats
          </p>
        </motion.div>

        {/* Upcoming Matches */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">Matchs à Venir</h2>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-4">
              {upcomingMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">
                        {match.date.toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold border border-blue-200 dark:border-blue-800">
                      À venir
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-lg md:text-xl">{match.homeTeam}</p>
                    </div>
                    <div className="px-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">VS</span>
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-lg md:text-xl">{match.awayTeam}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{match.location}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl text-center"
            >
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Aucun match à venir</p>
            </motion.div>
          )}
        </div>

        {/* Past Matches */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">Matchs Passés</h2>
          {pastMatches.length > 0 ? (
            <div className="space-y-4">
              {pastMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">
                        {match.date.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-semibold border border-gray-300 dark:border-gray-600">
                      Terminé
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-lg md:text-xl mb-2">{match.homeTeam}</p>
                      <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{match.homeScore ?? '-'}</p>
                    </div>
                    <div className="px-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-lg md:text-xl mb-2">{match.awayTeam}</p>
                      <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{match.awayScore ?? '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{match.location}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl text-center"
            >
              <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Aucun match passé</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
