"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Users,
  Trophy,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react'
import type { GameweekHistory } from '@/lib/types/fantasy'
import type { Player } from '@/lib/types'

interface PointsHistoryProps {
  gameweekHistory: GameweekHistory[]
  playerDetails: Map<string, Player>
  currentGameweek?: number
  showChart?: boolean
  compact?: boolean
}

export function PointsHistory({
  gameweekHistory,
  playerDetails,
  currentGameweek,
  showChart = true,
  compact = false
}: PointsHistoryProps) {
  const [expandedGameweek, setExpandedGameweek] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart')

  // Sort by gameweek descending (most recent first)
  const sortedHistory = [...gameweekHistory].sort((a, b) => b.gameweek - a.gameweek)

  // Calculate statistics
  const totalPoints = sortedHistory.reduce((sum, gw) => sum + gw.points, 0)
  const averagePoints = sortedHistory.length > 0 ? totalPoints / sortedHistory.length : 0
  const bestGameweek = sortedHistory.reduce((best, gw) => 
    gw.points > best.points ? gw : best
  , sortedHistory[0] || { points: 0, gameweek: 0 })
  const worstGameweek = sortedHistory.reduce((worst, gw) => 
    gw.points < worst.points ? gw : worst
  , sortedHistory[0] || { points: 0, gameweek: 0 })

  const toggleGameweek = (gameweek: number) => {
    setExpandedGameweek(expandedGameweek === gameweek ? null : gameweek)
  }

  // Calculate max points for chart scaling
  const maxPoints = Math.max(...sortedHistory.map(gw => gw.points), 100)

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-500" />}
            label="Total"
            value={totalPoints}
            suffix="pts"
            color="yellow"
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
            label="Moyenne"
            value={averagePoints.toFixed(1)}
            suffix="pts"
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-green-500" />}
            label="Meilleur"
            value={bestGameweek.points}
            suffix={`pts (GW${bestGameweek.gameweek})`}
            color="green"
          />
          <StatCard
            icon={<TrendingDown className="w-5 h-5 text-red-500" />}
            label="Pire"
            value={worstGameweek.points}
            suffix={`pts (GW${worstGameweek.gameweek})`}
            color="red"
          />
        </div>
      )}

      {/* View Mode Toggle */}
      {showChart && !compact && (
        <div className="flex justify-center gap-2">
          <Button
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('chart')}
            className={viewMode === 'chart' ? 'bg-sofa-green hover:bg-sofa-green/90' : ''}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Graphique
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-sofa-green hover:bg-sofa-green/90' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Liste
          </Button>
        </div>
      )}

      {/* Chart View */}
      {showChart && viewMode === 'chart' && !compact && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sofa-text-primary flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sofa-green" />
              Évolution des points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Chart */}
              <div className="relative h-64 flex items-end gap-2 px-4">
                {sortedHistory.slice().reverse().map((gw, index) => {
                  const heightPercentage = (gw.points / maxPoints) * 100
                  const isCurrentGameweek = currentGameweek === gw.gameweek
                  const isBest = gw.gameweek === bestGameweek.gameweek
                  
                  return (
                    <motion.div
                      key={gw.gameweek}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${heightPercentage}%`, opacity: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      className="flex-1 relative group cursor-pointer"
                      onClick={() => toggleGameweek(gw.gameweek)}
                    >
                      <div
                        className={`
                          w-full rounded-t-lg transition-all
                          ${isCurrentGameweek 
                            ? 'bg-gradient-to-t from-sofa-green to-emerald-400' 
                            : isBest
                            ? 'bg-gradient-to-t from-yellow-400 to-yellow-500'
                            : 'bg-gradient-to-t from-blue-400 to-blue-500'
                          }
                          group-hover:from-sofa-green group-hover:to-emerald-400
                        `}
                        style={{ height: '100%' }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                            <div className="font-semibold">GW {gw.gameweek}</div>
                            <div>{gw.points} points</div>
                            {gw.rank && <div className="text-gray-300">Rang: {gw.rank}</div>}
                          </div>
                          <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                        </div>

                        {/* Points label on bar */}
                        {heightPercentage > 20 && (
                          <div className="absolute top-2 left-0 right-0 text-center">
                            <span className="text-white font-bold text-xs drop-shadow">
                              {gw.points}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Gameweek label */}
                      <div className="absolute -bottom-6 left-0 right-0 text-center">
                        <span className={`text-xs font-medium ${
                          isCurrentGameweek ? 'text-sofa-green' : 'text-sofa-text-muted'
                        }`}>
                          {gw.gameweek}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* X-axis label */}
              <div className="text-center text-sm text-sofa-text-muted mt-8">
                Journées
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-sofa-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-t from-blue-400 to-blue-500"></div>
                  <span className="text-xs text-sofa-text-muted">Points</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-t from-sofa-green to-emerald-400"></div>
                  <span className="text-xs text-sofa-text-muted">Journée actuelle</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-t from-yellow-400 to-yellow-500"></div>
                  <span className="text-xs text-sofa-text-muted">Meilleur score</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {(viewMode === 'list' || compact) && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sofa-text-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sofa-green" />
              Historique par journée
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedHistory.length === 0 ? (
              <div className="text-center py-12 text-sofa-text-muted">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun historique disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedHistory.map((gw, index) => (
                  <GameweekCard
                    key={gw.gameweek}
                    gameweek={gw}
                    playerDetails={playerDetails}
                    isExpanded={expandedGameweek === gw.gameweek}
                    onToggle={() => toggleGameweek(gw.gameweek)}
                    isCurrent={currentGameweek === gw.gameweek}
                    isBest={gw.gameweek === bestGameweek.gameweek}
                    index={index}
                    compact={compact}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  suffix?: string
  color: 'yellow' | 'blue' | 'green' | 'red'
}

function StatCard({ icon, label, value, suffix, color }: StatCardProps) {
  const colorClasses = {
    yellow: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
    green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
    red: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
  }

  return (
    <div className={`p-4 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-sofa-text-muted mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-xl font-bold text-sofa-text-primary truncate">
              {value}
            </p>
            {suffix && (
              <p className="text-xs text-sofa-text-muted">{suffix}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface GameweekCardProps {
  gameweek: GameweekHistory
  playerDetails: Map<string, Player>
  isExpanded: boolean
  onToggle: () => void
  isCurrent: boolean
  isBest: boolean
  index: number
  compact: boolean
}

function GameweekCard({
  gameweek,
  playerDetails,
  isExpanded,
  onToggle,
  isCurrent,
  isBest,
  index,
  compact
}: GameweekCardProps) {
  // Sort players by points descending
  const sortedPlayers = [...gameweek.players].sort((a, b) => b.points - a.points)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`
        border-2 rounded-lg overflow-hidden transition-all
        ${isCurrent 
          ? 'border-sofa-green bg-green-50 dark:bg-green-900/10' 
          : isBest
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10'
          : 'border-sofa-border bg-white dark:bg-gray-800'
        }
      `}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center font-bold text-white
              ${isCurrent 
                ? 'bg-sofa-green' 
                : isBest
                ? 'bg-yellow-500'
                : 'bg-blue-500'
              }
            `}>
              {gameweek.gameweek}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sofa-text-primary">
                  Journée {gameweek.gameweek}
                </h3>
                {isCurrent && (
                  <Badge className="bg-sofa-green text-white text-xs">
                    Actuelle
                  </Badge>
                )}
                {isBest && (
                  <Badge className="bg-yellow-500 text-white text-xs">
                    🏆 Meilleur
                  </Badge>
                )}
              </div>
              <p className="text-sm text-sofa-text-muted">
                {gameweek.createdAt && new Date(gameweek.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Points */}
            <div className="text-right">
              <div className="text-2xl font-bold text-sofa-text-primary">
                {gameweek.points}
              </div>
              <div className="text-xs text-sofa-text-muted">points</div>
            </div>

            {/* Rank */}
            {gameweek.rank && (
              <div className="text-right">
                <div className="text-lg font-semibold text-sofa-text-primary">
                  #{gameweek.rank}
                </div>
                <div className="text-xs text-sofa-text-muted">rang</div>
              </div>
            )}

            {/* Expand Icon */}
            {!compact && (
              <div className="text-sofa-text-muted">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Transfers & Penalties */}
        {(gameweek.transfers > 0 || gameweek.pointsDeducted > 0) && (
          <div className="mt-3 pt-3 border-t border-sofa-border flex items-center gap-4 text-sm">
            {gameweek.transfers > 0 && (
              <div className="flex items-center gap-1 text-sofa-text-muted">
                <Users className="w-4 h-4" />
                <span>{gameweek.transfers} transfert{gameweek.transfers > 1 ? 's' : ''}</span>
              </div>
            )}
            {gameweek.pointsDeducted > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <TrendingDown className="w-4 h-4" />
                <span>-{gameweek.pointsDeducted} pts (pénalité)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && !compact && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-sofa-border bg-gray-50 dark:bg-gray-900/50"
        >
          <div className="p-4">
            <h4 className="font-semibold text-sofa-text-primary mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Détails par joueur
            </h4>
            
            <div className="space-y-2">
              {sortedPlayers.map((player) => {
                const detail = playerDetails.get(player.playerId)
                if (!detail) return null

                return (
                  <div
                    key={player.playerId}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {/* Player Photo */}
                      {detail.photoURL ? (
                        <img
                          src={detail.photoURL}
                          alt={detail.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                      )}

                      {/* Player Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sofa-text-primary">
                            {detail.name}
                          </span>
                          {player.isCaptain && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                              👑 Capitaine
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-sofa-text-muted">
                          {detail.position} • {detail.team}
                        </div>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        player.points > 10 ? 'text-green-600' :
                        player.points > 5 ? 'text-sofa-text-primary' :
                        'text-gray-500'
                      }`}>
                        {player.points}
                      </div>
                      <div className="text-xs text-sofa-text-muted">
                        {player.isCaptain ? `(${player.points / 2} x2)` : 'pts'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
