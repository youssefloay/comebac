"use client"

import { useState, useEffect } from 'react'
import { BadgeDisplay } from './badge-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getUserBadges } from '@/lib/fantasy/badges'
import type { FantasyBadge } from '@/lib/types/fantasy'
import { Timestamp } from 'firebase/firestore'

/**
 * Exemple d'utilisation du composant BadgeDisplay
 * 
 * Ce composant montre comment intégrer BadgeDisplay dans une page
 * avec différentes configurations et options d'affichage.
 */

export function BadgeDisplayExample() {
  const [badges, setBadges] = useState<FantasyBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full')

  // Exemple d'IDs - à remplacer par les vraies valeurs
  const userId = 'example-user-id'
  const teamId = 'example-team-id'

  useEffect(() => {
    loadBadges()
  }, [])

  const loadBadges = async () => {
    try {
      setLoading(true)
      const userBadges = await getUserBadges(userId)
      setBadges(userBadges)
    } catch (error) {
      console.error('Error loading badges:', error)
    } finally {
      setLoading(false)
    }
  }

  // Données de démonstration pour les tests
  const mockBadges: FantasyBadge[] = [
    {
      id: '1',
      userId: userId,
      badgeType: 'top_10_week',
      earnedAt: Timestamp.now(),
      gameweek: 5,
      metadata: {
        rank: 7,
        points: 85
      }
    },
    {
      id: '2',
      userId: userId,
      badgeType: 'century',
      earnedAt: Timestamp.now(),
      gameweek: 8,
      metadata: {
        points: 105
      }
    },
    {
      id: '3',
      userId: userId,
      badgeType: 'perfect_captain',
      earnedAt: Timestamp.now(),
      gameweek: 3,
      metadata: {
        points: 24
      }
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sofa-green mx-auto mb-4"></div>
          <p className="text-sofa-text-muted">Chargement des badges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>🏆 Exemples BadgeDisplay</span>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'full' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('full')}
              >
                Vue Complète
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('compact')}
              >
                Vue Compacte
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sofa-text-muted">
            Exemples d'utilisation du composant BadgeDisplay avec différentes configurations.
          </p>
        </CardContent>
      </Card>

      {/* Tabs avec différents exemples */}
      <Tabs defaultValue="real" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="real">Badges Réels</TabsTrigger>
          <TabsTrigger value="demo">Badges Démo</TabsTrigger>
          <TabsTrigger value="empty">État Vide</TabsTrigger>
        </TabsList>

        {/* Badges réels de l'utilisateur */}
        <TabsContent value="real" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vos Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <BadgeDisplay
                userId={userId}
                teamId={teamId}
                earnedBadges={badges}
                showProgress={true}
                compact={viewMode === 'compact'}
                animated={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges de démonstration */}
        <TabsContent value="demo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Badges de Démonstration</CardTitle>
            </CardHeader>
            <CardContent>
              <BadgeDisplay
                userId={userId}
                teamId={teamId}
                earnedBadges={mockBadges}
                showProgress={true}
                compact={viewMode === 'compact'}
                animated={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* État vide */}
        <TabsContent value="empty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aucun Badge</CardTitle>
            </CardHeader>
            <CardContent>
              <BadgeDisplay
                userId={userId}
                teamId={teamId}
                earnedBadges={[]}
                showProgress={true}
                compact={viewMode === 'compact'}
                animated={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Exemples de configurations */}
      <Card>
        <CardHeader>
          <CardTitle>Configurations Disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sans progression */}
            <div>
              <h3 className="font-semibold mb-2 text-sofa-text-primary">
                Sans Progression
              </h3>
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <BadgeDisplay
                  userId={userId}
                  teamId={teamId}
                  earnedBadges={mockBadges.slice(0, 2)}
                  showProgress={false}
                  compact={true}
                  animated={false}
                />
              </div>
            </div>

            {/* Sans animation */}
            <div>
              <h3 className="font-semibold mb-2 text-sofa-text-primary">
                Sans Animation
              </h3>
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <BadgeDisplay
                  userId={userId}
                  teamId={teamId}
                  earnedBadges={mockBadges.slice(0, 2)}
                  showProgress={true}
                  compact={true}
                  animated={false}
                />
              </div>
            </div>
          </div>

          {/* Code examples */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2 text-sofa-text-primary">
              Exemples de Code
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`// Vue complète avec progression
<BadgeDisplay
  userId={userId}
  teamId={teamId}
  earnedBadges={badges}
  showProgress={true}
  compact={false}
  animated={true}
/>`}
                </pre>
              </div>

              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`// Vue compacte sans progression
<BadgeDisplay
  userId={userId}
  teamId={teamId}
  earnedBadges={badges}
  showProgress={false}
  compact={true}
  animated={false}
/>`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation des props */}
      <Card>
        <CardHeader>
          <CardTitle>Props du Composant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Prop</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Défaut</th>
                  <th className="text-left p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-mono">userId</td>
                  <td className="p-2">string</td>
                  <td className="p-2">-</td>
                  <td className="p-2">ID de l'utilisateur</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-mono">teamId</td>
                  <td className="p-2">string</td>
                  <td className="p-2">-</td>
                  <td className="p-2">ID de l'équipe Fantasy</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-mono">earnedBadges</td>
                  <td className="p-2">FantasyBadge[]</td>
                  <td className="p-2">-</td>
                  <td className="p-2">Liste des badges gagnés</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-mono">showProgress</td>
                  <td className="p-2">boolean</td>
                  <td className="p-2">true</td>
                  <td className="p-2">Afficher la progression vers les badges</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-mono">compact</td>
                  <td className="p-2">boolean</td>
                  <td className="p-2">false</td>
                  <td className="p-2">Mode compact (grille serrée)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-mono">animated</td>
                  <td className="p-2">boolean</td>
                  <td className="p-2">true</td>
                  <td className="p-2">Activer les animations</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
