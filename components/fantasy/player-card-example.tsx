"use client"

import { useState } from 'react'
import { FantasyPlayerCard } from './player-card'
import type { Player } from '@/lib/types'
import type { PlayerFantasyStats } from '@/lib/types/fantasy'
import { Timestamp } from 'firebase/firestore'

/**
 * Example usage of the FantasyPlayerCard component
 * This demonstrates the different states and configurations
 */
export function FantasyPlayerCardExample() {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  // Example player data
  const examplePlayer: Player = {
    id: 'player-1',
    name: 'Jean Dupont',
    number: 10,
    position: 'Attaquant',
    teamId: 'team-1',
    photo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=300&fit=crop&crop=face',
    school: 'Lycée Victor Hugo',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const exampleFantasyStats: PlayerFantasyStats = {
    playerId: 'player-1',
    price: 8.5,
    totalPoints: 45,
    gameweekPoints: 12,
    popularity: 23.5,
    form: [8, 6, 12, 5, 9],
    priceChange: 0.3,
    selectedBy: 1250,
    updatedAt: Timestamp.now()
  }

  const handleSelect = (player: Player) => {
    setSelectedPlayers([...selectedPlayers, player.id])
  }

  const handleDeselect = (player: Player) => {
    setSelectedPlayers(selectedPlayers.filter(id => id !== player.id))
  }

  return (
    <div className="p-8 space-y-8 bg-sofa-bg-primary min-h-screen">
      <div>
        <h2 className="text-2xl font-bold text-sofa-text-primary mb-4">
          Fantasy Player Card Examples
        </h2>
        <p className="text-sofa-text-secondary mb-6">
          Different states and configurations of the player card component
        </p>
      </div>

      {/* Standard card with stats */}
      <div>
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-3">
          Standard Card with Stats
        </h3>
        <div className="max-w-sm">
          <FantasyPlayerCard
            player={examplePlayer}
            fantasyStats={exampleFantasyStats}
            selected={selectedPlayers.includes(examplePlayer.id)}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
          />
        </div>
      </div>

      {/* Compact card */}
      <div>
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-3">
          Compact Card
        </h3>
        <div className="max-w-xs">
          <FantasyPlayerCard
            player={examplePlayer}
            fantasyStats={exampleFantasyStats}
            compact={true}
            selected={selectedPlayers.includes(examplePlayer.id)}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
          />
        </div>
      </div>

      {/* Card without stats */}
      <div>
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-3">
          Card Without Stats
        </h3>
        <div className="max-w-sm">
          <FantasyPlayerCard
            player={examplePlayer}
            fantasyStats={exampleFantasyStats}
            showStats={false}
            selected={selectedPlayers.includes(examplePlayer.id)}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
          />
        </div>
      </div>

      {/* Disabled card */}
      <div>
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-3">
          Disabled Card
        </h3>
        <div className="max-w-sm">
          <FantasyPlayerCard
            player={examplePlayer}
            fantasyStats={exampleFantasyStats}
            disabled={true}
          />
        </div>
      </div>

      {/* Grid of cards */}
      <div>
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-3">
          Grid Layout
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Gardien', 'Défenseur', 'Milieu', 'Attaquant'].map((position, idx) => (
            <FantasyPlayerCard
              key={idx}
              player={{
                ...examplePlayer,
                id: `player-${idx}`,
                name: `Joueur ${idx + 1}`,
                position: position as any,
                number: idx + 1
              }}
              fantasyStats={{
                ...exampleFantasyStats,
                playerId: `player-${idx}`,
                price: 5.0 + idx,
                totalPoints: 30 + idx * 10
              }}
              selected={selectedPlayers.includes(`player-${idx}`)}
              onSelect={handleSelect}
              onDeselect={handleDeselect}
              index={idx}
            />
          ))}
        </div>
      </div>

      {/* Selected players info */}
      <div className="mt-8 p-4 bg-sofa-bg-card border border-sofa-border rounded-lg">
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-2">
          Selected Players
        </h3>
        <p className="text-sofa-text-secondary">
          {selectedPlayers.length > 0 
            ? `${selectedPlayers.length} player(s) selected: ${selectedPlayers.join(', ')}`
            : 'No players selected'
          }
        </p>
      </div>
    </div>
  )
}
