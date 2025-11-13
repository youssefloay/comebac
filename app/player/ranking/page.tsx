"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import type { TeamStatistics } from "@/lib/types"
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface RankingTeam extends TeamStatistics {
  teamName: string
  goalDifference: number
}

export default function PlayerRankingPage() {
  const [ranking, setRanking] = useState<RankingTeam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const [statsSnap, teamsSnap] = await Promise.all([
          getDocs(collection(db, "teamStatistics")),
          getDocs(collection(db, "teams"))
        ])
        
        const teamsMap = new Map()
        teamsSnap.docs.forEach((doc) => {
          teamsMap.set(doc.id, { id: doc.id, ...doc.data() })
        })

        const teamStatsMap = new Map()
        
        statsSnap.docs.forEach((doc) => {
          const data = doc.data() as TeamStatistics
          const existing = teamStatsMap.get(data.teamId)
          
          if (!existing || (data.points || 0) > (existing.points || 0)) {
            teamStatsMap.set(data.teamId, {
              ...data,
              docId: doc.id
            })
          }
        })

        const statsData = Array.from(teamStatsMap.values())
          .map((data) => {
            const team = teamsMap.get(data.teamId)
            return {
              id: data.docId || data.id,
              teamId: data.teamId,
              teamName: team?.name || "Équipe inconnue",
              points: data.points || 0,
              wins: data.wins || 0,
              draws: data.draws || 0,
              losses: data.losses || 0,
              goalsFor: data.goalsFor || 0,
              goalsAgainst: data.goalsAgainst || 0,
              matchesPlayed: data.matchesPlayed || 0,
              goalDifference: (data.goalsFor || 0) - (data.goalsAgainst || 0),
              updatedAt: data.updatedAt
            }
          })
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            return b.goalDifference - a.goalDifference
          })

        setRanking(statsData)
      } catch (error) {
        console.error("Error fetching ranking:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [])

  const getPositionBadge = (position: number) => {
    if (position === 1) return "🥇"
    if (position === 2) return "🥈"
    if (position === 3) return "🥉"
    return position
  }

  const getPositionColor = (position: number) => {
    if (position === 1) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    if (position === 2) return "bg-gray-100 text-gray-800 border-gray-300"
    if (position === 3) return "bg-orange-100 text-orange-800 border-orange-300"
    return "bg-white text-gray-900 border-gray-200"
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-600" />
          Classement
        </h1>
        <p className="text-gray-600">
          Découvrez le classement général du championnat
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du classement...</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Aucune donnée de classement disponible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ranking.map((team, idx) => {
            const position = idx + 1
            const goalDiff = team.goalDifference

            return (
              <div
                key={team.id}
                className={`border-2 rounded-xl p-4 sm:p-6 transition-all hover:shadow-lg ${getPositionColor(position)}`}
              >
                <div className="flex items-center gap-4">
                  {/* Position */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 flex items-center justify-center font-bold text-lg sm:text-xl">
                      {getPositionBadge(position)}
                    </div>
                  </div>

                  {/* Team Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg sm:text-xl text-gray-900 truncate">
                      {team.teamName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {team.matchesPlayed} matchs joués
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">V-N-D</div>
                      <div className="font-semibold text-gray-900">
                        {team.wins}-{team.draws}-{team.losses}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Buts</div>
                      <div className="font-semibold text-gray-900">
                        {team.goalsFor}:{team.goalsAgainst}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Diff</div>
                      <div className={`font-semibold flex items-center gap-1 ${
                        goalDiff > 0 ? 'text-green-600' : goalDiff < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {goalDiff > 0 && <TrendingUp className="w-4 h-4" />}
                        {goalDiff < 0 && <TrendingDown className="w-4 h-4" />}
                        {goalDiff === 0 && <Minus className="w-4 h-4" />}
                        {goalDiff > 0 ? '+' : ''}{goalDiff}
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0">
                    <div className="bg-blue-600 text-white rounded-lg px-4 py-2 sm:px-6 sm:py-3">
                      <div className="text-xs sm:text-sm font-medium">Points</div>
                      <div className="text-2xl sm:text-3xl font-bold">{team.points}</div>
                    </div>
                  </div>
                </div>

                {/* Mobile Stats */}
                <div className="sm:hidden mt-4 pt-4 border-t border-gray-200 flex justify-around text-center">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">V-N-D</div>
                    <div className="font-semibold text-gray-900">
                      {team.wins}-{team.draws}-{team.losses}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Buts</div>
                    <div className="font-semibold text-gray-900">
                      {team.goalsFor}:{team.goalsAgainst}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Diff</div>
                    <div className={`font-semibold ${
                      goalDiff > 0 ? 'text-green-600' : goalDiff < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {goalDiff > 0 ? '+' : ''}{goalDiff}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
