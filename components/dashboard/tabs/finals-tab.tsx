"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, updateDoc, Timestamp } from "firebase/firestore"
import type { Match, Team } from "@/lib/types"
import { Trophy, Calendar, Clock, CheckCircle, XCircle, Users, AlertCircle } from "lucide-react"

export default function FinalsTab() {
  const [finals, setFinals] = useState<(Match & { homeTeam?: Team; awayTeam?: Team })[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Charger les équipes
      const teamsSnap = await getDocs(collection(db, "teams"))
      const teamsData = teamsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[]
      setTeams(teamsData)

      const teamsMap = new Map(teamsData.map(t => [t.id, t]))

      // Charger les finales (publiées et non publiées)
      const finalsQuery = query(
        collection(db, "matches"),
        where("tournamentMode", "==", "MINI_LEAGUE"),
        where("isFinal", "==", true)
      )
      const finalsSnap = await getDocs(finalsQuery)

      const finalsData = finalsSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          homeTeam: teamsMap.get(data.homeTeamId),
          awayTeam: teamsMap.get(data.awayTeamId),
          isPublished: data.isPublished || false,
          isTest: data.isTest || false
        }
      }) as (Match & { homeTeam?: Team; awayTeam?: Team })[]

      // Trier : non publiées en premier, puis par type de finale
      finalsData.sort((a, b) => {
        if (a.isPublished !== b.isPublished) {
          return a.isPublished ? 1 : -1
        }
        if (a.finalType === 'grande_finale' && b.finalType !== 'grande_finale') return -1
        if (a.finalType !== 'grande_finale' && b.finalType === 'grande_finale') return 1
        return 0
      })

      setFinals(finalsData)
    } catch (error) {
      console.error("Error loading finals:", error)
      setMessage({ type: "error", text: "Erreur lors du chargement des finales" })
    } finally {
      setLoading(false)
    }
  }

  const handlePublishFinals = async (isTest: boolean = false) => {
    try {
      setPublishing(true)
      setMessage(null)

      const response = await fetch("/api/admin/publish-finals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTest })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        await loadData() // Recharger les données
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de la publication" })
      }
    } catch (error) {
      console.error("Error publishing finals:", error)
      setMessage({ type: "error", text: "Erreur lors de la publication des finales" })
    } finally {
      setPublishing(false)
    }
  }

  const unpublishedFinals = finals.filter(f => !f.isPublished)
  const publishedFinals = finals.filter(f => f.isPublished)
  const testFinals = finals.filter(f => f.isTest)
  const productionFinals = finals.filter(f => !f.isTest)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des finales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Finales Mini-League</h2>
          <p className="text-gray-600 mt-1">
            Gérez la publication des finales générées automatiquement
          </p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total finales</p>
          <p className="text-2xl font-bold text-gray-900">{finals.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
          <p className="text-sm text-gray-600 mb-1">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{unpublishedFinals.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Publiées</p>
          <p className="text-2xl font-bold text-green-600">{publishedFinals.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Mode test</p>
          <p className="text-2xl font-bold text-blue-600">{testFinals.length}</p>
        </div>
      </div>

      {/* Finales en attente */}
      {unpublishedFinals.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                  Finales en attente de publication
                </h3>
                <p className="text-sm text-yellow-800">
                  {unpublishedFinals.length} finale(s) générée(s) automatiquement et en attente de votre validation.
                  Cliquez sur "Publier" pour les rendre visibles publiquement.
                </p>
              </div>
            </div>
            <button
              onClick={() => handlePublishFinals(productionFinals.some(f => !f.isPublished && !f.isTest))}
              disabled={publishing}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {publishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publication...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Publier les finales
                </>
              )}
            </button>
          </div>

          <div className="space-y-4 mt-4">
            {unpublishedFinals.map((final) => {
              const matchDate = final.date instanceof Date ? final.date : new Date(final.date)
              return (
                <div
                  key={final.id}
                  className="bg-white rounded-lg p-4 border border-yellow-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                          {final.finalType === 'grande_finale' ? '🥇 Grande Finale' : '🥉 Petite Finale'}
                        </span>
                        {final.isTest && (
                          <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded">
                            TEST
                          </span>
                        )}
                        <XCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs text-yellow-600 font-medium">Non publiée</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 text-right">
                          <p className="font-semibold text-gray-900">
                            {final.homeTeam?.name || 'Équipe à domicile'}
                          </p>
                        </div>
                        <div className="text-gray-400">vs</div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {final.awayTeam?.name || 'Équipe à l\'extérieur'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Finales publiées */}
      {publishedFinals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Finales publiées ({publishedFinals.length})
          </h3>
          <div className="space-y-4">
            {publishedFinals.map((final) => {
              const matchDate = final.date instanceof Date ? final.date : new Date(final.date)
              return (
                <div
                  key={final.id}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                      {final.finalType === 'grande_finale' ? '🥇 Grande Finale' : '🥉 Petite Finale'}
                    </span>
                    {final.isTest && (
                      <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded">
                        TEST
                      </span>
                    )}
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Publiée</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-gray-900">
                        {final.homeTeam?.name || 'Équipe à domicile'}
                      </p>
                    </div>
                    <div className="text-gray-400">vs</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {final.awayTeam?.name || 'Équipe à l\'extérieur'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Aucune finale */}
      {finals.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Aucune finale trouvée</p>
          <p className="text-gray-500 text-sm">
            Les finales seront générées automatiquement une fois tous les matchs de qualification terminés.
          </p>
        </div>
      )}
    </div>
  )
}

