"use client"

import { motion } from 'framer-motion'
import { Clock, MapPin, Calendar } from 'lucide-react'

interface SofaMatchCardProps {
  match: {
    id: string
    teamA: string
    teamB: string
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="sofa-match-card"
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

      {/* Teams and Score - Mobile Optimized */}
      <div className="space-y-3">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          {/* Home Team Mobile */}
          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs">
                ⚽
              </div>
              <span className="text-sm font-semibold text-gray-900">{match.teamA}</span>
            </div>
            {(match.status === 'completed' || match.status === 'live') && (
              <div className="text-xl font-bold text-green-600">
                {match.scoreA}
              </div>
            )}
          </div>

          {/* Score Mobile */}
          <div className="text-center bg-gray-50 p-2 rounded-lg mb-2">
            {match.status === 'completed' || match.status === 'live' ? (
              <div className={`text-2xl font-bold ${match.status === 'live' ? 'text-red-600' : 'text-gray-900'}`}>
                {match.scoreA} - {match.scoreB}
              </div>
            ) : (
              <div className="text-gray-500 text-xl font-semibold">VS</div>
            )}
          </div>

          {/* Away Team Mobile */}
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs">
                ⚽
              </div>
              <span className="text-sm font-semibold text-gray-900">{match.teamB}</span>
            </div>
            {(match.status === 'completed' || match.status === 'live') && (
              <div className="text-xl font-bold text-blue-600">
                {match.scoreB}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout - Fixed Grid */}
        <div className="hidden sm:grid grid-cols-3 gap-4 items-center">
          {/* Home Team */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="sofa-team-name font-semibold">{match.teamA}</span>
              <div className="sofa-team-logo">
                ⚽
              </div>
            </div>
          </div>

          {/* Score - Centered */}
          <div className="text-center">
            {match.status === 'completed' || match.status === 'live' ? (
              <div className={`sofa-score ${match.status === 'live' ? 'sofa-score-live' : ''}`}>
                {match.scoreA} - {match.scoreB}
              </div>
            ) : (
              <div className="text-sofa-text-muted text-2xl font-bold">
                VS
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="text-left">
            <div className="flex items-center justify-start gap-2">
              <div className="sofa-team-logo">
                ⚽
              </div>
              <span className="sofa-team-name font-semibold">{match.teamB}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Venue */}
      {match.venue && (
        <div className="flex items-center justify-center gap-2 text-sofa-text-muted text-sm pt-3 border-t border-sofa-border">
          <MapPin className="w-4 h-4" />
          <span>{match.venue}</span>
        </div>
      )}
    </motion.div>
  )
}