"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getTeams, getMatches, createMatch } from "@/lib/db"
import type { Team, Match, MatchResult } from "@/lib/types"
import { 
  Plus, 
  AlertCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Trophy, 
  Users, 
  Target,
  Home,
  Plane,
  CheckCircle,
  PlayCircle,
  XCircle,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MatchResultForm } from "@/components/matches/match-result-form"
import { collection, doc, updateDoc, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { recalculateAllStatistics } from "@/lib/statistics"

export default function MatchesTab() {
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<(Match & { result?: MatchResult })[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const handleSubmitResult = async (match: Match & { result?: MatchResult }, result: MatchResult) => {
    try {
      console.log("🚀 Starting handleSubmitResult with:", { matchId: match.id, result })
      setLoading(true)
      setError(null)

      // Check for existing result for this match
      const existingResultQuery = query(collection(db, "matchResults"), where("matchId", "==", match.id))
      const existingResultSnap = await getDocs(existingResultQuery)
      const existingResultDoc = existingResultSnap.docs[0]
      const existingResult = existingResultDoc ? (existingResultDoc.data() as MatchResult) : null

      console.log("Checking for existing result:", { existingResult })

      // Mark match as completed
      console.log("Updating match status to completed")
      await updateDoc(doc(db, "matches", match.id), {
        status: "completed",
        updatedAt: Timestamp.now()
      })
      console.log("✅ Match status updated to completed")

      // Upsert match result (create or update)
      console.log("Upserting match result", result)
      const resultData = {
        matchId: match.id,
        homeTeamScore: Number(result.homeTeamScore),  // Conversion explicite en nombre
        awayTeamScore: Number(result.awayTeamScore),  // Conversion explicite en nombre
        homeTeamGoalScorers: result.homeTeamGoalScorers,
        awayTeamGoalScorers: result.awayTeamGoalScorers,
        updatedAt: Timestamp.now(),
      }

      if (existingResultDoc) {
        console.log("Updating existing result", { docId: existingResultDoc.id, resultData })
        // Mise à jour du document existant
        await updateDoc(doc(db, "matchResults", existingResultDoc.id), resultData)
      } else {
        console.log("Creating new result", resultData)
        // Création d'un nouveau document
        const newDocRef = await addDoc(collection(db, "matchResults"), {
          ...resultData,
          createdAt: Timestamp.now(),
        })
        console.log("New result created with ID:", newDocRef.id)
      }

      // Compute points for new and old results
      const computePoints = (home: number, away: number) => {
        const homePts = home > away ? 3 : home === away ? 1 : 0
        const awayPts = away > home ? 3 : home === away ? 1 : 0
        return { homePts, awayPts }
      }

      // Convert string scores to numbers for computation
      const newHomeScore = Number(result.homeTeamScore)
      const newAwayScore = Number(result.awayTeamScore)
      const oldHomeScore = existingResult ? Number(existingResult.homeTeamScore) || 0 : 0
      const oldAwayScore = existingResult ? Number(existingResult.awayTeamScore) || 0 : 0

      const newPts = computePoints(newHomeScore, newAwayScore)
      const oldPts = existingResult ? computePoints(oldHomeScore, oldAwayScore) : { homePts: 0, awayPts: 0 }
      
      console.log("Points computation:", {
        new: { home: newHomeScore, away: newAwayScore, pts: newPts },
        old: { home: oldHomeScore, away: oldAwayScore, pts: oldPts }
      })

      // Deltas to apply to team statistics
      const homeDeltas = {
        matchesPlayed: existingResult ? 0 : 1,
        wins: (newPts.homePts === 3 ? 1 : 0) - (oldPts.homePts === 3 ? 1 : 0),
        draws: (newPts.homePts === 1 ? 1 : 0) - (oldPts.homePts === 1 ? 1 : 0),
        losses: (newPts.homePts === 0 ? 1 : 0) - (oldPts.homePts === 0 ? 1 : 0),
        goalsFor: result.homeTeamScore - (existingResult?.homeTeamScore || 0),
        goalsAgainst: result.awayTeamScore - (existingResult?.awayTeamScore || 0),
        points: newPts.homePts - oldPts.homePts,
      }

      const awayDeltas = {
        matchesPlayed: existingResult ? 0 : 1,
        wins: (newPts.awayPts === 3 ? 1 : 0) - (oldPts.awayPts === 3 ? 1 : 0),
        draws: (newPts.awayPts === 1 ? 1 : 0) - (oldPts.awayPts === 1 ? 1 : 0),
        losses: (newPts.awayPts === 0 ? 1 : 0) - (oldPts.awayPts === 0 ? 1 : 0),
        goalsFor: result.awayTeamScore - (existingResult?.awayTeamScore || 0),
        goalsAgainst: result.homeTeamScore - (existingResult?.homeTeamScore || 0),
        points: newPts.awayPts - oldPts.awayPts,
      }

      // Fetch current stats docs
      const homeTeamStatsQuery = query(collection(db, "teamStatistics"), where("teamId", "==", match.homeTeamId))
      const awayTeamStatsQuery = query(collection(db, "teamStatistics"), where("teamId", "==", match.awayTeamId))

      const [homeStatsSnap, awayStatsSnap] = await Promise.all([
        getDocs(homeTeamStatsQuery),
        getDocs(awayTeamStatsQuery)
      ])

      const homeStatsDoc = homeStatsSnap.docs[0]
      const awayStatsDoc = awayStatsSnap.docs[0]

      const applyDeltas = async (teamId: string, deltas: any, statsDoc: any) => {
        if (statsDoc) {
          const current = statsDoc.data()
          const updated = {
            teamId,
            matchesPlayed: (current.matchesPlayed || 0) + deltas.matchesPlayed,
            wins: (current.wins || 0) + deltas.wins,
            draws: (current.draws || 0) + deltas.draws,
            losses: (current.losses || 0) + deltas.losses,
            goalsFor: (current.goalsFor || 0) + deltas.goalsFor,
            goalsAgainst: (current.goalsAgainst || 0) + deltas.goalsAgainst,
            points: (current.points || 0) + deltas.points,
            updatedAt: Timestamp.now(),
          }
          await updateDoc(doc(db, "teamStatistics", statsDoc.id), updated)
        } else {
          // create a new stats doc with deltas as initial values
          await addDoc(collection(db, "teamStatistics"), {
            teamId,
            matchesPlayed: deltas.matchesPlayed,
            wins: deltas.wins,
            draws: deltas.draws,
            losses: deltas.losses,
            goalsFor: deltas.goalsFor,
            goalsAgainst: deltas.goalsAgainst,
            points: deltas.points,
            updatedAt: Timestamp.now(),
          })
        }
      }

      console.log("Applying team statistics deltas:", { homeDeltas, awayDeltas })
      await Promise.all([
        applyDeltas(match.homeTeamId, homeDeltas, homeStatsDoc),
        applyDeltas(match.awayTeamId, awayDeltas, awayStatsDoc),
      ])
      console.log("✅ Team statistics updated")

      // Recalculate all statistics to ensure consistency
      console.log("Recalculating all statistics...")
      await recalculateAllStatistics()
      console.log("✅ All statistics recalculated")

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
    const statusMap: Record<string, { bg: string; text: string; label: string; icon: any; iconColor: string }> = {
      scheduled: { bg: "bg-blue-50", text: "text-blue-700", label: "Programmé", icon: Clock, iconColor: "text-blue-600" },
      in_progress: { bg: "bg-yellow-50", text: "text-yellow-700", label: "En cours", icon: PlayCircle, iconColor: "text-yellow-600" },
      completed: { bg: "bg-green-50", text: "text-green-700", label: "Terminé", icon: CheckCircle, iconColor: "text-green-600" },
      cancelled: { bg: "bg-red-50", text: "text-red-700", label: "Annulé", icon: XCircle, iconColor: "text-red-600" },
    }
    const s = statusMap[status] || statusMap.scheduled
    const StatusIcon = s.icon
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${s.bg} ${s.text} flex items-center gap-2`}>
        <StatusIcon className={`w-4 h-4 ${s.iconColor}`} />
        {s.label}
      </span>
    )
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

      <div className="space-y-6">
        {matches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun match créé</h3>
            <p className="text-gray-600">Créez votre premier match pour commencer.</p>
          </div>
        ) : (
          matches.map((match) => {
            const getMatchResult = () => {
              if (!match.result) return null
              
              const homeScore = match.result.homeTeamScore
              const awayScore = match.result.awayTeamScore
              
              if (homeScore > awayScore) {
                return { winner: 'home', result: 'Victoire à domicile' }
              } else if (awayScore > homeScore) {
                return { winner: 'away', result: 'Victoire à l\'extérieur' }
              } else {
                return { winner: 'draw', result: 'Match nul' }
              }
            }

            const matchResult = getMatchResult()
            
            return (
              <div key={`admin-match-${match.id}`} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200">
                {/* Match Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{formatDate(match.date)}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(match.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                        Journée {match.round}
                      </span>
                      {getStatusBadge(match.status)}
                    </div>
                  </div>
                </div>

                {/* Match Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                    {/* Home Team */}
                    <div className="text-center lg:text-right">
                      <div className="flex items-center justify-center lg:justify-end gap-3 mb-3">
                        <div className="bg-green-50 p-2 rounded-lg">
                          <Home className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                          DOMICILE
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {getTeamName(match.homeTeamId)}
                      </h3>
                      
                      {match.result && (
                        <div className="space-y-2">
                          <div className={`text-4xl font-bold ${
                            matchResult?.winner === 'home' ? 'text-green-600' : 
                            matchResult?.winner === 'draw' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {match.result.homeTeamScore}
                          </div>
                          
                          {match.result.homeTeamGoalScorers && match.result.homeTeamGoalScorers.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-700 flex items-center justify-center lg:justify-end gap-1">
                                <Target className="w-4 h-4" />
                                Buteurs
                              </p>
                              {match.result.homeTeamGoalScorers.map((scorer: any, idx: number) => (
                                <div key={`admin-home-scorer-${match.id}-${idx}`} className="text-sm text-gray-600">
                                  <span className="font-medium">{scorer.playerName}</span>
                                  {scorer.assists && (
                                    <span className="text-blue-600 ml-1">(Passe: {scorer.assists})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* VS Section */}
                    <div className="text-center">
                      <div className="flex flex-col items-center gap-3">
                        {match.result ? (
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <div className="text-3xl font-bold text-gray-900 mb-2">
                              {match.result.homeTeamScore} - {match.result.awayTeamScore}
                            </div>
                            {matchResult && (
                              <p className={`text-sm font-medium ${
                                matchResult.winner === 'home' ? 'text-green-600' : 
                                matchResult.winner === 'away' ? 'text-blue-600' : 'text-yellow-600'
                              }`}>
                                {matchResult.result}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-blue-50 p-4 rounded-xl">
                            <div className="text-2xl font-bold text-blue-600 mb-2">VS</div>
                            <p className="text-sm text-blue-700">
                              {new Date(match.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>Stade de {getTeamName(match.homeTeamId)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                        <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          EXTÉRIEUR
                        </span>
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <Plane className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {getTeamName(match.awayTeamId)}
                      </h3>
                      
                      {match.result && (
                        <div className="space-y-2">
                          <div className={`text-4xl font-bold ${
                            matchResult?.winner === 'away' ? 'text-green-600' : 
                            matchResult?.winner === 'draw' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {match.result.awayTeamScore}
                          </div>
                          
                          {match.result.awayTeamGoalScorers && match.result.awayTeamGoalScorers.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-700 flex items-center justify-center lg:justify-start gap-1">
                                <Target className="w-4 h-4" />
                                Buteurs
                              </p>
                              {match.result.awayTeamGoalScorers.map((scorer: any, idx: number) => (
                                <div key={`admin-away-scorer-${match.id}-${idx}`} className="text-sm text-gray-600">
                                  <span className="font-medium">{scorer.playerName}</span>
                                  {scorer.assists && (
                                    <span className="text-blue-600 ml-1">(Passe: {scorer.assists})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {getTeamName(match.homeTeamId)} vs {getTeamName(match.awayTeamId)}
                      </span>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white hover:bg-gray-50"
                        >
                          {match.result ? 'Modifier le résultat' : 'Ajouter le résultat'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            Résultat du match
                          </DialogTitle>
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
            )
          })
        )}
      </div>
    </div>
  )
}
