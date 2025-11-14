"use client"

import { useState } from 'react'
import { PitchView } from './pitch-view'
import type { Player } from '@/lib/types'
import type { FantasyPlayer, Formation } from '@/lib/types/fantasy'

/**
 * Example usage of the PitchView component
 * 
 * This demonstrates how to use the PitchView component with sample data
 */
export function PitchViewExample() {
  const [formation] = useState<Formation>('3-3-1')

  // Sample player details
  const playerDetailsMap = new Map<string, Player>([
    ['player1', {
      id: 'player1',
      name: 'Jean Dupont',
      number: 1,
      position: 'Gardien',
      teamId: 'team1',
      photo: '/placeholder-user.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player2', {
      id: 'player2',
      name: 'Marc Martin',
      number: 2,
      position: 'Défenseur',
      teamId: 'team1',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player3', {
      id: 'player3',
      name: 'Pierre Durand',
      number: 3,
      position: 'Défenseur',
      teamId: 'team2',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player4', {
      id: 'player4',
      name: 'Luc Bernard',
      number: 4,
      position: 'Défenseur',
      teamId: 'team1',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player5', {
      id: 'player5',
      name: 'Paul Petit',
      number: 5,
      position: 'Milieu',
      teamId: 'team2',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player6', {
      id: 'player6',
      name: 'Jacques Moreau',
      number: 6,
      position: 'Milieu',
      teamId: 'team3',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player7', {
      id: 'player7',
      name: 'Antoine Simon',
      number: 7,
      position: 'Milieu',
      teamId: 'team2',
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    ['player8', {
      id: 'player8',
      name: 'Thomas Laurent',
      number: 8,
      position: 'Attaquant',
      teamId: 'team3',
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  ])

  // Sample fantasy players (3-3-1 formation)
  const fantasyPlayers: FantasyPlayer[] = [
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
      price: 6.0,
      points: 48,
      gameweekPoints: 4,
      isCaptain: false
    },
    {
      playerId: 'player4',
      position: 'Défenseur',
      price: 5.5,
      points: 38,
      gameweekPoints: 2,
      isCaptain: false
    },
    {
      playerId: 'player5',
      position: 'Milieu',
      price: 7.5,
      points: 68,
      gameweekPoints: 12,
      isCaptain: true // Captain!
    },
    {
      playerId: 'player6',
      position: 'Milieu',
      price: 7.0,
      points: 55,
      gameweekPoints: 7,
      isCaptain: false
    },
    {
      playerId: 'player7',
      position: 'Milieu',
      price: 6.5,
      points: 42,
      gameweekPoints: 5,
      isCaptain: false
    },
    {
      playerId: 'player8',
      position: 'Attaquant',
      price: 9.0,
      points: 82,
      gameweekPoints: 15,
      isCaptain: false
    }
  ]

  const handlePlayerClick = (playerId: string) => {
    console.log('Player clicked:', playerId)
    // Navigate to player profile or show details
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-sofa-text-primary mb-2">
          PitchView Component Example
        </h2>
        <p className="text-sofa-text-muted">
          Formation: {formation} | Captain: Paul Petit (×2 points)
        </p>
      </div>

      {/* Full size pitch view */}
      <div>
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-3">
          Full Size (Desktop)
        </h3>
        <PitchView
          players={fantasyPlayers}
          playerDetails={playerDetailsMap}
          formation={formation}
          captainId="player5"
          showPoints={true}
          onPlayerClick={handlePlayerClick}
        />
      </div>

      {/* Compact pitch view */}
      <div>
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-3">
          Compact Size (Mobile)
        </h3>
        <PitchView
          players={fantasyPlayers}
          playerDetails={playerDetailsMap}
          formation={formation}
          captainId="player5"
          compact={true}
          showPoints={true}
          onPlayerClick={handlePlayerClick}
        />
      </div>

      {/* Without points */}
      <div>
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-3">
          Without Points Display
        </h3>
        <PitchView
          players={fantasyPlayers}
          playerDetails={playerDetailsMap}
          formation={formation}
          captainId="player5"
          compact={true}
          showPoints={false}
        />
      </div>
    </div>
  )
}
