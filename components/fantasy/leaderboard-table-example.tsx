"use client"

import { useState } from 'react'
import { LeaderboardTable } from './leaderboard-table'
import type { LeaderboardEntry } from '@/lib/types/fantasy'

/**
 * Example usage of the LeaderboardTable component
 * 
 * This demonstrates:
 * - Basic leaderboard display
 * - User team highlighting
 * - Pagination
 * - Search functionality
 * - Gameweek points display
 */
export default function LeaderboardTableExample() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data - in real app, this would come from API
  const mockEntries: LeaderboardEntry[] = [
    {
      rank: 1,
      teamId: 'team1',
      teamName: 'Les Champions',
      userId: 'user1',
      userName: 'Jean Dupont',
      totalPoints: 450,
      gameweekPoints: 85,
      badges: ['champion', 'top_10_week', 'perfect_captain']
    },
    {
      rank: 2,
      teamId: 'team2',
      teamName: 'Dream Team FC',
      userId: 'user2',
      userName: 'Marie Martin',
      totalPoints: 438,
      gameweekPoints: 72,
      badges: ['podium', 'century']
    },
    {
      rank: 3,
      teamId: 'team3',
      teamName: 'Mon Équipe',
      userId: 'current-user',
      userName: 'Vous',
      totalPoints: 425,
      gameweekPoints: 68,
      badges: ['top_10_week', 'wildcard_master']
    },
    {
      rank: 4,
      teamId: 'team4',
      teamName: 'Les Invincibles',
      userId: 'user4',
      userName: 'Pierre Dubois',
      totalPoints: 410,
      gameweekPoints: 75,
      badges: ['winning_streak']
    },
    {
      rank: 5,
      teamId: 'team5',
      teamName: 'FC Victoire',
      userId: 'user5',
      userName: 'Sophie Bernard',
      totalPoints: 395,
      gameweekPoints: 62,
      badges: ['century']
    }
  ]

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    console.log('Page changed to:', page)
    // In real app: fetch new data for this page
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    console.log('Search query:', query)
    // In real app: fetch filtered data
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-sofa-text-primary">
          Exemple: Tableau de Classement
        </h1>
        <p className="text-sofa-text-muted">
          Démonstration du composant LeaderboardTable avec toutes ses fonctionnalités
        </p>
      </div>

      {/* Example 1: Full featured leaderboard */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-sofa-text-primary">
          Classement complet avec recherche et pagination
        </h2>
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="current-user"
          currentUserTeamId="team3"
          totalEntries={150}
          currentPage={currentPage}
          pageSize={50}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          showGameweekPoints={true}
          title="Classement Fantasy Général"
        />
      </div>

      {/* Example 2: Simple leaderboard without search */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-sofa-text-primary">
          Classement simple (sans recherche)
        </h2>
        <LeaderboardTable
          entries={mockEntries.slice(0, 3)}
          totalEntries={3}
          currentPage={1}
          pageSize={10}
          onPageChange={() => {}}
          showGameweekPoints={false}
          title="Top 3 de la semaine"
        />
      </div>

      {/* Example 3: Empty state */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-sofa-text-primary">
          État vide
        </h2>
        <LeaderboardTable
          entries={[]}
          totalEntries={0}
          currentPage={1}
          pageSize={50}
          onPageChange={() => {}}
          emptyMessage="Aucune équipe n'a encore été créée"
        />
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-4">
          Comment utiliser ce composant
        </h3>
        <div className="space-y-4 text-sm text-sofa-text-muted">
          <div>
            <h4 className="font-semibold text-sofa-text-primary mb-2">Props principales:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>entries</code>: Tableau des entrées du classement</li>
              <li><code>currentUserTeamId</code>: ID de l'équipe de l'utilisateur (pour le highlight)</li>
              <li><code>totalEntries</code>: Nombre total d'entrées (pour la pagination)</li>
              <li><code>currentPage</code>: Page actuelle</li>
              <li><code>onPageChange</code>: Callback pour le changement de page</li>
              <li><code>onSearch</code>: Callback pour la recherche (optionnel)</li>
              <li><code>showGameweekPoints</code>: Afficher les points de la semaine</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sofa-text-primary mb-2">Fonctionnalités:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>✅ Affichage du rang avec icônes pour le top 3</li>
              <li>✅ Highlight de l'équipe de l'utilisateur</li>
              <li>✅ Pagination complète avec navigation</li>
              <li>✅ Recherche d'équipes</li>
              <li>✅ Affichage des badges</li>
              <li>✅ Points totaux et points de la semaine</li>
              <li>✅ Responsive design</li>
              <li>✅ Animations avec Framer Motion</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
