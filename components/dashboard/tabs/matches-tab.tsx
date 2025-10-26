"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getTeams, getMatches, createMatch } from "@/lib/db"
import type { Team, Match, MatchResult } from "@/lib/types"
import { Plus, AlertCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MatchResultForm } from "@/components/matches/match-result-form"
import { collection, doc, updateDoc, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function MatchesTab() {
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<(Match & { result?: MatchResult })[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const handleSubmitResult = async (match: Match & { result?: MatchResult }, result: MatchResult) => {
    try {
      setLoading(true)
      setError(null)
      
      // Update match status
      await updateDoc(doc(db, "matches", match.id), {
        status: "in_progress",
        updatedAt: Timestamp.now()
      })

      // Create or update match result
      await addDoc(collection(db, "matchResults"), {
        ...result,
        matchId: match.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })

      // Update team statistics
      const homeTeamPoints = result.homeTeamScore > result.awayTeamScore ? 3 : result.homeTeamScore === result.awayTeamScore ? 1 : 0
      const awayTeamPoints = result.awayTeamScore > result.homeTeamScore ? 3 : result.homeTeamScore === result.awayTeamScore ? 1 : 0

      // Fetch current stats or create new ones
      const homeTeamStatsQuery = query(collection(db, "teamStatistics"), where("teamId", "==", match.homeTeamId))
      const awayTeamStatsQuery = query(collection(db, "teamStatistics"), where("teamId", "==", match.awayTeamId))

      const [homeStats, awayStats] = await Promise.all([
        getDocs(homeTeamStatsQuery),
        getDocs(awayTeamStatsQuery)
      ])

      const updateTeamStats = async (teamId: string, isHome: boolean, currentStats: any) => {
        const stats = {
          teamId,
          matchesPlayed: (currentStats?.matchesPlayed || 0) + 1,
          wins: (currentStats?.wins || 0) + (isHome ? (homeTeamPoints === 3 ? 1 : 0) : (awayTeamPoints === 3 ? 1 : 0)),
          draws: (currentStats?.draws || 0) + (homeTeamPoints === 1 ? 1 : 0),
          losses: (currentStats?.losses || 0) + (isHome ? (homeTeamPoints === 0 ? 1 : 0) : (awayTeamPoints === 0 ? 1 : 0)),
          goalsFor: (currentStats?.goalsFor || 0) + (isHome ? result.homeTeamScore : result.awayTeamScore),
          goalsAgainst: (currentStats?.goalsAgainst || 0) + (isHome ? result.awayTeamScore : result.homeTeamScore),
          points: (currentStats?.points || 0) + (isHome ? homeTeamPoints : awayTeamPoints),
          updatedAt: Timestamp.now()
        }

        if (currentStats?.id) {
          await updateDoc(doc(db, "teamStatistics", currentStats.id), stats)
        } else {
          await addDoc(collection(db, "teamStatistics"), stats)
        }
      }

      await Promise.all([
        updateTeamStats(match.homeTeamId, true, homeStats.docs[0]?.data()),
        updateTeamStats(match.awayTeamId, false, awayStats.docs[0]?.data())
      ])

      setSuccess("Résultat enregistré avec succès")
      setTimeout(() => setSuccess(null), 3000)
      
      // Refresh matches
      await loadMatches()
    } catch (err) {
      setError("Une erreur s'est produite lors de l'enregistrement du résultat")
      console.error("Error submitting match result:", err)
    } finally {
      setLoading(false)
    }
  }
  const [formData, setFormData] = useState({
    homeTeamId: "",
    awayTeamId: "",
    date: "",
    round: "1",
  })

  useEffect(() => {
    loadTeams()
    loadMatches()
  }, [])

  const loadTeams = async () => {
    try {
      setError(null)
      const teamsData = await getTeams()
      setTeams(teamsData)
    } catch (err) {
      setError("Erreur lors du chargement des équipes")
      console.error("Error loading teams:", err)
    }
  }

  const loadMatches = async () => {
    try {
      setError(null)
      // Use existing helper to fetch matches (it normalizes dates)
      const matchesData = await getMatches()

      // Fetch match results separately
      const resultsRef = collection(db, "matchResults")
      const resultsSnap = await getDocs(resultsRef)

      // Create a map of match results
      const resultsMap = new Map()
      resultsSnap.docs.forEach((doc) => {
        const result = doc.data() as MatchResult
        resultsMap.set(result.matchId, {
          ...result,
          id: doc.id,
        })
      })

      // Combine matches with their results
      const matchesWithResults = matchesData.map((m) => ({
        ...m,
        result: resultsMap.get(m.id),
      }))

      setMatches(matchesWithResults)
    } catch (err) {
      setError("Erreur lors du chargement des matchs")
      console.error("Error loading matches:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.homeTeamId || !formData.awayTeamId) {
      setError("Veuillez sélectionner deux équipes")
      return
    }

    if (formData.homeTeamId === formData.awayTeamId) {
      setError("Une équipe ne peut pas jouer contre elle-même")
      return
    }

    if (!formData.date) {
      setError("Veuillez sélectionner une date")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createMatch({
        homeTeamId: formData.homeTeamId,
        awayTeamId: formData.awayTeamId,
        date: new Date(formData.date),
        round: Number.parseInt(formData.round),
        status: "scheduled",
      })

      setSuccess("Match créé avec succès")
      setFormData({ homeTeamId: "", awayTeamId: "", date: "", round: "1" })
      setShowForm(false)
      await loadMatches()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Une erreur s'est produite lors de la création du match")
      console.error("Error creating match:", err)
    } finally {
      setLoading(false)
    }
  }

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || "Équipe inconnue"
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      scheduled: { bg: "bg-blue-50", text: "text-blue-700", label: "Programmé" },
      in_progress: { bg: "bg-yellow-50", text: "text-yellow-700", label: "En cours" },
      completed: { bg: "bg-green-50", text: "text-green-700", label: "Terminé" },
      cancelled: { bg: "bg-red-50", text: "text-red-700", label: "Annulé" },
    }
    const s = statusMap[status] || statusMap.scheduled
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.bg} ${s.text}`}>{s.label}</span>
  }

  if (teams.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 text-center py-8">Créez d'abord des équipes pour générer les matchs</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Matchs</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setError(null)
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter un match
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Équipe à domicile</label>
                <select
                  value={formData.homeTeamId}
                  onChange={(e) => setFormData({ ...formData, homeTeamId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                >
                  <option value="">Sélectionner une équipe</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Équipe à l'extérieur</label>
                <select
                  value={formData.awayTeamId}
                  onChange={(e) => setFormData({ ...formData, awayTeamId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                >
                  <option value="">Sélectionner une équipe</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date et heure</label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Journée</label>
                <input
                  type="number"
                  min="1"
                  value={formData.round}
                  onChange={(e) => setFormData({ ...formData, round: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
              >
                {loading ? "Création..." : "Créer le match"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ homeTeamId: "", awayTeamId: "", date: "", round: "1" })
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun match créé</p>
          </div>
        ) : (
          matches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Journée {match.round}</span>
                    {getStatusBadge(match.status)}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{getTeamName(match.homeTeamId)}</p>
                      {match.result && (
                        <div className="mt-2 text-sm">
                          <p className="font-bold">{match.result.homeTeamScore}</p>
                          {match.result.homeTeamGoalScorers?.map((scorer: any, idx: number) => (
                            <p key={idx} className="text-xs text-gray-600">
                              ⚽ {scorer.playerName} {scorer.assists && `(Passe: ${scorer.assists})`}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">VS</p>
                      <p className="text-xs text-gray-500">{formatDate(match.date)}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-gray-900">{getTeamName(match.awayTeamId)}</p>
                      {match.result && (
                        <div className="mt-2 text-sm">
                          <p className="font-bold">{match.result.awayTeamScore}</p>
                          {match.result.awayTeamGoalScorers?.map((scorer: any, idx: number) => (
                            <p key={idx} className="text-xs text-gray-600">
                              ⚽ {scorer.playerName} {scorer.assists && `(Passe: ${scorer.assists})`}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        {match.result ? 'Modifier le résultat' : 'Ajouter le résultat'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Résultat du match</DialogTitle>
                      </DialogHeader>
                      <MatchResultForm 
                        match={match} 
                        onSubmit={handleSubmitResult}
                        isSubmitting={loading}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
