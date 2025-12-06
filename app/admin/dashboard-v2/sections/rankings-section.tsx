"use client"

import { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Trophy, TrendingUp } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { getParticipatingTeamIds, filterParticipatingTeams } from '@/lib/tournament-utils'

interface TeamStats {
  id: string
  teamId: string
  teamName: string
  teamLogo?: string
  points: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  matchesPlayed: number
  goalDifference: number
}

export default function RankingsSection() {
  const [ranking, setRanking] = useState<TeamStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRanking()
  }, [])

  const loadRanking = async () => {
    try {
      setLoading(true)
      
      // Fetch teams
      const teamsSnapshot = await getDocs(collection(db, 'teams'))
      const teamsMap = new Map()
      teamsSnapshot.forEach((doc) => {
        teamsMap.set(doc.id, { id: doc.id, ...doc.data() })
      })

      // Fetch team statistics
      const statsSnapshot = await getDocs(collection(db, 'teamStatistics'))
      const teamStatsMap = new Map()

      statsSnapshot.forEach((doc) => {
        const data = doc.data()
        const existing = teamStatsMap.get(data.teamId)
        if (!existing || (doc.data().updatedAt?.toMillis() || 0) > (existing.updatedAt?.toMillis() || 0)) {
          teamStatsMap.set(data.teamId, {
            docId: doc.id,
            ...data
          })
        }
      })

      let statsData: TeamStats[] = Array.from(teamStatsMap.values())
        .map((data) => {
          const team = teamsMap.get(data.teamId)
          return {
            id: data.docId || data.id,
            teamId: data.teamId,
            teamName: team?.name || 'Unknown Team',
            teamLogo: team?.logo,
            points: data.points || 0,
            wins: data.wins || 0,
            draws: data.draws || 0,
            losses: data.losses || 0,
            goalsFor: data.goalsFor || 0,
            goalsAgainst: data.goalsAgainst || 0,
            matchesPlayed: data.matchesPlayed || 0,
            goalDifference: (data.goalsFor || 0) - (data.goalsAgainst || 0)
          }
        })
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          return b.goalDifference - a.goalDifference
        })

      // Filter participating teams
      const participatingTeamIds = await getParticipatingTeamIds()
      if (participatingTeamIds) {
        statsData = filterParticipatingTeams(statsData, participatingTeamIds)
      }

      setRanking(statsData)
    } catch (error) {
      console.error('Error loading ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rankings</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Pos</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Team</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">MP</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">W</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">D</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">L</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">GF</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">GA</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">GD</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No ranking data available
                  </td>
                </tr>
              ) : (
                ranking.map((team, index) => (
                  <tr
                    key={team.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {index + 1}
                      {index === 0 && ' 🥇'}
                      {index === 1 && ' 🥈'}
                      {index === 2 && ' 🥉'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {team.teamLogo && (
                          <img
                            src={team.teamLogo}
                            alt={team.teamName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">{team.teamName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      {team.matchesPlayed}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-green-600 dark:text-green-400 font-semibold">
                      {team.wins}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      {team.draws}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-red-600 dark:text-red-400">
                      {team.losses}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-white font-medium">
                      {team.goalsFor}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      {team.goalsAgainst}
                    </td>
                    <td className={`px-6 py-4 text-center text-sm font-semibold ${
                      team.goalDifference > 0
                        ? 'text-green-600 dark:text-green-400'
                        : team.goalDifference < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                      {team.points}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
