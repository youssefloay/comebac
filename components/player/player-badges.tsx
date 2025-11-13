"use client"

import { Badge, getBadgesByRarity } from '@/lib/player-badges'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

interface PlayerBadgesProps {
  badges: Badge[]
  showAll?: boolean
  maxDisplay?: number
  allPossibleBadges?: Badge[]
  showLocked?: boolean
}

export function PlayerBadges({ 
  badges, 
  showAll = false, 
  maxDisplay = 6,
  allPossibleBadges = [],
  showLocked = false
}: PlayerBadgesProps) {
  const unlockedIds = new Set(badges.map(b => b.id))
  const lockedBadges = allPossibleBadges.filter(b => !unlockedIds.has(b.id))

  if (badges.length === 0 && !showLocked) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Aucun badge débloqué</p>
        <p className="text-xs mt-1">Jouez des matchs pour débloquer des badges!</p>
      </div>
    )
  }

  const displayBadges = showAll ? badges : badges.slice(0, maxDisplay)
  const byRarity = getBadgesByRarity(displayBadges)
  const lockedByRarity = showLocked ? getBadgesByRarity(lockedBadges) : { legendary: [], epic: [], rare: [], common: [] }

  return (
    <div className="space-y-4">
      {/* Legendary Badges */}
      {byRarity.legendary.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-yellow-600 mb-2 flex items-center gap-2">
            <span>✨</span>
            <span>LÉGENDAIRE</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {byRarity.legendary.map((badge, index) => (
              <BadgeCard key={badge.id} badge={badge} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Epic Badges */}
      {byRarity.epic.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-purple-600 mb-2 flex items-center gap-2">
            <span>💜</span>
            <span>ÉPIQUE</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {byRarity.epic.map((badge, index) => (
              <BadgeCard key={badge.id} badge={badge} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Rare Badges */}
      {byRarity.rare.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-2">
            <span>💙</span>
            <span>RARE</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {byRarity.rare.map((badge, index) => (
              <BadgeCard key={badge.id} badge={badge} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Common Badges */}
      {byRarity.common.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <span>🤍</span>
            <span>COMMUN</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {byRarity.common.map((badge, index) => (
              <BadgeCard key={badge.id} badge={badge} index={index} />
            ))}
          </div>
        </div>
      )}

      {!showAll && badges.length > maxDisplay && (
        <div className="text-center text-sm text-gray-500">
          +{badges.length - maxDisplay} autres badges
        </div>
      )}

      {/* Locked Badges */}
      {showLocked && lockedBadges.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span>Badges à Débloquer ({lockedBadges.length})</span>
          </h3>

          {/* Legendary Locked */}
          {lockedByRarity.legendary.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
                <span>🔒</span>
                <span>LÉGENDAIRE</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {lockedByRarity.legendary.map((badge, index) => (
                  <LockedBadgeCard key={badge.id} badge={badge} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Epic Locked */}
          {lockedByRarity.epic.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
                <span>🔒</span>
                <span>ÉPIQUE</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {lockedByRarity.epic.map((badge, index) => (
                  <LockedBadgeCard key={badge.id} badge={badge} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Rare Locked */}
          {lockedByRarity.rare.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
                <span>🔒</span>
                <span>RARE</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {lockedByRarity.rare.map((badge, index) => (
                  <LockedBadgeCard key={badge.id} badge={badge} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Common Locked */}
          {lockedByRarity.common.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
                <span>🔒</span>
                <span>COMMUN</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {lockedByRarity.common.map((badge, index) => (
                  <LockedBadgeCard key={badge.id} badge={badge} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BadgeCard({ badge, index }: { badge: Badge; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`${badge.color} rounded-lg p-3 text-white shadow-md hover:shadow-lg transition-shadow cursor-pointer group`}
      title={badge.description}
    >
      <div className="flex flex-col items-center text-center">
        <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">
          {badge.icon}
        </div>
        <div className="text-xs font-bold mb-0.5">{badge.name}</div>
        <div className="text-[10px] opacity-90 line-clamp-2">{badge.description}</div>
      </div>
    </motion.div>
  )
}

function LockedBadgeCard({ badge, index }: { badge: Badge; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-gray-100 rounded-lg p-3 border-2 border-gray-200 opacity-60 hover:opacity-80 transition-opacity cursor-pointer group"
      title={badge.description}
    >
      <div className="flex flex-col items-center text-center">
        <div className="text-3xl mb-1 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="opacity-30">{badge.icon}</div>
        </div>
        <div className="text-xs font-bold mb-0.5 text-gray-700">{badge.name}</div>
        <div className="text-[10px] text-gray-500 line-clamp-2">{badge.description}</div>
      </div>
    </motion.div>
  )
}

export function PlayerBadgesMini({ badges, count = 3 }: { badges: Badge[]; count?: number }) {
  if (badges.length === 0) return null

  const topBadges = badges.slice(0, count)

  return (
    <div className="flex gap-1">
      {topBadges.map((badge) => (
        <div
          key={badge.id}
          className={`${badge.color} rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-sm`}
          title={`${badge.name}: ${badge.description}`}
        >
          {badge.icon}
        </div>
      ))}
      {badges.length > count && (
        <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-xs font-semibold text-gray-600">
          +{badges.length - count}
        </div>
      )}
    </div>
  )
}
