"use client"

import { useEffect, useState } from "react"
import { getTeams } from "@/lib/db"
import { 
  getCurrentRanking, 
  getTopScorers, 
  getDetailedMatchHistory,
  getComprehensiveTeamStats,
  getAdvancedAnalytics,
  getSeasonTrends,
  getMatchPredictions,
  getPlayerAwards,
  getHeadToHeadStats
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
  MapPin,
  BarChart3,
  Activity,
  Brain,
  Star,
  Flame,
  GitCompare
} from "lucide-react"

export default function PublicStatisticsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [topScorers, setTopScorers] = useState<any[]>([])
  const [matchHistory, setMatchHistory] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [teamStats, setTeamStats] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [trendsData, setTrendsData] = useState<any>(null)
  const [predictionsData, setPredictionsData] = useState<any>(null)
  const [awardsData, setAwardsData] = useState<any>(null)
  const [comparisonTeamA, setComparisonTeamA] = useState<string>("")
  const [comparisonTeamB, setComparisonTeamB] = useState<string>("")
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'ranking' | 'scorers' | 'matches' | 'team-details' | 'analytics' | 'comparison' | 'trends' | 'predictions' | 'awards'>('ranking')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedTeamId && activeTab === 'team-details') {
      loadTeamStats()
    }
  }, [selectedTeamId, activeTab])

  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData) {
      loadAnalyticsData()
    }
  }, [activeTab, analyticsData])

  useEffect(() => {
    if (activeTab === 'trends' && !trendsData) {
      loadTrendsData()
    }
  }, [activeTab, trendsData])

  useEffect(() => {
    if (activeTab === 'predictions' && !predictionsData) {
      loadPredictionsData()
    }
  }, [activeTab, predictionsData])

  useEffect(() => {
    if (activeTab === 'awards' && !awardsData) {
      loadAwardsData()
    }
  }, [activeTab, awardsData])

  useEffect(() => {
    if (activeTab === 'comparison' && comparisonTeamA && comparisonTeamB && comparisonTeamA !== comparisonTeamB) {
      loadComparisonData()
    }
  }, [activeTab, comparisonTeamA, comparisonTeamB])

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

  const loadAnalyticsData = async () => {
    try {
      const data = await getAdvancedAnalytics()
      setAnalyticsData(data)
    } catch (error) {
      console.error("Error loading analytics data:", error)
    }
  }

  const loadTrendsData = async () => {
    try {
      const data = await getSeasonTrends()
      setTrendsData(data)
    } catch (error) {
      console.error("Error loading trends data:", error)
    }
  }

  const loadPredictionsData = async () => {
    try {
      const data = await getMatchPredictions()
      setPredictionsData(data)
    } catch (error) {
      console.error("Error loading predictions data:", error)
    }
  }

  const loadAwardsData = async () => {
    try {
      const data = await getPlayerAwards()
      setAwardsData(data)
    } catch (error) {
      console.error("Error loading awards data:", error)
    }
  }

  const loadComparisonData = async () => {
    if (!comparisonTeamA || !comparisonTeamB) return

    try {
      const data = await getHeadToHeadStats(comparisonTeamA, comparisonTeamB)
      setComparisonData(data)
    } catch (error) {
      console.error("Error loading comparison data:", error)
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-sofa-green rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sofa-text-secondary">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  // Organize data by priority
  const topTeams = ranking.slice(0, 3)
  const topScorersData = topScorers.slice(0, 5)
  const recentMatches = matchHistory.slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Compact Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-sofa-text-primary mb-2">Statistiques de la Ligue</h1>
        <p className="text-sofa-text-secondary">Analyses complètes et données en temps réel</p>
      </div>

      {/* Priority Content - Key Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top 3 Teams */}
        <div className="sofa-card p-6">
          <h2 className="text-lg font-bold text-sofa-text-primary mb-4 flex items-center gap-2">
            🏆 Podium Actuel
          </h2>
          <div className="space-y-3">
            {topTeams.map((team, index) => (
              <div key={team.teamId} className="flex items-center gap-3 p-3 bg-sofa-bg-tertiary rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index === 0 ? 'bg-sofa-green' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sofa-text-primary">{getTeamName(team.teamId)}</div>
                  <div className="text-sm text-sofa-text-muted">{team.wins}V - {team.draws}N - {team.losses}D</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-sofa-text-accent">{team.points}</div>
                  <div className="text-xs text-sofa-text-muted">pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Scorers */}
        <div className="sofa-card p-6">
          <h2 className="text-lg font-bold text-sofa-text-primary mb-4 flex items-center gap-2">
            ⚽ Meilleurs Buteurs
          </h2>
          <div className="space-y-3">
            {topScorersData.map((scorer, index) => (
              <div key={`${scorer.name}-${index}`} className="flex items-center gap-3 p-3 bg-sofa-bg-tertiary rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index === 0 ? 'bg-sofa-green' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sofa-text-primary">{scorer.name}</div>
                  <div className="text-sm text-sofa-text-muted">{scorer.matches} matchs</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-sofa-text-accent">{scorer.goals}</div>
                  <div className="text-xs text-sofa-text-muted">buts</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="sofa-card p-6">
          <h2 className="text-lg font-bold text-sofa-text-primary mb-4 flex items-center gap-2">
            📅 Derniers Résultats
          </h2>
          <div className="space-y-3">
            {recentMatches.map((match, index) => (
              <div key={`${match.id}-${index}`} className="p-3 bg-sofa-bg-tertiary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-sofa-text-primary">
                    {getTeamName(match.homeTeamId)} vs {getTeamName(match.awayTeamId)}
                  </div>
                  <div className="text-sm text-sofa-text-muted">
                    J{match.round}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-sofa-text-accent">
                    {match.result.homeTeamScore} - {match.result.awayTeamScore}
                  </div>
                  <div className="text-xs text-sofa-text-muted">
                    {formatDate(match.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Improved Navigation Tabs */}
      <div className="sofa-card mb-8">
        <div className="border-b border-sofa-border">
          <nav className="flex space-x-1 px-4 overflow-x-auto scrollbar-hide" role="tablist">
            {[
              { id: 'ranking', label: 'Classement', icon: TrendingUp, priority: 1 },
              { id: 'scorers', label: 'Buteurs', icon: Target, priority: 2 },
              { id: 'matches', label: 'Matchs', icon: Calendar, priority: 3 },
              { id: 'team-details', label: 'Équipes', icon: Users, priority: 4 },
              { id: 'analytics', label: 'Analytics', icon: BarChart3, priority: 5 },
              { id: 'comparison', label: 'Comparaison', icon: GitCompare, priority: 6 }
            ].map(({ id, label, icon: Icon, priority }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === id
                    ? 'border-sofa-text-accent text-sofa-text-accent bg-sofa-text-accent/10 rounded-t-lg'
                    : 'border-transparent text-sofa-text-secondary hover:text-sofa-text-accent hover:bg-sofa-bg-hover rounded-t-lg'
                }`}
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`panel-${id}`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Ranking Tab */}
          {activeTab === 'ranking' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-sofa-text-accent" />
                <h2 className="text-xl font-semibold text-sofa-text-primary">Classement Général</h2>
              </div>
              
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="sofa-table">
                  <thead className="bg-sofa-bg-secondary border-b-2 border-sofa-text-accent">
                    <tr>
                      <th className="text-sofa-text-primary font-bold">Position</th>
                      <th className="text-sofa-text-primary font-bold">Équipe</th>
                      <th className="text-sofa-text-primary font-bold">Matchs</th>
                      <th className="text-sofa-text-primary font-bold">Victoires</th>
                      <th className="text-sofa-text-primary font-bold">Nuls</th>
                      <th className="text-sofa-text-primary font-bold">Défaites</th>
                      <th className="text-sofa-text-primary font-bold">Buts Pour</th>
                      <th className="text-sofa-text-primary font-bold">Buts Contre</th>
                      <th className="text-sofa-text-primary font-bold">Différence</th>
                      <th className="text-sofa-text-primary font-bold">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((team, index) => (
                      <tr key={`ranking-${team.teamId}-${index}`} 
                          className={`hover:bg-gray-50 transition-colors ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' :
                            index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100' :
                            index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100' :
                            index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          }`}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' : 
                              index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                              'bg-gradient-to-r from-blue-400 to-blue-600'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                        </td>
                        <td className="font-bold text-sofa-text-primary">{getTeamName(team.teamId)}</td>
                        <td className="text-center font-medium text-sofa-text-secondary">{team.matchesPlayed}</td>
                        <td className="text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                            {team.wins}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                            {team.draws}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                            {team.losses}
                          </span>
                        </td>
                        <td className="text-center font-medium text-sofa-blue">{team.goalsFor}</td>
                        <td className="text-center font-medium text-sofa-red">{team.goalsAgainst}</td>
                        <td className="text-center">
                          <span className={`font-bold px-2 py-1 rounded ${
                            team.goalDifference >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="text-xl font-bold text-sofa-text-primary bg-sofa-bg-secondary px-3 py-1 rounded-lg border-2 border-sofa-text-accent">
                            {team.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {ranking.map((team, index) => (
                  <div key={`ranking-mobile-${team.teamId}-${index}`} 
                       className={`p-4 rounded-xl shadow-lg border-l-4 ${
                         index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-500' :
                         index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-500' :
                         index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-500' :
                         'bg-white border-gray-300'
                       }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' : 
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-gradient-to-r from-blue-400 to-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{getTeamName(team.teamId)}</h3>
                          <p className="text-sm text-gray-600">{team.matchesPlayed} matchs joués</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{team.points}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-green-100 rounded-lg p-2">
                        <div className="text-lg font-bold text-green-700">{team.wins}</div>
                        <div className="text-xs text-green-600">Victoires</div>
                      </div>
                      <div className="bg-yellow-100 rounded-lg p-2">
                        <div className="text-lg font-bold text-yellow-700">{team.draws}</div>
                        <div className="text-xs text-yellow-600">Nuls</div>
                      </div>
                      <div className="bg-red-100 rounded-lg p-2">
                        <div className="text-lg font-bold text-red-700">{team.losses}</div>
                        <div className="text-xs text-red-600">Défaites</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-sofa-border">
                      <div className="text-sm text-sofa-text-secondary">
                        <span className="font-medium">Buts:</span> {team.goalsFor} - {team.goalsAgainst}
                      </div>
                      <div className={`text-sm font-bold ${team.goalDifference >= 0 ? 'text-sofa-green' : 'text-sofa-red'}`}>
                        Diff: {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scorers Tab */}
          {activeTab === 'scorers' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-sofa-text-accent" />
                <h2 className="text-xl font-semibold text-sofa-text-primary">Meilleurs Buteurs et Passeurs</h2>
              </div>
              
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="sofa-table">
                  <thead className="bg-sofa-bg-secondary border-b-2 border-sofa-green">
                    <tr>
                      <th className="text-sofa-text-primary font-bold">Rang</th>
                      <th className="text-sofa-text-primary font-bold">Joueur</th>
                      <th className="text-sofa-text-primary font-bold">Buts</th>
                      <th className="text-sofa-text-primary font-bold">Passes Décisives</th>
                      <th className="text-sofa-text-primary font-bold">Matchs</th>
                      <th className="text-sofa-text-primary font-bold">Buts/Match</th>
                      <th className="text-sofa-text-primary font-bold">Total Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topScorers.map((scorer, index) => (
                      <tr key={`scorer-${index}-${scorer.name}`}
                          className={`hover:bg-gray-50 transition-colors ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' :
                            index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100' :
                            index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100' :
                            index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          }`}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' : 
                              index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                              'bg-gradient-to-r from-green-400 to-green-600'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                        </td>
                        <td className="font-bold text-sofa-text-primary">{scorer.name}</td>
                        <td className="text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                            ⚽ {scorer.goals}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                            🎯 {scorer.assists}
                          </span>
                        </td>
                        <td className="text-center font-medium text-sofa-text-secondary">{scorer.matches}</td>
                        <td className="text-center font-medium text-sofa-text-accent">{scorer.goalsPerMatch}</td>
                        <td className="text-center">
                          <span className="text-xl font-bold text-sofa-text-primary bg-sofa-bg-secondary px-3 py-1 rounded-lg border-2 border-sofa-orange">
                            {scorer.goals + scorer.assists}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {topScorers.map((scorer, index) => (
                  <div key={`scorer-mobile-${index}-${scorer.name}`} 
                       className={`p-4 rounded-xl shadow-lg border-l-4 ${
                         index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-500' :
                         index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-500' :
                         index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-500' :
                         'bg-white border-green-300'
                       }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' : 
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-gradient-to-r from-green-400 to-green-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-sofa-text-primary">{scorer.name}</h3>
                          <p className="text-sm text-sofa-text-secondary">{scorer.matches} matchs joués</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-sofa-orange">{scorer.goals + scorer.assists}</div>
                        <div className="text-xs text-sofa-text-muted">points total</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-green-100 rounded-lg p-3">
                        <div className="text-xl font-bold text-green-700">⚽ {scorer.goals}</div>
                        <div className="text-xs text-green-600">Buts</div>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-3">
                        <div className="text-xl font-bold text-blue-700">🎯 {scorer.assists}</div>
                        <div className="text-xs text-blue-600">Passes</div>
                      </div>
                      <div className="bg-purple-100 rounded-lg p-3">
                        <div className="text-xl font-bold text-purple-700">{scorer.goalsPerMatch}</div>
                        <div className="text-xs text-purple-600">Buts/Match</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Match History Tab */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-sofa-text-accent" />
                <h2 className="text-xl font-semibold text-sofa-text-primary">Historique des Matchs</h2>
              </div>
              <div className="space-y-4">
                {matchHistory.slice(0, 15).map((match, idx) => (
                  <div key={`match-${match.id}-${idx}`} className="sofa-match-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-sofa-text-secondary">{formatDate(match.date)}</span>
                        <span className="sofa-badge sofa-badge-completed">
                          Journée {match.round}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-sofa-text-muted">
                        <MapPin className="w-4 h-4" />
                        Stade de {getTeamName(match.homeTeamId)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-center flex-1">
                        <p className="text-lg font-bold text-sofa-text-primary">{getTeamName(match.homeTeamId)}</p>
                        <p className="text-sm text-sofa-text-muted">Domicile</p>
                      </div>
                      <div className="text-center px-8">
                        <p className="sofa-score">
                          {match.result.homeTeamScore} - {match.result.awayTeamScore}
                        </p>
                        <p className="text-xs text-sofa-text-muted">Score Final</p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-lg font-bold text-sofa-text-primary">{getTeamName(match.awayTeamId)}</p>
                        <p className="text-sm text-sofa-text-muted">Extérieur</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Details Tab */}
          {activeTab === 'team-details' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Users className="w-5 h-5 text-sofa-text-accent" />
                <h2 className="text-xl font-semibold text-sofa-text-primary">Analyse Détaillée d'Équipe</h2>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="px-4 py-2 border border-sofa-border rounded-lg text-sm bg-sofa-bg-card text-sofa-text-primary focus:ring-2 focus:ring-sofa-text-accent outline-none"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {teamStats && (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="sofa-stat-card">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-6 h-6 text-sofa-text-accent" />
                        <span className="font-medium text-sofa-text-primary">Matchs Joués</span>
                      </div>
                      <p className="sofa-stat-number">{teamStats.completedMatches}</p>
                      <p className="sofa-stat-label">sur {teamStats.totalMatches} programmés</p>
                    </div>
                    
                    <div className="sofa-stat-card">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-6 h-6 text-sofa-text-accent" />
                        <span className="font-medium text-sofa-text-primary">Série Actuelle</span>
                      </div>
                      <p className="sofa-stat-number">{teamStats.currentStreak}</p>
                      <p className="sofa-stat-label">forme récente</p>
                    </div>

                    <div className="sofa-stat-card">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-6 h-6 text-sofa-text-accent" />
                        <span className="font-medium text-sofa-text-primary">Clean Sheets</span>
                      </div>
                      <p className="sofa-stat-number">{teamStats.cleanSheets}</p>
                      <p className="sofa-stat-label">matchs sans encaisser</p>
                    </div>

                    <div className="sofa-stat-card">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="w-6 h-6 text-sofa-text-accent" />
                        <span className="font-medium text-sofa-text-primary">Forme</span>
                      </div>
                      <div className="flex gap-1 mb-2 justify-center">
                        {teamStats.formGuide.map((result: string, idx: number) => (
                          <span
                            key={idx}
                            className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center text-white ${
                              result === 'W' ? 'bg-sofa-green' : result === 'D' ? 'bg-sofa-yellow' : 'bg-sofa-red'
                            }`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                      <p className="sofa-stat-label">5 derniers matchs</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-sofa-text-accent" />
                <h2 className="text-xl font-semibold text-sofa-text-primary">Analytics Avancées</h2>
              </div>

              {analyticsData ? (
                <>
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="sofa-card">
                      <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">Statistiques Générales</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sofa-text-secondary">Matchs Joués</span>
                          <span className="text-lg font-bold text-sofa-green">{analyticsData.totalMatches}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sofa-text-secondary">Total Buts</span>
                          <span className="text-lg font-bold text-sofa-blue">{analyticsData.totalGoals}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sofa-text-secondary">Moyenne/Match</span>
                          <span className="text-lg font-bold text-sofa-text-accent">{analyticsData.avgGoalsPerMatch}</span>
                        </div>
                      </div>
                    </div>

                    <div className="sofa-card">
                      <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">Efficacité Offensive</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sofa-text-secondary">Buts/Match</span>
                          <span className="text-lg font-bold text-sofa-green">{analyticsData.avgGoalsPerMatch}</span>
                        </div>
                        <div className="w-full bg-sofa-bg-secondary rounded-full h-2">
                          <div 
                            className="bg-sofa-green h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min((analyticsData.avgGoalsPerMatch / 5) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-sofa-text-muted">Basé sur les matchs réels</div>
                      </div>
                    </div>

                    <div className="sofa-card">
                      <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">Performance Équipes</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sofa-text-secondary">Équipes Actives</span>
                          <span className="text-lg font-bold text-sofa-text-accent">{analyticsData.teamMetrics.length}</span>
                        </div>
                        <div className="w-full bg-sofa-bg-secondary rounded-full h-2">
                          <div className="bg-sofa-text-accent h-2 rounded-full w-full" />
                        </div>
                        <div className="text-xs text-sofa-text-muted">Équipes avec statistiques</div>
                      </div>
                    </div>
                  </div>

                  {/* Team Performance Matrix */}
                  <div className="sofa-card">
                    <h3 className="text-lg font-semibold text-sofa-text-primary mb-6">Matrice de Performance</h3>
                    
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="sofa-table">
                        <thead className="bg-sofa-bg-secondary border-b-2 border-sofa-text-accent">
                          <tr>
                            <th className="text-sofa-text-primary font-bold">Équipe</th>
                            <th className="text-sofa-text-primary font-bold">xG (Buts Attendus)</th>
                            <th className="text-sofa-text-primary font-bold">xGA (Buts Encaissés Attendus)</th>
                            <th className="text-sofa-text-primary font-bold">Passes Réussies %</th>
                            <th className="text-sofa-text-primary font-bold">Duels Gagnés %</th>
                            <th className="text-sofa-text-primary font-bold">Note Performance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.teamMetrics.map((team: any, idx: number) => (
                            <tr key={idx} className={`hover:bg-gray-50 transition-colors ${
                              idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                            }`}>
                              <td className="font-bold text-sofa-text-primary">{team.team}</td>
                              <td className="text-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                                  {team.xg}
                                </span>
                              </td>
                              <td className="text-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                                  {team.xga}
                                </span>
                              </td>
                              <td className="text-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                                  {team.passes}%
                                </span>
                              </td>
                              <td className="text-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                                  {team.duels}%
                                </span>
                              </td>
                              <td className="text-center">
                                <span className={`text-xl font-bold px-3 py-1 rounded-lg ${
                                  team.rating >= 8.5 ? 'bg-green-100 text-green-800' : 
                                  team.rating >= 8.0 ? 'bg-blue-100 text-blue-800' : 
                                  team.rating >= 7.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {team.rating}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-4">
                      {analyticsData.teamMetrics.map((team: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl shadow-lg bg-white border border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-sofa-text-primary text-lg">{team.team}</h4>
                            <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${
                              team.rating >= 8.5 ? 'bg-green-100 text-green-800' : 
                              team.rating >= 8.0 ? 'bg-blue-100 text-blue-800' : 
                              team.rating >= 7.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {team.rating}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-blue-700">{team.xg}</div>
                              <div className="text-xs text-blue-600">xG Attendus</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-red-700">{team.xga}</div>
                              <div className="text-xs text-red-600">xGA Encaissés</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-green-700">{team.passes}%</div>
                              <div className="text-xs text-green-600">Passes Réussies</div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-yellow-700">{team.duels}%</div>
                              <div className="text-xs text-yellow-600">Duels Gagnés</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Heat Map */}
                  <div className="sofa-card">
                    <h3 className="text-lg font-semibold text-sofa-text-primary mb-6">Répartition des Performances</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {analyticsData.teamMetrics.slice(0, 8).map((team: any, i: number) => (
                        <div 
                          key={i} 
                          className={`p-4 rounded-lg border-2 text-center ${
                            team.rating >= 8.5 ? 'bg-sofa-green/20 border-sofa-green text-sofa-green' :
                            team.rating >= 8.0 ? 'bg-sofa-text-accent/20 border-sofa-text-accent text-sofa-text-accent' :
                            team.rating >= 7.5 ? 'bg-sofa-yellow/20 border-sofa-yellow text-sofa-yellow' :
                            'bg-sofa-red/20 border-sofa-red text-sofa-red'
                          }`}
                        >
                          <div className="text-xs font-medium mb-1">{team.team}</div>
                          <div className="text-lg font-bold">{team.rating}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-6 mt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-sofa-green/30 rounded" />
                        <span className="text-sofa-text-secondary">Excellent (8.5+)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-sofa-text-accent/30 rounded" />
                        <span className="text-sofa-text-secondary">Très Bon (8.0+)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-sofa-yellow/30 rounded" />
                        <span className="text-sofa-text-secondary">Bon (7.5+)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-sofa-red/30 rounded" />
                        <span className="text-sofa-text-secondary">À Améliorer</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-sofa-green rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sofa-text-secondary">Chargement des analytics...</p>
                </div>
              )}
            </div>
          )}

          {/* Team Comparison Tab */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <GitCompare className="w-5 h-5 text-sofa-text-accent" />
                <h2 className="text-xl font-semibold text-sofa-text-primary">Comparaison d'Équipes</h2>
              </div>

              {/* Team Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="sofa-card">
                  <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">Équipe A</h3>
                  <select 
                    value={comparisonTeamA}
                    onChange={(e) => setComparisonTeamA(e.target.value)}
                    className="w-full px-4 py-2 border border-sofa-border rounded-lg bg-sofa-bg-card text-sofa-text-primary"
                  >
                    <option value="">Sélectionner une équipe</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sofa-card">
                  <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">Équipe B</h3>
                  <select 
                    value={comparisonTeamB}
                    onChange={(e) => setComparisonTeamB(e.target.value)}
                    className="w-full px-4 py-2 border border-sofa-border rounded-lg bg-sofa-bg-card text-sofa-text-primary"
                  >
                    <option value="">Sélectionner une équipe</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison Results */}
              {comparisonData ? (
                <>
                  {/* Head to Head Summary */}
                  <div className="sofa-card">
                    <h3 className="text-lg font-semibold text-sofa-text-primary mb-6">Confrontations Directes</h3>
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-sofa-green mb-2">{comparisonData.team1Wins}</div>
                        <div className="text-sm text-sofa-text-secondary">Victoires {getTeamName(comparisonTeamA)}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-sofa-yellow mb-2">{comparisonData.draws}</div>
                        <div className="text-sm text-sofa-text-secondary">Matchs Nuls</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-sofa-blue mb-2">{comparisonData.team2Wins}</div>
                        <div className="text-sm text-sofa-text-secondary">Victoires {getTeamName(comparisonTeamB)}</div>
                      </div>
                    </div>
                    <div className="mt-4 text-center text-sm text-sofa-text-muted">
                      Total: {comparisonData.totalMatches} match(s) joué(s)
                    </div>
                  </div>

                  {/* Recent Matches */}
                  {comparisonData.detailedMatches.length > 0 && (
                    <div className="sofa-card">
                      <h3 className="text-lg font-semibold text-sofa-text-primary mb-6">Dernières Confrontations</h3>
                      <div className="space-y-4">
                        {comparisonData.detailedMatches.slice(0, 5).map((match: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 border border-sofa-border rounded-lg">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-sofa-text-muted">
                                {new Date(match.match?.date).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="font-medium text-sofa-text-primary">
                                {getTeamName(comparisonTeamA)} vs {getTeamName(comparisonTeamB)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-sofa-text-accent">
                                {match.team1Score} - {match.team2Score}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                match.winner === comparisonTeamA ? 'bg-sofa-green/20 text-sofa-green' :
                                match.winner === comparisonTeamB ? 'bg-sofa-blue/20 text-sofa-blue' :
                                'bg-sofa-yellow/20 text-sofa-yellow'
                              }`}>
                                {match.winner === comparisonTeamA ? 'V1' : 
                                 match.winner === comparisonTeamB ? 'V2' : 'N'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Meeting */}
                  {comparisonData.lastMeeting && (
                    <div className="sofa-card">
                      <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">Dernière Rencontre</h3>
                      <div className="text-center space-y-2">
                        <div className="text-lg font-bold text-sofa-text-primary">
                          {getTeamName(comparisonTeamA)} {comparisonData.lastMeeting.team1Score} - {comparisonData.lastMeeting.team2Score} {getTeamName(comparisonTeamB)}
                        </div>
                        <div className="text-sm text-sofa-text-secondary">
                          {new Date(comparisonData.lastMeeting.match?.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : comparisonTeamA && comparisonTeamB && comparisonTeamA !== comparisonTeamB ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-sofa-green rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sofa-text-secondary">Chargement de la comparaison...</p>
                </div>
              ) : (
                <div className="sofa-card">
                  <div className="text-center py-12 text-sofa-text-secondary">
                    {!comparisonTeamA || !comparisonTeamB ? 
                      "Sélectionnez deux équipes pour voir leur comparaison" :
                      "Veuillez sélectionner deux équipes différentes"
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Season Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-sofa-text-accent" />
                <h2 className="text-xl font-semibold text-sofa-text-primary">Tendances de la Saison</h2>
              </div>

              {trendsData ? (
                <>
                  {/* Goals Trend */}
                  <div className="sofa-card">
                    <h3 className="text-lg font-semibold text-sofa-text-primary mb-6">Évolution des Buts par Journée (Cumulé)</h3>
                    {trendsData.goalsByRound.length > 0 ? (
                      <div className="h-64 flex items-end justify-between gap-2 px-4">
                        {trendsData.goalsByRound.map((goals: number, idx: number) => (
                          <div key={idx} className="flex flex-col items-center gap-2">
                            <div 
                              className="bg-gradient-to-t from-sofa-green to-sofa-text-accent rounded-t transition-all duration-1000 w-8"
                              style={{ 
                                height: `${Math.max((goals / Math.max(...trendsData.goalsByRound)) * 200, 4)}px` 
                              }}
                            />
                            <span className="text-xs text-sofa-text-muted">J{trendsData.rounds[idx]}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sofa-text-secondary">
                        Aucune donnée de tendance disponible
                      </div>
                    )}
                  </div>

                  {/* Performance Trends */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="sofa-card">
                      <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">Tendance Offensive</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sofa-text-secondary">Buts/Match</span>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-sofa-green" />
                            <span className="text-sm font-bold text-sofa-green">+{trendsData.trends.goals}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sofa-text-secondary">Passes Décisives</span>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-sofa-green" />
                            <span className="text-sm font-bold text-sofa-green">+{trendsData.trends.assists}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sofa-text-secondary">Tirs Cadrés</span>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-sofa-green" />
                            <span className="text-sm font-bold text-sofa-green">+{trendsData.trends.shots}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sofa-card">
                      <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">Tendance Défensive</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sofa-text-secondary">Clean Sheets</span>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-sofa-green" />
                            <span className="text-sm font-bold text-sofa-green">+{trendsData.trends.cleanSheets}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sofa-text-secondary">Buts Encaissés</span>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-sofa-red rotate-180" />
                            <span className="text-sm font-bold text-sofa-green">-{trendsData.trends.conceded}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sofa-text-secondary">Tacles Réussis</span>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-sofa-green" />
                            <span className="text-sm font-bold text-sofa-green">+{trendsData.trends.tackles}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="sofa-card">
                    <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">Résumé des Tendances</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-sofa-green mb-1">
                          {trendsData.goalsByRound[trendsData.goalsByRound.length - 1] || 0}
                        </div>
                        <div className="text-sm text-sofa-text-secondary">Total Buts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-sofa-blue mb-1">
                          {trendsData.rounds.length}
                        </div>
                        <div className="text-sm text-sofa-text-secondary">Journées Jouées</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-sofa-text-accent mb-1">
                          {trendsData.goalsByRound.length > 0 ? 
                            Number((trendsData.goalsByRound[trendsData.goalsByRound.length - 1] / trendsData.rounds.length).toFixed(1)) : 0}
                        </div>
                        <div className="text-sm text-sofa-text-secondary">Buts/Journée</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-sofa-yellow mb-1">
                          {trendsData.trends.goals > 0 ? '↗' : '↘'}
                        </div>
                        <div className="text-sm text-sofa-text-secondary">Tendance</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-sofa-green rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sofa-text-secondary">Chargement des tendances...</p>
                </div>
              )}
            </div>
          )}

          {/* Match Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Brain className="w-5 h-5 text-sofa-text-accent" />
                <h2 className="text-xl font-semibold text-sofa-text-primary">Prédictions IA</h2>
              </div>

              {predictionsData ? (
                <>
                  {/* Next Matches Predictions */}
                  <div className="sofa-card">
                    <h3 className="text-lg font-semibold text-sofa-text-primary mb-6">Prochains Matchs - Prédictions</h3>
                    {predictionsData.length > 0 ? (
                      <div className="space-y-4">
                        {predictionsData.map((match: any, idx: number) => (
                          <div key={idx} className="border border-sofa-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <span className="font-medium text-sofa-text-primary">{match.home}</span>
                                <span className="text-sofa-text-muted">vs</span>
                                <span className="font-medium text-sofa-text-primary">{match.away}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-sofa-text-accent" />
                                <span className="text-sm font-bold text-sofa-text-accent">{match.confidence}% confiance</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div className="space-y-2">
                                <div className="text-sm text-sofa-text-secondary">Victoire Domicile</div>
                                <div className="text-lg font-bold text-sofa-green">{match.homeWin}%</div>
                                <div className="w-full bg-sofa-bg-secondary rounded-full h-2">
                                  <div 
                                    className="bg-sofa-green h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${match.homeWin}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="text-sm text-sofa-text-secondary">Match Nul</div>
                                <div className="text-lg font-bold text-sofa-yellow">{match.draw}%</div>
                                <div className="w-full bg-sofa-bg-secondary rounded-full h-2">
                                  <div 
                                    className="bg-sofa-yellow h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${match.draw}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="text-sm text-sofa-text-secondary">Victoire Extérieur</div>
                                <div className="text-lg font-bold text-sofa-blue">{match.awayWin}%</div>
                                <div className="w-full bg-sofa-bg-secondary rounded-full h-2">
                                  <div 
                                    className="bg-sofa-blue h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${match.awayWin}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 text-xs text-sofa-text-muted text-center">
                              Match prévu le {new Date(match.date).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sofa-text-secondary">
                        Aucun match à venir programmé pour le moment
                      </div>
                    )}
                  </div>

                  {/* AI Insights */}
                  <div className="sofa-card">
                    <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">Analyses IA Basées sur les Données</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-sofa-bg-secondary rounded-lg">
                        <Brain className="w-5 h-5 text-sofa-text-accent mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-sofa-text-primary mb-1">Algorithme de Prédiction</p>
                          <p className="text-sm text-sofa-text-secondary">
                            Les prédictions sont basées sur les performances récentes des équipes, 
                            incluant les victoires, défaites et l'avantage du terrain.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-4 bg-sofa-bg-secondary rounded-lg">
                        <Shield className="w-5 h-5 text-sofa-text-accent mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-sofa-text-primary mb-1">Facteurs Analysés</p>
                          <p className="text-sm text-sofa-text-secondary">
                            Forme récente (5 derniers matchs), statistiques domicile/extérieur, 
                            et historique des confrontations directes.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-4 bg-sofa-bg-secondary rounded-lg">
                        <Flame className="w-5 h-5 text-sofa-text-accent mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-sofa-text-primary mb-1">Niveau de Confiance</p>
                          <p className="text-sm text-sofa-text-secondary">
                            Plus il y a de données historiques entre les équipes, 
                            plus le niveau de confiance de la prédiction est élevé.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-sofa-green rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sofa-text-secondary">Chargement des prédictions...</p>
                </div>
              )}
            </div>
          )}

          {/* Player Awards Tab */}
          {activeTab === 'awards' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-5 h-5 text-sofa-text-accent" />
                <h2 className="text-xl font-semibold text-sofa-text-primary">Récompenses & Records</h2>
              </div>

              {awardsData ? (
                <>
                  {/* Monthly Awards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="sofa-card">
                      <div className="flex items-center gap-3 mb-4">
                        <Trophy className="w-6 h-6 text-sofa-yellow" />
                        <h3 className="text-lg font-semibold text-sofa-text-primary">Joueur du Mois</h3>
                      </div>
                      <div className="text-center space-y-3">
                        <div className="w-20 h-20 bg-gradient-to-br from-sofa-yellow to-sofa-orange rounded-full flex items-center justify-center mx-auto">
                          <Trophy className="w-10 h-10 text-white" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-sofa-text-primary">{awardsData.monthlyAwards.player.name}</p>
                          <p className="text-sm text-sofa-text-secondary">{awardsData.monthlyAwards.player.team} - Joueur</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-sofa-border">
                          <div>
                            <p className="text-lg font-bold text-sofa-green">{awardsData.monthlyAwards.player.goals}</p>
                            <p className="text-xs text-sofa-text-muted">Buts</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-sofa-blue">{awardsData.monthlyAwards.player.assists}</p>
                            <p className="text-xs text-sofa-text-muted">Passes</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-sofa-text-accent">
                              {(awardsData.monthlyAwards.player.goals + awardsData.monthlyAwards.player.assists)}
                            </p>
                            <p className="text-xs text-sofa-text-muted">Total</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sofa-card">
                      <div className="flex items-center gap-3 mb-4">
                        <Award className="w-6 h-6 text-sofa-text-accent" />
                        <h3 className="text-lg font-semibold text-sofa-text-primary">Équipe du Mois</h3>
                      </div>
                      <div className="text-center space-y-3">
                        <div className="w-20 h-20 bg-gradient-to-br from-sofa-text-accent to-sofa-green rounded-full flex items-center justify-center mx-auto">
                          <Users className="w-10 h-10 text-white" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-sofa-text-primary">{awardsData.monthlyAwards.team.name}</p>
                          <p className="text-sm text-sofa-text-secondary">Performance exceptionnelle</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-sofa-border">
                          <div>
                            <p className="text-lg font-bold text-sofa-green">{awardsData.monthlyAwards.team.wins}</p>
                            <p className="text-xs text-sofa-text-muted">Victoires</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-sofa-blue">{awardsData.monthlyAwards.team.goals}</p>
                            <p className="text-xs text-sofa-text-muted">Buts</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-sofa-text-accent">{awardsData.monthlyAwards.team.conceded}</p>
                            <p className="text-xs text-sofa-text-muted">Encaissés</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Season Records */}
                  <div className="sofa-card">
                    <h3 className="text-lg font-semibold text-sofa-text-primary mb-6">Records de la Saison</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {awardsData.records.map((record: any, idx: number) => (
                        <div key={idx} className="text-center space-y-3 p-4 border border-sofa-border rounded-lg">
                          <div className="w-12 h-12 bg-sofa-bg-secondary rounded-full flex items-center justify-center mx-auto">
                            <Target className="w-6 h-6 text-sofa-text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-sofa-text-secondary">{record.title}</p>
                            <p className="text-xl font-bold text-sofa-text-primary">{record.value}</p>
                            <p className="text-xs text-sofa-text-muted">{record.subtitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hall of Fame */}
                  <div className="sofa-card">
                    <h3 className="text-lg font-semibold text-sofa-text-primary mb-6">Hall of Fame</h3>
                    {awardsData.hallOfFame.length > 0 ? (
                      <div className="space-y-4">
                        {awardsData.hallOfFame.map((fame: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-sofa-bg-secondary to-transparent rounded-lg">
                            <div className="w-12 h-12 bg-gradient-to-br from-sofa-yellow to-sofa-orange rounded-full flex items-center justify-center">
                              <Star className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-sofa-text-primary">{fame.name}</p>
                              <p className="text-sm text-sofa-text-secondary">{fame.achievement}</p>
                              <p className="text-xs text-sofa-text-muted">{fame.detail} - {fame.team}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sofa-text-secondary">
                        Aucun exploit remarquable enregistré pour le moment
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-sofa-green rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sofa-text-secondary">Chargement des récompenses...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}