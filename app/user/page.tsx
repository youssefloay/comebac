"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { UserNavbar } from '@/components/user/navbar'
import { MatchCard } from '@/components/user/match-card'
import { StandingsTable } from '@/components/user/standings-table'
import { TeamCard } from '@/components/user/team-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Users, 
  TrendingUp,
  ChevronRight,
  Zap
} from 'lucide-react'

interface Match {
  id: string
  teamA: string
  teamB: string
  date: Date
  scoreA?: number
  scoreB?: number
  status: 'today' | 'upcoming' | 'live' | 'completed'
  venue?: string
}

interface Team {
  id: string
  name: string
  logo?: string
  playerCount?: number
  color?: string
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

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [todayMatches, setTodayMatches] = useState<Match[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [standings, setStandings] = useState<Standing[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const unsubscribes: (() => void)[] = []

    // Today's matches
    const todayQuery = query(
      collection(db, 'matches'),
      where('status', 'in', ['today', 'live']),
      orderBy('date', 'asc')
    )
    
    const unsubscribeToday = onSnapshot(todayQuery, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      })) as Match[]
      setTodayMatches(matches)
    })
    unsubscribes.push(unsubscribeToday)

    // Upcoming matches
    const upcomingQuery = query(
      collection(db, 'matches'),
      where('status', '==', 'upcoming'),
      orderBy('date', 'asc')
    )
    
    const unsubscribeUpcoming = onSnapshot(upcomingQuery, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      })) as Match[]
      setUpcomingMatches(matches.slice(0, 6)) // Limit to 6 upcoming matches
    })
    unsubscribes.push(unsubscribeUpcoming)

    // Standings
    const standingsQuery = query(
      collection(db, 'standings'),
      orderBy('points', 'desc')
    )
    
    const unsubscribeStandings = onSnapshot(standingsQuery, (snapshot) => {
      const standingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Standing[]
      setStandings(standingsData)
    })
    unsubscribes.push(unsubscribeStandings)

    // Teams
    const teamsQuery = query(collection(db, 'teams'))
    
    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[]
      setTeams(teamsData)
      setLoading(false)
    })
    unsubscribes.push(unsubscribeTeams)

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe())
    }
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />
      
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Bienvenue dans la Ligue Scolaire
          </h1>
          <p className="text-gray-600 text-lg">
            Suivez les matchs, classements et statistiques en temps réel
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{todayMatches.length}</div>
                <div className="text-sm opacity-90">Matchs aujourd'hui</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{upcomingMatches.length}</div>
                <div className="text-sm opacity-90">À venir</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{teams.length}</div>
                <div className="text-sm opacity-90">Équipes</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{standings.length}</div>
                <div className="text-sm opacity-90">Classés</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Today's Matches */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-red-500" />
              Matchs d'Aujourd'hui
            </h2>
            {todayMatches.some(m => m.status === 'live') && (
              <Badge className="bg-red-500 hover:bg-red-600 animate-pulse">
                🔴 EN DIRECT
              </Badge>
            )}
          </div>
          
          {todayMatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayMatches.map((match, index) => (
                <MatchCard key={match.id} match={match} index={index} />
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun match prévu aujourd'hui</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Upcoming Matches */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-500" />
              Prochains Matchs
            </h2>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          
          {upcomingMatches.length > 0 ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 w-max sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:w-full">
                {upcomingMatches.map((match, index) => (
                  <div key={match.id} className="w-80 sm:w-full">
                    <MatchCard match={match} index={index} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun match à venir</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* League Standings */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-500" />
              Classement
            </h2>
          </div>
          
          {standings.length > 0 ? (
            <StandingsTable standings={standings} />
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Classement non disponible</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Teams */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-500" />
              Équipes
            </h2>
          </div>
          
          {teams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teams.map((team, index) => (
                <TeamCard key={team.id} team={team} index={index} />
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune équipe disponible</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  )
}