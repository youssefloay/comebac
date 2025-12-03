'use client'

import { useState, useEffect } from 'react'
import { Calendar, Trophy, TrendingUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { PreseasonMatch, PreseasonStats } from '@/lib/types'
import { motion } from 'framer-motion'

interface PreseasonSectionProps {
  teamId: string
  teamName?: string
}

export function PreseasonSection({ teamId, teamName }: PreseasonSectionProps) {
  const [upcomingMatches, setUpcomingMatches] = useState<PreseasonMatch[]>([])
  const [finishedMatches, setFinishedMatches] = useState<PreseasonMatch[]>([])
  const [teamRank, setTeamRank] = useState<number | null>(null)
  const [teamStats, setTeamStats] = useState<PreseasonStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPreseasonData()
  }, [teamId])

  const loadPreseasonData = async () => {
    try {
      setLoading(true)
      const [matchesRes, rankingRes] = await Promise.all([
        fetch('/api/preseason/matches'),
        fetch('/api/preseason/ranking'),
      ])

      const matchesData = await matchesRes.json()
      const rankingData = await rankingRes.json()

      const allMatches = matchesData.matches || []
      const ranking = rankingData.ranking || []

      // Filter matches for this team
      const teamMatches = allMatches.filter(
        (m: PreseasonMatch) => m.teamAId === teamId || m.teamBId === teamId
      )

      setUpcomingMatches(
        teamMatches.filter((m: PreseasonMatch) => m.status === 'upcoming' || m.status === 'in_progress')
      )
      setFinishedMatches(teamMatches.filter((m: PreseasonMatch) => m.status === 'finished'))

      // Find team rank
      const teamRankIndex = ranking.findIndex((s: PreseasonStats) => s.teamId === teamId)
      if (teamRankIndex !== -1) {
        setTeamRank(teamRankIndex + 1)
        setTeamStats(ranking[teamRankIndex])
      }
    } catch (error) {
      console.error('Error loading preseason data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  if (loading) {
    return null
  }

  // Don't show section if no preseason data
  if (upcomingMatches.length === 0 && finishedMatches.length === 0 && !teamRank) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="mt-8 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preseason</h2>
        <Link
          href="/preseason"
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Voir tout <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Ranking Card */}
      {teamRank && teamStats && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-white via-white to-yellow-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Classement Preseason
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {teamName || 'Votre équipe'} • Rang #{teamRank}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {teamStats.points}
              </div>
              <p className="text-xs text-gray-500">Points</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{teamStats.played}</div>
              <div className="text-gray-500">Joués</div>
            </div>
            <div>
              <div className="font-semibold text-green-600">{teamStats.wins}</div>
              <div className="text-gray-500">Victoires</div>
            </div>
            <div>
              <div className="font-semibold text-red-600">{teamStats.losses}</div>
              <div className="text-gray-500">Défaites</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {teamStats.goalsFor - teamStats.goalsAgainst > 0 ? '+' : ''}
                {teamStats.goalsFor - teamStats.goalsAgainst}
              </div>
              <div className="text-gray-500">Différence</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Prochains matchs
          </h3>
          <div className="space-y-3">
            {upcomingMatches.slice(0, 3).map((match) => {
              const isHome = match.teamAId === teamId
              const opponent = isHome ? match.teamBName : match.teamAName
              return (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      vs {opponent}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(match.date)} à {match.time} • {match.location}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {finishedMatches.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-600" />
            Derniers résultats
          </h3>
          <div className="space-y-3">
            {finishedMatches.slice(0, 3).map((match) => {
              const isHome = match.teamAId === teamId
              const opponent = isHome ? match.teamBName : match.teamAName
              const myScore = isHome ? match.scoreA : match.scoreB
              const oppScore = isHome ? match.scoreB : match.scoreA
              const won = myScore! > oppScore!
              const draw = myScore === oppScore

              return (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      vs {opponent}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(match.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${won ? 'text-green-600' : draw ? 'text-yellow-600' : 'text-red-600'}`}>
                      {myScore} - {oppScore}
                    </div>
                    {match.penaltiesA !== undefined && match.penaltiesB !== undefined && (
                      <div className="text-xs text-gray-500">
                        (P: {isHome ? match.penaltiesA : match.penaltiesB} - {isHome ? match.penaltiesB : match.penaltiesA})
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

