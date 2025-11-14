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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/public/team/${team.id}`}>
        <div className="sofa-card cursor-pointer group h-full relative">
          {/* Favorite Button - Outside card, top right corner */}
          <div className="absolute -top-2 -right-2 z-20" onClick={(e) => e.preventDefault()}>
            <FavoriteButton teamId={team.id} teamName={team.name} size="sm" />
          </div>

          {/* Team Header - Compact */}
          <div 
            className="h-16 sm:h-20 relative overflow-hidden flex items-center px-4 gap-3"
            style={{ 
              background: `linear-gradient(135deg, ${team.color || '#00d4aa'} 0%, ${team.color || '#00d4aa'}dd 100%)` 
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            
            {/* Logo */}
            {team.logo && (
              <div className="relative z-10 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={team.logo} 
                    alt={team.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* Team Info */}
            <div className="relative z-10 flex-1 min-w-0 pr-8">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:scale-105 transition-transform truncate">
                {team.name}
              </h3>
              {(team.school || team.schoolName) && (
                <p className="text-xs text-white/90 truncate">
                  {team.school || team.schoolName}
                </p>
              )}
            </div>
          </div>

          {/* Team Info */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sofa-text-accent" />
                <span className="text-sm text-sofa-text-primary font-medium">
                  {team.playerCount} joueurs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-sofa-text-muted" />
                <span className="text-xs text-sofa-text-muted">
                  Stade
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-3 border-t border-sofa-border">
              <div className="flex items-center justify-center gap-2 text-sofa-text-accent group-hover:text-sofa-green transition-colors">
                <span className="text-xs font-medium">Voir l'équipe</span>
                <Target className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}