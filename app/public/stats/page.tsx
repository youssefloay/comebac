"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

interface TopScorer {
  playerName: string
  teamName: string
  goals: number
}

interface TopAssister {
  playerName: string
  teamName: string
  assists: number
}

export default function StatsPage() {
  const [topScorers, setTopScorers] = useState<TopScorer[]>([])
  const [topAssisters, setTopAssisters] = useState<TopAssister[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all results to calculate top scorers and assisters
        const resultsSnap = await getDocs(collection(db, "matchResults"))
        const teamsSnap = await getDocs(collection(db, "teams"))

        const teamsMap = new Map()
        teamsSnap.docs.forEach((doc) => {
          teamsMap.set(doc.id, doc.data().name)
        })

        const scorersMap = new Map<string, { goals: number; team: string }>()
        const assistersMap = new Map<string, { assists: number; team: string }>()

        resultsSnap.docs.forEach((doc) => {
          const data = doc.data()

          // Process home team goal scorers
          if (data.homeTeamGoalScorers) {
            data.homeTeamGoalScorers.forEach((scorer: any) => {
              const key = `${scorer.playerName}-${data.homeTeamId}`
              const current = scorersMap.get(key) || { goals: 0, team: teamsMap.get(data.homeTeamId) || "Unknown" }
              scorersMap.set(key, { goals: current.goals + 1, team: current.team })
            })
          }

          // Process away team goal scorers
          if (data.awayTeamGoalScorers) {
            data.awayTeamGoalScorers.forEach((scorer: any) => {
              const key = `${scorer.playerName}-${data.awayTeamId}`
              const current = scorersMap.get(key) || { goals: 0, team: teamsMap.get(data.awayTeamId) || "Unknown" }
              scorersMap.set(key, { goals: current.goals + 1, team: current.team })
            })
          }

          // Process assists
          if (data.homeTeamAssists) {
            data.homeTeamAssists.forEach((assister: any) => {
              const key = `${assister.playerName}-${data.homeTeamId}`
              const current = assistersMap.get(key) || { assists: 0, team: teamsMap.get(data.homeTeamId) || "Unknown" }
              assistersMap.set(key, { assists: current.assists + 1, team: current.team })
            })
          }

          if (data.awayTeamAssists) {
            data.awayTeamAssists.forEach((assister: any) => {
              const key = `${assister.playerName}-${data.awayTeamId}`
              const current = assistersMap.get(key) || { assists: 0, team: teamsMap.get(data.awayTeamId) || "Unknown" }
              assistersMap.set(key, { assists: current.assists + 1, team: current.team })
            })
          }
        })

        // Convert to arrays and sort
        const scorersArray = Array.from(scorersMap.entries())
          .map(([key, value]) => ({
            playerName: key.split("-")[0],
            teamName: value.team,
            goals: value.goals,
          }))
          .sort((a, b) => b.goals - a.goals)
          .slice(0, 10)

        const assistersArray = Array.from(assistersMap.entries())
          .map(([key, value]) => ({
            playerName: key.split("-")[0],
            teamName: value.team,
            assists: value.assists,
          }))
          .sort((a, b) => b.assists - a.assists)
          .slice(0, 10)

        setTopScorers(scorersArray)
        setTopAssisters(assistersArray)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Statistiques</h1>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Scorers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Meilleurs Buteurs</h2>
            {topScorers.length === 0 ? (
              <div className="text-gray-600 text-center py-8">Aucune donnée disponible</div>
            ) : (
              <div className="space-y-3">
                {topScorers.map((scorer, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold text-gray-900">{scorer.playerName}</p>
                      <p className="text-sm text-gray-600">{scorer.teamName}</p>
                    </div>
                    <p className="text-2xl font-bold text-primary">{scorer.goals}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Assisters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Meilleurs Passeurs</h2>
            {topAssisters.length === 0 ? (
              <div className="text-gray-600 text-center py-8">Aucune donnée disponible</div>
            ) : (
              <div className="space-y-3">
                {topAssisters.map((assister, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold text-gray-900">{assister.playerName}</p>
                      <p className="text-sm text-gray-600">{assister.teamName}</p>
                    </div>
                    <p className="text-2xl font-bold text-primary">{assister.assists}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
