"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import type { Match, Team } from "@/lib/types"

export default function MatchesPage() {
  const [matches, setMatches] = useState<(Match & { homeTeam?: Team; awayTeam?: Team })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matchesSnap = await getDocs(query(collection(db, "matches"), orderBy("date", "asc")))
        const teamsSnap = await getDocs(collection(db, "teams"))

        const teamsMap = new Map()
        teamsSnap.docs.forEach((doc) => {
          teamsMap.set(doc.id, { id: doc.id, ...doc.data() })
        })

        const matchesData = matchesSnap.docs.map((doc) => {
          const data = doc.data() as Match
          return {
            id: doc.id,
            ...data,
            homeTeam: teamsMap.get(data.homeTeamId),
            awayTeam: teamsMap.get(data.awayTeamId),
          }
        })

        setMatches(matchesData)
      } catch (error) {
        console.error("Error fetching matches:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Date non définie"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Calendrier des Matchs</h1>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 text-center">Aucun match programmé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">{formatDate(match.date)}</p>
                  <div className="flex items-center justify-between md:justify-start gap-4">
                    <div className="flex-1 text-right md:text-left">
                      <p className="font-semibold text-gray-900">{match.homeTeam?.name || "Équipe inconnue"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">VS</p>
                      <p className="text-xs text-gray-500">{formatTime(match.date)}</p>
                    </div>
                    <div className="flex-1 text-left md:text-right">
                      <p className="font-semibold text-gray-900">{match.awayTeam?.name || "Équipe inconnue"}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                    {match.status === "completed" ? "Terminé" : match.status === "in-progress" ? "En cours" : "À venir"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
