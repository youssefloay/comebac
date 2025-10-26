"use client"

import { useState, useEffect } from "react"
import { getTeams } from "@/lib/db"
import { 
  getCurrentRanking, 
  getComprehensiveTeamStats, 
  getTopScorers, 
  recalculateAllStatistics,
  getDetailedMatchHistory,
  getHeadToHeadStats
} from "@/lib/statistics"
import type { Team } from "@/lib/types"
import { 
  AlertCircle, 
  TrendingUp, 
  Target, 
  Calendar,
  Trophy,
  Users,
  BarChart3,
  Zap,
  Shield,
  Award,
  Clock,
  MapPin
} from "lucide-react"

export default function StatisticsTab() {
  const [teams, setTeams] = useState<Team[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [teamStats, setTeamStats] = useState<any>(null)
  const [topScorers, setTopScorers] = useState<any[]>([])
  const [matchHistory, setMatchHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'ranking' | 'team-details' | 'scorers' | 'matches' | 'h2h'>('ranking')
  const [selectedTeam2Id, setSelectedTeam2Id] = useState<string>("")
  const [h2hStats, setH2hStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recalculating, setRecalculating] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      loadTeamStats()
    }
  }, [selectedTeamId])

  useEffect(() => {
    if (selectedTeamId && selectedTeam2Id && activeTab === 'h2h') {
      loadH2HStats()
    }
  }, [selectedTeamId, selectedTeam2Id, activeTab])

  const loadData = async () => {
    try {
      setError(null)
      setLoading(true)
      const [teamsData, rankingData, scorersData, matchHistoryData] = await Promise.all([
        getTeams(),
        getCurrentRanking(),
        getTopScorers(),
        getDetailedMatchHistory(),
      ])

      setTeams(teamsData)
      setRanking(rankingData)
      setTopScorers(scorersData)
      setMatchHistory(matchHistoryData)

      if (teamsData.length > 0) {
        setSelectedTeamId(teamsData[0].id)
        setSelectedTeam2Id(teamsData[1]?.id || teamsData[0].id)
      }
    } catch (err) {
      setError("Erreur lors du chargement des statistiques")
      console.error("Error loading statistics:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadTeamStats = async () => {
    if (!selectedTeamId) return

    try {
      setError(null)
      const stats = await getComprehensiveTeamStats(selectedTeamId)
      setTeamStats(stats)
    } catch (err) {
      setError("Erreur lors du chargement des statistiques de l'équipe")
      console.error("Error loading team stats:", err)
    }
  }

  const loadH2HStats = async () => {
    if (!selectedTeamId || !selectedTeam2Id || selectedTeamId === selectedTeam2Id) return

    try {
      setError(null)
      const stats = await getHeadToHeadStats(selectedTeamId, selectedTeam2Id)
      setH2hStats(stats)
    } catch (err) {
      setError("Erreur lors du chargement des statistiques face-à-face")
      console.error("Error loading H2H stats:", err)
    }
  }

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name || "Équipe inconnue"

  const handleRecalculateStats = async () => {
    try {
      setRecalculating(true)
      setError(null)
      await recalculateAllStatistics()
      await loadData() // Reload all data
    } catch (err) {
      setError("Erreur lors du recalcul des statistiques")
      console.error("Error recalculating statistics:", err)
    } finally {
      setRecalculating(false)
    }
  }

  const handleCleanupDuplicates = async () => {
    try {
      setCleaning(true)
      setError(null)
      
      // Import the direct cleanup function
      const { directCleanupDuplicates, showCurrentStats } = await import('@/scripts/direct-cleanup')
      
      console.log('🔍 Showing current stats before cleanup:')
      await showCurrentStats()
      
      const result = await directCleanupDuplicates()
      
      console.log(`🎉 Cleanup completed: ${result.deletedCount} duplicates removed`)
      console.log(`📊 Teams: ${result.totalTeams}, Original docs: ${result.originalCount}`)
      
      await loadData() // Reload all data
    } catch (err) {
      setError("Erreur lors du nettoyage des doublons")
      console.error("Error cleaning duplicates:", err)
    } finally {
      setCleaning(false)
    }
  }

  const handleResetStatistics = async () => {
    if (!confirm('⚠️ ATTENTION: Ceci va supprimer TOUTES les statistiques existantes et les recalculer depuis zéro. Continuer?')) {
      return
    }
    
    try {
      setResetting(true)
      setError(null)
      
      // Import the reset function
      const { resetAndRecalculateStatistics } = await import('@/scripts/reset-statistics')
      const result = await resetAndRecalculateStatistics()
      
      console.log(`🎉 Reset completed: ${result.deletedCount} deleted, ${result.createdCount} created`)
      
      await loadData() // Reload all data
    } catch (err) {
      setError("Erreur lors du reset des statistiques")
      console.error("Error resetting statistics:", err)
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'W': return 'text-green-600 bg-green-50'
      case 'D': return 'text-yellow-600 bg-yellow-50'
      case 'L': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Statistiques Détaillées</h2>
        <div className="flex gap-2">
          <button
            onClick={handleResetStatistics}
            disabled={resetting || cleaning || recalculating}
            className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition disabled:opacity-50"
          >
            {resetting ? "Reset..." : "Reset Complet"}
          </button>
          <button
            onClick={handleCleanupDuplicates}
            disabled={cleaning || recalculating || resetting}
            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
          >
            {cleaning ? "Nettoyage..." : "Nettoyer Doublons"}
          </button>
          <button
            onClick={handleRecalculateStats}
            disabled={recalculating || cleaning || resetting}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
          >
            {recalculating ? "Recalcul..." : "Recalculer Stats"}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'ranking', label: 'Classement', icon: TrendingUp },
              { id: 'team-details', label: 'Détails Équipe', icon: Users },
              { id: 'scorers', label: 'Buteurs & Passeurs', icon: Target },
              { id: 'matches', label: 'Historique Matchs', icon: Calendar },
              { id: 'h2h', label: 'Face-à-Face', icon: BarChart3 }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Ranking Tab */}
          {activeTab === 'ranking' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900">Classement Général</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Pos</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Équipe</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">M</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">V</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">N</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">D</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">BP</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">BC</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Diff</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ranking.length > 0 ? (
                      ranking.map((team, index) => (
                        <tr
                          key={`ranking-${team.teamId}-${index}`}
                          className={`hover:bg-gray-50 cursor-pointer ${selectedTeamId === team.teamId ? "bg-blue-50" : ""}`}
                          onClick={() => setSelectedTeamId(team.teamId)}
                        >
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{team.rank}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{getTeamName(team.teamId)}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">{team.matchesPlayed}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">{team.wins}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">{team.draws}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">{team.losses}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">{team.goalsFor}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">{team.goalsAgainst}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">
                            {team.goalDifference > 0 ? "+" : ""}
                            {team.goalDifference}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-center text-primary">{team.points}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                          Aucune statistique disponible
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Team Details Tab */}
          {activeTab === 'team-details' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900">Détails de l'équipe</h3>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  {teams.map((team, index) => (
                    <option key={`team-select-${team.id}-${index}`} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {teamStats && (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Matchs Joués</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 mt-1">{teamStats.completedMatches}</p>
                      <p className="text-xs text-blue-700">sur {teamStats.totalMatches} programmés</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Série Actuelle</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900 mt-1">{teamStats.currentStreak}</p>
                      <p className="text-xs text-green-700">forme récente</p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Clean Sheets</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900 mt-1">{teamStats.cleanSheets}</p>
                      <p className="text-xs text-purple-700">matchs sans encaisser</p>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Forme</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {teamStats.formGuide.map((result: string, idx: number) => (
                          <span
                            key={`form-guide-${selectedTeamId}-${idx}-${result}`}
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${getOutcomeColor(result)}`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-orange-700">5 derniers matchs</p>
                    </div>
                  </div>

                  {/* Top Players */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Meilleurs joueurs de l'équipe
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teamStats.topPlayers.slice(0, 6).map((player: any, idx: number) => (
                        <div key={`top-player-${selectedTeamId}-${idx}-${player.name}`} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-gray-900">{player.name}</p>
                            <p className="text-sm text-gray-600">{player.matches} matchs joués</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{player.goals} buts</p>
                            <p className="text-sm text-gray-600">{player.assists} passes</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Matches */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Derniers matchs
                    </h4>
                    <div className="space-y-3">
                      {teamStats.detailedResults.slice(0, 5).map((match: any, idx: number) => (
                        <div key={`recent-match-${selectedTeamId}-${idx}-${match.match?.id || idx}`} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center ${getOutcomeColor(match.outcome)}`}>
                              {match.outcome}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">
                                {match.isHome ? 'vs' : '@'} {getTeamName(match.isHome ? match.match.awayTeamId : match.match.homeTeamId)}
                              </p>
                              <p className="text-sm text-gray-600">{formatDate(match.match.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{match.teamScore} - {match.opponentScore}</p>
                            {match.teamGoals.length > 0 && (
                              <p className="text-xs text-gray-600">
                                {match.teamGoals.map((g: any) => g.playerName).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scorers Tab */}
          {activeTab === 'scorers' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900">Buteurs et Passeurs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rang</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Joueur</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Buts</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Passes</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Matchs</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Buts/Match</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topScorers.length > 0 ? (
                      topScorers.map((scorer, index) => (
                        <tr key={`scorer-${index}-${scorer.name}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{scorer.name}</td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-green-600">{scorer.goals}</td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-blue-600">{scorer.assists}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">{scorer.matches}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">{scorer.goalsPerMatch}</td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-primary">{scorer.goals + scorer.assists}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Aucun buteur enregistré
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Match History Tab */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900">Historique des Matchs</h3>
              </div>
              <div className="space-y-3">
                {matchHistory.slice(0, 10).map((match, idx) => (
                  <div key={`match-history-${match.id}-${idx}`} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">{formatDate(match.date)}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Journée {match.round}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {getTeamName(match.homeTeamId)} (Domicile)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center flex-1">
                        <p className="font-semibold text-gray-900">{getTeamName(match.homeTeamId)}</p>
                      </div>
                      <div className="text-center px-6">
                        <p className="text-2xl font-bold text-primary">
                          {match.result.homeTeamScore} - {match.result.awayTeamScore}
                        </p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="font-semibold text-gray-900">{getTeamName(match.awayTeamId)}</p>
                      </div>
                    </div>

                    {(match.result.homeTeamGoalScorers.length > 0 || match.result.awayTeamGoalScorers.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                        <div>
                          <p className="font-medium text-gray-900 mb-2">{getTeamName(match.homeTeamId)}</p>
                          {match.result.homeTeamGoalScorers.map((scorer: any, scorerIdx: number) => (
                            <div key={`home-scorer-${match.id}-${scorerIdx}-${scorer.playerName}`} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <span className="text-green-600">⚽</span>
                              <span>{scorer.playerName}</span>
                              {scorer.assists && (
                                <span className="text-blue-600">({scorer.assists})</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 mb-2">{getTeamName(match.awayTeamId)}</p>
                          {match.result.awayTeamGoalScorers.map((scorer: any, scorerIdx: number) => (
                            <div key={`away-scorer-${match.id}-${scorerIdx}-${scorer.playerName}`} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <span className="text-green-600">⚽</span>
                              <span>{scorer.playerName}</span>
                              {scorer.assists && (
                                <span className="text-blue-600">({scorer.assists})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Head-to-Head Tab */}
          {activeTab === 'h2h' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900">Confrontations Directes</h3>
                <div className="flex gap-2">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    {teams.map((team, index) => (
                      <option key={`h2h-team1-${team.id}-${index}`} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <span className="py-1 text-gray-500">vs</span>
                  <select
                    value={selectedTeam2Id}
                    onChange={(e) => setSelectedTeam2Id(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    {teams.map((team, index) => (
                      <option key={`h2h-team2-${team.id}-${index}`} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {h2hStats && selectedTeamId !== selectedTeam2Id && (
                <div className="space-y-6">
                  {/* H2H Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-900">{h2hStats.totalMatches}</p>
                      <p className="text-sm text-blue-700">Matchs Joués</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-900">{h2hStats.team1Wins}</p>
                      <p className="text-sm text-green-700">{getTeamName(selectedTeamId)} Victoires</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-900">{h2hStats.draws}</p>
                      <p className="text-sm text-yellow-700">Matchs Nuls</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-900">{h2hStats.team2Wins}</p>
                      <p className="text-sm text-red-700">{getTeamName(selectedTeam2Id)} Victoires</p>
                    </div>
                  </div>

                  {/* H2H Match History */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Historique des confrontations</h4>
                    {h2hStats.detailedMatches.map((match: any, idx: number) => (
                      <div key={`h2h-match-${selectedTeamId}-${selectedTeam2Id}-${idx}-${match.match?.id || idx}`} className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600">{formatDate(match.match.date)}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            match.winner === selectedTeamId ? 'bg-green-100 text-green-800' :
                            match.winner === selectedTeam2Id ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {match.winner === selectedTeamId ? `Victoire ${getTeamName(selectedTeamId)}` :
                             match.winner === selectedTeam2Id ? `Victoire ${getTeamName(selectedTeam2Id)}` :
                             'Match Nul'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-center flex-1">
                            <p className="font-semibold text-gray-900">{getTeamName(selectedTeamId)}</p>
                          </div>
                          <div className="text-center px-6">
                            <p className="text-2xl font-bold text-primary">
                              {match.team1Score} - {match.team2Score}
                            </p>
                          </div>
                          <div className="text-center flex-1">
                            <p className="font-semibold text-gray-900">{getTeamName(selectedTeam2Id)}</p>
                          </div>
                        </div>

                        {(match.team1Goals.length > 0 || match.team2Goals.length > 0) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                            <div>
                              <p className="font-medium text-gray-900 mb-2">{getTeamName(selectedTeamId)}</p>
                              {match.team1Goals.map((scorer: any, scorerIdx: number) => (
                                <div key={`h2h-team1-scorer-${selectedTeamId}-${scorerIdx}-${scorer.playerName}`} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <span className="text-green-600">⚽</span>
                                  <span>{scorer.playerName}</span>
                                  {scorer.assists && (
                                    <span className="text-blue-600">({scorer.assists})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 mb-2">{getTeamName(selectedTeam2Id)}</p>
                              {match.team2Goals.map((scorer: any, scorerIdx: number) => (
                                <div key={`h2h-team2-scorer-${selectedTeam2Id}-${scorerIdx}-${scorer.playerName}`} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <span className="text-green-600">⚽</span>
                                  <span>{scorer.playerName}</span>
                                  {scorer.assists && (
                                    <span className="text-blue-600">({scorer.assists})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTeamId === selectedTeam2Id && (
                <div className="text-center py-8 text-gray-500">
                  Veuillez sélectionner deux équipes différentes pour voir les confrontations directes.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
