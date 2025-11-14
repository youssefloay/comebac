"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Lock, TrendingUp } from 'lucide-react'
import type { FantasyBadge, BadgeType } from '@/lib/types/fantasy'
import { FANTASY_BADGES, getBadgeProgress } from '@/lib/fantasy/badges'

interface BadgeDisplayProps {
  userId: string
  teamId: string
  earnedBadges: FantasyBadge[]
  showProgress?: boolean
  compact?: boolean
  animated?: boolean
}

export function BadgeDisplay({
  userId,
  teamId,
  earnedBadges,
  showProgress = true,
  compact = false,
  animated = true
}: BadgeDisplayProps) {
  const [badgeProgress, setBadgeProgress] = useState<Record<BadgeType, number | null>>({} as any)
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null)

  // Charger la progression vers les badges
  useEffect(() => {
    if (!showProgress) return

    const loadProgress = async () => {
      const progress: Record<BadgeType, number | null> = {} as any
      
      for (const badgeType of Object.keys(FANTASY_BADGES) as BadgeType[]) {
        const prog = await getBadgeProgress(userId, teamId, badgeType)
        progress[badgeType] = prog
      }
      
      setBadgeProgress(progress)
    }

    loadProgress()
  }, [userId, teamId, showProgress])

  const earnedBadgeTypes = new Set(earnedBadges.map(b => b.badgeType))
  const allBadgeTypes = Object.keys(FANTASY_BADGES) as BadgeType[]
  const lockedBadges = allBadgeTypes.filter(type => !earnedBadgeTypes.has(type))

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'gold':
        return 'from-yellow-400 to-yellow-600'
      case 'platinum':
        return 'from-gray-300 to-gray-500'
      case 'purple':
        return 'from-purple-400 to-purple-600'
      case 'blue':
        return 'from-blue-400 to-blue-600'
      case 'yellow':
        return 'from-yellow-300 to-yellow-500'
      case 'orange':
        return 'from-orange-400 to-orange-600'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const BadgeCard = ({ 
    badgeType, 
    earned, 
    badge 
  }: { 
    badgeType: BadgeType
    earned: boolean
    badge?: FantasyBadge 
  }) => {
    const info = FANTASY_BADGES[badgeType]
    const progress = badgeProgress[badgeType]
    const isSelected = selectedBadge === badgeType

    return (
      <motion.div
        initial={animated ? { opacity: 0, scale: 0.9 } : {}}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={!compact ? { scale: 1.05, y: -4 } : {}}
        transition={{ duration: 0.2 }}
        onClick={() => setSelectedBadge(isSelected ? null : badgeType)}
        className="cursor-pointer"
      >
        <Card 
          className={`
            border-0 shadow-md transition-all duration-300
            ${earned 
              ? `bg-gradient-to-br ${getBadgeColor(info.color)} text-white` 
              : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900'
            }
            ${isSelected ? 'ring-2 ring-sofa-green shadow-lg' : ''}
            ${compact ? 'h-full' : ''}
          `}
        >
          <CardContent className={compact ? 'p-3' : 'p-4'}>
            {/* Badge Icon */}
            <div className="flex flex-col items-center text-center">
              <div className={`
                ${compact ? 'w-12 h-12 text-3xl' : 'w-16 h-16 text-4xl'}
                flex items-center justify-center mb-2
                ${!earned && 'opacity-30 grayscale'}
              `}>
                {earned ? (
                  <motion.div
                    initial={animated ? { scale: 0, rotate: -180 } : {}}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1
                    }}
                  >
                    {info.icon}
                  </motion.div>
                ) : (
                  <div className="relative">
                    {info.icon}
                    <Lock className={`
                      absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                      ${compact ? 'w-4 h-4' : 'w-6 h-6'}
                      text-gray-600 dark:text-gray-400
                    `} />
                  </div>
                )}
              </div>

              {/* Badge Name */}
              <h3 className={`
                font-semibold mb-1
                ${compact ? 'text-xs' : 'text-sm'}
                ${earned ? 'text-white' : 'text-sofa-text-primary'}
              `}>
                {info.name}
              </h3>

              {/* Badge Description */}
              {!compact && (
                <p className={`
                  text-xs mb-2
                  ${earned ? 'text-white/90' : 'text-sofa-text-muted'}
                `}>
                  {info.description}
                </p>
              )}

              {/* Earned Date */}
              {earned && badge && !compact && (
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {badge.earnedAt.toDate().toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              )}

              {/* Progress Bar */}
              {!earned && showProgress && progress !== null && progress < 100 && (
                <div className="w-full mt-2">
                  <div className="flex items-center justify-between text-xs text-sofa-text-muted mb-1">
                    <span>Progression</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className={`h-full ${getProgressColor(progress)} rounded-full`}
                    />
                  </div>
                </div>
              )}

              {/* Metadata */}
              {earned && badge?.metadata && isSelected && !compact && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 pt-2 border-t border-white/20 w-full"
                >
                  <div className="flex flex-col gap-1 text-xs text-white/90">
                    {badge.metadata.points && (
                      <div className="flex items-center justify-between">
                        <span>Points:</span>
                        <span className="font-semibold">{badge.metadata.points}</span>
                      </div>
                    )}
                    {badge.metadata.rank && (
                      <div className="flex items-center justify-between">
                        <span>Rang:</span>
                        <span className="font-semibold">#{badge.metadata.rank}</span>
                      </div>
                    )}
                    {badge.gameweek && (
                      <div className="flex items-center justify-between">
                        <span>Gameweek:</span>
                        <span className="font-semibold">{badge.gameweek}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (compact) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
        {allBadgeTypes.map((badgeType) => {
          const badge = earnedBadges.find(b => b.badgeType === badgeType)
          return (
            <BadgeCard
              key={badgeType}
              badgeType={badgeType}
              earned={!!badge}
              badge={badge}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Earned Badges Section */}
      {earnedBadges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-sofa-green" />
            <h2 className="text-xl font-bold text-sofa-text-primary">
              Badges Gagnés
            </h2>
            <Badge variant="secondary" className="ml-auto">
              {earnedBadges.length} / {allBadgeTypes.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {earnedBadges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={animated ? { opacity: 0, y: 20 } : {}}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <BadgeCard
                    badgeType={badge.badgeType}
                    earned={true}
                    badge={badge}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Locked Badges Section */}
      {lockedBadges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-sofa-text-muted" />
            <h2 className="text-xl font-bold text-sofa-text-primary">
              Badges à Débloquer
            </h2>
            {showProgress && (
              <TrendingUp className="w-4 h-4 text-sofa-text-muted ml-auto" />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {lockedBadges.map((badgeType, index) => (
              <motion.div
                key={badgeType}
                initial={animated ? { opacity: 0, y: 20 } : {}}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (earnedBadges.length + index) * 0.05 }}
              >
                <BadgeCard
                  badgeType={badgeType}
                  earned={false}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {earnedBadges.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-sofa-text-primary mb-2">
            Aucun badge pour le moment
          </h3>
          <p className="text-sofa-text-muted max-w-md mx-auto">
            Jouez et performez pour débloquer des badges exclusifs !
            Terminez dans le top 10, marquez 100 points en une semaine, ou devenez champion.
          </p>
        </motion.div>
      )}
    </div>
  )
}
