"use client"

import { useState } from 'react'
import { SquadBuilder } from './squad-builder'
import type { Player } from '@/lib/types'
import type { Formation, FantasyPlayer, PlayerFantasyStats } from '@/lib/types/fantasy'

/**
 * Example usage of the SquadBuilder component
 * 
 * This demonstrates how to integrate the SquadBuilder into your application
 */
export function SquadBuilderExample() {
  // Mock data - replace with real data from your API/database
  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'John Doe',
      position: 'Gardien',
      number: 1,
      school: 'École A',
      teamId: 'team-a',
      photo: '/placeholder-user.jpg',
      seasonStats: {
        goals: 0,
        assists: 0,
        matches: 10,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 900
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Jane Smith',
      position: 'Défenseur',
      number: 2,
      school: 'École B',
      teamId: 'team-b',
      photo: '/placeholder-user.jpg',
      seasonStats: {
        goals: 2,
        assists: 3,
        matches: 10,
        yellowCards: 1,
        redCards: 0,
        minutesPlayed: 850
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Add more mock players...
  ]

  const mockFantasyStats = new Map<string, PlayerFantasyStats>([
    ['1', {
      playerId: '1',
      price: 5.0,
      totalPoints: 45,
      gameweekPoints: 8,
      popularity: 25.5,
      form: [6, 8, 7, 9, 8],
      priceChange: 0.2,
      selectedBy: 1250,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    }],
    ['2', {
      playerId: '2',
      price: 6.5,
      totalPoints: 52,
      gameweekPoints: 10,
      popularity: 35.2,
      form: [8, 9, 7, 10, 8],
      priceChange: 0.3,
      selectedBy: 1750,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    }],
    // Add more mock stats...
  ])

  const handleSave = (data: {
    formation: Formation
    players: FantasyPlayer[]
    captainId: string
    budgetRemaining: number
  }) => {
    console.log('Squad saved:', data)
    // Here you would typically:
    // 1. Send data to your API
    // 2. Save to database
    // 3. Navigate to next page
    alert(`Squad saved! Formation: ${data.formation}, Players: ${data.players.length}, Captain: ${data.captainId}`)
  }

  const handleCancel = () => {
    console.log('Squad building cancelled')
    // Navigate back or show confirmation dialog
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sofa-text-primary mb-2">
          Créer votre équipe Fantasy
        </h1>
        <p className="text-sofa-text-muted">
          Sélectionnez 7 joueurs avec un budget de 100M€
        </p>
      </div>

      <SquadBuilder
        availablePlayers={mockPlayers}
        playerFantasyStats={mockFantasyStats}
        initialFormation="4-2-0"
        initialPlayers={[]}
        initialBudget={100}
        teamName="Mon Équipe Fantasy"
        onSave={handleSave}
        onCancel={handleCancel}
        saveButtonText="Créer l'équipe"
        showPitchView={true}
      />
    </div>
  )
}

/**
 * Example: Editing an existing squad
 */
export function SquadBuilderEditExample() {
  const mockPlayers: Player[] = [] // Your players data
  const mockFantasyStats = new Map<string, PlayerFantasyStats>() // Your stats data

  // Existing squad data
  const existingPlayers: FantasyPlayer[] = [
    {
      playerId: '1',
      position: 'Gardien',
      price: 5.0,
      points: 45,
      gameweekPoints: 8,
      isCaptain: false
    },
    // ... more players
  ]

  const handleUpdate = (data: {
    formation: Formation
    players: FantasyPlayer[]
    captainId: string
    budgetRemaining: number
  }) => {
    console.log('Squad updated:', data)
    // Update squad in database
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-sofa-text-primary mb-8">
        Modifier votre équipe
      </h1>

      <SquadBuilder
        availablePlayers={mockPlayers}
        playerFantasyStats={mockFantasyStats}
        initialFormation="3-3-1"
        initialPlayers={existingPlayers}
        initialBudget={100}
        teamName="Mon Équipe Fantasy"
        onSave={handleUpdate}
        saveButtonText="Sauvegarder les modifications"
        showPitchView={true}
      />
    </div>
  )
}

/**
 * Example: Squad builder without pitch view (compact mode)
 */
export function SquadBuilderCompactExample() {
  const mockPlayers: Player[] = [] // Your players data
  const mockFantasyStats = new Map<string, PlayerFantasyStats>() // Your stats data

  return (
    <SquadBuilder
      availablePlayers={mockPlayers}
      playerFantasyStats={mockFantasyStats}
      showPitchView={false}
      onSave={(data) => console.log('Saved:', data)}
    />
  )
}
