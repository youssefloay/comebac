"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Sparkles,
  Trophy,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  Star,
  Zap,
  Award,
  Target
} from 'lucide-react'
import type { FantasyTeam } from '@/lib/types/fantasy'

interface LeaderboardEntry {
  rank: number
  teamName: string
  totalPoints: number
  gameweekPoints: number
}

interface TopPlayer {
  name: string
  photo?: string
  points: number
  position: string
}

export default function FantasyHubPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [fantasyTeam, setFantasyTeam] = useState<FantasyTeam | null>(null)
  const [playerNames, setPlayerNames] = useState<Map<string, string>>(new Map())
  const [topLeaderboard, setTopLeaderboard] = useState<LeaderboardEntry[]>([])
  const [topPlayer, setTopPlayer] = useState<TopPlayer | null>(null)
  const [deadline, setDeadline] = useState<Date | null>(null)

  useEffect(() => {
    const loadFantasyData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Load user's fantasy team
        const teamResponse = await fetch(`/api/fantasy/get-team?userId=${user.uid}`)
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setFantasyTeam(teamData.team)
          
          // Load player names
          const playerIds = teamData.team.players.map((p: any) => p.playerId)
          const playersResponse = await fetch('/api/players')
          if (playersResponse.ok) {
            const playersData = await playersResponse.json()
            const namesMap = new Map<string, string>()
            
            playersData.forEach((player: any) => {
              if (playerIds.includes(player.id)) {
                namesMap.set(player.id, player.name || 'Inconnu')
              }
            })
            
            setPlayerNames(namesMap)
          }
        }

        // Load top 5 leaderboard
        const leaderboardResponse = await fetch('/api/fantasy/leaderboard?type=global&limit=5')
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json()
          setTopLeaderboard(leaderboardData.leaderboard)
        }

        // Mock deadline (would come from gameweek info in production)
        const mockDeadline = new Date()
        mockDeadline.setDate(mockDeadline.getDate() + 3)
        mockDeadline.setHours(18, 0, 0, 0)
        setDeadline(mockDeadline)

        // Mock top player (would come from API in production)
        setTopPlayer({
          name: 'Meilleur joueur',
          points: 15,
          position: 'Attaquant'
        })

      } catch (error) {
        console.error('Error loading fantasy data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFantasyData()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // If user doesn't have a team, show welcome screen
  if (!fantasyTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Hero Section */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Mode Fantasy ComeBac
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Créez votre équipe de rêve, gagnez des points basés sur les performances réelles, 
                et affrontez les autres managers dans le classement !
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Sélectionnez 7 joueurs
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Budget de 100M€ pour composer votre équipe idéale
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Gagnez des points
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Basés sur les performances réelles de vos joueurs
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Grimpez au classement
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Affrontez les autres managers et gagnez des badges
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Button */}
            <Link href="/public/fantasy/create">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Créer mon équipe Fantasy
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            {/* Rules Link */}
            <div className="mt-6">
              <Link href="/public/fantasy/rules" className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                Comment ça marche ? Voir les règles →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Dashboard for users with a team
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Fantasy ComeBac
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenue, {fantasyTeam.teamName} !
          </p>
        </motion.div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="w-6 h-6 md:w-8 md:h-8 opacity-80" />
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    #{fantasyTeam.rank || '-'}
                  </Badge>
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1">
                  {fantasyTeam.totalPoints}
                </div>
                <div className="text-xs md:text-sm opacity-90">Points totaux</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-6 h-6 md:w-8 md:h-8 opacity-80" />
                  <Zap className="w-4 h-4 md:w-5 md:h-5 opacity-80" />
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1">
                  {fantasyTeam.gameweekPoints}
                </div>
                <div className="text-xs md:text-sm opacity-90">Points semaine</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-6 h-6 md:w-8 md:h-8 opacity-80" />
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {fantasyTeam.formation}
                  </Badge>
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1">
                  {fantasyTeam.players.length}
                </div>
                <div className="text-xs md:text-sm opacity-90">Joueurs</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-6 h-6 md:w-8 md:h-8 opacity-80" />
                  <Star className="w-4 h-4 md:w-5 md:h-5 opacity-80" />
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1">
                  {fantasyTeam.badges.length}
                </div>
                <div className="text-xs md:text-sm opacity-90">Badges</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - My Team */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Mon Équipe
                  </h2>
                  <Link href="/public/fantasy/my-team">
                    <Button variant="outline" size="sm">
                      Voir détails
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                {/* Team Preview */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 mb-4">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {fantasyTeam.teamName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Formation: {fantasyTeam.formation}
                    </p>
                  </div>

                  {/* Simple player list */}
                  <div className="grid grid-cols-2 gap-3">
                    {fantasyTeam.players.slice(0, 6).map((player, index) => (
                      <div 
                        key={player.playerId}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center gap-2"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {playerNames.get(player.playerId) || 'Chargement...'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {player.gameweekPoints} pts
                          </div>
                        </div>
                        {player.isCaptain && (
                          <Badge className="bg-yellow-500 text-white text-xs">
                            C
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <Link href="/public/fantasy/transfers" className="block">
                    <Button variant="outline" className="w-full text-xs md:text-sm">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Transferts</span>
                      <span className="sm:hidden">Trans.</span> ({fantasyTeam.transfers})
                    </Button>
                  </Link>
                  <Link href="/public/fantasy/my-team" className="block">
                    <Button variant="outline" className="w-full text-xs md:text-sm">
                      <Target className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Historique</span>
                      <span className="sm:hidden">Histo.</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Leaderboard & Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-6"
          >
            {/* Deadline Card */}
            {deadline && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Prochaine Deadline
                    </h3>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    {deadline.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {deadline.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top 5 Leaderboard */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Top 5
                  </h3>
                  <Link href="/public/fantasy/leaderboard">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Voir tout
                    </Button>
                  </Link>
                </div>

                <div className="space-y-3">
                  {topLeaderboard.map((entry, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index === 0 ? 'bg-yellow-500 text-white' : 
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}
                      `}>
                        {entry.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {entry.teamName}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          +{entry.gameweekPoints} cette semaine
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {entry.totalPoints}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Player of the Week */}
            {topPlayer && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Joueur de la semaine
                    </h3>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {topPlayer.name}
                    </div>
                    <Badge className="bg-purple-600 text-white mb-2">
                      {topPlayer.position}
                    </Badge>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {topPlayer.points} points
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        {/* Quick Links Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Navigation rapide
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/public/fantasy/my-team">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    Mon Équipe
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/public/fantasy/transfers">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-3 text-green-600" />
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    Transferts
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/public/fantasy/leaderboard">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-3 text-yellow-600" />
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    Classement
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/public/fantasy/rules">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    Règles
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
