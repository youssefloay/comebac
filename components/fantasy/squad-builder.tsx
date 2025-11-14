"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Check, X, Users, DollarSign, Shield, Activity, Target } from 'lucide-react'
import { FormationSelector } from './formation-selector'
import { PitchView } from './pitch-view'
import { FantasyPlayerCard } from './player-card'
import { BudgetTracker } from './budget-tracker'
import type { Player } from '@/lib/types'
import type { Formation, FantasyPlayer, PlayerFantasyStats } from '@/lib/types/fantasy'
import { 
  validateSquad, 
  validateBudget, 
  validatePlayerAddition,
  validateFantasyTeam,
  INITIAL_BUDGET,
  TOTAL_SQUAD_SIZE
} from '@/lib/fantasy/validation'

interface SquadBuilderProps {
  availablePlayers: Player[]
  playerFantasyStats: Map<string, PlayerFantasyStats>
  initialFormation?: Formation
  initialPlayers?: FantasyPlayer[]
  initialBudget?: number
  teamName?: string
  onSave?: (data: {
    formation: Formation
    players: FantasyPlayer[]
    captainId: string
    budgetRemaining: number
  }) => void
  onCancel?: () => void
  saveButtonText?: string
  showPitchView?: boolean
}

export function SquadBuilder({
  availablePlayers,
  playerFantasyStats,
  initialFormation = '4-2-0',
  initialPlayers = [],
  initialBudget = INITIAL_BUDGET,
  teamName = '',
  onSave,
  onCancel,
  saveButtonText = 'Sauvegarder l\'équipe',
  showPitchView = true
}: SquadBuilderProps) {
  const [formation, setFormation] = useState<Formation>(initialFormation)
  const [selectedPlayers, setSelectedPlayers] = useState<FantasyPlayer[]>(initialPlayers)
  const [captainId, setCaptainId] = useState<string>(
    initialPlayers.find(p => p.isCaptain)?.playerId || ''
  )
  const [budget] = useState(initialBudget)
  const [errors, setErrors] = useState<string[]>([])
  const [filterPosition, setFilterPosition] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate budget remaining
  const budgetSpent = selectedPlayers.reduce((sum, p) => sum + p.price, 0)
  const budgetRemaining = budget - budgetSpent

  // Create player details map for PitchView
  const playerDetailsMap = new Map<string, Player>()
  availablePlayers.forEach(player => {
    playerDetailsMap.set(player.id, player)
  })

  // Update validation when selection changes
  useEffect(() => {
    validateCurrentSquad()
  }, [selectedPlayers, formation, captainId])

  const validateCurrentSquad = () => {
    const validationErrors: string[] = []

    // Validate budget
    const budgetValidation = validateBudget(selectedPlayers, budget)
    if (!budgetValidation.valid) {
      validationErrors.push(...budgetValidation.errors)
    }

    // Validate squad composition if we have players
    if (selectedPlayers.length > 0) {
      const squadValidation = validateSquad(
        selectedPlayers.map(p => ({
          ...p,
          isCaptain: p.playerId === captainId
        })),
        formation
      )
      if (!squadValidation.valid) {
        validationErrors.push(...squadValidation.errors)
      }
    }

    setErrors(validationErrors)
  }

  const handleFormationChange = (newFormation: Formation) => {
    setFormation(newFormation)
  }

  const handlePlayerSelect = (player: Player) => {
    const stats = playerFantasyStats.get(player.id)
    const price = stats?.price || 5.0

    const newPlayer: FantasyPlayer = {
      playerId: player.id,
      position: player.position as any,
      price,
      points: 0,
      gameweekPoints: 0,
      isCaptain: false
    }

    // Validate if player can be added
    const validation = validatePlayerAddition(
      selectedPlayers,
      newPlayer,
      formation,
      budget
    )

    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setSelectedPlayers([...selectedPlayers, newPlayer])
  }

  const handlePlayerDeselect = (player: Player) => {
    const updatedPlayers = selectedPlayers.filter(p => p.playerId !== player.id)
    setSelectedPlayers(updatedPlayers)

    // If deselected player was captain, clear captain
    if (captainId === player.id) {
      setCaptainId('')
    }
  }

  const handleSetCaptain = (playerId: string) => {
    setCaptainId(playerId)
  }

  const handleSave = () => {
    // Final validation
    const finalPlayers = selectedPlayers.map(p => ({
      ...p,
      isCaptain: p.playerId === captainId
    }))

    const validation = validateFantasyTeam(
      teamName,
      finalPlayers,
      formation,
      budget
    )

    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    onSave?.({
      formation,
      players: finalPlayers,
      captainId,
      budgetRemaining
    })
  }

  // Filter available players
  const filteredPlayers = availablePlayers.filter(player => {
    // Filter by position
    if (filterPosition !== 'all' && player.position !== filterPosition) {
      return false
    }

    // Filter by search query
    if (searchQuery && !player.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Don't show already selected players
    if (selectedPlayers.some(p => p.playerId === player.id)) {
      return false
    }

    return true
  })

  // Count positions in selected squad
  const positionCounts = {
    Gardien: selectedPlayers.filter(p => p.position === 'Gardien').length,
    Défenseur: selectedPlayers.filter(p => p.position === 'Défenseur').length,
    Milieu: selectedPlayers.filter(p => p.position === 'Milieu').length,
    Attaquant: selectedPlayers.filter(p => p.position === 'Attaquant').length
  }

  const isSquadComplete = selectedPlayers.length === TOTAL_SQUAD_SIZE && captainId && errors.length === 0

  return (
    <div className="space-y-6">
      {/* Formation Selector */}
      <FormationSelector
        selectedFormation={formation}
        onFormationChange={handleFormationChange}
        disabled={selectedPlayers.length > 0}
      />

      {/* Budget Tracker */}
      <BudgetTracker
        budget={budget}
        budgetSpent={budgetSpent}
        budgetRemaining={budgetRemaining}
      />

      {/* Squad Status */}
      <SquadStatus
        selectedCount={selectedPlayers.length}
        totalRequired={TOTAL_SQUAD_SIZE}
        positionCounts={positionCounts}
        formation={formation}
        captainId={captainId}
      />

      {/* Pitch View */}
      {showPitchView && selectedPlayers.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sofa-text-primary">Votre équipe</CardTitle>
          </CardHeader>
          <CardContent>
            <PitchView
              players={selectedPlayers.map(p => ({
                ...p,
                isCaptain: p.playerId === captainId
              }))}
              playerDetails={playerDetailsMap}
              formation={formation}
              captainId={captainId}
              showPoints={false}
              onPlayerClick={(playerId) => {
                const player = availablePlayers.find(p => p.id === playerId)
                if (player) {
                  handlePlayerDeselect(player)
                }
              }}
            />

            {/* Captain Selection */}
            {selectedPlayers.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Désigner le capitaine (points x2)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {selectedPlayers.map(player => {
                    const playerDetail = playerDetailsMap.get(player.playerId)
                    return (
                      <Button
                        key={player.playerId}
                        variant={captainId === player.playerId ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSetCaptain(player.playerId)}
                        className={captainId === player.playerId ? 'bg-sofa-green hover:bg-sofa-green/90' : ''}
                      >
                        {captainId === player.playerId && <Check className="w-3 h-3 mr-1" />}
                        {playerDetail?.name || 'Unknown'}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <ErrorDisplay errors={errors} />
      )}

      {/* Player Selection */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sofa-text-primary">Sélectionner des joueurs</CardTitle>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 md:gap-2 mt-4">
            <Button
              variant={filterPosition === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition('all')}
              className={`text-xs md:text-sm ${filterPosition === 'all' ? 'bg-sofa-green hover:bg-sofa-green/90' : ''}`}
            >
              Tous
            </Button>
            <Button
              variant={filterPosition === 'Gardien' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition('Gardien')}
              className={`text-xs md:text-sm ${filterPosition === 'Gardien' ? 'bg-sofa-green hover:bg-sofa-green/90' : ''}`}
            >
              <span className="hidden sm:inline">🥅 Gardiens</span>
              <span className="sm:hidden">🥅 GK</span>
            </Button>
            <Button
              variant={filterPosition === 'Défenseur' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition('Défenseur')}
              className={`text-xs md:text-sm ${filterPosition === 'Défenseur' ? 'bg-sofa-green hover:bg-sofa-green/90' : ''}`}
            >
              <span className="hidden sm:inline">🛡️ Défenseurs</span>
              <span className="sm:hidden">🛡️ DEF</span>
            </Button>
            <Button
              variant={filterPosition === 'Milieu' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition('Milieu')}
              className={`text-xs md:text-sm ${filterPosition === 'Milieu' ? 'bg-sofa-green hover:bg-sofa-green/90' : ''}`}
            >
              <span className="hidden sm:inline">⚽ Milieux</span>
              <span className="sm:hidden">⚽ MID</span>
            </Button>
            <Button
              variant={filterPosition === 'Attaquant' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPosition('Attaquant')}
              className={`text-xs md:text-sm ${filterPosition === 'Attaquant' ? 'bg-sofa-green hover:bg-sofa-green/90' : ''}`}
            >
              <span className="hidden sm:inline">🎯 Attaquants</span>
              <span className="sm:hidden">🎯 ATT</span>
            </Button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Rechercher un joueur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-sofa-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sofa-green"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filteredPlayers.map((player, index) => (
              <FantasyPlayerCard
                key={player.id}
                player={player}
                fantasyStats={playerFantasyStats.get(player.id)}
                selected={false}
                onSelect={handlePlayerSelect}
                index={index}
                compact={false}
                showStats={true}
              />
            ))}
          </div>

          {filteredPlayers.length === 0 && (
            <div className="text-center py-12 text-sofa-text-muted">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun joueur disponible</p>
            </div>
          )}
        </CardContent>
      </Card>

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
        {onSave && (
          <Button
            onClick={handleSave}
            disabled={!isSquadComplete}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 mr-2" />
            {saveButtonText}
          </Button>
        )}
      </div>
    </div>
  )
}



interface SquadStatusProps {
  selectedCount: number
  totalRequired: number
  positionCounts: Record<string, number>
  formation: Formation
  captainId: string
}

function SquadStatus({ selectedCount, totalRequired, positionCounts, formation, captainId }: SquadStatusProps) {
  const formationRequirements: Record<Formation, { Gardien: number; Défenseur: number; Milieu: number; Attaquant: number }> = {
    '4-2-0': { Gardien: 1, Défenseur: 4, Milieu: 2, Attaquant: 0 },
    '3-3-0': { Gardien: 1, Défenseur: 3, Milieu: 3, Attaquant: 0 },
    '3-2-1': { Gardien: 1, Défenseur: 3, Milieu: 2, Attaquant: 1 },
    '2-3-1': { Gardien: 1, Défenseur: 2, Milieu: 3, Attaquant: 1 },
    '2-2-2': { Gardien: 1, Défenseur: 2, Milieu: 2, Attaquant: 2 }
  }

  const required = formationRequirements[formation] || { Gardien: 1, Défenseur: 4, Milieu: 2, Attaquant: 0 }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sofa-green" />
            <h3 className="font-semibold text-sofa-text-primary">Composition</h3>
          </div>
          <Badge variant={selectedCount === totalRequired ? 'default' : 'outline'} className={selectedCount === totalRequired ? 'bg-sofa-green' : ''}>
            {selectedCount}/{totalRequired} joueurs
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <PositionStatus
            icon="🥅"
            label="Gardien"
            current={positionCounts.Gardien}
            required={required.Gardien}
          />
          <PositionStatus
            icon="🛡️"
            label="Défenseurs"
            current={positionCounts.Défenseur}
            required={required.Défenseur}
          />
          <PositionStatus
            icon="⚽"
            label="Milieux"
            current={positionCounts.Milieu}
            required={required.Milieu}
          />
          <PositionStatus
            icon="🎯"
            label="Attaquants"
            current={positionCounts.Attaquant}
            required={required.Attaquant}
          />
        </div>

        {/* Captain status */}
        <div className="mt-4 pt-4 border-t border-sofa-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-sofa-text-muted">Capitaine désigné</span>
            {captainId ? (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <Shield className="w-3 h-3 mr-1" />
                Oui
              </Badge>
            ) : (
              <Badge variant="outline">Non</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PositionStatusProps {
  icon: string
  label: string
  current: number
  required: number
}

function PositionStatus({ icon, label, current, required }: PositionStatusProps) {
  const isComplete = current === required
  const isOver = current > required

  return (
    <div className={`
      p-2 md:p-3 rounded-lg border-2 transition-colors
      ${isComplete ? 'border-sofa-green bg-green-50 dark:bg-green-900/20' : 
        isOver ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
        'border-gray-200 dark:border-gray-700'}
    `}>
      <div className="text-center">
        <div className="text-xl md:text-2xl mb-0.5 md:mb-1">{icon}</div>
        <div className="text-[10px] md:text-xs text-sofa-text-muted mb-0.5 md:mb-1 truncate">{label}</div>
        <div className={`text-base md:text-lg font-bold ${
          isComplete ? 'text-sofa-green' :
          isOver ? 'text-red-600' :
          'text-sofa-text-primary'
        }`}>
          {current}/{required}
        </div>
      </div>
    </div>
  )
}

interface ErrorDisplayProps {
  errors: string[]
}

function ErrorDisplay({ errors }: ErrorDisplayProps) {
  if (errors.length === 0) return null

  return (
    <AnimatePresence>
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
    </AnimatePresence>
  )
}
