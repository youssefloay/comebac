"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, MapPin, Calendar, Target, CreditCard, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getMatchResult } from '@/lib/db'
import type { MatchResult } from '@/lib/types'

interface MatchDetailsPopupProps {
  isOpen: boolean
  onClose: () => void
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
}

export function MatchDetailsPopup({ isOpen, onClose, match }: MatchDetailsPopupProps) {
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && match.status !== 'upcoming') {
      setLoading(true)
      getMatchResult(match.id)
        .then(setMatchResult)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isOpen, match.id, match.status])

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Popup Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusBadge()}
                    {match.round && (
                      <span className="text-gray-500 text-sm">
                        Journée {match.round}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Date and Time */}
                <div className="flex items-center gap-4 mt-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(match.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{formatTime(match.date)}</span>
                  </div>
                </div>
              </div>

              {/* Score Section */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6 items-center mb-8">
                  {/* Home Team */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-3xl">⚽</span>
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">{match.teamA}</h3>
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    {match.status === 'completed' || match.status === 'live' ? (
                      <div className={`text-6xl font-bold ${match.status === 'live' ? 'text-red-600' : 'text-gray-900'} mb-2`}>
                        {match.scoreA} - {match.scoreB}
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-gray-400 mb-2">VS</div>
                    )}
                    {match.status === 'live' && (
                      <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        En Direct
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-3xl">⚽</span>
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">{match.teamB}</h3>
                  </div>
                </div>

                {/* Venue */}
                {match.venue && (
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-8 pb-6 border-b border-gray-200">
                    <MapPin className="w-4 h-4" />
                    <span>{match.venue}</span>
                  </div>
                )}

                {/* Match Details */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Chargement des détails...</p>
                  </div>
                ) : matchResult && match.status !== 'upcoming' ? (
                  <div className="space-y-6">
                    {/* Goals Section */}
                    {(matchResult.homeTeamGoalScorers.length > 0 || matchResult.awayTeamGoalScorers.length > 0) && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-lg">Buts</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Home Team Goals */}
                          <div className="bg-green-50 p-4 rounded-xl">
                            <h5 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                              <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                                <span className="text-sm">⚽</span>
                              </div>
                              {match.teamA}
                            </h5>
                            <div className="space-y-3">
                              {matchResult.homeTeamGoalScorers.map((goal, index) => (
                                <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-green-200">
                                  <div className="font-semibold text-green-900 flex items-center gap-2">
                                    <span className="text-green-600">⚽</span>
                                    {goal.playerName}
                                  </div>
                                  {goal.assists && (
                                    <div className="text-sm text-green-700 mt-1 flex items-center gap-1">
                                      <span className="text-green-500">🎯</span>
                                      Passe: {goal.assists}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {matchResult.homeTeamGoalScorers.length === 0 && (
                                <div className="text-green-600 text-sm italic text-center py-2">Aucun but marqué</div>
                              )}
                            </div>
                          </div>

                          {/* Away Team Goals */}
                          <div className="bg-blue-50 p-4 rounded-xl">
                            <h5 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                                <span className="text-sm">⚽</span>
                              </div>
                              {match.teamB}
                            </h5>
                            <div className="space-y-3">
                              {matchResult.awayTeamGoalScorers.map((goal, index) => (
                                <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-blue-200">
                                  <div className="font-semibold text-blue-900 flex items-center gap-2">
                                    <span className="text-blue-600">⚽</span>
                                    {goal.playerName}
                                  </div>
                                  {goal.assists && (
                                    <div className="text-sm text-blue-700 mt-1 flex items-center gap-1">
                                      <span className="text-blue-500">🎯</span>
                                      Passe: {goal.assists}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {matchResult.awayTeamGoalScorers.length === 0 && (
                                <div className="text-blue-600 text-sm italic text-center py-2">Aucun but marqué</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cards Section */}
                    {(matchResult.homeTeamYellowCards?.length || matchResult.awayTeamYellowCards?.length || 
                      matchResult.homeTeamRedCards?.length || matchResult.awayTeamRedCards?.length) && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <CreditCard className="w-5 h-5 text-yellow-600" />
                          <h4 className="font-semibold text-lg">Cartons</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Home Team Cards */}
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <CreditCard className="w-5 h-5 text-gray-600" />
                              {match.teamA}
                            </h5>
                            <div className="space-y-2">
                              {matchResult.homeTeamYellowCards?.map((card, index) => (
                                <div key={index} className="bg-yellow-100 p-3 rounded-lg flex items-center gap-3 border border-yellow-200">
                                  <div className="w-5 h-7 bg-yellow-400 rounded-sm shadow-sm border border-yellow-500"></div>
                                  <span className="text-yellow-900 font-medium">{card.playerName}</span>
                                </div>
                              ))}
                              {matchResult.homeTeamRedCards?.map((card, index) => (
                                <div key={index} className="bg-red-100 p-3 rounded-lg flex items-center gap-3 border border-red-200">
                                  <div className="w-5 h-7 bg-red-500 rounded-sm shadow-sm border border-red-600"></div>
                                  <span className="text-red-900 font-medium">{card.playerName}</span>
                                </div>
                              ))}
                              {!matchResult.homeTeamYellowCards?.length && !matchResult.homeTeamRedCards?.length && (
                                <div className="text-gray-500 text-sm italic text-center py-2">Aucun carton</div>
                              )}
                            </div>
                          </div>

                          {/* Away Team Cards */}
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <CreditCard className="w-5 h-5 text-gray-600" />
                              {match.teamB}
                            </h5>
                            <div className="space-y-2">
                              {matchResult.awayTeamYellowCards?.map((card, index) => (
                                <div key={index} className="bg-yellow-100 p-3 rounded-lg flex items-center gap-3 border border-yellow-200">
                                  <div className="w-5 h-7 bg-yellow-400 rounded-sm shadow-sm border border-yellow-500"></div>
                                  <span className="text-yellow-900 font-medium">{card.playerName}</span>
                                </div>
                              ))}
                              {matchResult.awayTeamRedCards?.map((card, index) => (
                                <div key={index} className="bg-red-100 p-3 rounded-lg flex items-center gap-3 border border-red-200">
                                  <div className="w-5 h-7 bg-red-500 rounded-sm shadow-sm border border-red-600"></div>
                                  <span className="text-red-900 font-medium">{card.playerName}</span>
                                </div>
                              ))}
                              {!matchResult.awayTeamYellowCards?.length && !matchResult.awayTeamRedCards?.length && (
                                <div className="text-gray-500 text-sm italic text-center py-2">Aucun carton</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : match.status === 'upcoming' ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Match à venir</h3>
                    <p className="text-gray-500">Les détails du match seront disponibles après le coup d'envoi.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Aucun détail disponible pour ce match.</div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}