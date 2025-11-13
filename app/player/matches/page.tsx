"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar, Trophy, Clock } from 'lucide-react'
import Link from 'next/link'

interface Match {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeam: string
  awayTeam: string
  date: Date
  homeTeamScore?: number
  awayTeamScore?: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  round: number
}

export default function PlayerMatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    const loadMatches = async () => {
      if (!user?.email) return

      try {
        // Trouver l'équipe du joueur
        const playerAccountsQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', user.email)
        )
        const playerAccountsSnap = await getDocs(playerAccountsQuery)

        if (playerAccountsSnap.empty) {
          setLoading(false)
          return
        }

        const playerData = playerAccountsSnap.docs[0].data()
        const playerTeamId = playerData.teamId
        setTeamId(playerTeamId)

        // Charger tous les matchs
        const matchesSnap = await getDocs(collection(db, 'matches'))
        
        // Charger les équipes
        const teamsSnap = await getDocs(collection(db, 'teams'))
        const teamsMap = new Map()
        teamsSnap.docs.forEach(doc => {
          teamsMap.set(doc.id, doc.data().name)
        })

        // Filtrer les matchs de l'équipe du joueur
        const teamMatches = matchesSnap.docs
          .map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              homeTeamId: data.homeTeamId,
              awayTeamId: data.awayTeamId,
              homeTeam: teamsMap.get(data.homeTeamId) || 'Équipe inconnue',
              awayTeam: teamsMap.get(data.awayTeamId) || 'Équipe inconnue',
              date: data.date?.toDate() || new Date(),
              homeTeamScore: data.homeTeamScore,
              awayTeamScore: data.awayTeamScore,
              status: data.status,
              round: data.round
            }
          })
          .filter(match => 
            match.homeTeamId === playerTeamId || match.awayTeamId === playerTeamId
          )
          .sort((a, b) => b.date.getTime() - a.date.getTime())

        setMatches(teamMatches)
      } catch (error) {
        console.error('Erreur lors du chargement des matchs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const upcomingMatches = matches.filter(m => m.status === 'scheduled')
  const completedMatches = matches.filter(m => m.status === 'completed')

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Matchs</h1>
          <p className="text-gray-600">Calendrier et résultats de mon équipe</p>
        </div>

        {/* Prochains matchs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Prochains Matchs ({upcomingMatches.length})
          </h2>
          
          {upcomingMatches.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Aucun match à venir</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/player/matches/${match.id}`}
                  className="block bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      Journée {match.round}
                    </span>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {match.date.toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className={`flex-1 text-right ${match.homeTeamId === teamId ? 'font-bold' : ''}`}>
                      {match.homeTeam}
                    </div>
                    <div className="px-6 text-gray-400 font-bold">VS</div>
                    <div className={`flex-1 text-left ${match.awayTeamId === teamId ? 'font-bold' : ''}`}>
                      {match.awayTeam}
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-xs text-blue-600 font-medium">
                      Voir les détails →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Matchs terminés */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-green-600" />
            Matchs Terminés ({completedMatches.length})
          </h2>
          
          {completedMatches.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Aucun match terminé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/player/matches/${match.id}`}
                  className="block bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Journée {match.round}
                    </span>
                    <span className="text-sm text-gray-600">
                      {match.date.toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className={`flex-1 text-right ${match.homeTeamId === teamId ? 'font-bold' : ''}`}>
                      {match.homeTeam}
                    </div>
                    <div className="px-6">
                      <div className="flex items-center gap-3 text-2xl font-bold">
                        <span className={match.homeTeamScore! > match.awayTeamScore! ? 'text-green-600' : 'text-gray-900'}>
                          {match.homeTeamScore ?? 0}
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className={match.awayTeamScore! > match.homeTeamScore! ? 'text-green-600' : 'text-gray-900'}>
                          {match.awayTeamScore ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className={`flex-1 text-left ${match.awayTeamId === teamId ? 'font-bold' : ''}`}>
                      {match.awayTeam}
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-xs text-blue-600 font-medium">
                      Voir les détails →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
