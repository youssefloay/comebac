'use client'

import { useState, useEffect } from 'react'
import { Calendar, Trophy, Clock, MapPin, TrendingUp, ArrowLeft, Flame } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { PreseasonMatch, PreseasonStats } from '@/lib/types'
import { MatchDetailsModal } from '@/components/preseason/match-details-modal'

export default function PreseasonPage() {
  const [matches, setMatches] = useState<(PreseasonMatch & { teamALogo?: string; teamBLogo?: string })[]>([])
  const [ranking, setRanking] = useState<PreseasonStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'finished' | 'ranking'>('upcoming')
  const [selectedMatch, setSelectedMatch] = useState<(PreseasonMatch & { teamALogo?: string; teamBLogo?: string }) | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [matchesRes, rankingRes] = await Promise.all([
        fetch('/api/preseason/matches'),
        fetch('/api/preseason/ranking'),
      ])

      const matchesData = await matchesRes.json()
      const rankingData = await rankingRes.json()

      setMatches(matchesData.matches || [])
      setRanking(rankingData.ranking || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const upcomingMatches = matches.filter((m) => m.status === 'upcoming' || m.status === 'in_progress')
  const finishedMatches = matches.filter((m) => m.status === 'finished')

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatShortDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const getGoalDifference = (stats: PreseasonStats) => {
    return stats.goalsFor - stats.goalsAgainst
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Header avec bouton retour */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/public"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour</span>
            </Link>
          </div>
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3 mb-3"
            >
              <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                Preseason
              </h1>
            </motion.div>
            <p className="text-orange-100 text-lg">
              Matchs et classement de la présaison
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Modern */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {[
              { id: 'upcoming', label: 'Matchs à venir', icon: Calendar },
              { id: 'finished', label: 'Résultats', icon: Trophy },
              { id: 'ranking', label: 'Classement', icon: TrendingUp },
            ].map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <motion.button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-all whitespace-nowrap relative ${
                    isActive
                      ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-orange-50 dark:bg-orange-900/20 rounded-t-lg"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-orange-600 dark:text-orange-400' : ''}`} />
                  <span className="relative z-10">{label}</span>
                </motion.button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upcoming Matches */}
        {activeTab === 'upcoming' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {upcomingMatches.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Aucun match à venir
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Les prochains matchs de présaison seront affichés ici
                  </p>
                </motion.div>
              </div>
            ) : (
              upcomingMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all cursor-pointer"
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">{formatShortDate(match.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{match.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{match.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 mb-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          {match.teamALogo ? (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-gray-50 rounded-2xl p-0.5 shadow-xl border-[3px] border-gray-300 dark:border-gray-400 flex-shrink-0 ring-2 ring-gray-100 dark:ring-gray-700 overflow-hidden">
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
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-200 to-red-200 dark:from-orange-800/40 dark:to-red-800/40 rounded-2xl flex items-center justify-center border-[3px] border-orange-300 dark:border-orange-700 flex-shrink-0 shadow-xl ring-2 ring-orange-100 dark:ring-orange-900/30">
                              <span className="text-orange-800 dark:text-orange-200 font-bold text-lg sm:text-xl">
                                {match.teamAName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                            {match.teamAName}
                          </h3>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm sm:text-base flex-shrink-0">vs</span>
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          {match.teamBLogo ? (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-gray-50 rounded-2xl p-0.5 shadow-xl border-[3px] border-gray-300 dark:border-gray-400 flex-shrink-0 ring-2 ring-gray-100 dark:ring-gray-700 overflow-hidden">
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
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-200 to-indigo-200 dark:from-blue-800/40 dark:to-indigo-800/40 rounded-2xl flex items-center justify-center border-[3px] border-blue-300 dark:border-blue-700 flex-shrink-0 shadow-xl ring-2 ring-blue-100 dark:ring-blue-900/30">
                              <span className="text-blue-800 dark:text-blue-200 font-bold text-lg sm:text-xl">
                                {match.teamBName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                            {match.teamBName}
                          </h3>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          match.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 animate-pulse'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}
                      >
                        {match.status === 'in_progress' ? '⚡ En cours' : '📅 À venir'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Finished Matches */}
        {activeTab === 'finished' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {finishedMatches.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Aucun résultat disponible
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Les résultats des matchs de présaison seront affichés ici
                  </p>
                </motion.div>
              </div>
            ) : (
              finishedMatches.map((match, index) => {
                const teamAWon = match.scoreA! > match.scoreB!
                const teamBWon = match.scoreB! > match.scoreA!
                const isDraw = match.scoreA === match.scoreB

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all cursor-pointer"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{formatShortDate(match.date)}</span>
                      <MapPin className="w-4 h-4 ml-2" />
                      <span>{match.location}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 items-center">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-2">
                          {match.teamALogo ? (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-50 rounded-2xl p-0.5 shadow-xl border-[3px] border-gray-300 dark:border-gray-400 ring-2 ring-gray-100 dark:ring-gray-700 overflow-hidden">
                              <img
                                src={match.teamALogo}
                                alt={match.teamAName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  if (e.currentTarget.parentElement) {
                                    const initials = match.teamAName.substring(0, 2).toUpperCase()
                                    e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-700 font-bold text-base sm:text-lg">${initials}</div>`
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-200 to-red-200 dark:from-orange-800/40 dark:to-red-800/40 rounded-2xl flex items-center justify-center border-[3px] border-orange-300 dark:border-orange-700 shadow-xl ring-2 ring-orange-100 dark:ring-orange-900/30">
                              <span className="text-orange-800 dark:text-orange-200 font-bold text-base sm:text-lg">
                                {match.teamAName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={`${teamAWon ? 'font-bold text-base sm:text-lg' : 'text-gray-700 dark:text-gray-300'}`}>
                          {match.teamAName}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                          {match.scoreA} - {match.scoreB}
                        </div>
                        {match.penaltiesA !== undefined && match.penaltiesB !== undefined && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            (TAB: {match.penaltiesA} - {match.penaltiesB})
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-2">
                          {match.teamBLogo ? (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-50 rounded-2xl p-0.5 shadow-xl border-[3px] border-gray-300 dark:border-gray-400 ring-2 ring-gray-100 dark:ring-gray-700 overflow-hidden">
                              <img
                                src={match.teamBLogo}
                                alt={match.teamBName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  if (e.currentTarget.parentElement) {
                                    const initials = match.teamBName.substring(0, 2).toUpperCase()
                                    e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-700 font-bold text-base sm:text-lg">${initials}</div>`
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-200 to-indigo-200 dark:from-blue-800/40 dark:to-indigo-800/40 rounded-2xl flex items-center justify-center border-[3px] border-blue-300 dark:border-blue-700 shadow-xl ring-2 ring-blue-100 dark:ring-blue-900/30">
                              <span className="text-blue-800 dark:text-blue-200 font-bold text-base sm:text-lg">
                                {match.teamBName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={`${teamBWon ? 'font-bold text-base sm:text-lg' : 'text-gray-700 dark:text-gray-300'}`}>
                          {match.teamBName}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        )}

        {/* Ranking */}
        {activeTab === 'ranking' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Classement Preseason
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rang
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Équipe
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      J
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      V
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      D
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      VP
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DP
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BP
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BC
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DB
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pts
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {ranking.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center">
                        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                          Aucune statistique disponible
                        </p>
                      </td>
                    </tr>
                  ) : (
                    ranking.map((team, index) => {
                      const goalDiff = getGoalDifference(team)
                      const isTopThree = index < 3

                      return (
                        <motion.tr
                          key={team.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                            isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10' : ''
                          }`}
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                              {index === 1 && <Trophy className="w-5 h-5 text-gray-400" />}
                              {index === 2 && <Trophy className="w-5 h-5 text-orange-500" />}
                              <span className={`text-sm font-medium ${isTopThree ? 'font-bold text-lg' : ''}`}>
                                {index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {team.teamName}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-gray-600 dark:text-gray-400">
                            {team.played}
                          </td>
                          <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm font-semibold text-green-600 dark:text-green-400">
                            {team.wins}
                          </td>
                          <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm font-semibold text-red-600 dark:text-red-400">
                            {team.losses}
                          </td>
                          <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-gray-600 dark:text-gray-400">
                            {team.penaltyWins}
                          </td>
                          <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-gray-600 dark:text-gray-400">
                            {team.penaltyLosses}
                          </td>
                          <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                            {team.goalsFor}
                          </td>
                          <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                            {team.goalsAgainst}
                          </td>
                          <td className={`px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm font-semibold ${
                            goalDiff > 0 ? 'text-green-600 dark:text-green-400' : goalDiff < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {goalDiff > 0 ? '+' : ''}{goalDiff}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                            <span className={`font-bold ${isTopThree ? 'text-2xl' : 'text-xl'} text-orange-600 dark:text-orange-400`}>
                              {team.points}
                            </span>
                          </td>
                        </motion.tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Spacer pour la navigation mobile */}
      <div className="h-20"></div>

      {/* Match Details Modal */}
      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  )
}
