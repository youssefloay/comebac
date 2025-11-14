"use client"

import { useState } from 'react'
import { TransferPanel } from './transfer-panel'
import type { Player } from '@/lib/types'
import type { FantasyPlayer, PlayerFantasyStats } from '@/lib/types/fantasy'

/**
 * Example usage of the TransferPanel component
 * 
 * This component demonstrates how to integrate the TransferPanel
 * into your Fantasy application.
 */
export function TransferPanelExample() {
  // Mock current squad
  const [currentPlayers] = useState<FantasyPlayer[]>([
    {
      playerId: 'player1',
      position: 'Gardien',
      price: 5.0,
      points: 45,
      gameweekPoints: 8,
      isCaptain: false
    },
    {
      playerId: 'player2',
      position: 'Défenseur',
      price: 6.5,
      points: 52,
      gameweekPoints: 6,
      isCaptain: false
    },
    {
      playerId: 'player3',
      position: 'Défenseur',
      price: 7.0,
      points: 58,
      gameweekPoints: 10,
      isCaptain: true
    },
    {
      playerId: 'player4',
      position: 'Milieu',
      price: 8.0,
      points: 65,
      gameweekPoints: 12,
      isCaptain: false
    },
    {
      playerId: 'player5',
      position: 'Milieu',
      price: 7.5,
      points: 48,
      gameweekPoints: 5,
      isCaptain: false
    },
    {
      playerId: 'player6',
      position: 'Milieu',
      price: 6.0,
      points: 38,
      gameweekPoints: 4,
      isCaptain: false
    },
    {
      playerId: 'player7',
      position: 'Attaquant',
      price: 9.0,
      points: 72,
      gameweekPoints: 15,
      isCaptain: false
    }
  ])

  // Mock player details
  const playerDetails = new Map<string, Player>([
    ['player1', {
      id: 'player1',
      name: 'Jean Dupont',
      position: 'Gardien',
      number: 1,
      school: 'École A',
      teamId: 'team1',
      photo: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player2', {
      id: 'player2',
      name: 'Pierre Martin',
      position: 'Défenseur',
      number: 4,
      school: 'École B',
      teamId: 'team1',
      photo: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player3', {
      id: 'player3',
      name: 'Marc Dubois',
      position: 'Défenseur',
      number: 5,
      school: 'École C',
      teamId: 'team2',
      photo: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player4', {
      id: 'player4',
      name: 'Luc Bernard',
      position: 'Milieu',
      number: 8,
      school: 'École A',
      teamId: 'team1',
      photo: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player5', {
      id: 'player5',
      name: 'Paul Petit',
      position: 'Milieu',
      number: 10,
      school: 'École D',
      teamId: 'team3',
      photo: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player6', {
      id: 'player6',
      name: 'Thomas Blanc',
      position: 'Milieu',
      number: 7,
      school: 'École E',
      teamId: 'team2',
      photo: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player7', {
      id: 'player7',
      name: 'Antoine Noir',
      position: 'Attaquant',
      number: 9,
      school: 'École F',
      teamId: 'team3',
      photo: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  ])

  // Mock fantasy stats
  const playerFantasyStats = new Map<string, PlayerFantasyStats>([
    ['player1', {
      playerId: 'player1',
      price: 5.0,
      totalPoints: 45,
      gameweekPoints: 8,
      popularity: 35.5,
      form: [6, 8, 4, 9, 7],
      priceChange: 0.1,
      selectedBy: 1420,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    }],
    ['player2', {
      playerId: 'player2',
      price: 6.5,
      totalPoints: 52,
      gameweekPoints: 6,
      popularity: 42.3,
      form: [5, 6, 7, 6, 5],
      priceChange: 0.0,
      selectedBy: 1692,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    }],
    ['player3', {
      playerId: 'player3',
      price: 7.0,
      totalPoints: 58,
      gameweekPoints: 10,
      popularity: 58.7,
      form: [8, 9, 10, 7, 10],
      priceChange: 0.3,
      selectedBy: 2348,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    }],
    ['player4', {
      playerId: 'player4',
      price: 8.0,
      totalPoints: 65,
      gameweekPoints: 12,
      popularity: 65.2,
      form: [10, 12, 11, 9, 12],
      priceChange: 0.4,
      selectedBy: 2608,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    }],
    ['player5', {
      playerId: 'player5',
      price: 7.5,
      totalPoints: 48,
      gameweekPoints: 5,
      popularity: 38.9,
      form: [6, 5, 4, 5, 5],
      priceChange: -0.2,
      selectedBy: 1556,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    }],
    ['player6', {
      playerId: 'player6',
      price: 6.0,
      totalPoints: 38,
      gameweekPoints: 4,
      popularity: 28.4,
      form: [4, 3, 5, 4, 4],
      priceChange: -0.1,
      selectedBy: 1136,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    }],
    ['player7', {
      playerId: 'player7',
      price: 9.0,
      totalPoints: 72,
      gameweekPoints: 15,
      popularity: 78.5,
      form: [14, 15, 13, 16, 15],
      priceChange: 0.5,
      selectedBy: 3140,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    }],
    // Available players
    ['player8', {
      playerId: 'player8',
      price: 7.0,
      totalPoints: 55,
      gameweekPoints: 9,
      popularity: 45.2,
      form: [8, 9, 7, 9, 9],
      priceChange: 0.2,
      selectedBy: 1808,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    }],
    ['player9', {
      playerId: 'player9',
      price: 6.0,
      totalPoints: 42,
      gameweekPoints: 6,
      popularity: 32.1,
      form: [5, 6, 5, 7, 6],
      priceChange: 0.0,
      selectedBy: 1284,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    }]
  ])

  // Mock available players (not in current squad)
  const availablePlayers: Player[] = [
    {
      id: 'player8',
      name: 'Sophie Rousseau',
      position: 'Milieu',
      number: 11,
      school: 'École G',
      teamId: 'team4',
      photo: '',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'player9',
      name: 'Marie Leroy',
      position: 'Milieu',
      number: 6,
      school: 'École H',
      teamId: 'team4',
      photo: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  const handleTransfer = (playerOutId: string, playerInId: string) => {
    console.log('Transfer:', { playerOutId, playerInId })
    alert(`Transfert effectué: ${playerOutId} → ${playerInId}`)
    // In a real app, you would call an API here
  }

  const handleWildcard = () => {
    console.log('Wildcard activated')
    alert('Wildcard activé! Vous pouvez maintenant refaire toute votre équipe.')
    // In a real app, you would navigate to squad builder or call an API
  }

  const handleCancel = () => {
    console.log('Transfer cancelled')
    alert('Transfert annulé')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-sofa-text-primary mb-2">
          Transferts
        </h1>
        <p className="text-sofa-text-muted">
          Exemple d'utilisation du composant TransferPanel
        </p>
      </div>

      <TransferPanel
        currentPlayers={currentPlayers}
        playerDetails={playerDetails}
        playerFantasyStats={playerFantasyStats}
        availablePlayers={availablePlayers}
        budgetRemaining={5.0}
        transfersRemaining={2}
        wildcardAvailable={true}
        onTransfer={handleTransfer}
        onWildcard={handleWildcard}
        onCancel={handleCancel}
      />
    </div>
  )
}
