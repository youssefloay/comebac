"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeftRight, 
  AlertCircle, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  AlertTriangle
} from 'lucide-react'
import { FantasyPlayerCard } from './player-card'
import type { Player } from '@/lib/types'
import type { FantasyPlayer, PlayerFantasyStats } from '@/lib/types/fantasy'
import { validateTransfer } from '@/lib/fantasy/validation'

interface TransferPanelProps {
  currentPlayers: FantasyPlayer[]
  playerDetails: Map<string, Player>
  playerFantasyStats: Map<string, PlayerFantasyStats>
  availablePlayers: Player[]
  budgetRemaining: number
  transfersRemaining: number
  wildcardAvailable: boolean
  onTransfer: (playerOutId: string, playerInId: string) => void
  onWildcard?: () => void
  onCancel?: () => void
}

const TRANSFER_PENALTY_POINTS = 4

export function TransferPanel({
  currentPlayers,
  playerDetails,
  playerFantasyStats,
  availablePlayers,
  budgetRemaining,
  transfersRemaining,
  wildcardAvailable,
  onTransfer,
  onWildcard,
  onCancel
}: TransferPanelProps) {
  const [playerOut, setPlayerOut] = useState<FantasyPlayer | null>(null)
  const [playerIn, setPlayerIn] = useState<Player | null>(null)
  const [filterPosition, setFilterPosition] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [showWildcardConfirm, setShowWildcardConfirm] = useState(false)

  // Reset errors when selection changes
  useEffect(() => {
    if (playerOut && playerIn) {
      validateCurrentTransfer()
    } else {
      setErrors([])
    }
  }, [playerOut, playerIn])

  const validateCurrentTransfer = () => {
    if (!playerOut || !playerIn) return

    const playerInStats = playerFantasyStats.get(playerIn.id)
    if (!playerInStats) {
      setErrors(['Statistiques du joueur non disponibles'])
      return
    }

    const fantasyPlayerIn: FantasyPlayer = {
      playerId: playerIn.id,
      position: playerIn.position as any,
      price: playerInStats.price,
      points: 0,
      gameweekPoints: 0,
      isCaptain: false
    }

    const validation = validateTransfer(playerOut, fantasyPlayerIn, budgetRemaining)
    setErrors(validation.errors)
  }

  const handlePlayerOutSelect = (player: FantasyPlayer) => {
    setPlayerOut(player)
    setPlayerIn(null)
    setFilterPosition(player.position)
  }

  const handlePlayerInSelect = (player: Player) => {
    setPlayerIn(player)
  }

  const handleConfirmTransfer = () => {
    if (!playerOut || !playerIn) return
    if (errors.length > 0) return

    onTransfer(playerOut.playerId, playerIn.id)
    
    // Reset selection
    setPlayerOut(null)
    setPlayerIn(null)
    setFilterPosition('all')
    setSearchQuery('')
  }

  const handleWildcardClick = () => {
    setShowWildcardConfirm(true)
  }

  const handleWildcardConfirm = () => {
    onWildcard?.()
    setShowWildcardConfirm(false)
  }

  const handleWildcardCancel = () => {
    setShowWildcardConfirm(false)
  }

  // Calculate transfer cost
  const willIncurPenalty = transfersRemaining === 0
  const priceDifference = playerOut && playerIn 
    ? (playerFantasyStats.get(playerIn.id)?.price || 0) - playerOut.price
    : 0

  // Filter available players
  const filteredAvailablePlayers = availablePlayers.filter(player => {
    // Don't show players already in squad
    if (currentPlayers.some(p => p.playerId === player.id)) {
      return false
    }

    // Filter by position if player out is selected
    if (playerOut && player.position !== playerOut.position) {
      return false
    }

    // Filter by position filter
    if (filterPosition !== 'all' && player.position !== filterPosition) {
      return false
    }

    // Filter by search query
    if (searchQuery && !player.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Transfer Status */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {/* Transfers Remaining */}
            <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <ArrowLeftRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-sofa-text-muted truncate">Transferts gratuits</p>
                <p className="text-xl md:text-2xl font-bold text-sofa-text-primary">{transfersRemaining}</p>
              </div>
            </div>

            {/* Budget Remaining */}
            <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg md:text-xl font-bold">€</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-sofa-text-muted truncate">Budget restant</p>
                <p className="text-xl md:text-2xl font-bold text-sofa-text-primary">{budgetRemaining.toFixed(1)}M€</p>
              </div>
            </div>

            {/* Wildcard */}
            <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                wildcardAvailable ? 'bg-purple-500' : 'bg-gray-400'
              }`}>
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-sofa-text-muted truncate">Wildcard</p>
                <p className="text-base md:text-lg font-bold text-sofa-text-primary truncate">
                  {wildcardAvailable ? 'Disponible' : 'Utilisé'}
                </p>
              </div>
            </div>
          </div>

          {/* Wildcard Button */}
          {wildcardAvailable && (
            <div className="mt-4 pt-4 border-t border-sofa-border">
              <Button
                onClick={handleWildcardClick}
                variant="outline"
                className="w-full border-purple-500 text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/20"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Activer le Wildcard (refaire toute l'équipe gratuitement)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Penalty Warning */}
      {willIncurPenalty && playerOut && playerIn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-orange-800 dark:text-orange-200 font-semibold mb-1">
                Pénalité de transfert
              </h3>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                Vous n'avez plus de transferts gratuits. Ce transfert vous coûtera <strong>{TRANSFER_PENALTY_POINTS} points</strong>.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transfer Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Player Out */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sofa-text-primary flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              Joueur à remplacer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {playerOut ? (
              <div className="space-y-4">
                <div className="relative">
                  <FantasyPlayerCard
                    player={playerDetails.get(playerOut.playerId)!}
                    fantasyStats={playerFantasyStats.get(playerOut.playerId)}
                    selected={true}
                    compact={false}
                    showStats={true}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPlayerOut(null)}
                    className="absolute top-2 right-2 bg-white dark:bg-gray-800 shadow-md"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-sofa-text-muted mb-4">
                  Sélectionnez le joueur que vous souhaitez remplacer
                </p>
                <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto">
                  {currentPlayers.map((player) => {
                    const detail = playerDetails.get(player.playerId)
                    if (!detail) return null
                    
                    return (
                      <div
                        key={player.playerId}
                        onClick={() => handlePlayerOutSelect(player)}
                        className="cursor-pointer"
                      >
                        <FantasyPlayerCard
                          player={detail}
                          fantasyStats={playerFantasyStats.get(player.playerId)}
                          selected={false}
                          compact={true}
                          showStats={true}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Player In */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sofa-text-primary flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Nouveau joueur
            </CardTitle>
          </CardHeader>
          <CardContent>
            {playerIn ? (
              <div className="space-y-4">
                <div className="relative">
                  <FantasyPlayerCard
                    player={playerIn}
                    fantasyStats={playerFantasyStats.get(playerIn.id)}
                    selected={true}
                    compact={false}
                    showStats={true}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPlayerIn(null)}
                    className="absolute top-2 right-2 bg-white dark:bg-gray-800 shadow-md"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Price Comparison */}
                {playerOut && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-sofa-text-primary mb-3">Comparaison</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-sofa-text-muted">Prix sortant</span>
                        <span className="font-semibold">{playerOut.price.toFixed(1)}M€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sofa-text-muted">Prix entrant</span>
                        <span className="font-semibold">
                          {playerFantasyStats.get(playerIn.id)?.price.toFixed(1)}M€
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-sofa-border">
                        <span className="text-sofa-text-muted">Différence</span>
                        <span className={`font-bold flex items-center gap-1 ${
                          priceDifference > 0 ? 'text-red-600' : 
                          priceDifference < 0 ? 'text-green-600' : 
                          'text-sofa-text-primary'
                        }`}>
                          {priceDifference > 0 ? (
                            <>
                              <TrendingUp className="w-4 h-4" />
                              +{priceDifference.toFixed(1)}M€
                            </>
                          ) : priceDifference < 0 ? (
                            <>
                              <TrendingDown className="w-4 h-4" />
                              {priceDifference.toFixed(1)}M€
                            </>
                          ) : (
                            '0.0M€'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {playerOut ? (
                  <>
                    <p className="text-sm text-sofa-text-muted mb-4">
                      Sélectionnez un {playerOut.position.toLowerCase()} pour remplacer votre joueur
                    </p>

                    {/* Search */}
                    <input
                      type="text"
                      placeholder="Rechercher un joueur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-sofa-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sofa-green"
                    />

                    {/* Available Players */}
                    <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto">
                      {filteredAvailablePlayers.map((player) => (
                        <div
                          key={player.id}
                          onClick={() => handlePlayerInSelect(player)}
                          className="cursor-pointer"
                        >
                          <FantasyPlayerCard
                            player={player}
                            fantasyStats={playerFantasyStats.get(player.id)}
                            selected={false}
                            compact={true}
                            showStats={true}
                          />
                        </div>
                      ))}
                    </div>

                    {filteredAvailablePlayers.length === 0 && (
                      <div className="text-center py-8 text-sofa-text-muted">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Aucun joueur disponible</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-sofa-text-muted">
                    <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Sélectionnez d'abord un joueur à remplacer</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <ErrorDisplay errors={errors} />
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-end">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            size="lg"
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
        )}
        <Button
          onClick={handleConfirmTransfer}
          disabled={!playerOut || !playerIn || errors.length > 0}
          size="lg"
          className="bg-sofa-green hover:bg-sofa-green/90 w-full sm:w-auto"
        >
          <Check className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Confirmer le transfert</span>
          <span className="sm:hidden">Confirmer</span>
          {willIncurPenalty && ` (-${TRANSFER_PENALTY_POINTS} pts)`}
        </Button>
      </div>

      {/* Wildcard Confirmation Modal */}
      <AnimatePresence>
        {showWildcardConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleWildcardCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-sofa-text-primary mb-2">
                    Activer le Wildcard ?
                  </h3>
                  <p className="text-sofa-text-muted text-sm">
                    Le Wildcard vous permet de refaire entièrement votre équipe sans pénalité. 
                    Vous ne pouvez l'utiliser qu'une seule fois par saison.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm font-semibold">
                  ⚠️ Cette action est irréversible
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleWildcardCancel}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleWildcardConfirm}
                  className="flex-1 bg-purple-500 hover:bg-purple-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Activer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ErrorDisplayProps {
  errors: string[]
}

function ErrorDisplay({ errors }: ErrorDisplayProps) {
  if (errors.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-lg p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
            Erreurs de validation
          </h3>
          <ul className="list-disc list-inside text-red-700 dark:text-red-300 text-sm space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
