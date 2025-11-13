"use client"

import { motion } from 'framer-motion'
import { Clock, MapPin, Calendar } from 'lucide-react'
import { useState } from 'react'
import { MatchDetailsPopup } from './match-details-popup'
import { TeamLink } from '@/components/ui/team-link'
import { getTeamColorStyle, getTeamTextColorStyle } from '@/lib/team-colors'

interface SofaMatchCardProps {
  match: {
    id: string
    teamA: string
    teamB: string
    teamAId?: string
    teamBId?: string
    scoreA?: number
    scoreB?: number
    date: Date
    status: 'live' | 'completed' | 'upcoming'
    venue?: string
    round?: number
  }
  index: number
}

export function SofaMatchCard({ match, index }: SofaMatchCardProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  
  // Générer les couleurs automatiquement pour chaque équipe
  const teamAColors = getTeamColorStyle(match.teamAId, match.teamA, 'light')
  const teamBColors = getTeamColorStyle(match.teamBId, match.teamB, 'light')
  const teamATextColor = getTeamTextColorStyle(match.teamAId, match.teamA)
  const teamBTextColor = getTeamTextColorStyle(match.teamBId, match.teamB)

  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return <span className="sofa-badge sofa-badge-live">En Direct</span>
      case 'completed':
        return <span className="sofa-badge sofa-badge-completed">Terminé</span>
      case 'upcoming':
        return <span className="sofa-badge sofa-badge-scheduled">À venir</span>
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    }).format(date)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="sofa-match-card cursor-pointer hover:shadow-lg transition-shadow duration-200"
        style={{ wordBreak: 'break-word', hyphens: 'auto' }}
        onClick={() => setIsPopupOpen(true)}
      >
      {/* Header with status and time - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {getStatusBadge()}
          {match.round && (
            <span className="text-sofa-text-muted text-xs sm:text-sm">
              Journée {match.round}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 text-sofa-text-secondary text-xs sm:text-sm">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{formatDate(match.date)}</span>
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
          <span>{formatTime(match.date)}</span>
        </div>
      </div>

      {/* Teams and Score - Clean Layout */}
      <div className="space-y-6">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div className="space-y-3">
            {/* Home Team */}
            <div className="flex items-center justify-between p-3 rounded-lg" style={teamAColors}>
              <div className="flex-1 pr-3">
                {match.teamAId ? (
                  <TeamLink 
                    teamId={match.teamAId} 
                    teamName={match.teamA}
                    className="font-bold text-gray-900 text-sm leading-tight block break-words hyphens-auto"
                    style={teamATextColor}
                  />
                ) : (
                  <span className="font-bold text-gray-900 text-sm leading-tight block break-words hyphens-auto">{match.teamA}</span>
                )}
              </div>
              {match.status === 'completed' || match.status === 'live' ? (
                <div className="text-xl font-bold flex-shrink-0" style={teamATextColor}>
                  {match.scoreA}
                </div>
              ) : null}
            </div>
            
            {/* Score */}
            <div className="text-center py-2">
              {match.status === 'completed' || match.status === 'live' ? (
                <div className={`text-2xl font-bold ${match.status === 'live' ? 'text-red-600' : 'text-gray-900'}`}>
                  {match.scoreA} - {match.scoreB}
                </div>
              ) : (
                <div className="text-gray-400 text-xl font-bold">VS</div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between p-3 rounded-lg" style={teamBColors}>
              <div className="flex-1 pr-3">
                {match.teamBId ? (
                  <TeamLink 
                    teamId={match.teamBId} 
                    teamName={match.teamB}
                    className="font-bold text-gray-900 text-sm leading-tight block break-words hyphens-auto"
                    style={teamBTextColor}
                  />
                ) : (
                  <span className="font-bold text-gray-900 text-sm leading-tight block break-words hyphens-auto">{match.teamB}</span>
                )}
              </div>
              {match.status === 'completed' || match.status === 'live' ? (
                <div className="text-xl font-bold flex-shrink-0" style={teamBTextColor}>
                  {match.scoreB}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Optimized Grid */}
        <div className="hidden sm:grid grid-cols-3 gap-3 md:gap-4 items-center py-4">
          {/* Home Team */}
          <div className="text-right pr-2">
            {match.teamAId ? (
              <TeamLink 
                teamId={match.teamAId} 
                teamName={match.teamA}
                className="font-bold text-sm md:text-base text-gray-900 leading-tight block break-words hyphens-auto"
                style={teamATextColor}
              />
            ) : (
              <span className="font-bold text-sm md:text-base text-gray-900 leading-tight block break-words hyphens-auto">{match.teamA}</span>
            )}
          </div>

          {/* Score - Centered */}
          <div className="text-center px-1">
            {match.status === 'completed' || match.status === 'live' ? (
              <div className={`text-2xl md:text-3xl font-bold ${match.status === 'live' ? 'text-red-600' : 'text-gray-900'}`}>
                {match.scoreA} - {match.scoreB}
              </div>
            ) : (
              <div className="text-gray-400 text-xl md:text-2xl font-bold">VS</div>
            )}
          </div>

          {/* Away Team */}
          <div className="text-left pl-2">
            {match.teamBId ? (
              <TeamLink 
                teamId={match.teamBId} 
                teamName={match.teamB}
                className="font-bold text-sm md:text-base text-gray-900 leading-tight block break-words hyphens-auto"
                style={teamBTextColor}
              />
            ) : (
              <span className="font-bold text-sm md:text-base text-gray-900 leading-tight block break-words hyphens-auto">{match.teamB}</span>
            )}
          </div>
        </div>
      </div>

      {/* Venue and Click Indicator */}
      <div className="pt-4 border-t border-gray-100">
        {match.venue && (
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-3">
            <MapPin className="w-4 h-4" />
            <span>{match.venue}</span>
          </div>
        )}
        
        {/* Click indicator - Only show for completed matches */}
        {(match.status === 'completed' || match.status === 'live') && (
          <div className="text-center">
            <span className="text-xs text-gray-400 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
              👆 Cliquez pour voir les détails du match
            </span>
          </div>
        )}
      </div>
      </motion.div>

      <MatchDetailsPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        match={match}
      />
    </>
  )
}