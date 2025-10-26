"use client"

import { useEffect, useState } from "react"
import { getTeams } from "@/lib/db"
import { 
  getCurrentRanking, 
  getTopScorers, 
  getDetailedMatchHistory,
  getComprehensiveTeamStats
} from "@/lib/statistics"
import type { Team } from "@/lib/types"
import { 
  TrendingUp, 
  Target, 
  Calendar,
  Users,
  Trophy,
  Award,
  Shield,
  Zap,
  Clock,
  MapPin
} from "lucide-react"

export default function PublicStatisticsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [topScorers, setTopScorers] = useState<any[]>([])
  const [matchHistory, setMatchHistory] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [teamStats, setTeamStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'ranking' | 'scorers' | 'matches' | 'team-details'>('ranking')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedTeamId && activeTab === 'team-details') {
      loadTeamStats()
    }
  }, [selectedTeamId, activeTab])

  const loadData = async () => {
    try {
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
      }
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTeamStats = async () => {
    if (!selectedTeamId) return

    try {
      const stats = await getComprehensiveTeamStats(selectedTeamId)
      setTeamStats(stats)
    } catch (error) {
      console.error("Error loading team stats:", error)
    }
  }

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name || "Équipe inconnue"

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
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Statistiques Complètes</h1>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'ranking', label: 'Classement', icon: TrendingUp },
              { id: 'scorers', label: 'Buteurs & Passeurs', icon: Target },
              { id: 'matches', label: 'Historique Matchs', icon: Calendar },
              { id: 'team-details', label: 'Détails Équipe', icon: Users }
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
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Classement Général</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Équipe</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Matchs</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Victoires</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Nuls</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Défaites</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Buts Pour</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Buts Contre</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Différence</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ranking.map((team, index) => (
                      <tr key={`public-ranking-${team.teamId}-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            {index < 3 && (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                              }`}>
                                {index + 1}
                              </div>
                            )}
                            {index >= 3 && <span className="w-6 text-center">{index + 1}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{getTeamName(team.teamId)}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{team.matchesPlayed}</td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{team.wins}</td>
                        <td className="px-4 py-3 text-sm text-center text-yellow-600 font-medium">{team.draws}</td>
                        <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">{team.losses}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{team.goalsFor}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{team.goalsAgainst}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          <span className={team.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-center text-primary">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scorers Tab */}
          {activeTab === 'scorers' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Meilleurs Buteurs et Passeurs</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rang</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Joueur</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Buts</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Passes Décisives</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Matchs</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Buts/Match</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topScorers.map((scorer, index) => (
                      <tr key={`public-scorer-${index}-${scorer.name}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            {index < 3 && (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                              }`}>
                                {index + 1}
                              </div>
                            )}
                            {index >= 3 && <span className="w-6 text-center">{index + 1}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{scorer.name}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ⚽ {scorer.goals}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🎯 {scorer.assists}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{scorer.matches}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{scorer.goalsPerMatch}</td>
                        <td className="px-4 py-3 text-sm text-center font-bold text-primary">{scorer.goals + scorer.assists}</td>
                      </tr>
                    ))}
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
                <h2 className="text-xl font-semibold text-gray-900">Historique des Matchs</h2>
              </div>
              <div className="space-y-4">
                {matchHistory.slice(0, 15).map((match, idx) => (
                  <div key={`public-match-${match.id}-${idx}`} className="bg-white border rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">{formatDate(match.date)}</span>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                          Journée {match.round}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        Stade de {getTeamName(match.homeTeamId)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-center flex-1">
                        <p className="text-lg font-bold text-gray-900">{getTeamName(match.homeTeamId)}</p>
                        <p className="text-sm text-gray-500">Domicile</p>
                      </div>
                      <div className="text-center px-8">
                        <p className="text-4xl font-bold text-primary mb-1">
                          {match.result.homeTeamScore} - {match.result.awayTeamScore}
                        </p>
                        <p className="text-xs text-gray-500">Score Final</p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-lg font-bold text-gray-900">{getTeamName(match.awayTeamId)}</p>
                        <p className="text-sm text-gray-500">Extérieur</p>
                      </div>
                    </div>

                    {(match.result.homeTeamGoalScorers.length > 0 || match.result.awayTeamGoalScorers.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                        <div>
                          <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" />
                            {getTeamName(match.homeTeamId)}
                          </p>
                          <div className="space-y-2">
                            {match.result.homeTeamGoalScorers.map((scorer: any, scorerIdx: number) => (
                              <div key={`public-home-scorer-${match.id}-${scorerIdx}-${scorer.playerName}`} className="flex items-center gap-3 p-2 bg-green-50 rounded">
                                <span className="text-green-600 text-lg">⚽</span>
                                <div>
                                  <p className="font-medium text-gray-900">{scorer.playerName}</p>
                                  {scorer.assists && (
                                    <p className="text-sm text-blue-600">Passe: {scorer.assists}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" />
                            {getTeamName(match.awayTeamId)}
                          </p>
                          <div className="space-y-2">
                            {match.result.awayTeamGoalScorers.map((scorer: any, scorerIdx: number) => (
                              <div key={`public-away-scorer-${match.id}-${scorerIdx}-${scorer.playerName}`} className="flex items-center gap-3 p-2 bg-green-50 rounded">
                                <span className="text-green-600 text-lg">⚽</span>
                                <div>
                                  <p className="font-medium text-gray-900">{scorer.playerName}</p>
                                  {scorer.assists && (
                                    <p className="text-sm text-blue-600">Passe: {scorer.assists}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Details Tab */}
          {activeTab === 'team-details' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Analyse Détaillée d'Équipe</h2>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  {teams.map((team, index) => (
                    <option key={`public-team-select-${team.id}-${index}`} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {teamStats && (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-6 h-6" />
                        <span className="font-medium">Matchs Joués</span>
                      </div>
                      <p className="text-3xl font-bold mb-1">{teamStats.completedMatches}</p>
                      <p className="text-blue-100 text-sm">sur {teamStats.totalMatches} programmés</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-6 h-6" />
                        <span className="font-medium">Série Actuelle</span>
                      </div>
                      <p className="text-3xl font-bold mb-1">{teamStats.currentStreak}</p>
                      <p className="text-green-100 text-sm">forme récente</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-6 h-6" />
                        <span className="font-medium">Clean Sheets</span>
                      </div>
                      <p className="text-3xl font-bold mb-1">{teamStats.cleanSheets}</p>
                      <p className="text-purple-100 text-sm">matchs sans encaisser</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="w-6 h-6" />
                        <span className="font-medium">Forme</span>
                      </div>
                      <div className="flex gap-1 mb-2">
                        {teamStats.formGuide.map((result: string, idx: number) => (
                          <span
                            key={`public-form-${selectedTeamId}-${idx}-${result}`}
                            className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center border-2 border-white/30 ${
                              result === 'W' ? 'bg-green-500' : result === 'D' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                      <p className="text-orange-100 text-sm">5 derniers matchs</p>
                    </div>
                  </div>

                  {/* Top Players */}
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Meilleurs Joueurs de l'Équipe
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamStats.topPlayers.slice(0, 6).map((player: any, idx: number) => (
                        <div key={`public-top-player-${selectedTeamId}-${idx}-${player.name}`} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{player.name}</h4>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              #{idx + 1}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{player.goals}</p>
                              <p className="text-xs text-gray-600">Buts</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{player.assists}</p>
                              <p className="text-xs text-gray-600">Passes</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-700">{player.matches}</p>
                              <p className="text-xs text-gray-600">Matchs</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Matches */}
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Derniers Matchs
                    </h3>
                    <div className="space-y-4">
                      {teamStats.detailedResults.slice(0, 5).map((match: any, idx: number) => (
                        <div key={`public-recent-match-${selectedTeamId}-${idx}-${match.match?.id || idx}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                          <div className="flex items-center gap-4">
                            <span className={`w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center ${getOutcomeColor(match.outcome)}`}>
                              {match.outcome}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {match.isHome ? 'vs' : '@'} {getTeamName(match.isHome ? match.match.awayTeamId : match.match.homeTeamId)}
                              </p>
                              <p className="text-sm text-gray-600">{formatDate(match.match.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">{match.teamScore} - {match.opponentScore}</p>
                            {match.teamGoals.length > 0 && (
                              <p className="text-xs text-gray-600 max-w-xs truncate">
                                Buteurs: {match.teamGoals.map((g: any) => g.playerName).join(', ')}
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
        </div>
      </div>
    </div>
  )
}