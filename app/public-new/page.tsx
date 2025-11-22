"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SimpleLogo } from '@/components/ui/logo'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Users, 
  Target,
  TrendingUp,
  ChevronRight,
  PlayCircle,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react'

interface Match {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeam?: { name: string; logo?: string; color?: string }
  awayTeam?: { name: string; logo?: string; color?: string }
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
}

export default function PublicNewPage() {
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
        const teamsWithPlayerCounts = teamsData.map(team => ({
          ...team,
          playerCount: allPlayers.filter(player => player.teamId === team.id).length
        }))
        setTeams(teamsWithPlayerCounts)

        const teamsMap = new Map()
        teamsData.forEach(team => {
          teamsMap.set(team.id, team)
        })
        
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

        const resultsMap = new Map()
        let totalGoals = 0
        resultsSnap.docs.forEach(doc => {
          const result = doc.data()
          resultsMap.set(result.matchId, result)
          totalGoals += (result.homeTeamScore || 0) + (result.awayTeamScore || 0)
        })

        const matchesWithResults = allMatches.map(match => ({
          ...match,
          result: resultsMap.get(match.id),
          homeTeamScore: resultsMap.get(match.id)?.homeTeamScore,
          awayTeamScore: resultsMap.get(match.id)?.awayTeamScore
        }))

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

        const teamStatsMap = new Map()
        statsSnap.docs.forEach(doc => {
          const data = doc.data()
          const existing = teamStatsMap.get(data.teamId)
          if (!existing) {
            teamStatsMap.set(data.teamId, { id: doc.id, ...data })
          } else {
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
          
        setStandings(standingsData.slice(0, 6))

        setStats({
          teams: teamsData.length,
          matches: allMatches.length,
          goals: totalGoals,
          completed: matchesWithResults.filter(m => m.status === 'completed').length
        })
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null
  const liveMatch = todayMatches.find(match => match.status === 'in_progress')
  const featuredMatch = liveMatch || nextMatch
  const topThreeTeams = standings.slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section - Glassmorphism with subtle colors */}
      <div className="relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 via-transparent to-purple-100/30"></div>
        {/* Subtle pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.05)_1px,transparent_0)] bg-[length:32px_32px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-100/80 to-purple-100/80 backdrop-blur-xl border border-indigo-200/50 rounded-full text-xs font-medium text-indigo-700 mb-6 shadow-sm"
            >
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Ligue Active</span>
            </motion.div>
            
            <div className="flex flex-col items-center gap-4 mb-4">
              <SimpleLogo 
                className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-contain"
                alt="ComeBac League"
              />
            </div>
            
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto font-light">
              Compétition scolaire de football. Suivez les matchs et classements en temps réel.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        {/* Featured Match - Glass Card with accent */}
        {featuredMatch && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {liveMatch ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <h2 className="text-xl font-medium text-slate-900">En Direct</h2>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-medium text-slate-900">Prochain Match</h2>
                  </>
                )}
              </div>
              <Link 
                href="/public/matches" 
                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 font-medium"
              >
                Tout voir <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/50 shadow-lg p-8 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              {/* Subtle accent gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div className="text-xs font-medium text-slate-500 mb-6 uppercase tracking-wider">
                {featuredMatch.date.toLocaleDateString('fr-FR', { 
                  weekday: 'long',
                  day: 'numeric', 
                  month: 'long'
                })}
              </div>

              <div className="grid grid-cols-3 gap-6 items-center">
                {/* Home Team */}
                <div className="text-center">
                  <div className="mb-4">
                    {featuredMatch.homeTeam?.logo ? (
                      <img 
                        src={featuredMatch.homeTeam.logo} 
                        alt={featuredMatch.homeTeam.name}
                        className="w-20 h-20 mx-auto object-contain"
                      />
                    ) : (
                      <div 
                        className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-3xl font-light shadow-sm"
                        style={{ 
                          backgroundColor: featuredMatch.homeTeam?.color || '#e0e7ff',
                          color: featuredMatch.homeTeam?.color ? '#6366f1' : '#818cf8'
                        }}
                      >
                        ⚽
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-slate-900 text-lg">{featuredMatch.homeTeam?.name}</h3>
                  {featuredMatch.homeTeamScore !== undefined && (
                    <div className="text-4xl font-light text-indigo-600 mt-3">
                      {featuredMatch.homeTeamScore}
                    </div>
                  )}
                </div>

                {/* VS / Score */}
                <div className="text-center">
                  {featuredMatch.homeTeamScore !== undefined ? (
                    <div className="text-5xl font-light text-slate-300">-</div>
                  ) : (
                    <div className="text-sm font-medium text-indigo-500 uppercase tracking-wider">VS</div>
                  )}
                  {featuredMatch.homeTeamScore !== undefined && (
                    <div className="text-4xl font-light text-purple-600 mt-3">
                      {featuredMatch.awayTeamScore}
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="text-center">
                  <div className="mb-4">
                    {featuredMatch.awayTeam?.logo ? (
                      <img 
                        src={featuredMatch.awayTeam.logo} 
                        alt={featuredMatch.awayTeam.name}
                        className="w-20 h-20 mx-auto object-contain"
                      />
                    ) : (
                      <div 
                        className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-3xl font-light shadow-sm"
                        style={{ 
                          backgroundColor: featuredMatch.awayTeam?.color || '#f3e8ff',
                          color: featuredMatch.awayTeam?.color ? '#a855f7' : '#c084fc'
                        }}
                      >
                        ⚽
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-slate-900 text-lg">{featuredMatch.awayTeam?.name}</h3>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Top 3 Podium - With subtle colors */}
        {topThreeTeams.length >= 3 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-medium text-slate-900">Classement</h2>
              </div>
              <Link 
                href="/public/ranking" 
                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 font-medium"
              >
                Tout voir <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-6"
              >
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-lg p-6 text-center relative hover:shadow-xl transition-all">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 text-white rounded-full flex items-center justify-center font-medium text-sm shadow-md">
                    2
                  </div>
                  <h3 className="font-medium text-slate-900 mb-3 text-sm">{topThreeTeams[1].teamName}</h3>
                  <div className="text-3xl font-light text-slate-700 mb-1">{topThreeTeams[1].points}</div>
                  <div className="text-xs text-slate-500 font-light">points</div>
                  <div className="mt-4 text-xs text-slate-400 font-light">
                    {topThreeTeams[1].wins}V • {topThreeTeams[1].draws}N • {topThreeTeams[1].losses}D
                  </div>
                </div>
              </motion.div>
              
              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50/50 backdrop-blur-xl rounded-2xl border-2 border-amber-200/50 shadow-xl p-6 text-center relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-full flex items-center justify-center font-medium shadow-lg">
                    1
                  </div>
                  <h3 className="font-medium text-slate-900 mb-3">{topThreeTeams[0].teamName}</h3>
                  <div className="text-4xl font-light text-amber-600 mb-1">{topThreeTeams[0].points}</div>
                  <div className="text-xs text-amber-600/70 font-light">points</div>
                  <div className="mt-4 text-xs text-slate-500 font-light">
                    {topThreeTeams[0].wins}V • {topThreeTeams[0].draws}N • {topThreeTeams[0].losses}D
                  </div>
                </div>
              </motion.div>
              
              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-10"
              >
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-orange-200/50 shadow-lg p-6 text-center relative hover:shadow-xl transition-all">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-full flex items-center justify-center font-medium text-sm shadow-md">
                    3
                  </div>
                  <h3 className="font-medium text-slate-900 mb-3 text-sm">{topThreeTeams[2].teamName}</h3>
                  <div className="text-3xl font-light text-orange-600 mb-1">{topThreeTeams[2].points}</div>
                  <div className="text-xs text-slate-500 font-light">points</div>
                  <div className="mt-4 text-xs text-slate-400 font-light">
                    {topThreeTeams[2].wins}V • {topThreeTeams[2].draws}N • {topThreeTeams[2].losses}D
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* Stats Grid - Glass Cards with color accents */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-medium text-slate-900 mb-4">Statistiques</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassStatCard
              icon={Users}
              title="Équipes"
              value={stats.teams}
              color="indigo"
              delay={0.1}
            />
            <GlassStatCard
              icon={Calendar}
              title="Matchs"
              value={stats.matches}
              color="emerald"
              delay={0.2}
            />
            <GlassStatCard
              icon={Target}
              title="Buts"
              value={stats.goals}
              color="rose"
              delay={0.3}
            />
            <GlassStatCard
              icon={Trophy}
              title="Terminés"
              value={stats.completed}
              color="amber"
              delay={0.4}
            />
          </div>
        </motion.section>

        {/* Recent Results */}
        {recentMatches.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-medium text-slate-900">Résultats Récents</h2>
              </div>
              <Link 
                href="/public/matches" 
                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 font-medium"
              >
                Tout voir <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentMatches.slice(0, 6).map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                >
                  <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/50 shadow-sm p-5 hover:shadow-md transition-all group">
                    <div className="text-xs text-slate-400 mb-4 font-light">
                      {match.date.toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{match.homeTeam?.name}</span>
                        {match.homeTeamScore !== undefined && (
                          <span className="text-lg font-medium text-indigo-600">{match.homeTeamScore}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{match.awayTeam?.name}</span>
                        {match.awayTeamScore !== undefined && (
                          <span className="text-lg font-medium text-purple-600">{match.awayTeamScore}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 1 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-medium text-slate-900">À Venir</h2>
              </div>
              <Link 
                href="/public/matches" 
                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 font-medium"
              >
                Tout voir <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingMatches.slice(1, 5).map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                >
                  <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/50 shadow-sm p-5 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-light text-slate-400 uppercase tracking-wider">
                        {match.date.toLocaleDateString('fr-FR', { 
                          weekday: 'short',
                          day: 'numeric', 
                          month: 'short'
                        })}
                      </div>
                      <div className="text-xs text-indigo-500 font-medium">
                        {match.date.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-700">{match.homeTeam?.name}</div>
                      <div className="text-sm font-medium text-slate-700">{match.awayTeam?.name}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Teams Preview */}
        {teams.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-medium text-slate-900">Équipes</h2>
              </div>
              <Link 
                href="/public/teams" 
                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 font-medium"
              >
                Tout voir <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {teams.slice(0, 6).map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.05 }}
                >
                  <Link href={`/public/teams/${team.id}`}>
                    <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/50 shadow-sm p-4 text-center hover:shadow-md transition-all cursor-pointer group">
                      {team.logo ? (
                        <img 
                          src={team.logo} 
                          alt={team.name}
                          className="w-16 h-16 mx-auto mb-3 object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div 
                          className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center text-2xl font-light shadow-sm group-hover:scale-105 transition-transform"
                          style={{ 
                            backgroundColor: team.color ? `${team.color}20` : '#e0e7ff',
                            color: team.color || '#6366f1'
                          }}
                        >
                          ⚽
                        </div>
                      )}
                      <h3 className="font-medium text-slate-700 text-sm mb-1">{team.name}</h3>
                      {team.playerCount && (
                        <div className="text-xs text-slate-400 font-light">{team.playerCount} joueurs</div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}

function GlassStatCard({ 
  icon: Icon, 
  title, 
  value, 
  color,
  delay 
}: { 
  icon: any
  title: string
  value: number
  color: 'indigo' | 'emerald' | 'rose' | 'amber'
  delay: number
}) {
  const colorClasses = {
    indigo: {
      bg: 'from-indigo-50 to-indigo-100/50',
      border: 'border-indigo-200/50',
      icon: 'text-indigo-500',
      value: 'text-indigo-600'
    },
    emerald: {
      bg: 'from-emerald-50 to-emerald-100/50',
      border: 'border-emerald-200/50',
      icon: 'text-emerald-500',
      value: 'text-emerald-600'
    },
    rose: {
      bg: 'from-rose-50 to-rose-100/50',
      border: 'border-rose-200/50',
      icon: 'text-rose-500',
      value: 'text-rose-600'
    },
    amber: {
      bg: 'from-amber-50 to-amber-100/50',
      border: 'border-amber-200/50',
      icon: 'text-amber-500',
      value: 'text-amber-600'
    }
  }

  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-br ${colors.bg} backdrop-blur-xl rounded-xl border ${colors.border} shadow-sm p-6 hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>
      <div className={`text-3xl font-light ${colors.value} mb-1`}>{value}</div>
      <div className="text-xs text-slate-500 font-light uppercase tracking-wider">{title}</div>
    </motion.div>
  )
}
