"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { SofaMatchCard } from '@/components/sofa/match-card'
import { SofaStatCard } from '@/components/sofa/stat-card'
import { SofaTeamCard } from '@/components/sofa/team-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { t } from '@/lib/i18n'
import { AdBanner } from '@/components/ads/AdBanner'
import { getParticipatingTeamIds, filterParticipatingTeams } from '@/lib/tournament-utils'
import { TeamLink } from '@/components/ui/team-link'
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Users, 
  Target,
  UserPlus
} from 'lucide-react'

interface Match {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeam?: { name: string }
  awayTeam?: { name: string }
  date: Date
  homeTeamScore?: number
  awayTeamScore?: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  round: number
  result?: any
  isTest?: boolean
}

interface Team {
  id: string
  name: string
  logo?: string
  color?: string
  playerCount?: number
  school?: string
  schoolName?: string
}

interface Standing {
  id: string
  teamId: string
  teamName: string
  points: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  matchesPlayed: number
  goalDifference: number
  teamLogo?: string
}

export default function PublicHome() {
  const [todayMatches, setTodayMatches] = useState<Match[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [standings, setStandings] = useState<Standing[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [stats, setStats] = useState({ teams: 0, matches: 0, goals: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        
        // Charger toutes les données en parallèle pour améliorer les performances
        const [teamsSnap, playersSnap, playerAccountsSnap, coachAccountsSnap, matchesSnap, statsSnap, resultsSnap] = await Promise.all([
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'players')),
          getDocs(collection(db, 'playerAccounts')),
          getDocs(collection(db, 'coachAccounts')),
          getDocs(collection(db, 'matches')),
          getDocs(query(collection(db, 'teamStatistics'), orderBy('points', 'desc'))),
          getDocs(collection(db, 'matchResults'))
        ])
        
        
        const teamsData = teamsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[]
        
        const allPlayers = playersSnap.docs.map(doc => doc.data())
        const allPlayerAccounts = playerAccountsSnap.docs.map(doc => doc.data())
        const allCoachAccounts = coachAccountsSnap.docs.map(doc => doc.data())
        
        // Créer un Set des emails des entraîneurs pour exclusion rapide
        const coachEmails = new Set(allCoachAccounts.map((coach: any) => coach.email))
        
        // Add player counts to teams - exclure les entraîneurs
        let teamsWithPlayerCounts = teamsData.map(team => {
          // Compter uniquement les playerAccounts qui ne sont pas des entraîneurs
          const teamPlayerAccounts = allPlayerAccounts.filter((account: any) => 
            account.teamId === team.id && 
            !coachEmails.has(account.email) && 
            !account.isActingCoach
          )
          
          return {
            ...team,
            playerCount: teamPlayerAccounts.length
          }
        })
        
        // Filtrer pour ne garder que les équipes participantes (pages publiques uniquement)
        const participatingTeamIds = await getParticipatingTeamIds()
        if (participatingTeamIds) {
          teamsWithPlayerCounts = filterParticipatingTeams(teamsWithPlayerCounts, participatingTeamIds)
        }
        
        setTeams(teamsWithPlayerCounts)

        // Create teams map for match display
        const teamsMap = new Map()
        teamsData.forEach(team => {
          teamsMap.set(team.id, team)
        })
        const allMatches = matchesSnap.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            homeTeamId: data.homeTeamId,
            awayTeamId: data.awayTeamId,
            date: data.date?.toDate() || new Date(),
            round: data.round || 1,
            status: data.status || 'scheduled',
            homeTeam: teamsMap.get(data.homeTeamId),
            awayTeam: teamsMap.get(data.awayTeamId),
            isTest: data.isTest || false
          }
        }) as Match[]

        // Filtrer les matchs de test et les finales non publiées (ne pas les afficher publiquement)
        const publicMatches = allMatches.filter(match => {
          if (match.isTest) return false
          // Si c'est une finale, vérifier qu'elle est publiée
          if ((match as any).isFinal && !(match as any).isPublished) return false
          return true
        })

        // Process match results (déjà chargés en parallèle)
        const resultsMap = new Map()
        let totalGoals = 0
        resultsSnap.docs.forEach(doc => {
          const result = doc.data()
          resultsMap.set(result.matchId, result)
          totalGoals += (result.homeTeamScore || 0) + (result.awayTeamScore || 0)
        })

        // Combine matches with results
        const matchesWithResults = allMatches.map(match => ({
          ...match,
          result: resultsMap.get(match.id),
          homeTeamScore: resultsMap.get(match.id)?.homeTeamScore,
          awayTeamScore: resultsMap.get(match.id)?.awayTeamScore
        }))

        // Filter matches
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

        // Matchs d'aujourd'hui - trier par heure croissante (le plus proche en premier)
        const todayMatchesFiltered = matchesWithResults
          .filter(match => match.date >= todayStart && match.date < todayEnd)
          .sort((a, b) => a.date.getTime() - b.date.getTime())
        
        // Matchs à venir - trier par date/heure croissante (le plus proche en premier)
        const upcomingMatchesFiltered = matchesWithResults
          .filter(match => match.date > todayEnd && match.status === 'scheduled')
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, 6)

        // Matchs récents - trier par date décroissante (les plus récents en premier)
        const recentMatchesFiltered = matchesWithResults
          .filter(match => match.status === 'completed')
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 6)

        setTodayMatches(todayMatchesFiltered)
        setUpcomingMatches(upcomingMatchesFiltered)
        setRecentMatches(recentMatchesFiltered)

        // Process standings from teamStatistics (déjà chargés en parallèle)
        // Remove duplicates by keeping only the best entry per team
        const teamStatsMap = new Map()
        
        statsSnap.docs.forEach(doc => {
          const data = doc.data()
          const existing = teamStatsMap.get(data.teamId)
          
          if (!existing) {
            teamStatsMap.set(data.teamId, { id: doc.id, ...data })
          } else {
            // Keep the one with higher points, or more recent updatedAt
            const shouldReplace = 
              (data.points || 0) > (existing.points || 0) ||
              ((data.points || 0) === (existing.points || 0) && 
               (data.updatedAt?.toDate?.() || new Date(data.updatedAt || 0)) > 
               (existing.updatedAt?.toDate?.() || new Date(existing.updatedAt || 0)))
            
            if (shouldReplace) {
              teamStatsMap.set(data.teamId, { id: doc.id, ...data })
            }
          }
        })
        
        const uniqueStats = Array.from(teamStatsMap.values())
        
        const standingsData = uniqueStats
          .map(data => {
            const team = teamsMap.get(data.teamId)
            const goalDifference = (data.goalsFor || 0) - (data.goalsAgainst || 0)
            return {
              ...data,
              teamName: team?.name || 'Équipe inconnue',
              goalDifference: goalDifference,
              teamLogo: team?.logo
            }
          })
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            const aDiff = a.goalDifference
            const bDiff = b.goalDifference
            return bDiff - aDiff
          }) as Standing[]
          
        setStandings(standingsData.slice(0, 6)) // Top 6 teams

        // Set stats
        setStats({
          teams: teamsData.length,
          matches: allMatches.length,
          goals: totalGoals,
          completed: matchesWithResults.filter(m => m.status === 'completed').length
        })
        
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error)
        console.error('Détails de l\'erreur:', error instanceof Error ? error.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const convertMatchFormat = (match: Match) => ({
    id: match.id,
    teamA: match.homeTeam?.name || t('home.unknownTeam'),
    teamB: match.awayTeam?.name || t('home.unknownTeam'),
    teamAId: match.homeTeamId,
    teamBId: match.awayTeamId,
    date: match.date,
    scoreA: match.homeTeamScore,
    scoreB: match.awayTeamScore,
    status: match.status === 'completed' ? 'completed' as const : 
            match.status === 'in_progress' ? 'live' as const :
            'upcoming' as const,
    venue: `${t('home.stadium')} ${match.homeTeam?.name || t('home.unknownTeam')}`,
    round: match.round
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // Get next match (most important info)
  // Priorité 1: Match en cours aujourd'hui
  const liveMatch = todayMatches.find(match => match.status === 'in_progress')
  
  // Priorité 2: Prochain match d'aujourd'hui (programmé mais pas encore commencé)
  const nextTodayMatch = todayMatches.find(match => match.status === 'scheduled')
  
  // Priorité 3: Prochain match à venir (après aujourd'hui)
  const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null
  
  // Le match en vedette est le match en cours, ou le prochain match d'aujourd'hui, ou le prochain match à venir
  const featuredMatch = liveMatch || nextTodayMatch || nextMatch

  // Get top 3 teams for podium display
  const topThreeTeams = standings.slice(0, 3)

  return (
    <div className="space-y-6 pb-8">
      {/* Modern Hero Section 2025 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-emerald-600/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent"
            >
              {t('home.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
            >
              {t('home.subtitle')}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register-team">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Inscrire une Équipe</span>
                </motion.button>
              </Link>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Aucun compte requis
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Priority 1: Featured Match (Live or Next) - Modern 2025 */}
        {featuredMatch && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {liveMatch ? (
                  <>
                    <div className="relative">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('home.liveMatch')}
                    </h2>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('home.nextMatch')}
                    </h2>
                  </>
                )}
              </div>
              <Link 
                href="/public/matches" 
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('home.allMatches')}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            
            <div className="max-w-2xl">
              <SofaMatchCard 
                match={convertMatchFormat(featuredMatch)} 
                index={0} 
              />
            </div>
          </motion.section>
        )}

        {/* Priority 2: Top 3 Teams Podium - Modern 2025 */}
        {topThreeTeams.length >= 3 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('home.podium')}
              </h2>
              </div>
              <Link 
                href="/public/ranking" 
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('home.fullRanking')}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            
            {/* Podium Layout - Modern 2025 */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto overflow-visible">
              {/* 2nd Place */}
              <motion.div 
                className="order-1 pt-8" 
                style={{ overflow: 'visible' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 via-gray-100/50 to-white dark:from-gray-800/50 dark:via-gray-700/30 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center" style={{ overflow: 'visible' }}>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-full flex items-center justify-center font-bold text-sm z-50 shadow-xl border-2 border-white">
                    2
                  </div>
                  <div className="mb-4 flex justify-center">
                    {topThreeTeams[1].teamLogo ? (
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-lg flex items-center justify-center">
                        <img 
                          src={topThreeTeams[1].teamLogo} 
                          alt={topThreeTeams[1].teamName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">🥈</div>'
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-5xl flex items-center justify-center">🥈</div>
                    )}
                  </div>
                  <TeamLink 
                    teamId={topThreeTeams[1].teamId} 
                    teamName={topThreeTeams[1].teamName}
                    className="font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm block mb-3"
                  />
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">{topThreeTeams[1].points} pts</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {topThreeTeams[1].wins}V - {topThreeTeams[1].draws}N - {topThreeTeams[1].losses}D
                  </div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-500">
                    Diff: {topThreeTeams[1].goalDifference > 0 ? '+' : ''}{topThreeTeams[1].goalDifference}
                  </div>
                </div>
              </motion.div>
              
              {/* 1st Place */}
              <motion.div 
                className="order-2" 
                style={{ overflow: 'visible' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + 0.15 }}
                whileHover={{ y: -4 }}
              >
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50 via-amber-50/50 to-white dark:from-yellow-900/20 dark:via-amber-900/10 dark:to-gray-900 border-2 border-yellow-300/50 dark:border-yellow-700/30 backdrop-blur-sm p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-center" style={{ overflow: 'visible' }}>
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-base z-50 shadow-xl border-2 border-white">
                    1
                  </div>
                  <div className="mb-4 flex justify-center">
                    {topThreeTeams[0].teamLogo ? (
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 shadow-xl flex items-center justify-center">
                        <img 
                          src={topThreeTeams[0].teamLogo} 
                          alt={topThreeTeams[0].teamName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-yellow-600 text-3xl font-bold">👑</div>'
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-6xl flex items-center justify-center">👑</div>
                    )}
                  </div>
                  <TeamLink 
                    teamId={topThreeTeams[0].teamId} 
                    teamName={topThreeTeams[0].teamName}
                    className="font-bold text-gray-900 dark:text-white hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors block mb-3 text-base"
                  />
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{topThreeTeams[0].points} pts</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {topThreeTeams[0].wins}V - {topThreeTeams[0].draws}N - {topThreeTeams[0].losses}D
                  </div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-500">
                    Diff: {topThreeTeams[0].goalDifference > 0 ? '+' : ''}{topThreeTeams[0].goalDifference}
                  </div>
                </div>
              </motion.div>
              
              {/* 3rd Place */}
              <motion.div 
                className="order-3 pt-12" 
                style={{ overflow: 'visible' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + 0.2 }}
                whileHover={{ y: -4 }}
              >
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50/50 to-white dark:from-orange-900/20 dark:via-amber-900/10 dark:to-gray-900 border border-orange-200/50 dark:border-orange-700/30 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center" style={{ overflow: 'visible' }}>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm z-50 shadow-xl border-2 border-white">
                    3
                  </div>
                  <div className="mb-4 flex justify-center">
                    {topThreeTeams[2].teamLogo ? (
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-400 dark:border-orange-600 shadow-lg flex items-center justify-center">
                        <img 
                          src={topThreeTeams[2].teamLogo} 
                          alt={topThreeTeams[2].teamName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-orange-500 text-2xl font-bold">🥉</div>'
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-5xl flex items-center justify-center">🥉</div>
                    )}
                  </div>
                  <TeamLink 
                    teamId={topThreeTeams[2].teamId} 
                    teamName={topThreeTeams[2].teamName}
                    className="font-semibold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-sm block mb-3"
                  />
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">{topThreeTeams[2].points} pts</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {topThreeTeams[2].wins}V - {topThreeTeams[2].draws}N - {topThreeTeams[2].losses}D
                  </div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-500">
                    Diff: {topThreeTeams[2].goalDifference > 0 ? '+' : ''}{topThreeTeams[2].goalDifference}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* Priority 3: League Stats - Modern 2025 Design */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-sofa-text-primary mb-1">{t('home.leagueStats')}</h2>
              <p className="text-sm text-sofa-text-secondary">Vue d'ensemble de la ligue</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Teams Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + 0.1 * 0 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-blue-100/50 to-white dark:from-blue-950/20 dark:via-blue-900/10 dark:to-gray-900 border border-blue-200/50 dark:border-blue-800/30 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:shadow-blue-500/50 transition-shadow duration-300">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + 0.1 * 0 + 0.2 }}
                      className="text-3xl font-bold text-blue-600 dark:text-blue-400"
                    >
                      {stats.teams}
                    </motion.div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('home.teamsCount')}</div>
              </div>
            </motion.div>

            {/* Matches Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + 0.1 * 1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-white dark:from-emerald-950/20 dark:via-emerald-900/10 dark:to-gray-900 border border-emerald-200/50 dark:border-emerald-800/30 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg group-hover:shadow-emerald-500/50 transition-shadow duration-300">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + 0.1 * 1 + 0.2 }}
                      className="text-3xl font-bold text-emerald-600 dark:text-emerald-400"
                    >
                      {stats.matches}
                    </motion.div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('nav.matches')}</div>
              </div>
            </motion.div>

            {/* Goals Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + 0.1 * 2 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-purple-100/50 to-white dark:from-purple-950/20 dark:via-purple-900/10 dark:to-gray-900 border border-purple-200/50 dark:border-purple-800/30 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:shadow-purple-500/50 transition-shadow duration-300">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + 0.1 * 2 + 0.2 }}
                      className="text-3xl font-bold text-purple-600 dark:text-purple-400"
                    >
                      {stats.goals}
                    </motion.div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('stats.goals')}</div>
              </div>
            </motion.div>

            {/* Completed Matches Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + 0.1 * 3 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-amber-100/50 to-white dark:from-amber-950/20 dark:via-amber-900/10 dark:to-gray-900 border border-amber-200/50 dark:border-amber-800/30 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg group-hover:shadow-orange-500/50 transition-shadow duration-300">
                    <Trophy className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + 0.1 * 3 + 0.2 }}
                      className="text-3xl font-bold text-amber-600 dark:text-amber-400"
                    >
                      {stats.completed}
                    </motion.div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('match.completed')}</div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Priority 4: Recent Results - Modern 2025 */}
        {recentMatches.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('matches.lastResults')}
              </h2>
              </div>
              <Link 
                href="/public/matches" 
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('matches.allResults')}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            
            {/* Modern Results List */}
            <div className="rounded-2xl bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm p-6 shadow-lg space-y-4">
              {recentMatches.slice(0, 3).map((match, index) => (
                <motion.div 
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/30 dark:to-transparent border border-gray-200/30 dark:border-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {match.homeTeam?.name} <span className="text-gray-500 dark:text-gray-400">vs</span> {match.awayTeam?.name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {match.homeTeamScore} - {match.awayTeamScore}
                    </div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                      {new Intl.DateTimeFormat('fr-FR', { 
                        day: 'numeric', 
                        month: 'short' 
                      }).format(match.date)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Priority 5: Upcoming Matches - Modern 2025 */}
        {upcomingMatches.length > 1 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('matches.upcomingMatches')}
                </h2>
              </div>
              <Link 
                href="/public/matches" 
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('matches.fullSchedule')}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingMatches.slice(1, 5).map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <SofaMatchCard 
                    match={convertMatchFormat(match)} 
                    index={index} 
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Priority 6: Teams Overview - Modern 2025 */}
        {teams.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('home.teamsCount')} <span className="text-gray-500 dark:text-gray-400">({teams.length})</span>
                </h2>
              </div>
              <Link 
                href="/public/teams" 
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('teams.viewAll')}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {teams.slice(0, 4).map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <SofaTeamCard 
                    team={{
                      id: team.id,
                      name: team.name,
                      color: team.color,
                      playerCount: team.playerCount || 0,
                      logo: team.logo,
                      school: team.school,
                      schoolName: team.schoolName
                    }} 
                    index={index} 
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Publicité discrète en bas de page */}
        <div className="pt-8">
          <AdBanner slot="1234567890" format="auto" style="horizontal" className="opacity-75" />
        </div>

      </div>
    </div>
  )
}
