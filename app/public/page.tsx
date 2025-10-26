"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

interface Stats {
  teams: number
  matches: number
  goals: number
}

export default function PublicHome() {
  const [stats, setStats] = useState<Stats>({ teams: 0, matches: 0, goals: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch teams count
        const teamsSnap = await getDocs(collection(db, "teams"))
        const teamsCount = teamsSnap.size

        // Fetch matches count
        const matchesSnap = await getDocs(collection(db, "matches"))
        const matchesCount = matchesSnap.size

        // Fetch results to count goals
        const resultsSnap = await getDocs(collection(db, "matchResults"))
        let totalGoals = 0
        resultsSnap.forEach((doc) => {
          const data = doc.data()
          totalGoals += (data.homeTeamScore || 0) + (data.awayTeamScore || 0)
        })

        setStats({ teams: teamsCount, matches: matchesCount, goals: totalGoals })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Championnat de Football Scolaire</h2>
          <p className="text-lg text-primary-light mb-8">Suivez tous les matchs, équipes et statistiques en direct</p>
          <Link
            href="/public/ranking"
            className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Voir le classement
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-4xl font-bold text-primary mb-2">{loading ? "-" : stats.teams}</p>
            <p className="text-gray-600">Équipes</p>
          </div>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-4xl font-bold text-primary mb-2">{loading ? "-" : stats.matches}</p>
            <p className="text-gray-600">Matchs joués</p>
          </div>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-4xl font-bold text-primary mb-2">{loading ? "-" : stats.goals}</p>
            <p className="text-gray-600">Buts marqués</p>
          </div>
        </div>
      </div>
    </div>
  )
}
