"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import type { TeamStatistics } from "@/lib/types"

export default function RankingPage() {
  const [ranking, setRanking] = useState<TeamStatistics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const statsSnap = await getDocs(collection(db, "teamStatistics"))
        const statsData = statsSnap.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            return b.goalDifference - a.goalDifference
          }) as TeamStatistics[]

        setRanking(statsData)
      } catch (error) {
        console.error("Error fetching ranking:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Classement Général</h1>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 text-center">Aucune donnée disponible</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pos</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Équipe</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Matchs</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">V</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">N</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">D</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">BP</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">BC</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Diff</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Pts</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((team, idx) => (
                <tr key={team.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{team.teamName}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-700">
                    {team.wins + team.draws + team.losses}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-700">{team.wins}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-700">{team.draws}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-700">{team.losses}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-700">{team.goalsFor}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-700">{team.goalsAgainst}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-700">{team.goalDifference}</td>
                  <td className="px-6 py-4 text-sm font-bold text-right text-primary">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
