"use client"

import { Star, Trash2, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

interface Favorite {
  id: string
  itemId: string
  type: 'team' | 'player'
  name: string
  teamId?: string
  teamName?: string
  playerId?: string
  playerName?: string
  createdAt: any
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  const fetchFavorites = async () => {
    try {
      const { auth } = await import('@/lib/firebase')
      const currentUser = auth.currentUser
      if (!currentUser) return

      const response = await fetch(`/api/favorites?userId=${currentUser.uid}`)
      const data = await response.json()
      
      if (data.success) {
        setFavorites(data.favorites)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favorite: Favorite) => {
    try {
      const { auth } = await import('@/lib/firebase')
      const currentUser = auth.currentUser
      if (!currentUser) return

      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.uid, 
          teamId: favorite.teamId,
          playerId: favorite.playerId,
          type: favorite.type
        })
      })

      if (response.ok) {
        setFavorites(favorites.filter(f => f.id !== favorite.id))
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            Mes Équipes Favorites
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Suivez vos équipes préférées et recevez des notifications sur leurs matchs
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Notifications automatiques</p>
              <p>Vous recevrez des notifications pour les matchs, résultats et actualités de vos équipes favorites.</p>
            </div>
          </div>
        </div>

        {/* Favorites List */}
        {favorites.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center">
            <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Aucune équipe favorite</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
              Ajoutez des équipes à vos favoris pour suivre leurs actualités
            </p>
            <Link
              href="/public/teams"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Découvrir les équipes
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {favorites.map((favorite) => {
              const displayName = favorite.name || favorite.teamName || favorite.playerName || 'Sans nom'
              const linkHref = favorite.type === 'team' 
                ? `/public/team/${favorite.itemId}` 
                : `/public/players` // Adapter selon ta structure
              const typeLabel = favorite.type === 'team' ? 'Équipe' : 'Joueur'
              
              return (
                <div
                  key={favorite.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={linkHref}
                      className="flex items-center gap-4 flex-1 hover:opacity-80 transition-opacity"
                    >
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            {displayName}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Ajouté le {new Date(favorite.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </Link>
                    
                    <button
                      onClick={() => removeFavorite(favorite)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Retirer des favoris"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats */}
        {favorites.length > 0 && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Vous suivez <strong className="text-gray-900 dark:text-white">{favorites.length}</strong> équipe{favorites.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
