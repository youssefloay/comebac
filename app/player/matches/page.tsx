"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar, Trophy, Clock, Flame } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { t } from '@/lib/i18n'
import type { PreseasonMatch } from '@/lib/types'

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
  isPreseason?: boolean
  penaltyShootout?: {
    teamAScore: number
    teamBScore: number
  }
}

export default function PlayerMatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    const loadMatches = async () => {
      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        console.log('🔍 Chargement des matchs pour le joueur:', user.email)
        
        // Trouver l'équipe du joueur
        const playerAccountsQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', user.email)
        )
        const playerAccountsSnap = await getDocs(playerAccountsQuery)

        if (playerAccountsSnap.empty) {
          console.log('⚠️ Aucun compte joueur trouvé pour:', user.email)
          setLoading(false)
          return
        }

        const playerData = playerAccountsSnap.docs[0].data()
        const playerTeamId = playerData.teamId
        console.log('✅ Équipe du joueur trouvée:', playerTeamId)
        setTeamId(playerTeamId)

        if (!playerTeamId) {
          console.log('⚠️ Aucune équipe associée au joueur')
          setLoading(false)
          return
        }

        // Charger tous les matchs réguliers
        const matchesSnap = await getDocs(collection(db, 'matches'))
        console.log('📊 Matchs réguliers chargés (avant filtrage):', matchesSnap.docs.length)
        
        // Charger les résultats des matchs
        const resultsSnap = await getDocs(collection(db, 'matchResults'))
        const resultsMap = new Map()
        resultsSnap.docs.forEach(doc => {
          const resultData = doc.data()
          resultsMap.set(resultData.matchId, resultData)
        })
        console.log('📊 Résultats chargés:', resultsMap.size)
        
        // Charger les matchs de preseason (comme dans le code du coach qui fonctionne)
        const preseasonRes = await fetch('/api/preseason/matches')
        const preseasonData = await preseasonRes.json()
        const preseasonMatches = (preseasonData.matches || []) as (PreseasonMatch & { teamALogo?: string; teamBLogo?: string })[]
        console.log('📊 Matchs preseason chargés (tous):', preseasonMatches.length)
        
        // Charger les équipes
        const teamsSnap = await getDocs(collection(db, 'teams'))
        const teamsMap = new Map()
        teamsSnap.docs.forEach(doc => {
          teamsMap.set(doc.id, doc.data().name)
        })
        console.log('📊 Équipes chargées:', teamsMap.size)

        // Filtrer les matchs réguliers de l'équipe du joueur (exclure les matchs de test)
        const regularMatches: Match[] = matchesSnap.docs
          .filter(doc => {
            const data = doc.data()
            // Exclure les matchs de test
            if (data.isTest === true) return false
            // Filtrer par équipe du joueur
            return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId
          })
          .map(doc => {
            const data = doc.data()
            const matchId = doc.id
            const result = resultsMap.get(matchId)
            
            // Convertir la date Firestore
            let matchDate = new Date()
            if (data.date) {
              if (data.date.toDate) {
                matchDate = data.date.toDate()
              } else if (data.date.seconds) {
                matchDate = new Date(data.date.seconds * 1000)
              } else if (typeof data.date === 'string') {
                matchDate = new Date(data.date)
              }
            }
            
            return {
              id: matchId,
              homeTeamId: data.homeTeamId,
              awayTeamId: data.awayTeamId,
              homeTeam: teamsMap.get(data.homeTeamId) || 'Équipe inconnue',
              awayTeam: teamsMap.get(data.awayTeamId) || 'Équipe inconnue',
              date: matchDate,
              homeTeamScore: result?.homeTeamScore ?? data.homeTeamScore,
              awayTeamScore: result?.awayTeamScore ?? data.awayTeamScore,
              status: data.status || 'scheduled',
              round: data.round || 0,
              isPreseason: false
            }
          })
        
        console.log('✅ Matchs réguliers filtrés pour l\'équipe:', regularMatches.length)

        // Filtrer les matchs de preseason de l'équipe du joueur (comme dans le code du coach)
        const preseasonTeamMatches: Match[] = preseasonMatches
          .filter(match => match.teamAId === playerTeamId || match.teamBId === playerTeamId)
          .map(match => {
            // Convertir le statut preseason au statut match régulier
            let status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' = 'scheduled'
            if (match.status === 'finished') {
              status = 'completed'
            } else if (match.status === 'in_progress') {
              status = 'in_progress'
            } else if (match.status === 'upcoming') {
              status = 'scheduled'
            }
            
            // Créer une date complète avec date + time (comme dans le code du coach)
            const matchDate = new Date(match.date)
            if (match.time) {
              const [hours, minutes] = match.time.split(':').map(Number)
              if (!isNaN(hours) && !isNaN(minutes)) {
                matchDate.setHours(hours, minutes, 0, 0)
              }
            }
            
            return {
              id: match.id,
              homeTeamId: match.teamAId,
              awayTeamId: match.teamBId,
              homeTeam: match.teamAName,
              awayTeam: match.teamBName,
              date: matchDate,
              homeTeamScore: match.scoreA,
              awayTeamScore: match.scoreB,
              status: status,
              round: 0, // Preseason n'a pas de round
              isPreseason: true,
              penaltyShootout: match.penaltyShootout ? {
                teamAScore: match.penaltyShootout.teamAPlayers?.filter(p => p.scored).length || 0,
                teamBScore: match.penaltyShootout.teamBPlayers?.filter(p => p.scored).length || 0
              } : undefined
            }
          })
        
        console.log('✅ Matchs preseason filtrés pour l\'équipe:', preseasonTeamMatches.length)
        if (preseasonTeamMatches.length > 0) {
          console.log('📊 Détails des matchs preseason filtrés:', preseasonTeamMatches.map(m => ({
            id: m.id,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            status: m.status,
            date: m.date
          })))
        }

        // Combiner et trier tous les matchs
        const allMatches = [...regularMatches, ...preseasonTeamMatches]
          .sort((a, b) => b.date.getTime() - a.date.getTime())

        console.log('✅ Total matchs pour le joueur:', allMatches.length)
        console.log('📊 Répartition:', {
          regular: regularMatches.length,
          preseason: preseasonTeamMatches.length,
          total: allMatches.length
        })
        setMatches(allMatches)
      } catch (error) {
        console.error('❌ Erreur lors du chargement des matchs:', error)
        console.error('Détails:', error instanceof Error ? error.message : 'Erreur inconnue')
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

  // Filtrer les matchs à venir (scheduled ou in_progress)
  const upcomingMatches = matches.filter(m => 
    m.status === 'scheduled' || m.status === 'in_progress'
  )
  // Filtrer les matchs terminés
  const completedMatches = matches.filter(m => m.status === 'completed')
  
  // Debug: Log pour comprendre pourquoi aucun match
  console.log('🔍 État final des matchs:', {
    total: matches.length,
    upcoming: upcomingMatches.length,
    completed: completedMatches.length,
    preseason: matches.filter(m => m.isPreseason).length,
    regular: matches.filter(m => !m.isPreseason).length,
    teamId: teamId
  })

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
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">{t('player.matches.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{t('player.matches.subtitle')}</p>
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
            {t('player.matches.upcoming')} ({upcomingMatches.length})
          </h2>
          
          {upcomingMatches.length === 0 ? (
            <div className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-xl text-center">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">{t('player.matches.noUpcoming')}</p>
              {matches.length === 0 && teamId && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {t('player.matches.checkConsole')}
                </p>
              )}
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
                    href={match.isPreseason ? `/preseason` : `/player/matches/${match.id}`}
                    className="block bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 md:p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all backdrop-blur-xl cursor-pointer"
                  >
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      {match.status === 'in_progress' && (
                        <span className="px-3 py-1 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-400 rounded-full text-sm font-semibold border border-red-200 dark:border-red-800 flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          {t('player.matches.live')}
                        </span>
                      )}
                      {match.isPreseason && (
                        <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-semibold border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          Preseason
                        </span>
                      )}
                      {!match.isPreseason && match.round > 0 && (
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold border border-blue-200 dark:border-blue-800">
                          Journée {match.round}
                        </span>
                      )}
                    </div>
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
            {t('player.matches.completed')} ({completedMatches.length})
          </h2>
          
          {completedMatches.length === 0 ? (
            <div className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-xl text-center">
              <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">{t('player.matches.noCompleted')}</p>
              {matches.length === 0 && teamId && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {t('player.matches.checkConsole')}
                </p>
              )}
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
                    href={match.isPreseason ? `/preseason` : `/player/matches/${match.id}`}
                    className="block bg-gradient-to-br from-white via-white to-green-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 md:p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all backdrop-blur-xl cursor-pointer"
                  >
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      {match.isPreseason && (
                        <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-semibold border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {t('player.matches.preseason')}
                        </span>
                      )}
                      {!match.isPreseason && match.round > 0 && (
                        <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold border border-green-200 dark:border-green-800">
                          {t('player.matches.round')} {match.round}
                        </span>
                      )}
                    </div>
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
                      {match.isPreseason && match.penaltyShootout && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                          TAB: {match.penaltyShootout.teamAScore} - {match.penaltyShootout.teamBScore}
                        </div>
                      )}
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
