"use client"

import { useState, useEffect } from "react"
import { Bell, Sparkles, TrendingUp, Users, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function AdminStatsPage() {
  const [notificationStats, setNotificationStats] = useState<any>(null)
  const [fantasyStats, setFantasyStats] = useState<any>(null)
  const [pageStats, setPageStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [notifRes, fantasyRes, pageRes] = await Promise.all([
        fetch('/api/admin/notification-stats'),
        fetch('/api/admin/fantasy-stats'),
        fetch('/api/admin/page-analytics')
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
          <p className="text-gray-600">Suivi des interactions utilisateurs</p>
        </div>

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
