"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'

interface Favorite {
  id: string
  userId: string
  itemId: string
  type: 'team' | 'player'
  name?: string
  teamId?: string
  teamName?: string
  playerId?: string
  playerName?: string
  createdAt?: any
}

// Cache global pour éviter les appels multiples
let favoritesCache: Favorite[] | null = null
let cacheUserId: string | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60000 // 1 minute

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFavorites = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setFavorites([])
      setLoading(false)
      return
    }

    const { auth } = await import('@/lib/firebase')
    const currentUser = auth.currentUser
    if (!currentUser) {
      setFavorites([])
      setLoading(false)
      return
    }

    // Utiliser le cache si disponible et valide
    const now = Date.now()
    if (
      !forceRefresh &&
      favoritesCache &&
      cacheUserId === currentUser.uid &&
      now - cacheTimestamp < CACHE_DURATION
    ) {
      setFavorites(favoritesCache)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/favorites?userId=${currentUser.uid}`)
      const data = await response.json()
      
      if (data.success) {
        const favs = data.favorites || []
        setFavorites(favs)
        // Mettre à jour le cache
        favoritesCache = favs
        cacheUserId = currentUser.uid
        cacheTimestamp = now
      }
    } catch (error) {
      console.error('Erreur chargement favoris:', error)
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const invalidateCache = useCallback(() => {
    favoritesCache = null
    cacheUserId = null
    cacheTimestamp = 0
  }, [])

  const isFavorite = useCallback((itemId: string, type: 'team' | 'player') => {
    return favorites.some(f => f.itemId === itemId && f.type === type)
  }, [favorites])

  return {
    favorites,
    loading,
    isFavorite,
    refresh: () => fetchFavorites(true),
    invalidateCache
  }
}

