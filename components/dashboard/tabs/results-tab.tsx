"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getMatches, getMatchResult, createMatchResult, updateMatchResult, getTeams, getPlayersByTeam } from "@/lib/db"
import { generateRoundRobinMatches, calculateTeamStats, generateRanking } from "@/lib/match-generation"
import type { Match, MatchResult, Team, Player } from "@/lib/types"
import { Plus, AlertCircle, Trophy, X } from "lucide-react"

export default function ResultsTab() {
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [showResultForm, setShowResultForm] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [generateData, setGenerateData] = useState({ startDate: "", daysPerRound: "7" })
  const [resultData, setResultData] = useState({
    homeScore: "",
    awayScore: "",
    homeGoalScorers: [] as Array<{ playerName: string; assists?: string }>,
    awayGoalScorers: [] as Array<{ playerName: string; assists?: string }>,
  })
  const [players, setPlayers] = useState<Player[]>([])
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([])
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setError(null)
      const [teamsData, matchesData] = await Promise.all([getTeams(), getMatches()])
      setTeams(teamsData)
      setMatches(matchesData)

      // Load all results
      const allResults = await Promise.all(matchesData.map((m) => getMatchResult(m.id)))
      setResults(allResults.filter((r) => r !== null) as MatchResult[])

      // Calculate ranking
      const stats = calculateTeamStats(
        matchesData,
        allResults
          .filter((r) => r !== null)
          .map((r) => ({
            matchId: r!.matchId,
            homeScore: r!.homeTeamScore,
            awayScore: r!.awayTeamScore,
          })),
      )
      const rankingData = generateRanking(stats)
      setRanking(rankingData)
    } catch (err) {
      setError("Erreur lors du chargement des données")
      console.error("Error loading data:", err)
    }
  }

  const handleGenerateMatches = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!generateData.startDate) {
      setError("Veuillez sélectionner une date de début")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const teamIds = teams.map((t) => t.id)
      await generateRoundRobinMatches(
        teamIds,
        new Date(generateData.startDate),
        Number.parseInt(generateData.daysPerRound),
      )

      setSuccess("Matchs générés avec succès")
      setShowGenerateForm(false)
      setGenerateData({ startDate: "", daysPerRound: "7" })
      await loadData()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la génération des matchs")
      console.error("Error generating matches:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddResult = async (match: Match) => {
    try {
      const [homeTeamPlayersData, awayTeamPlayersData] = await Promise.all([
        getPlayersByTeam(match.homeTeamId),
        getPlayersByTeam(match.awayTeamId),
      ])
      setHomeTeamPlayers(homeTeamPlayersData)
      setAwayTeamPlayers(awayTeamPlayersData)
      setPlayers([...homeTeamPlayersData, ...awayTeamPlayersData])
    } catch (err) {
      console.error("Error loading players:", err)
    }

    setSelectedMatch(match)
    setResultData({
      homeScore: "",
      awayScore: "",
      homeGoalScorers: [],
      awayGoalScorers: [],
    })
    setShowResultForm(true)
    setError(null)
  }

  const addGoalScorer = (team: "home" | "away") => {
    if (team === "home") {
      setResultData({
        ...resultData,
        homeGoalScorers: [...resultData.homeGoalScorers, { playerName: "", assists: "" }],
      })
    } else {
      setResultData({
        ...resultData,
        awayGoalScorers: [...resultData.awayGoalScorers, { playerName: "", assists: "" }],
      })
    }
  }

  const removeGoalScorer = (team: "home" | "away", index: number) => {
    if (team === "home") {
      setResultData({
        ...resultData,
        homeGoalScorers: resultData.homeGoalScorers.filter((_, i) => i !== index),
      })
    } else {
      setResultData({
        ...resultData,
        awayGoalScorers: resultData.awayGoalScorers.filter((_, i) => i !== index),
      })
    }
  }

  const updateGoalScorer = (team: "home" | "away", index: number, field: string, value: string) => {
    if (team === "home") {
      const updated = [...resultData.homeGoalScorers]
      updated[index] = { ...updated[index], [field]: value }
      setResultData({ ...resultData, homeGoalScorers: updated })
    } else {
      const updated = [...resultData.awayGoalScorers]
      updated[index] = { ...updated[index], [field]: value }
      setResultData({ ...resultData, awayGoalScorers: updated })
    }
  }

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMatch) return

    if (!resultData.homeScore || !resultData.awayScore) {
      setError("Veuillez entrer les scores")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const existingResult = await getMatchResult(selectedMatch.id)

      if (existingResult) {
        await updateMatchResult(existingResult.id, {
          homeTeamScore: Number.parseInt(resultData.homeScore),
          awayTeamScore: Number.parseInt(resultData.awayScore),
          homeTeamGoalScorers: resultData.homeGoalScorers,
          awayTeamGoalScorers: resultData.awayGoalScorers,
        })
        setSuccess("Résultat mis à jour avec succès")
      } else {
        await createMatchResult({
          matchId: selectedMatch.id,
          homeTeamScore: Number.parseInt(resultData.homeScore),
          awayTeamScore: Number.parseInt(resultData.awayScore),
          homeTeamGoalScorers: resultData.homeGoalScorers,
          awayTeamGoalScorers: resultData.awayGoalScorers,
        })
        setSuccess("Résultat enregistré avec succès")
      }

      setShowResultForm(false)
      setSelectedMatch(null)
      setResultData({
        homeScore: "",
        awayScore: "",
        homeGoalScorers: [],
        awayGoalScorers: [],
      })
      await loadData()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Erreur lors de l'enregistrement du résultat")
      console.error("Error saving result:", err)
    } finally {
      setLoading(false)
    }
  }

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name || "Équipe inconnue"

  const completedMatches = matches.filter((m) => results.some((r) => r.matchId === m.id))
  const totalMatches = matches.length
  const totalGoals = results.reduce((sum, r) => sum + r.homeTeamScore + r.awayTeamScore, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Résultats et Classement</h2>
        <button
          onClick={() => {
            setShowGenerateForm(!showGenerateForm)
            setError(null)
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-5 h-5" />
          Générer matchs
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

      {showGenerateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleGenerateMatches} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                <input
                  type="date"
                  value={generateData.startDate}
                  onChange={(e) => setGenerateData({ ...generateData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jours entre les journées</label>
                <input
                  type="number"
                  min="1"
                  value={generateData.daysPerRound}
                  onChange={(e) => setGenerateData({ ...generateData, daysPerRound: e.target.value })}
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
                {loading ? "Génération..." : "Générer les matchs"}
              </button>
              <button
                type="button"
                onClick={() => setShowGenerateForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Matchs joués</p>
          <p className="text-3xl font-bold text-primary">
            {completedMatches.length}/{totalMatches}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Équipes</p>
          <p className="text-3xl font-bold text-primary">{teams.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Buts marqués</p>
          <p className="text-3xl font-bold text-primary">{totalGoals}</p>
        </div>
      </div>

      {showResultForm && selectedMatch && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {getTeamName(selectedMatch.homeTeamId)} vs {getTeamName(selectedMatch.awayTeamId)}
          </h3>
          <form onSubmit={handleSubmitResult} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buts {getTeamName(selectedMatch.homeTeamId)}
                </label>
                <input
                  type="number"
                  min="0"
                  value={resultData.homeScore}
                  onChange={(e) => setResultData({ ...resultData, homeScore: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buts {getTeamName(selectedMatch.awayTeamId)}
                </label>
                <input
                  type="number"
                  min="0"
                  value={resultData.awayScore}
                  onChange={(e) => setResultData({ ...resultData, awayScore: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Buteurs {getTeamName(selectedMatch.homeTeamId)}</h4>
                <button
                  type="button"
                  onClick={() => addGoalScorer("home")}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
                >
                  + Ajouter
                </button>
              </div>
              <div className="space-y-3">
                {resultData.homeGoalScorers.map((scorer, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Buteur</label>
                      <select
                        value={scorer.playerName}
                        onChange={(e) => updateGoalScorer("home", index, "playerName", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="">Sélectionner un joueur</option>
                        {homeTeamPlayers.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.number} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Passeur</label>
                      <select
                        value={scorer.assists || ""}
                        onChange={(e) => updateGoalScorer("home", index, "assists", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="">Aucun</option>
                        {homeTeamPlayers.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.number} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGoalScorer("home", index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Buteurs {getTeamName(selectedMatch.awayTeamId)}</h4>
                <button
                  type="button"
                  onClick={() => addGoalScorer("away")}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
                >
                  + Ajouter
                </button>
              </div>
              <div className="space-y-3">
                {resultData.awayGoalScorers.map((scorer, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Buteur</label>
                      <select
                        value={scorer.playerName}
                        onChange={(e) => updateGoalScorer("away", index, "playerName", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="">Sélectionner un joueur</option>
                        {awayTeamPlayers.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.number} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Passeur</label>
                      <select
                        value={scorer.assists || ""}
                        onChange={(e) => updateGoalScorer("away", index, "assists", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="">Aucun</option>
                        {awayTeamPlayers.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.number} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGoalScorer("away", index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 border-t pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : "Enregistrer le résultat"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResultForm(false)
                  setSelectedMatch(null)
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-900">Classement</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pos</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Équipe</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">M</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">V</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">N</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">D</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">BP</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">BC</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Diff</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ranking.length > 0 ? (
              ranking.map((team) => (
                <tr key={team.teamId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{team.rank}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getTeamName(team.teamId)}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.matchesPlayed}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.wins}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.draws}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.losses}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.goalsFor}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{team.goalsAgainst}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                    {team.goalsFor - team.goalsAgainst > 0 ? "+" : ""}
                    {team.goalsFor - team.goalsAgainst}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-center text-primary">{team.points}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  Aucun classement disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
