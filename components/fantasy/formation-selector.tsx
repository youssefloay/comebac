"use client"

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Formation } from '@/lib/types/fantasy'

interface FormationSelectorProps {
  selectedFormation: Formation
  onFormationChange: (formation: Formation) => void
  disabled?: boolean
}

interface FormationConfig {
  formation: Formation
  name: string
  description: string
  positions: {
    defenders: number
    midfielders: number
    attackers: number
  }
  layout: {
    defenders: number[]
    midfielders: number[]
    attackers: number[]
  }
}

const FORMATIONS: FormationConfig[] = [
  {
    formation: '4-2-0',
    name: '4-2-0',
    description: 'Défensif - 4 Défenseurs, 2 Milieux',
    positions: { defenders: 4, midfielders: 2, attackers: 0 },
    layout: { defenders: [1, 2, 3, 4], midfielders: [1, 2], attackers: [] }
  },
  {
    formation: '3-3-0',
    name: '3-3-0',
    description: 'Équilibré - 3 Défenseurs, 3 Milieux',
    positions: { defenders: 3, midfielders: 3, attackers: 0 },
    layout: { defenders: [1, 2, 3], midfielders: [1, 2, 3], attackers: [] }
  },
  {
    formation: '3-2-1',
    name: '3-2-1',
    description: 'Équilibré - 3 Défenseurs, 2 Milieux, 1 Attaquant',
    positions: { defenders: 3, midfielders: 2, attackers: 1 },
    layout: { defenders: [1, 2, 3], midfielders: [1, 2], attackers: [1] }
  },
  {
    formation: '2-3-1',
    name: '2-3-1',
    description: 'Offensif - 2 Défenseurs, 3 Milieux, 1 Attaquant',
    positions: { defenders: 2, midfielders: 3, attackers: 1 },
    layout: { defenders: [1, 2], midfielders: [1, 2, 3], attackers: [1] }
  },
  {
    formation: '2-2-2',
    name: '2-2-2',
    description: 'Très offensif - 2 Défenseurs, 2 Milieux, 2 Attaquants',
    positions: { defenders: 2, midfielders: 2, attackers: 2 },
    layout: { defenders: [1, 2], midfielders: [1, 2], attackers: [1, 2] }
  }
]

export function FormationSelector({
  selectedFormation,
  onFormationChange,
  disabled = false
}: FormationSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-1">
          Choisir une formation
        </h3>
        <p className="text-sm text-sofa-text-muted">
          Sélectionnez la disposition tactique de votre équipe (1 Gardien + 6 joueurs de champ)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FORMATIONS.map((config, index) => (
          <FormationCard
            key={config.formation}
            config={config}
            selected={selectedFormation === config.formation}
            onSelect={() => !disabled && onFormationChange(config.formation)}
            disabled={disabled}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}

interface FormationCardProps {
  config: FormationConfig
  selected: boolean
  onSelect: () => void
  disabled: boolean
  index: number
}

function FormationCard({ config, selected, onSelect, disabled, index }: FormationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={!disabled ? { y: -4, transition: { duration: 0.2 } } : {}}
    >
      <Card
        className={`
          border-0 shadow-md transition-all duration-300 cursor-pointer h-full
          ${selected
            ? 'ring-2 ring-sofa-green shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
            : 'hover:shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-lg text-sofa-text-primary">
                {config.name}
              </h4>
              <p className="text-xs text-sofa-text-muted mt-0.5">
                {config.description}
              </p>
            </div>
            {selected && (
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-sofa-green rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            )}
          </div>

          {/* Position breakdown */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 text-xs" variant="outline">
              🛡️ {config.positions.defenders} DEF
            </Badge>
            <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 text-xs" variant="outline">
              ⚽ {config.positions.midfielders} MIL
            </Badge>
            {config.positions.attackers > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 text-xs" variant="outline">
                🎯 {config.positions.attackers} ATT
              </Badge>
            )}
          </div>

          {/* Visual formation display */}
          <FormationVisual config={config} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface FormationVisualProps {
  config: FormationConfig
}

function FormationVisual({ config }: FormationVisualProps) {
  return (
    <div className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-lg p-3 h-40">
      {/* Field lines */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
        <div className="absolute top-0 left-1/2 bottom-0 w-px bg-white" />
      </div>

      {/* Goalkeeper */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <PlayerDot color="yellow" />
      </div>

      {/* Defenders */}
      {config.layout.defenders.length > 0 && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2">
          {config.layout.defenders.map((_, idx) => (
            <PlayerDot key={`def-${idx}`} color="blue" />
          ))}
        </div>
      )}

      {/* Midfielders */}
      {config.layout.midfielders.length > 0 && (
        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-center gap-2">
          {config.layout.midfielders.map((_, idx) => (
            <PlayerDot key={`mid-${idx}`} color="green" />
          ))}
        </div>
      )}

      {/* Attackers */}
      {config.layout.attackers.length > 0 && (
        <div className="absolute top-8 left-0 right-0 flex justify-center gap-2">
          {config.layout.attackers.map((_, idx) => (
            <PlayerDot key={`att-${idx}`} color="red" />
          ))}
        </div>
      )}
    </div>
  )
}

interface PlayerDotProps {
  color: 'yellow' | 'blue' | 'green' | 'red'
}

function PlayerDot({ color }: PlayerDotProps) {
  const colorClasses = {
    yellow: 'bg-yellow-400 border-yellow-600',
    blue: 'bg-blue-400 border-blue-600',
    green: 'bg-green-400 border-green-600',
    red: 'bg-red-400 border-red-600'
  }

  return (
    <div
      className={`
        w-6 h-6 rounded-full border-2 shadow-lg
        ${colorClasses[color]}
        flex items-center justify-center
      `}
    >
      <div className="w-2 h-2 bg-white rounded-full" />
    </div>
  )
}
