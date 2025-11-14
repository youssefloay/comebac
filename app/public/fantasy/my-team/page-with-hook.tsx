"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useFantasyTeam } from '@/lib/hooks/use-fantasy-team'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PitchView } from '@/components/fantasy/pitch-view'
import { PointsHistory } from '@/components/fantasy/points-history'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Users,
  TrendingUp,
  Trophy,
  Crown,
  ArrowLeft,
  Calendar,
  DollarSign,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import type { GameweekHistory } from '@/lib/types/fantasy'
import type { Player } from '@/lib/types'

/**
 * Example implementation of My Team page using the useFantasyTeam hook
 * This demonstrates how to use React Query for data fetching and caching
 */
export default function MyTeamPageWithHook() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Use the custom hook for fantasy team data
  const { 
    data: fantasyTeam, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useFantasyTeam(user?.uid, {
    // Refetch every 30 seconds to get live updates
    refetchInterval: 30000,
    // Consider data stale after 2 minutes
    staleTime: 2 * 60 * 1000,
  })

  const [playerDetails, setPlayerDetails] = useState<Map<string, Player>>(new Map())
  const [gameweekHistory, setGameweekHistory] = useState<GameweekHistory[]>([])
  const [activeTab, setActiveTab] = useState<'team' | 'history'>('team')
  const [currentGameweek, setCurrentGameweek] = useState<number>(1)

  // Handle team not found error
  useEffect(() => {
    if (error?.message === 'TEAM_NOT_FOUND') {
      router.push('/public/fantasy/create')
    }
  }, [error, router])

  // Load player details when team is loaded
  useEffect(() => {
    const loadPlayerDetails = async () => {
      if (!fantasyTeam) return

      try {
        const playerIds = fantasyTeam.players.map((p) => p.playerId)
        const playersResponse = await fetch('/api/players')
        
        if (playersResponse.ok) {
          const playersData = await playersResponse.json()
          const playersMap = new Map<string, Player>()
          
          // playersData is directly an array of players
          playersData.forEach((player: Player) => {
            if (playerIds.includes(player.id)) {
              playersMap.set(player.id, player)
            }
          })
          
          setPlayerDetails(playersMap)
        }

        // Load gameweek history (mock data for now)
        const now = Date.now() / 1000
        const mockHistory: GameweekHistory[] = [
          {
            id: '1',
            teamId: fantasyTeam.id,
            gameweek: 1,
            points: 65,
            rank: 42,
            transfers: 0,
            pointsDeducted: 0,
            players: fantasyTeam.players.map((p) => ({
              playerId: p.playerId,
              points: Math.floor(Math.random() * 15),
              isCaptain: p.isCaptain
            })),
            createdAt: { seconds: now - 172800, nanoseconds: 0 } as any
          },
          {
            id: '2',
            teamId: fantasyTeam.id,
            gameweek: 2,
            points: 78,
            rank: 28,
            transfers: 1,
            pointsDeducted: 0,
            players: fantasyTeam.players.map((p) => ({
              playerId: p.playerId,
              points: Math.floor(Math.random() * 15),
              isCaptain: p.isCaptain
            })),
            createdAt: { seconds: now - 86400, nanoseconds: 0 } as any
          },
          {
            id: '3',
            teamId: fantasyTeam.id,
            gameweek: 3,
            points: 52,
            rank: 67,
            transfers: 2,
            pointsDeducted: 0,
            players: fantasyTeam.players.map((p) => ({
              playerId: p.playerId,
              points: Math.floor(Math.random() * 15),
              isCaptain: p.isCaptain
            })),
            createdAt: { seconds: now, nanoseconds: 0 } as any
          }
        ]
        setGameweekHistory(mockHistory)
        setCurrentGameweek(3)
      } catch (error) {
        console.error('Error loading player details:', error)
      }
    }

    loadPlayerDetails()
  }, [fantasyTeam])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // Error state (other than team not found)
  if (error && error.message !== 'TEAM_NOT_FOUND') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Erreur lors du chargement de votre équipe
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error.message}
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!fantasyTeam) {
    return null
  }

  // Find captain player
  const captain = fantasyTeam.players.find(p => p.playerId === fantasyTeam.captainId)

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
          <Link href="/public/fantasy">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au Hub
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {fantasyTeam.teamName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Formation: {fantasyTeam.formation}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Actualisation...' : 'Actualiser'}
              </Button>
              
              <Link href="/public/fantasy/transfers">
                <Button className="bg-sofa-green hover:bg-sofa-green/90">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Transferts ({fantasyTeam.transfers})
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Points totaux</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {fantasyTeam.totalPoints}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cette semaine</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {fantasyTeam.gameweekPoints}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rang</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      #{fantasyTeam.rank || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Budget restant</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {fantasyTeam.budgetRemaining.toFixed(1)}M€
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-6"
        >
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('team')}
              className={`
                px-6 py-3 font-semibold transition-colors relative
                ${activeTab === 'team'
                  ? 'text-sofa-green'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Mon Équipe
              </div>
              {activeTab === 'team' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-sofa-green"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`
                px-6 py-3 font-semibold transition-colors relative
                ${activeTab === 'history'
                  ? 'text-sofa-green'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Historique
              </div>
              {activeTab === 'history' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-sofa-green"
                />
              )}
            </button>
          </div>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'team' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Pitch View */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sofa-text-primary flex items-center gap-2">
                  <Users className="w-5 h-5 text-sofa-green" />
                  Composition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PitchView
                  players={fantasyTeam.players}
                  playerDetails={playerDetails}
                  formation={fantasyTeam.formation}
                  captainId={fantasyTeam.captainId}
                  showPoints={true}
                />
              </CardContent>
            </Card>

            {/* Captain Info */}
            {captain && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-yellow-400 rounded-full">
                      <Crown className="w-8 h-8 text-yellow-900" fill="currentColor" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        Capitaine
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Les points de votre capitaine sont doublés
                      </p>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Joueur</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {playerDetails.get(captain.playerId)?.name || 'Inconnu'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Points cette semaine</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {captain.gameweekPoints} pts
                            <span className="text-yellow-600 ml-1">×2</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Players List */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sofa-text-primary flex items-center gap-2">
                  <Users className="w-5 h-5 text-sofa-green" />
                  Détails des joueurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fantasyTeam.players.map((player) => {
                    const detail = playerDetails.get(player.playerId)
                    if (!detail) return null

                    return (
                      <div
                        key={player.playerId}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {/* Player Photo */}
                          {detail.photo ? (
                            <img
                              src={detail.photo}
                              alt={detail.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-bold">
                                {detail.number || '?'}
                              </span>
                            </div>
                          )}

                          {/* Player Info */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {detail.name}
                              </span>
                              {player.isCaptain && (
                                <Badge className="bg-yellow-500 text-white text-xs">
                                  <Crown className="w-3 h-3 mr-1" fill="currentColor" />
                                  Capitaine
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <span>{player.position}</span>
                              <span>•</span>
                              <span>{detail.school || 'École'}</span>
                              <span>•</span>
                              <span>{player.price}M€</span>
                            </div>
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {player.gameweekPoints}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            pts cette semaine
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Total: {player.points} pts
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <PointsHistory
              gameweekHistory={gameweekHistory}
              playerDetails={playerDetails}
              currentGameweek={currentGameweek}
              showChart={true}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}
