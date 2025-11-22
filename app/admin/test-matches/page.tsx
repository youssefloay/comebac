"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"
import type { Match, Team, MatchResult } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Calendar, Clock, Trophy, Users, ArrowLeft, Filter } from "lucide-react"
import Link from "next/link"

export default function TestMatchesPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<(Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult })[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'in_progress'>('all')

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        router.push('/admin')
        return
      }
    }
  }, [user, isAdmin, authLoading, router])

  useEffect(() => {
    if (user && isAdmin) {
      fetchTestMatches()
    }
  }, [user, isAdmin, filterStatus])

  const fetchTestMatches = async () => {
    try {
      setLoading(true)
      
      // Récupérer tous les matchs puis filtrer côté client (évite l'index composite)
      const matchesQuery = query(
        collection(db, "matches"),
        orderBy("date", "asc")
      )
      const matchesSnap = await getDocs(matchesQuery)
      
      // Filtrer les matchs de test côté client
      const testMatchesDocs = matchesSnap.docs.filter(doc => doc.data().isTest === true)

      // Récupérer les équipes
      const teamsSnap = await getDocs(collection(db, "teams"))
      const teamsMap = new Map()
      teamsSnap.docs.forEach((doc) => {
        teamsMap.set(doc.id, { id: doc.id, ...doc.data() })
      })

      // Récupérer les résultats
      const resultsSnap = await getDocs(collection(db, "matchResults"))
      const resultsMap = new Map()
      resultsSnap.docs.forEach((doc) => {
        const resultData = doc.data() as MatchResult
        resultsMap.set(resultData.matchId, { ...resultData, id: doc.id })
      })

      let matchesData = testMatchesDocs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
          date: data.date?.toDate() || new Date(),
          round: data.round || 1,
          status: data.status || "scheduled",
          tournamentMode: data.tournamentMode,
          isFinal: data.isFinal,
          finalType: data.finalType,
          homeTeam: teamsMap.get(data.homeTeamId),
          awayTeam: teamsMap.get(data.awayTeamId),
          result: resultsMap.get(doc.id),
          isTest: true
        }
      }) as (Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult })[]

      // Filtrer par statut si nécessaire
      if (filterStatus !== 'all') {
        matchesData = matchesData.filter(m => m.status === filterStatus)
      }

      setMatches(matchesData)
    } catch (error) {
      console.error("Error fetching test matches:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour au dashboard</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Matchs de Test
              </h1>
              <p className="text-gray-600">
                Page réservée aux administrateurs - Les matchs de test ne sont pas visibles publiquement
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="scheduled">Programmés</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Mode Test activé :</strong> Ces matchs ne sont pas visibles dans les pages publiques (classement, statistiques, etc.).
                Ils sont uniquement accessibles depuis cette page admin.
              </p>
            </div>
          </div>
        </div>

        {/* Matches List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des matchs de test...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">Aucun match de test trouvé</p>
            <p className="text-gray-500 text-sm">
              Les matchs générés en mode test apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const matchDate = match.date instanceof Date ? match.date : new Date(match.date)
              const isCompleted = match.status === 'completed'
              const hasResult = match.result

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-l-4 border-yellow-400"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Match Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                          TEST
                        </span>
                        {match.tournamentMode && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                            {match.tournamentMode === 'MINI_LEAGUE' ? 'Mini-League' : 'Classique'}
                          </span>
                        )}
                        {match.isFinal && (
                          <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">
                            {match.finalType === 'grande_finale' ? '🥇 Grande Finale' : '🥉 Petite Finale'}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          Journée {match.round}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 text-right">
                              <p className="font-semibold text-gray-900">
                                {match.homeTeam?.name || 'Équipe à domicile'}
                              </p>
                            </div>
                            {hasResult ? (
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-gray-900">
                                  {match.result?.homeTeamScore || 0}
                                </span>
                                <span className="text-gray-400">-</span>
                                <span className="text-2xl font-bold text-gray-900">
                                  {match.result?.awayTeamScore || 0}
                                </span>
                              </div>
                            ) : (
                              <div className="text-gray-400">vs</div>
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {match.awayTeam?.name || 'Équipe à l\'extérieur'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{matchDate.toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{matchDate.toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          match.status === 'completed' ? 'bg-green-100 text-green-800' :
                          match.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {match.status === 'completed' ? 'Terminé' :
                           match.status === 'in_progress' ? 'En cours' :
                           'Programmé'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats Summary */}
        {matches.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total matchs</p>
              <p className="text-2xl font-bold text-gray-900">{matches.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Programmés</p>
              <p className="text-2xl font-bold text-blue-600">
                {matches.filter(m => m.status === 'scheduled').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Terminés</p>
              <p className="text-2xl font-bold text-green-600">
                {matches.filter(m => m.status === 'completed').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">En cours</p>
              <p className="text-2xl font-bold text-orange-600">
                {matches.filter(m => m.status === 'in_progress').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

