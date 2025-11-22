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
  Target
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
        const [teamsSnap, playersSnap, matchesSnap, statsSnap, resultsSnap] = await Promise.all([
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'players')),
          getDocs(collection(db, 'matches')),
          getDocs(query(collection(db, 'teamStatistics'), orderBy('points', 'desc'))),
          getDocs(collection(db, 'matchResults'))
        ])
        
        
        const teamsData = teamsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[]
        
        const allPlayers = playersSnap.docs.map(doc => doc.data())
        
        // Add player counts to teams
        let teamsWithPlayerCounts = teamsData.map(team => ({
          ...team,
          playerCount: allPlayers.filter(player => player.teamId === team.id).length
        }))
        
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
      {/* Compact Hero Section */}
      <div className="relative overflow-hidden hero-section">
        <div className="absolute inset-0 bg-gradient-to-br from-sofa-bg-secondary via-sofa-bg-tertiary to-sofa-bg-card"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-sofa-text-primary">
              {t('home.title')}
            </h1>
            <p className="text-sm sm:text-base text-sofa-text-secondary mb-6 max-w-xl mx-auto">
              {t('home.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Priority 1: Featured Match (Live or Next) */}
        {featuredMatch && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-sofa-text-primary flex items-center gap-3">
                {liveMatch ? (
                  <>
                    <div className="w-3 h-3 bg-sofa-red rounded-full animate-pulse"></div>
                    {t('home.liveMatch')}
                  </>
                ) : (
                  <>
                    <Clock className="w-6 h-6 text-sofa-blue" />
                    {t('home.nextMatch')}
                  </>
                )}
              </h2>
              <Link href="/public/matches" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                {t('home.allMatches')} →
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

        {/* Priority 2: Top 3 Teams Podium */}
        {topThreeTeams.length >= 3 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-sofa-text-primary flex items-center gap-3">
                <Trophy className="w-6 h-6 text-sofa-green" />
                {t('home.podium')}
              </h2>
              <Link href="/public/ranking" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                {t('home.fullRanking')} →
              </Link>
            </div>
            
            {/* Podium Layout */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto overflow-visible">
              {/* 2nd Place */}
              <div className="order-1 pt-8" style={{ overflow: 'visible' }}>
                <div className="sofa-card p-4 text-center relative bg-gradient-to-br from-sofa-bg-card to-sofa-bg-secondary" style={{ overflow: 'visible' }}>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-sm z-50 shadow-xl border-2 border-white">
                    2
                  </div>
                  <div className="mb-3">
                    {topThreeTeams[1].teamLogo ? (
                      <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-sofa-bg-secondary border-2 border-gray-400">
                        <img 
                          src={topThreeTeams[1].teamLogo} 
                          alt={topThreeTeams[1].teamName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">🥈</div>'
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-4xl">🥈</div>
                    )}
                  </div>
                  <TeamLink 
                    teamId={topThreeTeams[1].teamId} 
                    teamName={topThreeTeams[1].teamName}
                    className="font-semibold text-sofa-text-primary hover:text-sofa-text-accent transition-colors text-sm block mb-2"
                  />
                  <div className="text-lg font-bold text-sofa-text-accent">{topThreeTeams[1].points} pts</div>
                  <div className="text-xs text-sofa-text-muted">
                    {topThreeTeams[1].wins}V - {topThreeTeams[1].draws}N - {topThreeTeams[1].losses}D
                  </div>
                  <div className="text-xs text-sofa-text-muted mt-1">
                    Diff: {topThreeTeams[1].goalDifference > 0 ? '+' : ''}{topThreeTeams[1].goalDifference}
                  </div>
                </div>
              </div>
              
              {/* 1st Place */}
              <div className="order-2" style={{ overflow: 'visible' }}>
                <div className="sofa-card p-4 text-center relative bg-gradient-to-br from-sofa-green/10 to-sofa-bg-secondary" style={{ overflow: 'visible' }}>
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-full flex items-center justify-center font-bold z-50 shadow-xl border-2 border-white">
                    1
                  </div>
                  <div className="mb-3">
                    {topThreeTeams[0].teamLogo ? (
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-sofa-bg-secondary border-2 border-sofa-green">
                        <img 
                          src={topThreeTeams[0].teamLogo} 
                          alt={topThreeTeams[0].teamName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-sofa-green text-2xl font-bold">👑</div>'
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-5xl">👑</div>
                    )}
                  </div>
                  <TeamLink 
                    teamId={topThreeTeams[0].teamId} 
                    teamName={topThreeTeams[0].teamName}
                    className="font-bold text-sofa-text-primary hover:text-sofa-text-accent transition-colors block mb-2"
                  />
                  <div className="text-xl font-bold text-sofa-green">{topThreeTeams[0].points} pts</div>
                  <div className="text-xs text-sofa-text-muted">
                    {topThreeTeams[0].wins}V - {topThreeTeams[0].draws}N - {topThreeTeams[0].losses}D
                  </div>
                  <div className="text-xs text-sofa-text-muted mt-1">
                    Diff: {topThreeTeams[0].goalDifference > 0 ? '+' : ''}{topThreeTeams[0].goalDifference}
                  </div>
                </div>
              </div>
              
              {/* 3rd Place */}
              <div className="order-3 pt-12" style={{ overflow: 'visible' }}>
                <div className="sofa-card p-4 text-center relative bg-gradient-to-br from-sofa-bg-card to-sofa-bg-secondary" style={{ overflow: 'visible' }}>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm z-50 shadow-xl border-2 border-white">
                    3
                  </div>
                  <div className="mb-3">
                    {topThreeTeams[2].teamLogo ? (
                      <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-sofa-bg-secondary border-2 border-orange-500">
                        <img 
                          src={topThreeTeams[2].teamLogo} 
                          alt={topThreeTeams[2].teamName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-orange-500 text-lg font-bold">🥉</div>'
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-4xl">🥉</div>
                    )}
                  </div>
                  <TeamLink 
                    teamId={topThreeTeams[2].teamId} 
                    teamName={topThreeTeams[2].teamName}
                    className="font-semibold text-sofa-text-primary hover:text-sofa-text-accent transition-colors text-sm block mb-2"
                  />
                  <div className="text-lg font-bold text-sofa-text-accent">{topThreeTeams[2].points} pts</div>
                  <div className="text-xs text-sofa-text-muted">
                    {topThreeTeams[2].wins}V - {topThreeTeams[2].draws}N - {topThreeTeams[2].losses}D
                  </div>
                  <div className="text-xs text-sofa-text-muted mt-1">
                    Diff: {topThreeTeams[2].goalDifference > 0 ? '+' : ''}{topThreeTeams[2].goalDifference}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Priority 3: Quick Stats - More Compact */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-sofa-text-primary mb-4">{t('home.leagueStats')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <SofaStatCard
              title={t('home.teamsCount')}
              value={stats.teams}
              icon={Users}
              color="blue"
              index={0}
            />
            <SofaStatCard
              title={t('nav.matches')}
              value={stats.matches}
              icon={Calendar}
              color="green"
              index={1}
            />
            <SofaStatCard
              title={t('stats.goals')}
              value={stats.goals}
              icon={Target}
              color="purple"
              index={2}
            />
            <SofaStatCard
              title={t('match.completed')}
              value={stats.completed}
              icon={Trophy}
              color="orange"
              index={3}
            />
          </div>
        </motion.section>

        {/* Priority 4: Recent Results - Compact List */}
        {recentMatches.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-sofa-text-primary flex items-center gap-3">
                <Trophy className="w-5 h-5 text-sofa-green" />
                {t('matches.lastResults')}
              </h2>
              <Link href="/public/matches" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                {t('matches.allResults')} →
              </Link>
            </div>
            
            {/* Compact Results List */}
            <div className="sofa-card p-4 space-y-3">
              {recentMatches.slice(0, 3).map((match, index) => (
                <motion.div 
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between py-2 border-b border-sofa-border last:border-b-0"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-sm font-medium text-sofa-text-primary">
                      {match.homeTeam?.name} vs {match.awayTeam?.name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-bold text-sofa-text-primary">
                      {match.homeTeamScore} - {match.awayTeamScore}
                    </div>
                    <div className="text-xs text-sofa-text-muted">
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

        {/* Priority 5: Upcoming Matches - Compact */}
        {upcomingMatches.length > 1 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-sofa-text-primary flex items-center gap-3">
                <Calendar className="w-5 h-5 text-sofa-blue" />
                {t('matches.upcomingMatches')}
              </h2>
              <Link href="/public/matches" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                {t('matches.fullSchedule')} →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingMatches.slice(1, 5).map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
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

        {/* Priority 6: Teams Overview - Simplified */}
        {teams.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-sofa-text-primary flex items-center gap-3">
                <Users className="w-5 h-5 text-sofa-blue" />
                {t('home.teamsCount')} ({teams.length})
              </h2>
              <Link href="/public/teams" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                {t('teams.viewAll')} →
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {teams.slice(0, 4).map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
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
