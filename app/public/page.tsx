"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { SofaMatchCard } from '@/components/sofa/match-card'
import { SofaStatCard } from '@/components/sofa/stat-card'
import { SofaTeamCard } from '@/components/sofa/team-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'
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
}

interface Team {
  id: string
  name: string
  logo?: string
  color?: string
  playerCount?: number
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
        console.log('🔄 Chargement des données...')
        
        // Load teams with player counts
        console.log('📊 Chargement des équipes...')
        const teamsSnap = await getDocs(collection(db, 'teams'))
        const teamsData = teamsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[]
        console.log(`✅ ${teamsData.length} équipes chargées`)

        // Load all players to count them per team
        console.log('👥 Chargement des joueurs...')
        const playersSnap = await getDocs(collection(db, 'players'))
        const allPlayers = playersSnap.docs.map(doc => doc.data())
        console.log(`✅ ${allPlayers.length} joueurs chargés`)
        
        // Add player counts to teams
        const teamsWithPlayerCounts = teamsData.map(team => ({
          ...team,
          playerCount: allPlayers.filter(player => player.teamId === team.id).length
        }))
        
        setTeams(teamsWithPlayerCounts)

        // Create teams map for match display
        const teamsMap = new Map()
        teamsData.forEach(team => {
          teamsMap.set(team.id, team)
        })

