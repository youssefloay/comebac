'use client'

import { useState, useEffect } from 'react'
import { X, Users, Calendar, Clock, MapPin, Trophy, Target } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { PreseasonMatch } from '@/lib/types'

interface Player {
  id: string
  name: string
  firstName?: string
  lastName?: string
  nickname?: string
  number: number
  position?: string
  photo?: string
}

interface Lineup {
  id: string
  teamId: string
  startersData: Player[]
  substitutesData: Player[]
  formation: string
  validated: boolean
}

interface MatchDetailsModalProps {
  match: PreseasonMatch & { teamALogo?: string; teamBLogo?: string }
  isOpen: boolean
  onClose: () => void
}

export function MatchDetailsModal({ match, isOpen, onClose }: MatchDetailsModalProps) {
  const [lineups, setLineups] = useState<Lineup[]>([])
  const [loadingLineups, setLoadingLineups] = useState(false)

  useEffect(() => {
    if (isOpen && match.id) {
      loadLineups()
    }
  }, [isOpen, match.id])

  const loadLineups = async () => {
    try {
      setLoadingLineups(true)
      const response = await fetch(`/api/preseason/lineups?matchId=${match.id}`)
      const data = await response.json()
      setLineups(data.lineups || [])
    } catch (error) {
      console.error('Error loading lineups:', error)
    } finally {
      setLoadingLineups(false)
    }
  }

  const teamALineup = lineups.find(l => l.teamId === match.teamAId)
  const teamBLineup = lineups.find(l => l.teamId === match.teamBId)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getPlayerDisplayName = (player: Player) => {
    if (player.nickname) {
      return `${player.name} (${player.nickname})`
    }
    return player.name
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Détails du Match</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-orange-100 flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(match.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{match.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{match.location}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Match Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Team A */}
                <div className="text-center">
                  <Link
                    href={`/public/team/${match.teamAId}`}
                    className="block hover:opacity-80 transition-opacity"
                  >
                    {match.teamALogo ? (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3 bg-white dark:bg-gray-100 rounded-2xl p-0.5 shadow-xl border-2 border-gray-200 dark:border-gray-300 overflow-hidden">
                        <img
                          src={match.teamALogo}
                          alt={match.teamAName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.parentElement) {
                              const initials = match.teamAName.substring(0, 2).toUpperCase()
                              e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-700 font-bold text-lg sm:text-xl">${initials}</div>`
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center border-2 border-orange-200 dark:border-orange-800 shadow-xl">
                        <span className="text-orange-700 dark:text-orange-300 font-bold text-lg sm:text-xl">
                          {match.teamAName.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                      {match.teamAName}
                    </h3>
                  </Link>
                </div>

                {/* Score */}
                <div className="text-center">
                  {match.status === 'finished' && match.scoreA !== undefined && match.scoreB !== undefined ? (
                    <>
                      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {match.scoreA} - {match.scoreB}
                      </div>
                      {match.penaltiesA !== undefined && match.penaltiesB !== undefined && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          TAB: {match.penaltiesA} - {match.penaltiesB}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-gray-400">VS</div>
                  )}
                </div>

                {/* Team B */}
                <div className="text-center">
                  <Link
                    href={`/public/team/${match.teamBId}`}
                    className="block hover:opacity-80 transition-opacity"
                  >
                    {match.teamBLogo ? (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3 bg-white dark:bg-gray-100 rounded-2xl p-0.5 shadow-xl border-2 border-gray-200 dark:border-gray-300 overflow-hidden">
                        <img
                          src={match.teamBLogo}
                          alt={match.teamBName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.parentElement) {
                              const initials = match.teamBName.substring(0, 2).toUpperCase()
                              e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-700 font-bold text-lg sm:text-xl">${initials}</div>`
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center border-2 border-blue-200 dark:border-blue-800 shadow-xl">
                        <span className="text-blue-700 dark:text-blue-300 font-bold text-lg sm:text-xl">
                          {match.teamBName.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                      {match.teamBName}
                    </h3>
                  </Link>
                </div>
              </div>

              {/* Lineups */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Compositions
                </h3>

                {loadingLineups ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Chargement des compositions...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Team A Lineup */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{match.teamAName}</h4>
                        {teamALineup?.validated && (
                          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full">
                            ✓ Validée
                          </span>
                        )}
                      </div>
                      {teamALineup ? (
                        <div className="space-y-4">
                          {teamALineup.formation && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Formation: <span className="font-semibold">{teamALineup.formation}</span>
                            </div>
                          )}
                          {teamALineup.startersData.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Titulaires ({teamALineup.startersData.length})
                              </h5>
                              <div className="space-y-1">
                                {teamALineup.startersData.map((player) => (
                                  <div
                                    key={player.id}
                                    className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 rounded-lg p-2"
                                  >
                                    <span className="font-bold text-orange-600 dark:text-orange-400 w-6">
                                      #{player.number}
                                    </span>
                                    <span className="flex-1 text-gray-900 dark:text-white">
                                      {getPlayerDisplayName(player)}
                                    </span>
                                    {player.position && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {player.position}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {teamALineup.substitutesData.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Remplaçants ({teamALineup.substitutesData.length})
                              </h5>
                              <div className="space-y-1">
                                {teamALineup.substitutesData.map((player) => (
                                  <div
                                    key={player.id}
                                    className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 rounded-lg p-2"
                                  >
                                    <span className="font-bold text-orange-600 dark:text-orange-400 w-6">
                                      #{player.number}
                                    </span>
                                    <span className="flex-1 text-gray-900 dark:text-white">
                                      {getPlayerDisplayName(player)}
                                    </span>
                                    {player.position && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {player.position}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          Composition non annoncée
                        </p>
                      )}
                    </div>

                    {/* Team B Lineup */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{match.teamBName}</h4>
                        {teamBLineup?.validated && (
                          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full">
                            ✓ Validée
                          </span>
                        )}
                      </div>
                      {teamBLineup ? (
                        <div className="space-y-4">
                          {teamBLineup.formation && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Formation: <span className="font-semibold">{teamBLineup.formation}</span>
                            </div>
                          )}
                          {teamBLineup.startersData.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Titulaires ({teamBLineup.startersData.length})
                              </h5>
                              <div className="space-y-1">
                                {teamBLineup.startersData.map((player) => (
                                  <div
                                    key={player.id}
                                    className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 rounded-lg p-2"
                                  >
                                    <span className="font-bold text-blue-600 dark:text-blue-400 w-6">
                                      #{player.number}
                                    </span>
                                    <span className="flex-1 text-gray-900 dark:text-white">
                                      {getPlayerDisplayName(player)}
                                    </span>
                                    {player.position && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {player.position}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {teamBLineup.substitutesData.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Remplaçants ({teamBLineup.substitutesData.length})
                              </h5>
                              <div className="space-y-1">
                                {teamBLineup.substitutesData.map((player) => (
                                  <div
                                    key={player.id}
                                    className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 rounded-lg p-2"
                                  >
                                    <span className="font-bold text-blue-600 dark:text-blue-400 w-6">
                                      #{player.number}
                                    </span>
                                    <span className="flex-1 text-gray-900 dark:text-white">
                                      {getPlayerDisplayName(player)}
                                    </span>
                                    {player.position && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {player.position}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          Composition non annoncée
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

