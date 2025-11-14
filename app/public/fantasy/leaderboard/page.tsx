"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LeaderboardTable } from '@/components/fantasy/leaderboard-table'
import Link from 'next/link'
import { 
  Trophy,
  TrendingUp,
  ArrowLeft,
  Users,
  Award,
  Calendar
} from 'lucide-react'
import type { LeaderboardEntry } from '@/lib/types/fantasy'

type LeaderboardType = 'global' | 'weekly'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('global')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userTeam, setUserTeam] = useState<LeaderboardEntry | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalEntries, setTotalEntries] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const pageSize = 50

  // Load leaderboard data
  const loadLeaderboard = async (
    type: LeaderboardType, 
    page: number, 
    search?: string
  ) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        type,
        page: page.toString(),
        limit: pageSize.toString()
      })

      if (user) {
        params.append('userId', user.uid)
      }

      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/fantasy/leaderboard?${params}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du classement')
      }

      const data = await response.json()
      
      setLeaderboard(data.leaderboard)
      setUserTeam(data.userTeam)
      setTotalEntries(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
      
    } catch (error) {
      console.error('Erreur:', error)
      setLeaderboard([])
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadLeaderboard(leaderboardType, 1)
  }, [leaderboardType, user])

  // Handle tab change
  const handleTabChange = (type: LeaderboardType) => {
    setLeaderboardType(type)
    setCurrentPage(1)
    setSearchQuery('')
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadLeaderboard(leaderboardType, page, searchQuery || undefined)
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(true)
    setCurrentPage(1)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      loadLeaderboard(leaderboardType, 1, query || undefined)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/public/fantasy">
            <Button variant="ghost" className="mb-4 hover:bg-sofa-green/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au Hub Fantasy
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-sofa-text-primary mb-2">
                🏆 Classement Fantasy
              </h1>
              <p className="text-sofa-text-muted">
                Découvrez les meilleures équipes Fantasy de la ComeBac League
              </p>
            </div>
          </div>
        </motion.div>

        {/* User Team Position Card (if user has a team) */}
        {userTeam && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="border-2 border-sofa-green bg-gradient-to-r from-sofa-green/5 to-emerald-50 dark:from-sofa-green/10 dark:to-emerald-900/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-sofa-green rounded-full">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-sofa-text-muted mb-1">Votre position</p>
                      <h3 className="text-2xl font-bold text-sofa-text-primary">
                        {userTeam.rank}
                        <span className="text-base font-normal text-sofa-text-muted ml-2">
                          / {totalEntries}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-sofa-text-muted" />
                      <div>
                        <p className="text-xs text-sofa-text-muted">Équipe</p>
                        <p className="font-semibold text-sofa-text-primary">
                          {userTeam.teamName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-sofa-text-muted" />
                      <div>
                        <p className="text-xs text-sofa-text-muted">Points totaux</p>
                        <p className="font-semibold text-sofa-text-primary">
                          {userTeam.totalPoints} pts
                        </p>
                      </div>
                    </div>

                    {leaderboardType === 'weekly' && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-sofa-green" />
                        <div>
                          <p className="text-xs text-sofa-text-muted">Cette semaine</p>
                          <p className="font-semibold text-sofa-green">
                            {userTeam.gameweekPoints} pts
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
            <Button
              variant={leaderboardType === 'global' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('global')}
              className={`
                ${leaderboardType === 'global' 
                  ? 'bg-sofa-green hover:bg-sofa-green/90 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Classement Général
            </Button>
            <Button
              variant={leaderboardType === 'weekly' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('weekly')}
              className={`
                ${leaderboardType === 'weekly' 
                  ? 'bg-sofa-green hover:bg-sofa-green/90 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Classement Hebdomadaire
            </Button>
          </div>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center">
                  <LoadingSpinner size="lg" />
                  <p className="text-sofa-text-muted mt-4">
                    Chargement du classement...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <LeaderboardTable
              entries={leaderboard}
              currentUserId={user?.uid}
              currentUserTeamId={userTeam?.teamId}
              totalEntries={totalEntries}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              showGameweekPoints={leaderboardType === 'weekly'}
              title={
                leaderboardType === 'global' 
                  ? 'Classement Général' 
                  : 'Classement Hebdomadaire'
              }
              emptyMessage={
                searchQuery
                  ? `Aucune équipe trouvée pour "${searchQuery}"`
                  : 'Aucune équipe dans le classement'
              }
            />
          )}
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sofa-text-primary mb-1">
                    Top 3
                  </h3>
                  <p className="text-sm text-sofa-text-muted">
                    Les 3 premières équipes gagnent un badge Podium
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-sofa-green/10 rounded-lg">
                  <Award className="w-5 h-5 text-sofa-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-sofa-text-primary mb-1">
                    Top 10
                  </h3>
                  <p className="text-sm text-sofa-text-muted">
                    Terminer dans le top 10 hebdomadaire débloque un badge
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sofa-text-primary mb-1">
                    Progression
                  </h3>
                  <p className="text-sm text-sofa-text-muted">
                    Suivez votre évolution semaine après semaine
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Card className="border-2 border-sofa-green bg-gradient-to-r from-sofa-green/5 to-emerald-50 dark:from-sofa-green/10 dark:to-emerald-900/20">
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-sofa-green" />
                <h3 className="text-2xl font-bold text-sofa-text-primary mb-2">
                  Rejoignez le classement !
                </h3>
                <p className="text-sofa-text-muted mb-6">
                  Créez votre équipe Fantasy et affrontez les autres managers
                </p>
                <Link href="/login">
                  <Button className="bg-sofa-green hover:bg-sofa-green/90 text-white">
                    Se connecter pour jouer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
