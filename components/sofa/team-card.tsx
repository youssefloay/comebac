"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, MapPin, Target } from 'lucide-react'
import { FavoriteButton } from '@/components/favorites/favorite-button'

interface SofaTeamCardProps {
  team: {
    id: string
    name: string
    color?: string
    playerCount: number
    logo?: string
    school?: string
    schoolName?: string
  }
  index: number
}

export function SofaTeamCard({ team, index }: SofaTeamCardProps) {
  const teamColor = team.color || '#3b82f6'
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="h-full"
    >
      <Link href={`/public/team/${team.id}`}>
        <div className="group relative h-full flex flex-col rounded-2xl overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
          {/* Favorite Button - Top right corner */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20" onClick={(e) => e.preventDefault()}>
            <FavoriteButton teamId={team.id} teamName={team.name} size="sm" />
          </div>

          {/* Team Header - Optimized for Mobile */}
          <div 
            className="relative overflow-hidden pt-6 pb-4 sm:pt-8 sm:pb-6 px-4 sm:px-5"
            style={{ 
              background: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}dd 50%, ${teamColor}cc 100%)` 
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"></div>
            
            {/* Logo and Name - Compact for Mobile */}
            <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
              {team.logo ? (
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden border-2 border-white/50 shadow-xl">
                  <img 
                    src={team.logo} 
                    alt={team.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      if (e.currentTarget.parentElement) {
                        const initials = team.name.substring(0, 2).toUpperCase()
                        e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-base sm:text-lg">${initials}</div>`
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50 shadow-xl">
                  <span className="text-white font-bold text-base sm:text-lg">
                    {team.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Team Name - Mobile Optimized */}
              <div className="text-center w-full px-2">
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:scale-105 transition-transform drop-shadow-lg mb-0.5 sm:mb-1 line-clamp-2">
                  {team.name}
                </h3>
                {(team.school || team.schoolName) && (
                  <p className="text-[10px] sm:text-xs text-white/90 drop-shadow line-clamp-1">
                    {team.school || team.schoolName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Team Stats - Mobile First Design */}
          <div className="flex-1 flex flex-col justify-between p-3 sm:p-5">
            {/* Stats - Compact Grid for Mobile */}
            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200/30 dark:border-blue-800/30">
                <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex-shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Joueurs</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">{team.playerCount}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/30 border border-gray-200/30 dark:border-gray-700/30">
                <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-gray-500/10 dark:bg-gray-400/10 flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Stade</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">Principal</p>
                </div>
              </div>
            </div>

            {/* Action Button - Mobile Optimized */}
            <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 group-hover:from-gray-200 group-hover:to-gray-100 dark:group-hover:from-gray-700 dark:group-hover:to-gray-600 transition-all duration-300">
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Voir l'équipe
                </span>
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}