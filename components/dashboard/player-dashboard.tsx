"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Trophy, Target, Award, TrendingUp, Calendar, Users, Shield, Sparkles, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { t } from '@/lib/i18n'
import { motion } from 'framer-motion'
import { useTheme } from '@/lib/theme-context'
import { PreseasonSection } from '@/components/preseason/preseason-section'

interface PlayerData {
  id: string
  firstName: string
  lastName: string
  nickname?: string
  position: string
  jerseyNumber: number
  teamId: string
  teamName?: string
  stats?: {
    matchesPlayed: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
  }
}

interface TeamData {
  name: string
  logo?: string
  players?: number
}

export function PlayerDashboard() {
  const { user, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        // Vérifier si on est en mode impersonation
        const impersonatePlayerId = sessionStorage.getItem('impersonatePlayerId')
        
        if (isAdmin && impersonatePlayerId) {
          // Charger les données du joueur impersonné
          const playerDocRef = doc(db, 'playerAccounts', impersonatePlayerId)
          const playerDocSnap = await getDoc(playerDocRef)
          
          if (playerDocSnap.exists()) {
            const data = playerDocSnap.data()
            const player = {
              id: playerDocSnap.id,
              firstName: data.firstName,
              lastName: data.lastName,
              nickname: data.nickname,
              position: data.position,
              jerseyNumber: data.jerseyNumber,
              teamId: data.teamId,
              teamName: data.teamName,
              stats: data.stats || {
                matchesPlayed: 0,
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0
              }
            }
            setPlayerData(player)

            // Charger les données de l'équipe
            if (data.teamId) {
              const teamDoc = await getDoc(doc(db, 'teams', data.teamId))
              if (teamDoc.exists()) {
                const teamInfo = teamDoc.data()
                
                const teamPlayersQuery = query(
                  collection(db, 'playerAccounts'),
                  where('teamId', '==', data.teamId)
                )
                const teamPlayersSnap = await getDocs(teamPlayersQuery)
                
                setTeamData({
                  name: teamInfo.name,
                  logo: teamInfo.logo,
                  players: teamPlayersSnap.size
                })
              }
            }
            setLoading(false)
            return
          }
        }

        if (!user?.email) {
          setLoading(false)
          return
        }

        // Chercher dans playerAccounts
        const playerAccountsQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', user.email)
        )
        const playerAccountsSnap = await getDocs(playerAccountsQuery)

        if (!playerAccountsSnap.empty) {
          const playerDoc = playerAccountsSnap.docs[0]
          const data = playerDoc.data()
          
          const player = {
            id: playerDoc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            nickname: data.nickname,
            position: data.position,
            jerseyNumber: data.jerseyNumber,
            teamId: data.teamId,
            teamName: data.teamName,
            stats: data.stats || {
              matchesPlayed: 0,
              goals: 0,
              assists: 0,
              yellowCards: 0,
              redCards: 0
            }
          }
          setPlayerData(player)

          // Charger les données de l'équipe
          if (data.teamId) {
            const teamDoc = await getDoc(doc(db, 'teams', data.teamId))
            if (teamDoc.exists()) {
              const teamInfo = teamDoc.data()
              
              // Compter les joueurs de l'équipe
              const teamPlayersQuery = query(
                collection(db, 'playerAccounts'),
                where('teamId', '==', data.teamId)
              )
              const teamPlayersSnap = await getDocs(teamPlayersQuery)
              
              setTeamData({
                name: teamInfo.name,
                logo: teamInfo.logo,
                players: teamPlayersSnap.size
              })
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données joueur:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayerData()
  }, [user, isAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!playerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">{t('player.noData')}</p>
        </div>
      </div>
    )
  }

  const stats = playerData.stats || { matchesPlayed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2"
              >
                {t('player.welcome')}, {playerData.firstName}! 👋
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 dark:text-gray-400 text-lg"
              >
                {playerData.position} • #{playerData.jerseyNumber}
              </motion.p>
            </div>
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all"
                aria-label={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </motion.button>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
              >
                <NotificationBell />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Team Info Card */}
        {teamData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl mb-8 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/20 rounded-full blur-xl"></div>
            <div className="relative flex items-center gap-4 md:gap-6 flex-wrap">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-lg"
              >
                {teamData.logo ? (
                  <img src={teamData.logo} alt={teamData.name} className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" />
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold mb-1">{teamData.name}</h2>
                <p className="text-blue-100 text-sm md:text-base">{t('player.myTeam')}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl md:text-4xl font-bold">{teamData.players}</div>
                <p className="text-blue-100 text-sm">{t('player.players')}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                {stats.matchesPlayed}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('player.matchesPlayed')}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-green-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                {stats.goals}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('player.goals')}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-purple-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                {stats.assists}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('player.assists')}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-yellow-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Award className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-1">
                {stats.yellowCards + stats.redCards}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Cartons</p>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Link
              href="/player/profile"
              className="block bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Mon Profil</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Voir mes informations</p>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Link
              href="/player/matches"
              className="block bg-gradient-to-br from-white via-white to-green-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Mes Matchs</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Calendrier et résultats</p>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Link
              href="/player/badges"
              className="block bg-gradient-to-br from-white via-white to-purple-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Mes Badges</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Récompenses débloquées</p>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Preseason Section */}
        {playerData?.teamId && (
          <PreseasonSection teamId={playerData.teamId} teamName={playerData.teamName} />
        )}
      </div>
    </div>
  )
}
