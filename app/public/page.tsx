"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { SofaMatchCard } from '@/components/sofa/match-card'
import { SofaStandingsTable } from '@/components/sofa/standings-table'
import { SofaStatCard } from '@/components/sofa/stat-card'
import { SofaTeamCard } from '@/components/sofa/team-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Users, 
  TrendingUp,
  ChevronRight,
  Zap,
  Target,
  BarChart3
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

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden hero-section">
        <div className="absolute inset-0 bg-gradient-to-br from-sofa-bg-secondary via-sofa-bg-tertiary to-sofa-bg-card"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-sofa-text-primary">
              ComeBac
              <span className="block text-sofa-text-accent">League</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-sofa-text-secondary mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              Suivez tous les matchs, équipes et statistiques en temps réel de la ComeBac League
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/public/matches">
                <button className="sofa-btn">
                  📅 Voir les matchs
                </button>
              </Link>
              <Link href="/public/ranking">
                <button className="sofa-btn-secondary sofa-btn">
                  🏆 Classement
                </button>
              </Link>
              <Link href="/public/statistics">
                <button className="sofa-btn-secondary sofa-btn">
                  📊 Statistiques
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
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

        {/* Today's Matches */}
        {todayMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-sofa-text-primary flex items-center gap-3">
                <Zap className="w-8 h-8 text-sofa-red" />
                Matchs d'Aujourd'hui
              </h2>
              <Link href="/public/matches">
                <ChevronRight className="w-6 h-6 text-sofa-text-muted hover:text-sofa-text-accent transition-colors" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {todayMatches.map((match, index) => (
                <SofaMatchCard 
                  key={match.id} 
                  match={convertMatchFormat(match)} 
                  index={index} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-sofa-text-primary flex items-center gap-3">
                <Trophy className="w-8 h-8 text-sofa-green" />
                Derniers Résultats
              </h2>
              <Link href="/public/matches">
                <ChevronRight className="w-6 h-6 text-sofa-text-muted hover:text-sofa-text-accent transition-colors" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recentMatches.map((match, index) => (
                <SofaMatchCard 
                  key={match.id} 
                  match={convertMatchFormat(match)} 
                  index={index} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-sofa-text-primary flex items-center gap-3">
                <Clock className="w-8 h-8 text-sofa-blue" />
                Prochains Matchs
              </h2>
              <Link href="/public/matches">
                <ChevronRight className="w-6 h-6 text-sofa-text-muted hover:text-sofa-text-accent transition-colors" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {upcomingMatches.map((match, index) => (
                <SofaMatchCard 
                  key={match.id} 
                  match={convertMatchFormat(match)} 
                  index={index} 
                />
              ))}
            </div>
          </section>
        )}

        {/* League Standings Preview */}
        {standings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-sofa-text-primary flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-sofa-green" />
                Classement
              </h2>
              <Link href="/public/ranking">
                <ChevronRight className="w-6 h-6 text-sofa-text-muted hover:text-sofa-text-accent transition-colors" />
              </Link>
            </div>
            
            <SofaStandingsTable standings={standings} />
          </section>
        )}

        {/* Teams Preview */}
        {teams.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-sofa-text-primary flex items-center gap-3">
                <Users className="w-8 h-8 text-sofa-blue" />
                Équipes
              </h2>
              <Link href="/public/teams">
                <ChevronRight className="w-6 h-6 text-sofa-text-muted hover:text-sofa-text-accent transition-colors" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {teams.slice(0, 4).map((team, index) => (
                <SofaTeamCard 
                  key={team.id} 
                  team={{
                    id: team.id,
                    name: team.name,
                    color: team.color,
                    playerCount: team.playerCount || 0
                  }} 
                  index={index} 
                />
              ))}
            </div>
          </section>
        )}


      </div>
    </div>
  )
}
