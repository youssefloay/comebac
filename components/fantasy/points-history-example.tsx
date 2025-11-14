"use client"

import { PointsHistory } from './points-history'
import type { GameweekHistory } from '@/lib/types/fantasy'
import type { Player } from '@/lib/types'

/**
 * Example usage of the PointsHistory component
 * 
 * This component displays:
 * - Statistics overview (total, average, best, worst)
 * - Interactive chart showing points evolution
 * - Detailed list view with expandable gameweek details
 * - Player-by-player breakdown for each gameweek
 */

export default function PointsHistoryExample() {
  // Mock gameweek history data
  const mockGameweekHistory: GameweekHistory[] = [
    {
      id: 'gw1',
      teamId: 'team1',
      gameweek: 1,
      points: 65,
      rank: 45,
      transfers: 0,
      pointsDeducted: 0,
      players: [
        { playerId: 'player1', points: 12, isCaptain: true },
        { playerId: 'player2', points: 8, isCaptain: false },
        { playerId: 'player3', points: 6, isCaptain: false },
        { playerId: 'player4', points: 10, isCaptain: false },
        { playerId: 'player5', points: 7, isCaptain: false },
        { playerId: 'player6', points: 9, isCaptain: false },
        { playerId: 'player7', points: 1, isCaptain: false }
      ],
      createdAt: new Date('2024-09-15').toISOString()
    },
    {
      id: 'gw2',
      teamId: 'team1',
      gameweek: 2,
      points: 78,
      rank: 28,
      transfers: 1,
      pointsDeducted: 0,
      players: [
        { playerId: 'player1', points: 14, isCaptain: true },
        { playerId: 'player2', points: 11, isCaptain: false },
        { playerId: 'player3', points: 8, isCaptain: false },
        { playerId: 'player4', points: 12, isCaptain: false },
        { playerId: 'player5', points: 9, isCaptain: false },
        { playerId: 'player6', points: 10, isCaptain: false },
        { playerId: 'player8', points: 0, isCaptain: false }
      ],
      createdAt: new Date('2024-09-22').toISOString()
    },
    {
      id: 'gw3',
      teamId: 'team1',
      gameweek: 3,
      points: 92,
      rank: 12,
      transfers: 2,
      pointsDeducted: 0,
      players: [
        { playerId: 'player1', points: 20, isCaptain: true },
        { playerId: 'player2', points: 13, isCaptain: false },
        { playerId: 'player3', points: 9, isCaptain: false },
        { playerId: 'player4', points: 15, isCaptain: false },
        { playerId: 'player5', points: 11, isCaptain: false },
        { playerId: 'player6', points: 12, isCaptain: false },
        { playerId: 'player8', points: 2, isCaptain: false }
      ],
      createdAt: new Date('2024-09-29').toISOString()
    },
    {
      id: 'gw4',
      teamId: 'team1',
      gameweek: 4,
      points: 54,
      rank: 67,
      transfers: 3,
      pointsDeducted: 4,
      players: [
        { playerId: 'player1', points: 8, isCaptain: true },
        { playerId: 'player2', points: 6, isCaptain: false },
        { playerId: 'player3', points: 7, isCaptain: false },
        { playerId: 'player4', points: 9, isCaptain: false },
        { playerId: 'player9', points: 10, isCaptain: false },
        { playerId: 'player6', points: 8, isCaptain: false },
        { playerId: 'player8', points: 2, isCaptain: false }
      ],
      createdAt: new Date('2024-10-06').toISOString()
    },
    {
      id: 'gw5',
      teamId: 'team1',
      gameweek: 5,
      points: 71,
      rank: 34,
      transfers: 1,
      pointsDeducted: 0,
      players: [
        { playerId: 'player1', points: 16, isCaptain: true },
        { playerId: 'player2', points: 9, isCaptain: false },
        { playerId: 'player3', points: 8, isCaptain: false },
        { playerId: 'player4', points: 11, isCaptain: false },
        { playerId: 'player9', points: 12, isCaptain: false },
        { playerId: 'player6', points: 7, isCaptain: false },
        { playerId: 'player8', points: 0, isCaptain: false }
      ],
      createdAt: new Date('2024-10-13').toISOString()
    }
  ]

  // Mock player details
  const mockPlayerDetails = new Map<string, Player>([
    ['player1', {
      id: 'player1',
      name: 'Karim Benzema',
      position: 'Attaquant',
      team: 'Road To Glory',
      school: 'HEC Paris',
      photoURL: '/placeholder-user.jpg',
      goals: 12,
      assists: 5,
      cleanSheets: 0,
      yellowCards: 1,
      redCards: 0,
      matchesPlayed: 5
    }],
    ['player2', {
      id: 'player2',
      name: 'N\'Golo Kanté',
      position: 'Milieu',
      team: 'Road To Glory',
      school: 'HEC Paris',
      photoURL: '/placeholder-user.jpg',
      goals: 3,
      assists: 8,
      cleanSheets: 2,
      yellowCards: 2,
      redCards: 0,
      matchesPlayed: 5
    }],
    ['player3', {
      id: 'player3',
      name: 'Raphaël Varane',
      position: 'Défenseur',
      team: 'Les Invincibles',
      school: 'ESSEC',
      photoURL: '/placeholder-user.jpg',
      goals: 1,
      assists: 2,
      cleanSheets: 3,
      yellowCards: 1,
      redCards: 0,
      matchesPlayed: 5
    }],
    ['player4', {
      id: 'player4',
      name: 'Kylian Mbappé',
      position: 'Attaquant',
      team: 'Les Invincibles',
      school: 'ESSEC',
      photoURL: '/placeholder-user.jpg',
      goals: 10,
      assists: 6,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      matchesPlayed: 5
    }],
    ['player5', {
      id: 'player5',
      name: 'Hugo Lloris',
      position: 'Gardien',
      team: 'FC Champions',
      school: 'ESCP',
      photoURL: '/placeholder-user.jpg',
      goals: 0,
      assists: 0,
      cleanSheets: 3,
      yellowCards: 0,
      redCards: 0,
      matchesPlayed: 5
    }],
    ['player6', {
      id: 'player6',
      name: 'Paul Pogba',
      position: 'Milieu',
      team: 'FC Champions',
      school: 'ESCP',
      photoURL: '/placeholder-user.jpg',
      goals: 4,
      assists: 7,
      cleanSheets: 1,
      yellowCards: 3,
      redCards: 0,
      matchesPlayed: 5
    }],
    ['player7', {
      id: 'player7',
      name: 'Samuel Umtiti',
      position: 'Défenseur',
      team: 'Dream Team',
      school: 'EM Lyon',
      photoURL: '/placeholder-user.jpg',
      goals: 0,
      assists: 1,
      cleanSheets: 2,
      yellowCards: 2,
      redCards: 1,
      matchesPlayed: 4
    }],
    ['player8', {
      id: 'player8',
      name: 'Antoine Griezmann',
      position: 'Attaquant',
      team: 'Dream Team',
      school: 'EM Lyon',
      photoURL: '/placeholder-user.jpg',
      goals: 8,
      assists: 4,
      cleanSheets: 0,
      yellowCards: 1,
      redCards: 0,
      matchesPlayed: 5
    }],
    ['player9', {
      id: 'player9',
      name: 'Presnel Kimpembe',
      position: 'Défenseur',
      team: 'Les Guerriers',
      school: 'Dauphine',
      photoURL: '/placeholder-user.jpg',
      goals: 1,
      assists: 2,
      cleanSheets: 3,
      yellowCards: 2,
      redCards: 0,
      matchesPlayed: 5
    }]
  ])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-sofa-text-primary mb-2">
            Points History Component
          </h1>
          <p className="text-sofa-text-muted">
            Affiche l'évolution des points avec graphique interactif et détails par journée
          </p>
        </div>

        {/* Full Version */}
        <div>
          <h2 className="text-xl font-semibold text-sofa-text-primary mb-4">
            Version complète (avec graphique)
          </h2>
          <PointsHistory
            gameweekHistory={mockGameweekHistory}
            playerDetails={mockPlayerDetails}
            currentGameweek={5}
            showChart={true}
            compact={false}
          />
        </div>

        {/* Compact Version */}
        <div>
          <h2 className="text-xl font-semibold text-sofa-text-primary mb-4">
            Version compacte (liste uniquement)
          </h2>
          <PointsHistory
            gameweekHistory={mockGameweekHistory}
            playerDetails={mockPlayerDetails}
            currentGameweek={5}
            showChart={false}
            compact={true}
          />
        </div>

        {/* Usage Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-sofa-border">
          <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">
            📖 Instructions d'utilisation
          </h3>
          
          <div className="space-y-4 text-sm text-sofa-text-muted">
            <div>
              <h4 className="font-semibold text-sofa-text-primary mb-2">Props:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>gameweekHistory</code>: Array de GameweekHistory avec les données de chaque journée</li>
                <li><code>playerDetails</code>: Map des détails des joueurs (id → Player)</li>
                <li><code>currentGameweek</code>: Numéro de la journée actuelle (optionnel)</li>
                <li><code>showChart</code>: Afficher le graphique (défaut: true)</li>
                <li><code>compact</code>: Mode compact sans détails expandables (défaut: false)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sofa-text-primary mb-2">Fonctionnalités:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Statistiques globales (total, moyenne, meilleur, pire)</li>
                <li>Graphique interactif avec barres cliquables</li>
                <li>Vue liste avec détails expandables par journée</li>
                <li>Détails par joueur avec points et statut capitaine</li>
                <li>Affichage des transferts et pénalités</li>
                <li>Highlight de la journée actuelle et du meilleur score</li>
                <li>Animations fluides avec Framer Motion</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sofa-text-primary mb-2">Intégration:</h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
{`import { PointsHistory } from '@/components/fantasy/points-history'

<PointsHistory
  gameweekHistory={gameweekHistory}
  playerDetails={playerDetailsMap}
  currentGameweek={currentGameweek}
  showChart={true}
  compact={false}
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
