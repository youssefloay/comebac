"use client"

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, TrendingUp, TrendingDown } from 'lucide-react'
import type { Player } from '@/lib/types'
import type { PlayerFantasyStats } from '@/lib/types/fantasy'

interface FantasyPlayerCardProps {
  player: Player
  fantasyStats?: PlayerFantasyStats
  selected?: boolean
  disabled?: boolean
  onSelect?: (player: Player) => void
  onDeselect?: (player: Player) => void
  index?: number
  compact?: boolean
  showStats?: boolean
}

export function FantasyPlayerCard({
  player,
  fantasyStats,
  selected = false,
  disabled = false,
  onSelect,
  onDeselect,
  index = 0,
  compact = false,
  showStats = true
}: FantasyPlayerCardProps) {
  const getPositionColor = (position: string) => {
    switch (position) {
      case 'Gardien':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
      case 'Défenseur':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
      case 'Milieu':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
      case 'Attaquant':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
    }
  }

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'Gardien':
        return '🥅'
      case 'Défenseur':
        return '🛡️'
      case 'Milieu':
        return '⚽'
      case 'Attaquant':
        return '🎯'
      default:
        return '👤'
    }
  }

  const handleClick = () => {
    if (disabled) return
    
    if (selected && onDeselect) {
      onDeselect(player)
    } else if (!selected && onSelect) {
      onSelect(player)
    }
  }

  const priceChange = fantasyStats?.priceChange || 0
  const price = fantasyStats?.price || 5.0
  const points = fantasyStats?.totalPoints || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={!disabled ? { y: -4, transition: { duration: 0.2 } } : {}}
    >
      <Card 
        className={`
          border-0 shadow-md transition-all duration-300 cursor-pointer
          ${selected 
            ? 'ring-2 ring-sofa-green shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
            : 'hover:shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${compact ? 'h-full' : ''}
        `}
        onClick={handleClick}
      >
        <CardContent className={compact ? 'p-3' : 'p-4'}>
          {/* Header with photo and basic info */}
          <div className={`flex items-center gap-3 ${compact ? 'mb-2' : 'mb-3'}`}>
            {player.photo ? (
              <img 
                src={player.photo} 
                alt={player.name}
                className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover border-2 ${
                  selected ? 'border-sofa-green' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
            ) : (
              <div className={`
                ${compact ? 'w-10 h-10' : 'w-12 h-12'} 
                bg-gradient-to-br from-blue-500 to-purple-600 
                rounded-full flex items-center justify-center text-white font-bold
                ${selected ? 'ring-2 ring-sofa-green' : ''}
              `}>
                {player.number || <User className={compact ? 'w-5 h-5' : 'w-6 h-6'} />}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sofa-text-primary truncate ${compact ? 'text-sm' : ''}`}>
                {player.name}
              </h3>
              {player.school && !compact && (
                <p className="text-xs text-sofa-text-muted truncate">
                  {player.school}
                </p>
              )}
            </div>

            {/* Selection indicator */}
            {selected && (
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-sofa-green rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            )}
          </div>

          {/* Position and Price */}
          <div className="flex items-center justify-between mb-2">
            <Badge className={`${getPositionColor(player.position)} text-xs`} variant="outline">
              <span className="mr-1">{getPositionIcon(player.position)}</span>
              {player.position}
            </Badge>
            
            <div className="flex items-center gap-1">
              <span className={`font-bold ${compact ? 'text-sm' : 'text-base'} text-sofa-text-primary`}>
                {price.toFixed(1)}M€
              </span>
              {priceChange !== 0 && !compact && (
                <span className={`text-xs flex items-center ${
                  priceChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {priceChange > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Fantasy Stats */}
          {showStats && !compact && (
            <div className="pt-2 border-t border-sofa-border">
              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-sofa-text-muted">Points</span>
                  <span className="font-semibold text-sofa-text-primary">{points}</span>
                </div>
                {fantasyStats && (
                  <>
                    <div className="flex flex-col items-center flex-1 border-l border-sofa-border">
                      <span className="text-sofa-text-muted">Forme</span>
                      <span className="font-semibold text-sofa-text-primary">
                        {fantasyStats.form.length > 0 
                          ? (fantasyStats.form.reduce((a, b) => a + b, 0) / fantasyStats.form.length).toFixed(1)
                          : '0.0'
                        }
                      </span>
                    </div>
                    <div className="flex flex-col items-center flex-1 border-l border-sofa-border">
                      <span className="text-sofa-text-muted">Popularité</span>
                      <span className="font-semibold text-sofa-text-primary">
                        {fantasyStats.popularity.toFixed(0)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Compact stats */}
          {showStats && compact && fantasyStats && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-sofa-border">
              <span className="text-sofa-text-muted">
                {points} pts
              </span>
              <span className="text-sofa-text-muted">
                {fantasyStats.popularity.toFixed(0)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
