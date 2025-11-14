"use client"

import { Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

interface FavoriteButtonProps {
  teamId?: string
  teamName?: string
  playerId?: string
  playerName?: string
  type?: 'team' | 'player'
  size?: 'sm' | 'md' | 'lg'
}

export function FavoriteButton({ 
  teamId, 
  teamName, 
  playerId, 
  playerName, 
  type,
  size = 'md' 
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const favoriteType = type || (teamId ? 'team' : 'player')
  const itemId = teamId || playerId
  const itemName = teamName || playerName

  useEffect(() => {
    if (user && itemId) {
      checkIfFavorite()
    }
  }, [user, itemId])

  const checkIfFavorite = async () => {
    if (!user || !itemId) return

    try {
      const { auth } = await import('@/lib/firebase')
      const currentUser = auth.currentUser
      if (!currentUser) return

      const response = await fetch(`/api/favorites?userId=${currentUser.uid}`)
      const data = await response.json()
      
      if (data.success) {
        const isFav = data.favorites.some((f: any) => 
          f.itemId === itemId && f.type === favoriteType
        )
        setIsFavorite(isFav)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      alert('Connectez-vous pour ajouter des favoris')
      return
    }

    setLoading(true)

    try {
      const { auth } = await import('@/lib/firebase')
      const currentUser = auth.currentUser
      if (!currentUser) return

      if (isFavorite) {
        // Retirer des favoris
        const response = await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: currentUser.uid, 
            teamId, 
            playerId,
            type: favoriteType
          })
        })

        if (response.ok) {
          setIsFavorite(false)
        }
      } else {
        // Ajouter aux favoris
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: currentUser.uid, 
            teamId, 
            playerId,
            name: itemName,
            type: favoriteType
          })
        })

        if (response.ok) {
          setIsFavorite(true)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  }

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2.5',
    lg: 'p-3.5'
  }

  if (!user) return null

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`${buttonSizeClasses[size]} rounded-full bg-white/95 backdrop-blur-sm shadow-md transition-all duration-200 ${
        loading
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:scale-110 hover:shadow-lg active:scale-95'
      }`}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Star 
        className={`${sizeClasses[size]} transition-all duration-200 ${
          isFavorite 
            ? 'fill-yellow-500 text-yellow-500' 
            : 'fill-none text-gray-500 hover:text-yellow-500'
        }`}
        strokeWidth={2}
      />
    </button>
  )
}