        // Load all matches
        console.log('⚽ Chargement des matchs...')
        const matchesSnap = await getDocs(collection(db, 'matches'))
        console.log(`✅ ${matchesSnap.docs.length} matchs trouvés`)
        const allMatches = matchesSnap.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate() || new Date(),
            homeTeam: teamsMap.get(data.homeTeamId),
            awayTeam: teamsMap.get(data.awayTeamId)
          }
        }) as Match[]

        // Trier les matchs par date côté client
        allMatches.sort((a, b) => b.date.getTime() - a.date.getTime())

        // Load match results
        console.log('🏆 Chargement des résultats...')
        const resultsSnap = await getDocs(collection(db, 'matchResults'))
        console.log(`✅ ${resultsSnap.docs.length} résultats trouvés`)
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

        const todayMatchesFiltered = matchesWithResults.filter(match => 
          match.date >= todayStart && match.date < todayEnd
        )
        
        const upcomingMatchesFiltered = matchesWithResults
          .filter(match => match.date > todayEnd && match.status === 'scheduled')
          .slice(0, 6)

        const recentMatchesFiltered = matchesWithResults
          .filter(match => match.status === 'completed')
          .slice(0, 6)

        setTodayMatches(todayMatchesFiltered)
        setUpcomingMatches(upcomingMatchesFiltered)
        setRecentMatches(recentMatchesFiltered)

        // Load standings from teamStatistics (with duplicate filtering)
        const statsSnap = await getDocs(query(collection(db, 'teamStatistics'), orderBy('points', 'desc')))
        
        console.log(`[Public Home] Raw statistics count: ${statsSnap.docs.length}`)
        
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
              console.log(`[Public Home] Replacing duplicate stats for team ${data.teamId}`)
              teamStatsMap.set(data.teamId, { id: doc.id, ...data })
            }
          }
        })
        
        const uniqueStats = Array.from(teamStatsMap.values())
        console.log(`[Public Home] Unique statistics count: ${uniqueStats.length}`)
        
        const standingsData = uniqueStats
          .map(data => {
            const team = teamsMap.get(data.teamId)
            return {
              ...data,
              teamName: team?.name || 'Équipe inconnue'
            }
          })
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            const aDiff = a.goalsFor - a.goalsAgainst
            const bDiff = b.goalsFor - b.goalsAgainst
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

        console.log('✅ Toutes les données chargées avec succès')
        
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
    teamA: match.homeTeam?.name || 'Équipe inconnue',
    teamB: match.awayTeam?.name || 'Équipe inconnue',
    teamAId: match.homeTeamId,
    teamBId: match.awayTeamId,
    date: match.date,
    scoreA: match.homeTeamScore,
    scoreB: match.awayTeamScore,
    status: match.status === 'completed' ? 'completed' as const : 
            match.status === 'in_progress' ? 'live' as const :
            'upcoming' as const,
    venue: `Stade de ${match.homeTeam?.name || 'l\'équipe'}`,
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
  const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null
  const liveMatch = todayMatches.find(match => match.status === 'in_progress')
  const featuredMatch = liveMatch || nextMatch

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
              ComeBac League
            </h1>
            <p className="text-sm sm:text-base text-sofa-text-secondary mb-6 max-w-xl mx-auto">
              Championnat scolaire en temps réel
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
                    Match en Direct
                  </>
                ) : (
                  <>
                    <Clock className="w-6 h-6 text-sofa-blue" />
                    Prochain Match
                  </>
                )}
              </h2>
              <Link href="/public/matches" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                Tous les matchs →
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
                Podium
              </h2>
              <Link href="/public/ranking" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                Classement complet →
              </Link>
            </div>
            
            {/* Podium Layout */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl">
              {/* 2nd Place */}
              <div className="order-1 pt-8">
                <div className="sofa-card p-4 text-center relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="font-semibold text-sofa-text-primary mb-2 text-sm">{topThreeTeams[1].teamName}</h3>
                  <div className="text-lg font-bold text-sofa-text-accent">{topThreeTeams[1].points} pts</div>
                  <div className="text-xs text-sofa-text-muted">{topThreeTeams[1].wins}V - {topThreeTeams[1].draws}N - {topThreeTeams[1].losses}D</div>
                </div>
              </div>
              
              {/* 1st Place */}
              <div className="order-2">
                <div className="sofa-card p-4 text-center relative bg-gradient-to-br from-sofa-bg-card to-sofa-bg-secondary">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-sofa-green text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="mb-2">👑</div>
                  <h3 className="font-bold text-sofa-text-primary mb-2">{topThreeTeams[0].teamName}</h3>
                  <div className="text-xl font-bold text-sofa-green">{topThreeTeams[0].points} pts</div>
                  <div className="text-xs text-sofa-text-muted">{topThreeTeams[0].wins}V - {topThreeTeams[0].draws}N - {topThreeTeams[0].losses}D</div>
                </div>
              </div>
              
              {/* 3rd Place */}
              <div className="order-3 pt-12">
                <div className="sofa-card p-4 text-center relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="font-semibold text-sofa-text-primary mb-2 text-sm">{topThreeTeams[2].teamName}</h3>
                  <div className="text-lg font-bold text-sofa-text-accent">{topThreeTeams[2].points} pts</div>
                  <div className="text-xs text-sofa-text-muted">{topThreeTeams[2].wins}V - {topThreeTeams[2].draws}N - {topThreeTeams[2].losses}D</div>
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
          <h2 className="text-xl font-bold text-sofa-text-primary mb-4">Statistiques de la Ligue</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <SofaStatCard
              title="Équipes"
              value={stats.teams}
              icon={Users}
              color="blue"
              index={0}
            />
            <SofaStatCard
              title="Matchs"
              value={stats.matches}
              icon={Calendar}
              color="green"
              index={1}
            />
            <SofaStatCard
              title="Buts"
              value={stats.goals}
              icon={Target}
              color="purple"
              index={2}
            />
            <SofaStatCard
              title="Terminés"
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
                Derniers Résultats
              </h2>
              <Link href="/public/matches" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                Tous les résultats →
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
                Prochains Matchs
              </h2>
              <Link href="/public/matches" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                Calendrier complet →
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
                Équipes ({teams.length})
              </h2>
              <Link href="/public/teams" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                Toutes les équipes →
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
                      playerCount: team.playerCount || 0
                    }} 
                    index={index} 
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

      </div>
    </div>
  )
}
