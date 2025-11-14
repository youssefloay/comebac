"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BadgeDisplay } from '@/components/fantasy/badge-display'
import Link from 'next/link'
import { 
  Award,
  ArrowLeft,
  Sparkles,
  Trophy,
  TrendingUp,
  Info
} from 'lucide-react'
import type { FantasyTeam, FantasyBadge } from '@/lib/types/fantasy'
import { FANTASY_BADGES } from '@/lib/fantasy/badges'

export default function FantasyRewardsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [fantasyTeam, setFantasyTeam] = useState<FantasyTeam | null>(null)
  const [earnedBadges, setEarnedBadges] = useState<FantasyBadge[]>([])

  useEffect(() => {
    const loadRewardsData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Load user's fantasy team
        const teamResponse = await fetch(`/api/fantasy/get-team?userId=${user.uid}`)
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setFantasyTeam(teamData.team)
        }

        // Load user's badges
        // In production, this would be an API call
        // For now, we'll use mock data based on the team's badges array
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          const team = teamData.team as FantasyTeam
          
          // Mock badges based on team.badges array
          const mockBadges: FantasyBadge[] = team.badges.map((badgeType, index) => ({
            id: `badge-${index}`,
            userId: user.uid,
            badgeType: badgeType as any,
            earnedAt: {
              toDate: () => new Date(Date.now() - index * 86400000)
            } as any,
            gameweek: Math.floor(Math.random() * 10) + 1,
            metadata: {
              points: Math.floor(Math.random() * 50) + 50,
              rank: Math.floor(Math.random() * 10) + 1
            }
          }))
          
          setEarnedBadges(mockBadges)
        }

      } catch (error) {
        console.error('Error loading rewards data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRewardsData()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // If user doesn't have a team, redirect to create
  if (!fantasyTeam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Créez votre équipe Fantasy
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Vous devez d'abord créer une équipe Fantasy pour accéder aux récompenses
            </p>
            <Link href="/public/fantasy/create">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Sparkles className="w-5 h-5 mr-2" />
                Créer mon équipe
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  const totalBadges = Object.keys(FANTASY_BADGES).length
  const earnedCount = earnedBadges.length
  const progressPercentage = Math.round((earnedCount / totalBadges) * 100)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link href="/public/fantasy">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au Hub
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Récompenses & Badges
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {fantasyTeam.teamName}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Left: Stats */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-1">
                      {earnedCount} / {totalBadges}
                    </div>
                    <div className="text-lg opacity-90">
                      Badges débloqués
                    </div>
                  </div>
                </div>

                {/* Right: Progress Bar */}
                <div className="flex-1 max-w-md w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Progression</span>
                    <span className="text-sm font-bold">{progressPercentage}%</span>
                  </div>
                  <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                  <div className="text-xs opacity-80 mt-2">
                    {totalBadges - earnedCount} badges restants à débloquer
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {fantasyTeam.totalPoints}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Points totaux
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    #{fantasyTeam.rank || '-'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Rang global
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {fantasyTeam.gameweekPoints}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Points cette semaine
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-md bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Comment gagner des badges ?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Les badges sont automatiquement attribués lorsque vous atteignez certains objectifs. 
                    Continuez à jouer, performez bien, et débloquez-les tous !
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Top 10 hebdomadaire
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      100+ points en une semaine
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Podium général
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Et plus encore...
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Badge Display Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <BadgeDisplay
            userId={user?.uid || ''}
            teamId={fantasyTeam.id}
            earnedBadges={earnedBadges}
            showProgress={true}
            animated={true}
          />
        </motion.div>

        {/* Call to Action */}
        {earnedCount < totalBadges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Continuez à performer !
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Il vous reste {totalBadges - earnedCount} badge{totalBadges - earnedCount > 1 ? 's' : ''} à débloquer. 
                  Optimisez votre équipe et grimpez au classement !
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link href="/public/fantasy/my-team">
                    <Button variant="outline">
                      Voir mon équipe
                    </Button>
                  </Link>
                  <Link href="/public/fantasy/transfers">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Faire des transferts
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* All Badges Unlocked Celebration */}
        {earnedCount === totalBadges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white">
              <CardContent className="p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.7
                  }}
                  className="text-6xl mb-4"
                >
                  🏆
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">
                  Félicitations !
                </h3>
                <p className="text-lg opacity-90 mb-4">
                  Vous avez débloqué tous les badges Fantasy !
                </p>
                <Badge className="bg-white text-orange-600 text-lg px-4 py-2">
                  Maître Fantasy 👑
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
