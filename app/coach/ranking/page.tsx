"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import type { TeamStatistics } from "@/lib/types"
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { motion } from "framer-motion"

interface RankingTeam extends TeamStatistics {
  teamName: string
  goalDifference: number
}

export default function CoachRankingPage() {
  const [ranking, setRanking] = useState<RankingTeam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const [statsSnap, teamsSnap] = await Promise.all([
          getDocs(collection(db, "teamStatistics")),
          getDocs(query(collection(db, "teams"), where("isActive", "==", true)))
        ])
        
        const teamsMap = new Map()
        const activeTeamIds = new Set<string>()
        teamsSnap.docs.forEach((doc) => {
          const teamData = { id: doc.id, ...doc.data() }
          teamsMap.set(doc.id, teamData)
          activeTeamIds.add(doc.id)
        })

        const teamStatsMap = new Map()
        
        statsSnap.docs.forEach((doc) => {
          const data = doc.data() as TeamStatistics
          
          // Filtrer les équipes inactives
          if (!activeTeamIds.has(data.teamId)) {
            return
          }
          
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
            Classement
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Découvrez le classement général du championnat
          </p>
        </motion.div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du classement...</p>
        </div>
      ) : ranking.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl shadow-xl"
        >
          <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Aucune donnée de classement disponible</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {ranking.map((team, idx) => {
            const position = idx + 1
            const goalDiff = team.goalDifference

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`border-2 rounded-2xl p-4 sm:p-6 transition-all shadow-xl backdrop-blur-xl ${
                  position === 1
                    ? 'bg-gradient-to-br from-yellow-50 via-yellow-50/50 to-yellow-100/50 dark:from-yellow-900/20 dark:via-yellow-900/10 dark:to-yellow-800/10 border-yellow-300 dark:border-yellow-700'
                    : position === 2
                    ? 'bg-gradient-to-br from-gray-50 via-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:via-gray-800/30 dark:to-gray-700/30 border-gray-300 dark:border-gray-700'
                    : position === 3
                    ? 'bg-gradient-to-br from-orange-50 via-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:via-orange-900/10 dark:to-orange-800/10 border-orange-300 dark:border-orange-700'
                    : 'bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Position */}
                  <div className="flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center font-bold text-lg sm:text-xl shadow-lg ${
                        position === 1
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300 text-white'
                          : position === 2
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 border-gray-200 text-white'
                          : position === 3
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-300 text-white'
                          : 'bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                      }`}
                    >
                      {getPositionBadge(position)}
                    </motion.div>
                  </div>

                  {/* Team Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-lg sm:text-xl truncate ${
                      position <= 3
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {team.teamName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                      <div className={`font-semibold flex items-center gap-1 ${goalDiff > 0 ? 'text-green-600' : goalDiff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {goalDiff > 0 && <TrendingUp className="w-4 h-4" />}
                        {goalDiff < 0 && <TrendingDown className="w-4 h-4" />}
                        {goalDiff === 0 && <Minus className="w-4 h-4" />}
                        {goalDiff > 0 ? '+' : ''}{goalDiff}
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl px-4 py-2 sm:px-6 sm:py-3 shadow-lg"
                    >
                      <div className="text-xs sm:text-sm font-medium opacity-90">Points</div>
                      <div className="text-2xl sm:text-3xl font-bold">{team.points}</div>
                    </motion.div>
                  </div>
                </div>

                {/* Mobile Stats */}
                <div className="sm:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-around text-center">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">V-N-D</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {team.wins}-{team.draws}-{team.losses}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Buts</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {team.goalsFor}:{team.goalsAgainst}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Diff</div>
                    <div className={`font-semibold ${
                      goalDiff > 0 ? 'text-green-600 dark:text-green-400' : goalDiff < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {goalDiff > 0 ? '+' : ''}{goalDiff}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
