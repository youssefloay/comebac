"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useRouter } from 'next/navigation'
import { Archive, Calendar, Trophy, Users, Target } from 'lucide-react'
import { motion } from 'framer-motion'

interface SeasonArchive {
  id: string
  seasonName: string
  archivedAt: any
  summary: {
    totalTeams: number
    totalPlayers: number
    totalMatches: number
    totalResults: number
    totalGoals: number
  }
}

export default function ArchivesPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [archives, setArchives] = useState<SeasonArchive[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!isAdmin) {
        router.push('/public')
      }
    }
  }, [user, authLoading, isAdmin, router])

  useEffect(() => {
    if (user && isAdmin) {
      loadArchives()
    }
  }, [user, isAdmin])

  const loadArchives = async () => {
    try {
      const response = await fetch('/api/admin/season-archives')
      if (!response.ok) throw new Error('Failed to fetch archives')
      const data = await response.json()
      setArchives(data)
    } catch (error) {
      console.error('Erreur lors du chargement des archives:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Archive className="w-8 h-8 text-blue-600" />
            Archives des Saisons
          </h1>
          <p className="text-gray-600">Consultez les statistiques des saisons passées</p>
        </div>

        {archives.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
            <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune saison archivée pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archives.map((archive, index) => (
              <motion.div
                key={archive.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {archive.seasonName}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {archive.archivedAt?.toDate?.()?.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) || 'N/A'}
                    </p>
                  </div>
                  <Archive className="w-6 h-6 text-blue-600" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Équipes</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {archive.summary.totalTeams}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Joueurs</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {archive.summary.totalPlayers}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Matchs</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">
                      {archive.summary.totalMatches}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Buts</span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      {archive.summary.totalGoals}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            ← Retour au dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
