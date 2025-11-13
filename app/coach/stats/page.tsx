"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { BarChart3, Target, TrendingUp, Award, Users } from 'lucide-react'

interface PlayerStats {
  id: string
  firstName: string
  lastName: string
  jerseyNumber: number
  position: string
  stats: {
    matchesPlayed: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
  }
}

export default function CoachStatsPage() {
  const { user } = useAuth()
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.email) return

      try {
        let tid = ''
        
        // Vérifier si on est en mode impersonation
        const impersonateCoachId = sessionStorage.getItem('impersonateCoachId')
        
        if (impersonateCoachId) {
          // Mode impersonation: charger les données du coach spécifique
          const coachDoc = await getDoc(doc(db, 'coachAccounts', impersonateCoachId))
          if (coachDoc.exists()) {
            tid = coachDoc.data().teamId
          }
        } else {
          // Utilisateur normal: chercher par email
          const coachQuery = query(
            collection(db, 'coachAccounts'),
            where('email', '==', user.email)
          )
          const coachSnap = await getDocs(coachQuery)

          if (!coachSnap.empty) {
            const coachData = coachSnap.docs[0].data()
            tid = coachData.teamId
          }
        }

        if (tid) {

          // Charger les joueurs avec leurs stats
          const playersQuery = query(
            collection(db, 'playerAccounts'),
            where('teamId', '==', tid)
          )
          const playersSnap = await getDocs(playersQuery)

          const playersData = playersSnap.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              firstName: data.firstName,
              lastName: data.lastName,
              jerseyNumber: data.jerseyNumber,
              position: data.position,
              stats: data.stats || {
                matchesPlayed: 0,
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0
              }
            }
          }) as PlayerStats[]

          // Trier par buts décroissants
          playersData.sort((a, b) => b.stats.goals - a.stats.goals)
          setPlayers(playersData)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Calculer les totaux de l'équipe
  const teamStats = players.reduce((acc, player) => ({
    matchesPlayed: Math.max(acc.matchesPlayed, player.stats.matchesPlayed),
    goals: acc.goals + player.stats.goals,
    assists: acc.assists + player.stats.assists,
    yellowCards: acc.yellowCards + player.stats.yellowCards,
    redCards: acc.redCards + player.stats.redCards
  }), { matchesPlayed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 })

  const topScorer = players[0]
  const topAssister = [...players].sort((a, b) => b.stats.assists - a.stats.assists)[0]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Statistiques de l'Équipe
          </h1>
          <p className="text-gray-600">
            Analysez les performances de vos joueurs
          </p>
        </div>

        {/* Team Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <Users className="w-10 h-10 text-blue-600 mb-3" />
              <span className="text-3xl font-bold text-gray-900 mb-1">{players.length}</span>
              <p className="text-sm text-gray-600">Joueurs</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <Target className="w-10 h-10 text-green-600 mb-3" />
              <span className="text-3xl font-bold text-gray-900 mb-1">{teamStats.goals}</span>
              <p className="text-sm text-gray-600">Buts Totaux</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="w-10 h-10 text-purple-600 mb-3" />
              <span className="text-3xl font-bold text-gray-900 mb-1">{teamStats.assists}</span>
              <p className="text-sm text-gray-600">Passes Décisives</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <Award className="w-10 h-10 text-yellow-600 mb-3" />
              <span className="text-3xl font-bold text-gray-900 mb-1">
                {teamStats.yellowCards + teamStats.redCards}
              </span>
              <p className="text-sm text-gray-600">Cartons</p>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {topScorer && (
            <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-8 h-8" />
                <h3 className="text-xl font-bold">Meilleur Buteur</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{topScorer.firstName} {topScorer.lastName}</p>
                  <p className="text-green-100">#{topScorer.jerseyNumber} • {topScorer.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black">{topScorer.stats.goals}</p>
                  <p className="text-green-100 text-sm">Buts</p>
                </div>
              </div>
            </div>
          )}

          {topAssister && (
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-8 h-8" />
                <h3 className="text-xl font-bold">Meilleur Passeur</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{topAssister.firstName} {topAssister.lastName}</p>
                  <p className="text-purple-100">#{topAssister.jerseyNumber} • {topAssister.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black">{topAssister.stats.assists}</p>
                  <p className="text-purple-100 text-sm">Passes</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Players Stats Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Statistiques Détaillées</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joueur
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matchs
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buts
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Passes
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cartons
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                          {player.jerseyNumber}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {player.firstName} {player.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">{player.position}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-900">{player.stats.matchesPlayed}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-green-600">{player.stats.goals}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-purple-600">{player.stats.assists}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {player.stats.yellowCards > 0 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                            {player.stats.yellowCards} 🟨
                          </span>
                        )}
                        {player.stats.redCards > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                            {player.stats.redCards} 🟥
                          </span>
                        )}
                        {player.stats.yellowCards === 0 && player.stats.redCards === 0 && (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
