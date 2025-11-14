"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransferPanel } from '@/components/fantasy/transfer-panel'
import { 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import type { FantasyTeam, PlayerFantasyStats } from '@/lib/types/fantasy'
import type { Player } from '@/lib/types'

export default function TransfersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fantasyTeam, setFantasyTeam] = useState<FantasyTeam | null>(null)
  const [playerDetails, setPlayerDetails] = useState<Map<string, Player>>(new Map())
  const [playerFantasyStats, setPlayerFantasyStats] = useState<Map<string, PlayerFantasyStats>>(new Map())
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [transferring, setTransferring] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        router.push('/public/fantasy')
        return
      }

      try {
        // Load fantasy team
        const teamResponse = await fetch(`/api/fantasy/get-team?userId=${user.uid}`)
        if (!teamResponse.ok) {
          router.push('/public/fantasy/create')
          return
        }

        const teamData = await teamResponse.json()
        setFantasyTeam(teamData.team)

        // Load all players
        const playersResponse = await fetch('/api/players')
        if (playersResponse.ok) {
          const playersData = await playersResponse.json()
          const playersMap = new Map<string, Player>()
          
          // playersData is directly an array of players
          playersData.forEach((player: Player) => {
            playersMap.set(player.id, player)
          })
          
          setPlayerDetails(playersMap)
          setAvailablePlayers(playersData)
        }

        // Load fantasy stats for all players
        // In production, this would be a batch API call
        // For now, we'll create mock stats
        const statsMap = new Map<string, PlayerFantasyStats>()
        
        for (const player of teamData.team.players) {
          const statsResponse = await fetch(`/api/fantasy/player-stats/${player.playerId}`)
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            statsMap.set(player.playerId, statsData.stats)
          }
        }

        // Load stats for available players (mock for now)
        for (const player of availablePlayers.slice(0, 50)) { // Limit to avoid too many requests
          if (!statsMap.has(player.id)) {
            const statsResponse = await fetch(`/api/fantasy/player-stats/${player.id}`)
            if (statsResponse.ok) {
              const statsData = await statsResponse.json()
              statsMap.set(player.id, statsData.stats)
            }
          }
        }

        setPlayerFantasyStats(statsMap)

      } catch (error) {
        console.error('Error loading data:', error)
        setShowError(true)
        setErrorMessage('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, router])

  const handleTransfer = async (playerOutId: string, playerInId: string) => {
    if (!fantasyTeam || !user) return

    setTransferring(true)
    setShowError(false)
    setShowSuccess(false)

    try {
      const playerInStats = playerFantasyStats.get(playerInId)
      if (!playerInStats) {
        throw new Error('Statistiques du joueur non disponibles')
      }

      const response = await fetch('/api/fantasy/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: fantasyTeam.id,
          userId: user.uid,
          playerOutId,
          playerInId,
          playerInPrice: playerInStats.price
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du transfert')
      }

      // Update local state
      setFantasyTeam(data.team)
      setShowSuccess(true)
      setSuccessMessage(data.message)

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)

    } catch (error) {
      console.error('Error during transfer:', error)
      setShowError(true)
      setErrorMessage(error instanceof Error ? error.message : 'Erreur lors du transfert')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setTransferring(false)
    }
  }

  const handleWildcard = () => {
    // Redirect to squad builder with wildcard mode
    router.push('/public/fantasy/squad?wildcard=true')
  }

  const handleCancel = () => {
    router.push('/public/fantasy/my-team')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!fantasyTeam) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link href="/public/fantasy/my-team">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à mon équipe
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Transferts
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Améliorez votre équipe en remplaçant vos joueurs
              </p>
            </div>
          </div>
        </motion.div>

        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Card className="border-0 shadow-lg bg-green-50 dark:bg-green-900/20 border-2 border-green-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-green-800 dark:text-green-200 font-semibold mb-1">
                      Transfert réussi !
                    </h3>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      {successMessage}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Error Message */}
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Card className="border-0 shadow-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-800 dark:text-red-200 font-semibold mb-1">
                      Erreur
                    </h3>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                ℹ️ Comment fonctionnent les transferts ?
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-sofa-green font-bold">•</span>
                  <span>Vous avez <strong>{fantasyTeam.transfers} transferts gratuits</strong> disponibles cette semaine</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sofa-green font-bold">•</span>
                  <span>Chaque transfert supplémentaire coûte <strong>4 points</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sofa-green font-bold">•</span>
                  <span>Vous ne pouvez remplacer un joueur que par un joueur du <strong>même poste</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sofa-green font-bold">•</span>
                  <span>Le budget doit être respecté (différence de prix entre les joueurs)</span>
                </li>
                {fantasyTeam.wildcardUsed === false && (
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">✨</span>
                    <span>Utilisez votre <strong>Wildcard</strong> pour refaire toute votre équipe gratuitement (une seule fois par saison)</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transfer Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {transferring ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
              <span className="ml-4 text-gray-600 dark:text-gray-400">
                Transfert en cours...
              </span>
            </div>
          ) : (
            <TransferPanel
              currentPlayers={fantasyTeam.players}
              playerDetails={playerDetails}
              playerFantasyStats={playerFantasyStats}
              availablePlayers={availablePlayers}
              budgetRemaining={fantasyTeam.budgetRemaining}
              transfersRemaining={fantasyTeam.transfers}
              wildcardAvailable={!fantasyTeam.wildcardUsed}
              onTransfer={handleTransfer}
              onWildcard={handleWildcard}
              onCancel={handleCancel}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}
