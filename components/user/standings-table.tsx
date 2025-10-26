"use client"

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award } from 'lucide-react'

interface StandingsTableProps {
  standings: Array<{
    id: string
    teamId: string
    teamName: string
    points: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    matchesPlayed: number
  }>
}

export function StandingsTable({ standings }: StandingsTableProps) {
  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold text-gray-600">{position}</span>
    }
  }

  const getRankBadge = (position: number) => {
    if (position <= 3) {
      const colors = {
        1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        2: 'bg-gray-100 text-gray-800 border-gray-200',
        3: 'bg-orange-100 text-orange-800 border-orange-200'
      }
      return colors[position as keyof typeof colors] || ''
    }
    return ''
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Classement de la Ligue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pos
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Équipe
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    MJ
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    V
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    N
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    D
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    BP
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    BC
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Diff
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {standings.map((team, index) => {
                  const position = index + 1
                  const goalDifference = team.goalsFor - team.goalsAgainst
                  
                  return (
                    <motion.tr
                      key={team.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={`hover:bg-gray-50 transition-colors ${
                        position <= 3 ? getRankBadge(position) : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRankIcon(position)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="font-semibold text-gray-900">
                            {team.teamName}
                          </div>
                          {position <= 3 && (
                            <Badge className={`ml-2 ${getRankBadge(position)}`} variant="outline">
                              Top {position}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {team.matchesPlayed}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-green-600">
                        {team.wins}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-yellow-600">
                        {team.draws}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-red-600">
                        {team.losses}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {team.goalsFor}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {team.goalsAgainst}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold">
                        <span className={goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {goalDifference > 0 ? '+' : ''}{goalDifference}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-blue-100 text-blue-800 font-bold">
                          {team.points}
                        </Badge>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}