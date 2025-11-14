"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SquadBuilder } from '@/components/fantasy/squad-builder'
import { AlertCircle, Sparkles, ArrowLeft } from 'lucide-react'
import type { Player } from '@/lib/types'
import type { Formation, FantasyPlayer, PlayerFantasyStats } from '@/lib/types/fantasy'

export default function SquadSelectionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [teamName, setTeamName] = useState<string>('')
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [playerFantasyStats, setPlayerFantasyStats] = useState<Map<string, PlayerFantasyStats>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get team name from sessionStorage
    const storedTeamName = sessionStorage.getItem('fantasyTeamName')
    if (!storedTeamName) {
      // Redirect back to create page if no team name
      router.push('/public/fantasy/create')
      return
    }
    setTeamName(storedTeamName)

    // Fetch players and their fantasy stats
    fetchPlayersData()
  }, [])

  const fetchPlayersData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all players
      const playersResponse = await fetch('/api/players')
      if (!playersResponse.ok) {
        throw new Error('Erreur lors de la récupération des joueurs')
      }
      const playersData = await playersResponse.json()
      setAvailablePlayers(playersData)

      // Fetch fantasy stats for each player
      const statsMap = new Map<string, PlayerFantasyStats>()
      
      // Fetch stats in parallel for better performance
      const statsPromises = playersData.map(async (player: Player) => {
        try {
          const response = await fetch(`/api/fantasy/player-stats/${player.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.stats) {
              statsMap.set(player.id, {
                ...data.stats,
                updatedAt: data.stats.updatedAt 
                  ? { seconds: new Date(data.stats.updatedAt).getTime() / 1000, nanoseconds: 0 } as any
                  : { seconds: Date.now() / 1000, nanoseconds: 0 } as any
              })
            }
          }
        } catch (err) {
          console.error(`Error fetching stats for player ${player.id}:`, err)
          // Continue even if one player's stats fail
        }
      })

      await Promise.all(statsPromises)
      setPlayerFantasyStats(statsMap)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching players data:', err)
      setError('Erreur lors du chargement des joueurs. Veuillez réessayer.')
      setLoading(false)
    }
  }

  const handleSave = async (data: {
    formation: Formation
    players: FantasyPlayer[]
    captainId: string
    budgetRemaining: number
  }) => {
    if (!user) {
      setError('Vous devez être connecté')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Create the fantasy team
      const response = await fetch('/api/fantasy/create-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.uid,
          teamName,
          formation: data.formation,
          players: data.players,
          captainId: data.captainId,
          budget: 100,
          budgetRemaining: data.budgetRemaining
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création de l\'équipe')
      }

      const result = await response.json()
      
      if (result.success) {
        // Clear sessionStorage
        sessionStorage.removeItem('fantasyTeamName')
        
        // Redirect to fantasy hub
        router.push('/public/fantasy')
      } else {
        throw new Error(result.error || 'Erreur lors de la création de l\'équipe')
      }
    } catch (err) {
      console.error('Error creating fantasy team:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Clear sessionStorage and go back
    sessionStorage.removeItem('fantasyTeamName')
    router.push('/public/fantasy/create')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Connexion requise
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vous devez être connecté pour créer une équipe Fantasy
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading && availablePlayers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Chargement des joueurs...
          </p>
        </div>
      </div>
    )
  }

  if (error && availablePlayers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Erreur
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={fetchPlayersData}
              className="px-4 py-2 bg-sofa-green text-white rounded-lg hover:bg-sofa-green/90"
            >
              Réessayer
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/public/fantasy/create')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  {teamName}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Sélectionnez 7 joueurs avec un budget de 100M€
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </motion.div>
          )}

          {/* Squad Builder */}
          <SquadBuilder
            availablePlayers={availablePlayers}
            playerFantasyStats={playerFantasyStats}
            initialFormation="4-3-0"
            initialPlayers={[]}
            initialBudget={100}
            teamName={teamName}
            onSave={handleSave}
            onCancel={handleCancel}
            saveButtonText="Créer l'équipe"
            showPitchView={true}
          />
        </motion.div>
      </div>
    </div>
  )
}
