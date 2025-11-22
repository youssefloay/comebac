"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, updateDoc, Timestamp } from "firebase/firestore"
import type { Match, Team, TeamStatistics } from "@/lib/types"
import { 
  Trophy, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  AlertCircle,
  PlayCircle,
  Target,
  TrendingUp,
  Award,
  Trash2
} from "lucide-react"
// Les modals seront gérés par le dashboard parent ou créés ici si nécessaire

export default function MiniLeagueTab() {
  const [finals, setFinals] = useState<(Match & { homeTeam?: Team; awayTeam?: Team })[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [qualificationMatches, setQualificationMatches] = useState<Match[]>([])
  const [ranking, setRanking] = useState<Array<TeamStatistics & { rank: number; goalDifference: number }>>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showFinalsModal, setShowFinalsModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeSection, setActiveSection] = useState<"overview" | "qualification" | "finals" | "ranking">("overview")

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

      // Charger les matchs de qualification (Jours 1-5)
      const qualificationQuery = query(
        collection(db, "matches"),
        where("tournamentMode", "==", "MINI_LEAGUE"),
        where("isFinal", "==", false)
      )
      const qualificationSnap = await getDocs(qualificationQuery)

      const qualificationData = qualificationSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          homeTeam: teamsMap.get(data.homeTeamId),
          awayTeam: teamsMap.get(data.awayTeamId),
          isTest: data.isTest || false
        }
      }) as Match[]

      setQualificationMatches(qualificationData)

      // Charger les finales
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

      finalsData.sort((a, b) => {
        if (a.isPublished !== b.isPublished) {
          return a.isPublished ? 1 : -1
        }
        if (a.finalType === 'grande_finale' && b.finalType !== 'grande_finale') return -1
        if (a.finalType !== 'grande_finale' && b.finalType === 'grande_finale') return 1
        return 0
      })

      setFinals(finalsData)

      // Charger le classement
      const statsSnap = await getDocs(collection(db, "teamStatistics"))
      const statsData = statsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeamStatistics[]

      // Filtrer uniquement les équipes participantes à la Mini-League
      const participatingTeamIds = new Set(
        [...qualificationData, ...finalsData]
          .flatMap(m => [m.homeTeamId, m.awayTeamId])
      )

      const leagueStats = statsData
        .filter(stat => participatingTeamIds.has(stat.teamId))
        .map(stat => ({
          ...stat,
          goalDifference: (stat.goalsFor || 0) - (stat.goalsAgainst || 0),
          rank: 0 // Sera calculé après le tri
        }))
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          return b.goalDifference - a.goalDifference
        })
        .map((stat, index) => ({
          ...stat,
          rank: index + 1
        }))

      setRanking(leagueStats)
    } catch (error) {
      console.error("Error loading Mini-League data:", error)
      setMessage({ type: "error", text: "Erreur lors du chargement des données" })
    } finally {
      setLoading(false)
    }
  }

  const handlePublishFinals = async () => {
    try {
      setPublishing(true)
      setMessage(null)

      const response = await fetch("/api/admin/publish-finals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTest: false })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        await loadData()
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

  const handleDeleteMatches = async (deleteFinals: boolean = true) => {
    try {
      setDeleting(true)
      setMessage(null)
      setShowDeleteConfirm(false)

      const response = await fetch("/api/admin/delete-mini-league-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          deleteFinals,
          isTest: false // Supprimer les matchs de production, pas les tests
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message || "Matchs supprimés avec succès" })
        await loadData() // Recharger les données
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de la suppression" })
      }
    } catch (error) {
      console.error("Error deleting matches:", error)
      setMessage({ type: "error", text: "Erreur lors de la suppression des matchs" })
    } finally {
      setDeleting(false)
    }
  }

  const unpublishedFinals = finals.filter(f => !f.isPublished)
  const publishedFinals = finals.filter(f => f.isPublished)
  const completedQualification = qualificationMatches.filter(m => m.status === 'completed')
  const totalQualificationMatches = qualificationMatches.length
  const qualificationProgress = totalQualificationMatches > 0 
    ? Math.round((completedQualification.length / totalQualificationMatches) * 100) 
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données Mini-League...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-600" />
            Mini-League
          </h2>
          <p className="text-gray-600 mt-1">
            Gestion complète du tournoi Mini-League
          </p>
        </div>
        {(qualificationMatches.length > 0 || finals.length > 0) && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Supprimer les matchs
              </>
            )}
          </button>
        )}
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

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Vue d'ensemble", icon: Target },
            { id: "qualification", label: "Qualification", icon: PlayCircle },
            { id: "finals", label: "Finales", icon: Trophy },
            { id: "ranking", label: "Classement", icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id as any)}
              className={`${
                activeSection === id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Matchs de qualification</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedQualification.length} / {totalQualificationMatches}
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${qualificationProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{qualificationProgress}% terminés</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Finales générées</p>
              <p className="text-2xl font-bold text-gray-900">{finals.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {publishedFinals.length} publiée(s), {unpublishedFinals.length} en attente
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Équipes participantes</p>
              <p className="text-2xl font-bold text-gray-900">{ranking.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Top 4 qualifiés</p>
              <p className="text-2xl font-bold text-green-600">
                {ranking.filter(r => r.rank <= 4).length}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  // Utiliser un événement personnalisé pour communiquer avec le dashboard parent
                  window.dispatchEvent(new CustomEvent('openGenerateModal', { detail: { mode: 'MINI_LEAGUE' } }))
                }}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Générer les matchs</p>
                    <p className="text-sm text-gray-500">Créer le calendrier de qualification</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setShowFinalsModal(true)}
                disabled={qualificationProgress < 100}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Générer les finales</p>
                    <p className="text-sm text-gray-500">
                      {qualificationProgress < 100 
                        ? "Terminez d'abord tous les matchs" 
                        : "Créer les finales (Jour 6)"}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Top 4 Qualification Zone */}
          {ranking.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow p-6 border-l-4 border-blue-600">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Zone de qualification (Top 4)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {ranking.slice(0, 4).map((team) => {
                  const teamData = teams.find(t => t.id === team.teamId)
                  return (
                    <div
                      key={team.teamId}
                      className="bg-white rounded-lg p-4 border-2 border-blue-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-blue-600">#{team.rank}</span>
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                          Qualifié
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900">{teamData?.name || 'Équipe inconnue'}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>{team.points || 0} pts</p>
                        <p>Diff: {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Qualification Section */}
      {activeSection === "qualification" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Phase de qualification (Jours 1-5):</strong> Chaque équipe joue exactement 3 matchs.
              Les 4 meilleures équipes se qualifient pour les finales (Jour 6).
            </p>
          </div>

          {qualificationMatches.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Aucun match de qualification</p>
              <p className="text-gray-500 text-sm mb-4">
                Générez les matchs pour commencer la phase de qualification
              </p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Générer les matchs
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(day => {
                const dayMatches = qualificationMatches.filter(m => m.round === day)
                const completedDayMatches = dayMatches.filter(m => m.status === 'completed')
                
                return (
                  <div key={day} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Jour {day}</h4>
                      <span className="text-sm text-gray-500">
                        {completedDayMatches.length} / {dayMatches.length} terminés
                      </span>
                    </div>
                    {dayMatches.length > 0 ? (
                      <div className="space-y-2">
                        {dayMatches.map(match => {
                          const matchDate = match.date instanceof Date ? match.date : new Date(match.date)
                          return (
                            <div
                              key={match.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-4 border-gray-300"
                            >
                              <div className="flex-1 flex items-center gap-4">
                                <div className="flex-1 text-right">
                                  <p className="font-medium text-gray-900">
                                    {(match as any).homeTeam?.name || 'Équipe à domicile'}
                                  </p>
                                </div>
                                <div className="text-gray-400">vs</div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {(match as any).awayTeam?.name || 'Équipe à l\'extérieur'}
                                  </p>
                                </div>
                              </div>
                              <div className="ml-4 flex items-center gap-3">
                                <span className="text-xs text-gray-500">
                                  {matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
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
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Aucun match programmé</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Finals Section */}
      {activeSection === "finals" && (
        <div className="space-y-6">
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
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePublishFinals}
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
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                          {final.finalType === 'grande_finale' ? '🥇 Grande Finale' : '🥉 Petite Finale'}
                        </span>
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
      )}

      {/* Ranking Section */}
      {activeSection === "ranking" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Classement de qualification:</strong> Les 4 premières équipes se qualifient pour les finales.
            </p>
          </div>

          {ranking.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Aucun classement disponible</p>
              <p className="text-gray-500 text-sm">
                Le classement apparaîtra après les premiers résultats
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Équipe
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pts
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      J
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      G
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diff
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BP
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BC
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ranking.map((team) => {
                    const teamData = teams.find(t => t.id === team.teamId)
                    const isQualified = team.rank <= 4
                    return (
                      <tr
                        key={team.teamId}
                        className={`hover:bg-gray-50 ${
                          isQualified ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {team.rank}
                          {isQualified && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Qualifié
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {teamData?.name || 'Équipe inconnue'}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900">
                          {team.points || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500">
                          {team.matchesPlayed || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500">
                          {team.wins || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500">
                          {team.draws || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500">
                          {team.losses || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-gray-900">
                          {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500">
                          {team.goalsFor || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500">
                          {team.goalsAgainst || 0}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Le modal sera géré par le dashboard parent via l'événement */}

      {showFinalsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Générer les finales</h3>
            <p className="text-gray-600 mb-4">
              Les finales sont générées automatiquement une fois tous les matchs de qualification terminés.
              Si vous souhaitez les générer manuellement, utilisez le bouton dans l'onglet "Résultats".
            </p>
            <button
              onClick={() => setShowFinalsModal(false)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer les matchs Mini-League</h3>
                <p className="text-sm text-gray-600">Cette action est irréversible</p>
              </div>
            </div>
            
            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-700">
                Vous allez supprimer :
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                <li>{qualificationMatches.length} match(s) de qualification</li>
                {finals.length > 0 && <li>{finals.length} finale(s)</li>}
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Attention :</strong> Cette action supprimera également tous les résultats associés à ces matchs.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteMatches(true)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Supprimer tout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

