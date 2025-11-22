"use client"

import { Star, Trash2, Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useFavorites } from '@/hooks/use-favorites'
import Link from 'next/link'

interface Favorite {
  id: string
  itemId: string
  type: 'team' | 'player'
  name?: string
  teamId?: string
  teamName?: string
  playerId?: string
  playerName?: string
  createdAt?: any
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const { favorites: favoritesData, loading: favoritesLoading, refresh } = useFavorites()

  useEffect(() => {
    if (favoritesData) {
      setFavorites(favoritesData)
      setLoading(false)
    } else if (!favoritesLoading) {
      setLoading(false)
    }
  }, [favoritesData, favoritesLoading])

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
        refresh() // Rafraîchir le cache
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header - Modern 2025 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
              <Star className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                Mes Équipes Favorites
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Suivez vos équipes préférées et recevez des notifications sur leurs matchs
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Banner - Modern 2025 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 sm:mb-8 bg-gradient-to-br from-blue-50 via-blue-50/50 to-white dark:from-blue-900/20 dark:via-blue-900/10 dark:to-gray-800 border border-blue-200/50 dark:border-blue-800/50 rounded-xl sm:rounded-2xl backdrop-blur-sm shadow-lg p-4 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex-shrink-0">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="text-sm sm:text-base text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">Notifications automatiques</p>
              <p>Vous recevrez des notifications pour les matchs, résultats et actualités de vos équipes favorites.</p>
            </div>
          </div>
        </motion.div>

        {/* Favorites List */}
        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg p-12 text-center"
          >
            <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Aucune équipe favorite</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
              Ajoutez des équipes à vos favoris pour suivre leurs actualités
            </p>
            <Link href="/public/teams">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Découvrir les équipes
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {favorites.map((favorite, index) => {
              const displayName = favorite.name || favorite.teamName || favorite.playerName || 'Sans nom'
              const linkHref = favorite.type === 'team' 
                ? `/public/team/${favorite.itemId}` 
                : `/public/players`
              const typeLabel = favorite.type === 'team' ? 'Équipe' : 'Joueur'
              
              return (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={linkHref}
                      className="flex items-center gap-3 sm:gap-4 flex-1 hover:opacity-80 transition-opacity"
                    >
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-md">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
                            {displayName}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Ajouté le {new Date(favorite.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </Link>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeFavorite(favorite)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Retirer des favoris"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Stats - Modern 2025 */}
        {favorites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-br from-gray-100 via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg"
          >
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center">
              Vous suivez <strong className="text-gray-900 dark:text-white font-bold">{favorites.length}</strong> équipe{favorites.length > 1 ? 's' : ''}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
