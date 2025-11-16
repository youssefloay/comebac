"use client"

import { useState, useEffect } from "react"
import { Bell, Sparkles, TrendingUp, Users, CheckCircle, XCircle, Trophy, X } from "lucide-react"
import Link from "next/link"

export default function AdminStatsPage() {
  const [notificationStats, setNotificationStats] = useState<any>(null)
  const [fantasyStats, setFantasyStats] = useState<any>(null)
  const [pageStats, setPageStats] = useState<any>(null)
  const [generalStats, setGeneralStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [showTeamModal, setShowTeamModal] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [notifRes, fantasyRes, pageRes, generalRes] = await Promise.all([
        fetch('/api/admin/notification-stats?type=permissions'),
        fetch('/api/admin/fantasy-stats'),
        fetch('/api/admin/page-analytics'),
        fetch('/api/admin/general-stats')
      ])

      if (notifRes.ok) {
        const data = await notifRes.json()
        setNotificationStats(data)
      }

      if (fantasyRes.ok) {
        const data = await fantasyRes.json()
        setFantasyStats(data)
      }

      if (pageRes.ok) {
        const data = await pageRes.json()
        setPageStats(data)
      }

      if (generalRes.ok) {
        const data = await generalRes.json()
        setGeneralStats(data)
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Retour Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Statistiques</h1>
          <p className="text-gray-600">Vue d'ensemble de la plateforme</p>
        </div>

        {/* General Stats - Overview */}
        {generalStats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Vue d'ensemble</h2>
            
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Teams */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-3xl font-bold text-blue-600">{generalStats.stats.teams.total}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Équipes</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">✅ Avec coach: {generalStats.stats.teams.withCoach}</p>
                  <p className="text-gray-600">⚠️ Sans coach: {generalStats.stats.teams.withoutCoach}</p>
                </div>
              </div>

              {/* Players */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-3xl font-bold text-green-600">{generalStats.stats.players.total}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Joueurs</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">👑 Capitaines: {generalStats.stats.players.captains}</p>
                  <p className="text-gray-600">🏆 Coaches intérimaires: {generalStats.stats.players.actingCoaches}</p>
                </div>
              </div>

              {/* Matches */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-3xl font-bold text-purple-600">{generalStats.stats.matches.total}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Matchs</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">✅ Joués: {generalStats.stats.matches.played}</p>
                  <p className="text-gray-600">📅 À venir: {generalStats.stats.matches.upcoming}</p>
                </div>
              </div>

              {/* Registrations */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-3xl font-bold text-orange-600">{generalStats.stats.registrations.total}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Inscriptions</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">⏳ En attente: {generalStats.stats.registrations.pending}</p>
                  <p className="text-gray-600">✅ Approuvées: {generalStats.stats.registrations.approved}</p>
                </div>
              </div>
            </div>

            {/* Auth Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">🔐 Comptes utilisateurs</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{generalStats.stats.auth.totalUsers}</p>
                  <p className="text-sm text-gray-600">Total comptes</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{generalStats.stats.auth.verified}</p>
                  <p className="text-sm text-gray-600">Emails vérifiés</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{generalStats.stats.auth.withLastSignIn}</p>
                  <p className="text-sm text-gray-600">Connectés au moins 1x</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{generalStats.stats.auth.neverLoggedIn}</p>
                  <p className="text-sm text-gray-600">Jamais connectés</p>
                </div>
              </div>
            </div>

            {/* Teams Details */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">📋 Détails des équipes</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Équipe</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Joueurs</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Matchs</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Coach</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Capitaine</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generalStats.teamStats.map((team: any) => (
                      <tr key={team.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{team.name}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{team.playersCount}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{team.matchesCount}</td>
                        <td className="py-3 px-4 text-center">
                          {team.hasCoach ? (
                            <span className="text-green-600">✅</span>
                          ) : (
                            <span className="text-orange-600">⚠️</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{team.captain}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedTeam(team)
                              setShowTeamModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            Voir détails →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Players List */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">👥 Tous les joueurs ({generalStats.allPlayers.length})</h3>
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {generalStats.allPlayers.map((player: any) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                          {player.number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{player.name}</p>
                            {player.isCaptain && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">👑 Capitaine</span>}
                            {player.isActingCoach && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🏆 Coach intérimaire</span>}
                          </div>
                          <p className="text-xs text-gray-500">{player.email} • {player.teamName} • {player.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {player.hasAccount ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✅ Compte créé</span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">❌ Pas de compte</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* All Coaches List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">🏆 Tous les coaches ({generalStats.allCoaches.length})</h3>
              <div className="space-y-2">
                {generalStats.allCoaches.length > 0 ? (
                  generalStats.allCoaches.map((coach: any) => (
                    <div key={coach.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{coach.name}</p>
                          <p className="text-xs text-gray-500">{coach.email} • {coach.teamName}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucun coach enregistré</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Team Details Modal */}
        {showTeamModal && selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowTeamModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTeam.name}</h2>
                    <p className="text-gray-600">{selectedTeam.schoolName} • {selectedTeam.teamGrade}</p>
                  </div>
                  <button
                    onClick={() => setShowTeamModal(false)}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedTeam.playersCount}</p>
                    <p className="text-sm text-gray-600">Joueurs</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedTeam.matchesCount}</p>
                    <p className="text-sm text-gray-600">Matchs</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedTeam.hasCoach ? '✅' : '⚠️'}</p>
                    <p className="text-sm text-gray-600">Coach</p>
                  </div>
                </div>

                {/* Coach Info */}
                {selectedTeam.coach && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-gray-900 mb-2">🏆 Coach</h3>
                    <p className="text-gray-900 font-medium">{selectedTeam.coach.name}</p>
                    <p className="text-sm text-gray-600">{selectedTeam.coach.email}</p>
                  </div>
                )}

                {/* Captain Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">👑 Capitaine</h3>
                  <p className="text-gray-900 font-medium">{selectedTeam.captain}</p>
                  <p className="text-sm text-gray-600">{selectedTeam.captainEmail}</p>
                </div>

                {/* Players List */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">👥 Joueurs ({selectedTeam.players.length})</h3>
                  <div className="space-y-2">
                    {selectedTeam.players.map((player: any) => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-sm">
                            {player.number}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{player.name}</p>
                              {player.isCaptain && <span className="text-xs">👑</span>}
                            </div>
                            <p className="text-xs text-gray-500">{player.position} • {player.email}</p>
                          </div>
                        </div>
                        {player.hasAccount ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✅</span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">❌</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Stats */}
        {notificationStats && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                  <p className="text-gray-600">Permissions et activations</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total demandes</p>
                  <p className="text-3xl font-bold text-blue-900">{notificationStats.stats.totalRequests}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-600 font-medium">Activées</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900">{notificationStats.stats.granted}</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600 font-medium">Refusées</p>
                  </div>
                  <p className="text-3xl font-bold text-red-900">{notificationStats.stats.denied}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-600 font-medium">Taux conversion</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">{notificationStats.stats.conversionRate}</p>
                </div>
              </div>

              {/* Users with notifications */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Utilisateurs avec notifications activées</h3>
                <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                  {notificationStats.usersWithNotifications.length > 0 ? (
                    <div className="space-y-2">
                      {notificationStats.usersWithNotifications.map((user: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.email}</p>
                              <p className="text-xs text-gray-500">{user.type}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(user.timestamp).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucun utilisateur avec notifications</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Analytics Stats */}
        {pageStats && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Analytics Pages</h2>
                  <p className="text-gray-600">Vues et temps d'utilisation</p>
                </div>
              </div>

              {/* Global Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl">
                  <p className="text-sm text-indigo-600 font-medium mb-1">Total vues</p>
                  <p className="text-3xl font-bold text-indigo-900">{pageStats.globalStats.totalViews}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-600 font-medium">Utilisateurs</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{pageStats.globalStats.uniqueUsers}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                  <p className="text-sm text-purple-600 font-medium mb-1">Sessions</p>
                  <p className="text-3xl font-bold text-purple-900">{pageStats.globalStats.totalSessions}</p>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl">
                  <p className="text-sm text-pink-600 font-medium mb-1">Temps moyen/session</p>
                  <p className="text-3xl font-bold text-pink-900">{formatTime(pageStats.globalStats.avgTimePerSession)}</p>
                </div>
              </div>

              {/* Pages Stats Table */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Statistiques par page</h3>
                <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {pageStats.pageStats.map((page: any, index: number) => (
                      <div key={index} className="bg-white p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900 text-sm">{page.page}</p>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            {page.views} vues
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                          <div>
                            <p className="text-gray-500">Utilisateurs</p>
                            <p className="font-medium text-gray-900">{page.uniqueUsers}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Temps total</p>
                            <p className="font-medium text-gray-900">{formatTime(page.totalTime)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Temps moyen</p>
                            <p className="font-medium text-gray-900">{formatTime(page.avgTimePerView)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fantasy Stats */}
        {fantasyStats && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Fantasy</h2>
                <p className="text-gray-600">Clics et intérêt</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                <p className="text-sm text-purple-600 font-medium mb-1">Total clics</p>
                <p className="text-3xl font-bold text-purple-900">{fantasyStats.stats.totalClicks}</p>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-pink-600" />
                  <p className="text-sm text-pink-600 font-medium">Utilisateurs uniques</p>
                </div>
                <p className="text-3xl font-bold text-pink-900">{fantasyStats.stats.uniqueUsers}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                <p className="text-sm text-blue-600 font-medium mb-1">Clics/utilisateur</p>
                <p className="text-3xl font-bold text-blue-900">
                  {(fantasyStats.stats.totalClicks / fantasyStats.stats.uniqueUsers).toFixed(1)}
                </p>
              </div>
            </div>

            {/* Top Users */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Top utilisateurs</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                {fantasyStats.stats.topUsers.length > 0 ? (
                  <div className="space-y-2">
                    {fantasyStats.stats.topUsers.map((user: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.email}</p>
                            <p className="text-xs text-gray-500">{user.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{user.count} clics</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucun clic enregistré</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
