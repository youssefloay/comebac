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
      {/* Header with status and time */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {match.round && (
            <span className="text-sofa-text-muted text-sm">
              Journée {match.round}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sofa-text-secondary text-sm">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(match.date)}</span>
          <Clock className="w-4 h-4 ml-2" />
          <span>{formatTime(match.date)}</span>
        </div>
      </div>

      {/* Teams and Score */}
      <div className="flex items-center justify-between mb-4">
        {/* Home Team */}
        <div className="sofa-team flex-1">
          <div className="sofa-team-logo">
            ⚽
          </div>
          <span className="sofa-team-name">{match.teamA}</span>
        </div>

        {/* Score */}
        <div className="px-6">
          {match.status === 'completed' || match.status === 'live' ? (
            <div className={`sofa-score ${match.status === 'live' ? 'sofa-score-live' : ''}`}>
              {match.scoreA} - {match.scoreB}
            </div>
          ) : (
            <div className="text-sofa-text-muted text-lg font-semibold">
              vs
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="sofa-team flex-1 flex-row-reverse">
          <div className="sofa-team-logo">
            ⚽
          </div>
          <span className="sofa-team-name text-right">{match.teamB}</span>
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