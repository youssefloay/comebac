"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import type { Team } from "@/lib/types"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsSnap = await getDocs(collection(db, "teams"))
        const teamsData = teamsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Team[]
        setTeams(teamsData)
      } catch (error) {
        console.error("Error fetching teams:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Équipes</h1>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 text-center">Aucune équipe disponible</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
              <div className="h-32" style={{ backgroundColor: team.color || "#10b981" }}></div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{team.name}</h2>
                <p className="text-sm text-gray-600 mb-4">{team.players?.length || 0} joueurs</p>
                <div className="space-y-2">
                  {team.players?.slice(0, 5).map((player, idx) => (
                    <div key={idx} className="text-sm text-gray-700">
                      <span className="font-semibold">#{player.number}</span> - {player.name} ({player.position})
                    </div>
                  ))}
                  {team.players && team.players.length > 5 && (
                    <p className="text-sm text-gray-500 pt-2">+{team.players.length - 5} autres joueurs</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
