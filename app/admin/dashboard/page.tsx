"use client"

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Users, Trophy, FileText, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/general-stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Admin
          </h1>
          <p className="text-gray-600">
            Vue d'ensemble de la plateforme ComeBac League
          </p>
        </div>

        {/* Quick Stats */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Teams */}
              <Link href="/admin/teams">
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-3xl font-bold text-blue-600">
                      {stats.stats.teams.total}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Équipes</h3>
                  <p className="text-sm text-gray-600">
                    {stats.stats.teams.withCoach} avec coach
                  </p>
                </div>
              </Link>

              {/* Players */}
              <Link href="/admin/manage/players">
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-3xl font-bold text-green-600">
                      {stats.stats.players.total}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Joueurs</h3>
                  <p className="text-sm text-gray-600">
                    {stats.stats.players.captains} capitaines
                  </p>
                </div>
              </Link>

              {/* Matches */}
              <Link href="/admin/manage/matches">
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-3xl font-bold text-purple-600">
                      {stats.stats.matches.total}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Matchs</h3>
                  <p className="text-sm text-gray-600">
                    {stats.stats.matches.upcoming} à venir
                  </p>
                </div>
              </Link>

              {/* Registrations */}
              <Link href="/admin/team-registrations">
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="text-3xl font-bold text-orange-600">
                      {stats.stats.registrations.pending}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">En attente</h3>
                  <p className="text-sm text-gray-600">
                    {stats.stats.registrations.total} inscriptions
                  </p>
                </div>
              </Link>
            </div>

            {/* Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Pending Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Actions requises
                </h3>
                <div className="space-y-3">
                  {stats.stats.registrations.pending > 0 && (
                    <Link href="/admin/team-registrations">
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {stats.stats.registrations.pending} inscription(s) en attente
                          </span>
                        </div>
                        <span className="text-xs text-orange-600">Voir →</span>
                      </div>
                    </Link>
                  )}
                  
                  {stats.stats.teams.withoutCoach > 0 && (
                    <Link href="/admin/teams">
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {stats.stats.teams.withoutCoach} équipe(s) sans coach
                          </span>
                        </div>
                        <span className="text-xs text-yellow-600">Voir →</span>
                      </div>
                    </Link>
                  )}

                  {stats.stats.auth.neverLoggedIn > 0 && (
                    <Link href="/admin/accounts">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {stats.stats.auth.neverLoggedIn} utilisateur(s) jamais connecté(s)
                          </span>
                        </div>
                        <span className="text-xs text-blue-600">Voir →</span>
                      </div>
                    </Link>
                  )}

                  {stats.stats.registrations.pending === 0 && 
                   stats.stats.teams.withoutCoach === 0 && 
                   stats.stats.auth.neverLoggedIn === 0 && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        Tout est à jour! 🎉
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Accès rapides
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/admin/stats">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition cursor-pointer">
                      <TrendingUp className="w-6 h-6 text-blue-600 mb-2" />
                      <p className="text-sm font-medium text-gray-900">Statistiques</p>
                    </div>
                  </Link>
                  
                  <Link href="/admin/team-registrations">
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg hover:shadow-md transition cursor-pointer">
                      <FileText className="w-6 h-6 text-orange-600 mb-2" />
                      <p className="text-sm font-medium text-gray-900">Inscriptions</p>
                    </div>
                  </Link>
                  
                  <Link href="/admin/teams">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-md transition cursor-pointer">
                      <Users className="w-6 h-6 text-green-600 mb-2" />
                      <p className="text-sm font-medium text-gray-900">Équipes</p>
                    </div>
                  </Link>
                  
                  <Link href="/admin/maintenance">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition cursor-pointer">
                      <Trophy className="w-6 h-6 text-purple-600 mb-2" />
                      <p className="text-sm font-medium text-gray-900">Maintenance</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
