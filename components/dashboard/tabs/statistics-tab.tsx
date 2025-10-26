"use client"

import { useState, useEffect } from "react"
import { getTeams } from "@/lib/db"
import { getCurrentRanking, getTeamDetailedStats, getTopScorers } from "@/lib/statistics"
import type { Team } from "@/lib/types"
import { AlertCircle, TrendingUp, Target } from "lucide-react"

export default function StatisticsTab() {
  const [teams, setTeams] = useState<Team[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [teamStats, setTeamStats] = useState<any>(null)
  const [topScorers, setTopScorers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      loadTeamStats()
    }
  }, [selectedTeamId])

  const loadData = async () => {
    try {
      setError(null)
      setLoading(true)
      const [teamsData, rankingData, scorersData] = await Promise.all([
        getTeams(),
        getCurrentRanking(),
        getTopScorers(),
      ])

      setTeams(teamsData)
      setRanking(rankingData)
      setTopScorers(scorersData)

      if (teamsData.length > 0) {
        setSelectedTeamId(teamsData[0].id)
      }
    } catch (err) {
      setError("Erreur lors du chargement des statistiques")
      console.error("Error loading statistics:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadTeamStats = async () => {
    if (!selectedTeamId) return

    try {
      setError(null)
      const stats = await getTeamDetailedStats(selectedTeamId)
      setTeamStats(stats)
    } catch (err) {
      setError("Erreur lors du chargement des statistiques de l'équipe")
      console.error("Error loading team stats:", err)
    }
  }

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name || "Équipe inconnue"

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Ranking Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-900">Classement général</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pos</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Équipe</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">M</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">V</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">N</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">D</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">BP</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">BC</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Diff</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ranking.length > 0 ? (
              ranking.map((team) => (
                <tr
                  key={team.teamId}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedTeamId === team.teamId ? "bg-blue-50" : ""}`}
                  onClick={() => setSelectedTeamId(team.teamId)}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{team.rank}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getTeamName(team.teamId)}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.matchesPlayed}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.wins}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.draws}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.losses}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.goalsFor}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.goalsAgainst}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {team.goalDifference > 0 ? "+" : ""}
                    {team.goalDifference}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-center text-primary">{team.points}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  Aucune statistique disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Team Details */}
      {teamStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Statistiques à domicile</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Matchs joués</span>
                <span className="font-semibold text-gray-900">{teamStats.homeStats.played}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Victoires</span>
                <span className="font-semibold text-green-600">{teamStats.homeStats.wins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nuls</span>
                <span className="font-semibold text-yellow-600">{teamStats.homeStats.draws}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Défaites</span>
                <span className="font-semibold text-red-600">{teamStats.homeStats.losses}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-gray-600">Buts marqués</span>
                <span className="font-semibold text-gray-900">{teamStats.homeStats.goalsFor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buts encaissés</span>
                <span className="font-semibold text-gray-900">{teamStats.homeStats.goalsAgainst}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Statistiques à l'extérieur</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Matchs joués</span>
                <span className="font-semibold text-gray-900">{teamStats.awayStats.played}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Victoires</span>
                <span className="font-semibold text-green-600">{teamStats.awayStats.wins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nuls</span>
                <span className="font-semibold text-yellow-600">{teamStats.awayStats.draws}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Défaites</span>
                <span className="font-semibold text-red-600">{teamStats.awayStats.losses}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-gray-600">Buts marqués</span>
                <span className="font-semibold text-gray-900">{teamStats.awayStats.goalsFor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buts encaissés</span>
                <span className="font-semibold text-gray-900">{teamStats.awayStats.goalsAgainst}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Scorers */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-900">Meilleurs buteurs</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rang</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joueur</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Buts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {topScorers.length > 0 ? (
              topScorers.map((scorer, index) => (
                <tr key={scorer.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{scorer.name}</td>
                  <td className="px-6 py-4 text-sm text-center font-semibold text-primary">{scorer.goals}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  Aucun buteur enregistré
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
