"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar, Trophy, Clock, MapPin, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import type { PreseasonMatch } from '@/lib/types'

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamId?: string
  awayTeamId?: string
  homeScore?: number
  awayScore?: number
  date: Date
  location: string
  status: 'upcoming' | 'live' | 'finished'
  isPreseason?: boolean
  penaltyShootout?: {
    teamAScore: number
    teamBScore: number
  }
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

          // Charger les équipes pour obtenir les noms
          const teamsSnap = await getDocs(collection(db, 'teams'))
          const teamsMap = new Map()
          teamsSnap.docs.forEach(doc => {
            teamsMap.set(doc.id, doc.data().name)
          })

          // Charger les matchs réguliers de l'équipe
          const matchesQuery = query(
            collection(db, 'matches'),
            where('teams', 'array-contains', tid)
          )
          const matchesSnap = await getDocs(matchesQuery)

          const regularMatches: Match[] = matchesSnap.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              homeTeam: teamsMap.get(data.homeTeamId) || 'Équipe inconnue',
              awayTeam: teamsMap.get(data.awayTeamId) || 'Équipe inconnue',
              homeTeamId: data.homeTeamId,
              awayTeamId: data.awayTeamId,
              homeScore: data.homeScore,
              awayScore: data.awayScore,
              date: data.date?.toDate() || new Date(),
              location: data.location || 'Stade',
              status: data.status || 'upcoming',
              isPreseason: false
            }
          })

          // Charger les matchs de preseason
          const preseasonRes = await fetch('/api/preseason/matches')
          const preseasonData = await preseasonRes.json()
          const preseasonMatches = (preseasonData.matches || []) as (PreseasonMatch & { teamALogo?: string; teamBLogo?: string })[]

          // Filtrer les matchs de preseason de l'équipe
          const preseasonTeamMatches = preseasonMatches
            .filter(match => match.teamAId === tid || match.teamBId === tid)
            .map(match => {
              // Convertir le statut preseason au statut match régulier
              let status: 'upcoming' | 'live' | 'finished' = 'upcoming'
              if (match.status === 'finished') status = 'finished'
              else if (match.status === 'in_progress') status = 'live'
              
              // Créer une date complète avec date + time
              const matchDate = new Date(match.date)
              const [hours, minutes] = match.time.split(':').map(Number)
              matchDate.setHours(hours, minutes, 0, 0)
              
              return {
                id: match.id,
                homeTeam: match.teamAName,
                awayTeam: match.teamBName,
                homeTeamId: match.teamAId,
                awayTeamId: match.teamBId,
                homeScore: match.scoreA,
                awayScore: match.scoreB,
                date: matchDate,
                location: match.location,
                status: status,
                isPreseason: true,
                penaltyShootout: match.penaltyShootout ? {
                  teamAScore: match.penaltyShootout.teamAPlayers?.filter(p => p.scored).length || 0,
                  teamBScore: match.penaltyShootout.teamBPlayers?.filter(p => p.scored).length || 0
                } : undefined
              } as Match
            })

          // Combiner tous les matchs
          const allMatches = [...regularMatches, ...preseasonTeamMatches]
          // Trier : les matchs à venir par date croissante, les matchs passés par date décroissante
          allMatches.sort((a, b) => {
            const aIsUpcoming = a.status === 'upcoming'
            const bIsUpcoming = b.status === 'upcoming'
            
            if (aIsUpcoming && bIsUpcoming) {
              // Les deux sont à venir : trier par date croissante (plus proche en premier)
              return a.date.getTime() - b.date.getTime()
            } else if (!aIsUpcoming && !bIsUpcoming) {
              // Les deux sont passés : trier par date décroissante (plus récent en premier)
              return b.date.getTime() - a.date.getTime()
            } else {
              // Un est à venir, l'autre est passé : mettre les à venir en premier
              return aIsUpcoming ? -1 : 1
            }
          })

          setMatches(allMatches)
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              Matchs à Venir
              <span className="text-base font-normal text-gray-500 dark:text-gray-400">({upcomingMatches.length})</span>
            </h2>
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-4">
              {upcomingMatches.map((match, index) => {
                const isHomeTeam = teamId && (match.homeTeamId === teamId || match.awayTeamId === teamId)
                const getTeamInitials = (name: string) => {
                  const words = name.trim().split(/\s+/)
                  if (words.length >= 2) {
                    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
                  }
                  return name.substring(0, 2).toUpperCase()
                }
                
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-300"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>
                    
                    <div className="relative p-5 md:p-6">
                      {/* Header avec date et badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-base md:text-lg">
                              {match.date.toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long'
                              })}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{match.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {match.isPreseason && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-xs font-bold border border-orange-400/30 shadow-md flex items-center gap-1.5">
                              <Flame className="w-3.5 h-3.5" />
                              Preseason
                            </span>
                          )}
                          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-md">
                            À venir
                          </span>
                        </div>
                      </div>
                      
                      {/* Teams avec design amélioré */}
                      <div className="grid grid-cols-3 gap-4 items-center mb-5">
                        {/* Home Team */}
                        <div className="text-center">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl border-4 border-white dark:border-gray-800">
                            <span className="text-white font-bold text-lg md:text-xl">{getTeamInitials(match.homeTeam)}</span>
                          </div>
                          <p className={`font-bold text-gray-900 dark:text-white text-sm md:text-base ${teamId && match.homeTeamId === teamId ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {match.homeTeam}
                          </p>
                        </div>
                        
                        {/* VS Badge */}
                        <div className="flex justify-center">
                          <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white dark:border-gray-800">
                            <span className="text-white font-black text-sm md:text-base">VS</span>
                          </div>
                        </div>
                        
                        {/* Away Team */}
                        <div className="text-center">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl border-4 border-white dark:border-gray-800">
                            <span className="text-white font-bold text-lg md:text-xl">{getTeamInitials(match.awayTeam)}</span>
                          </div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                            {match.awayTeam}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-xl py-2.5 px-4">
                        <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium">{match.location}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-12 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Aucun match à venir</h3>
              <p className="text-gray-500 dark:text-gray-400">Vos prochains matchs apparaîtront ici</p>
            </motion.div>
          )}
        </div>

        {/* Past Matches */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              Matchs Passés
              <span className="text-base font-normal text-gray-500 dark:text-gray-400">({pastMatches.length})</span>
            </h2>
          </div>
          {pastMatches.length > 0 ? (
            <div className="space-y-4">
              {pastMatches.map((match, index) => {
                const isHomeTeam = teamId && (match.homeTeamId === teamId || match.awayTeamId === teamId)
                const homeWon = (match.homeScore ?? 0) > (match.awayScore ?? 0)
                const awayWon = (match.awayScore ?? 0) > (match.homeScore ?? 0)
                const getTeamInitials = (name: string) => {
                  const words = name.trim().split(/\s+/)
                  if (words.length >= 2) {
                    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
                  }
                  return name.substring(0, 2).toUpperCase()
                }
                
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-green-50/30 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm transition-all duration-300"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-emerald-500/0 to-teal-500/0 group-hover:from-green-500/5 group-hover:via-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-300"></div>
                    
                    <div className="relative p-5 md:p-6">
                      {/* Header avec date et badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-base md:text-lg">
                              {match.date.toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long'
                              })}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                              {match.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {match.isPreseason && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-xs font-bold border border-orange-400/30 shadow-md flex items-center gap-1.5">
                              <Flame className="w-3.5 h-3.5" />
                              Preseason
                            </span>
                          )}
                          <span className="px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg text-xs font-bold shadow-md">
                            Terminé
                          </span>
                        </div>
                      </div>
                      
                      {/* Teams avec scores */}
                      <div className="grid grid-cols-3 gap-4 items-center mb-5">
                        {/* Home Team */}
                        <div className="text-center">
                          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl border-4 border-white dark:border-gray-800 ${
                            homeWon ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            <span className="text-white font-bold text-lg md:text-xl">{getTeamInitials(match.homeTeam)}</span>
                          </div>
                          <p className={`font-bold text-sm md:text-base mb-2 ${homeWon ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                            {match.homeTeam}
                          </p>
                          <p className={`text-3xl md:text-4xl font-black ${homeWon ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                            {match.homeScore ?? 0}
                          </p>
                        </div>
                        
                        {/* Trophy Badge */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white dark:border-gray-800 mb-2">
                            <Trophy className="w-7 h-7 md:w-8 md:h-8 text-white" />
                          </div>
                          {match.isPreseason && match.penaltyShootout && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 text-center bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1">
                              TAB: {match.penaltyShootout.teamAScore} - {match.penaltyShootout.teamBScore}
                            </div>
                          )}
                        </div>
                        
                        {/* Away Team */}
                        <div className="text-center">
                          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl border-4 border-white dark:border-gray-800 ${
                            awayWon ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            <span className="text-white font-bold text-lg md:text-xl">{getTeamInitials(match.awayTeam)}</span>
                          </div>
                          <p className={`font-bold text-sm md:text-base mb-2 ${awayWon ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                            {match.awayTeam}
                          </p>
                          <p className={`text-3xl md:text-4xl font-black ${awayWon ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                            {match.awayScore ?? 0}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-xl py-2.5 px-4">
                        <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium">{match.location}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white via-white to-green-50/30 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-12 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Aucun match passé</h3>
              <p className="text-gray-500 dark:text-gray-400">Vos résultats de matchs apparaîtront ici</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
