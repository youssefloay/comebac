'use client'

import { useState, useEffect } from 'react'
import { Trophy, TrendingUp } from 'lucide-react'
import type { PreseasonStats } from '@/lib/types'

export default function PreseasonRankingPage() {
  const [ranking, setRanking] = useState<PreseasonStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRanking()
  }, [])

  const loadRanking = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/preseason/ranking')
      const data = await response.json()
      setRanking(data.ranking || [])
    } catch (error) {
      console.error('Error loading ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGoalDifference = (stats: PreseasonStats) => {
    return stats.goalsFor - stats.goalsAgainst
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Classement Preseason
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Classement automatique basé sur les points, différence de buts, buts marqués et victoires aux tirs au but
          </p>
        </div>
        <button
          onClick={loadRanking}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Ranking Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Équipe
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  J
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  V
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  D
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VP
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DP
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BP
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BC
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DB
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>Aucune statistique disponible</p>
                  </td>
                </tr>
              ) : (
                ranking.map((team, index) => {
                  const goalDiff = getGoalDifference(team)
                  const isTopThree = index < 3

                  return (
                    <tr
                      key={team.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        isTopThree ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                          {index === 1 && <Trophy className="w-5 h-5 text-gray-400" />}
                          {index === 2 && <Trophy className="w-5 h-5 text-orange-500" />}
                          <span className={`text-sm font-medium ${isTopThree ? 'font-bold' : ''}`}>
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{team.teamName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {team.played}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {team.wins}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {team.losses}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {team.penaltyWins}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {team.penaltyLosses}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {team.goalsFor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {team.goalsAgainst}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-center text-sm font-medium ${
                        goalDiff > 0 ? 'text-green-600' : goalDiff < 0 ? 'text-red-600' : ''
                      }`}>
                        {goalDiff > 0 ? '+' : ''}{goalDiff}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {team.points}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm">
        <div className="font-medium mb-2">Légende :</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
          <div>J = Joués</div>
          <div>V = Victoires</div>
          <div>D = Défaites</div>
          <div>VP = Victoires aux tirs au but</div>
          <div>DP = Défaites aux tirs au but</div>
          <div>BP = Buts pour</div>
          <div>BC = Buts contre</div>
          <div>DB = Différence de buts</div>
          <div>Pts = Points</div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="font-medium mb-1">Système de points :</div>
          <div className="text-gray-600 dark:text-gray-400">
            • Victoire (temps réglementaire) : 3 pts<br />
            • Match nul + victoire aux tirs au but : 2 pts<br />
            • Match nul + défaite aux tirs au but : 1 pt<br />
            • Défaite (temps réglementaire) : 0 pt
          </div>
        </div>
      </div>
    </div>
  )
}

