"use client"

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Trophy, Target } from 'lucide-react'

interface MatchCardProps {
  match: {
    id: string
    teamA: string
    teamB: string
    date: Date
    scoreA?: number
    scoreB?: number
    status: 'today' | 'upcoming' | 'live' | 'completed'
    venue?: string
  }
  index?: number
}

export function MatchCard({ match, index = 0 }: MatchCardProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date)
  }

  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return <Badge className="bg-red-500 hover:bg-red-600 animate-pulse">🔴 EN DIRECT</Badge>
      case 'today':
        return <Badge className="bg-blue-500 hover:bg-blue-600">AUJOURD'HUI</Badge>
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">TERMINÉ</Badge>
      default:
        return <Badge variant="outline">À VENIR</Badge>
    }
  }

  const hasScore = match.scoreA !== undefined && match.scoreB !== undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              {match.status === 'today' || match.status === 'live' 
                ? formatTime(match.date)
                : formatDate(match.date)
              }
            </div>
            {getStatusBadge()}
          </div>

          {/* Teams */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {match.teamA}
                </h3>
              </div>
              
              {hasScore ? (
                <div className="mx-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {match.scoreA}
                  </div>
                </div>
              ) : (
                <div className="mx-4 text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center">
              <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                VS
              </div>
            </div>

            <div className="flex items-center justify-between">
              {hasScore ? (
                <div className="mx-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {match.scoreB}
                  </div>
                </div>
              ) : (
                <div className="mx-4 text-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
              )}
              
              <div className="flex-1 text-right">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {match.teamB}
                </h3>
              </div>
            </div>
          </div>

          {/* Venue */}
          {match.venue && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                {match.venue}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}