"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Trophy, Users, Calendar, TrendingUp, Clipboard, BarChart3, Shield, Target, AlertCircle, Plus, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { t } from '@/lib/i18n'
import { motion } from 'framer-motion'
import { useTheme } from '@/lib/theme-context'

interface CoachData {
  id: string
  firstName: string
  lastName: string
  teamId: string
  teamName?: string
}

interface TeamData {
  name: string
  logo?: string
  color?: string
  players?: number
  stats?: {
    matchesPlayed: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
  }
}

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamId: string
  awayTeamId: string
  homeScore?: number
  awayScore?: number
  date: Date
  location: string
  status: 'upcoming' | 'live' | 'finished'
  hasLineup?: boolean
}

export function CoachDashboard() {
  const { user, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [coachData, setCoachData] = useState<CoachData | null>(null)
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [teamRanking, setTeamRanking] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCoachData = async () => {
      if (!user?.email) return

      try {
        let teamId = ''
        
        // Vérifier si on est en mode impersonation
        const impersonateCoachId = sessionStorage.getItem('impersonateCoachId')
        
        if (impersonateCoachId) {
          // Mode impersonation: charger les données du coach spécifique
          const coachDoc = await getDoc(doc(db, 'coachAccounts', impersonateCoachId))
          
          if (coachDoc.exists()) {
            const data = coachDoc.data()
            const coach = {
              id: coachDoc.id,
              firstName: data.firstName,
              lastName: data.lastName,
              teamId: data.teamId,
              teamName: data.teamName
            }
            setCoachData(coach)
            teamId = data.teamId
          }
        } else if (isAdmin) {
          // Admin sans impersonation: données de démo
          setCoachData({
            id: 'admin',
            firstName: 'Admin',
            lastName: 'Comebac',
            teamId: 'demo',
            teamName: 'Équipe Demo'
          })
          teamId = 'demo'
        } else {
          // Utilisateur normal: chercher par email
          const coachAccountsQuery = query(
            collection(db, 'coachAccounts'),
            where('email', '==', user.email)
          )
          const coachAccountsSnap = await getDocs(coachAccountsQuery)

          if (!coachAccountsSnap.empty) {
            const coachDoc = coachAccountsSnap.docs[0]
            const data = coachDoc.data()
            
            const coach = {
              id: coachDoc.id,
              firstName: data.firstName,
              lastName: data.lastName,
              teamId: data.teamId,
              teamName: data.teamName
            }
            setCoachData(coach)
            teamId = data.teamId
          } else {
            // Si pas de compte coach, vérifier si c'est un coach intérimaire (joueur avec isActingCoach)
            const playerAccountsQuery = query(
              collection(db, 'playerAccounts'),
              where('email', '==', user.email),
              where('isActingCoach', '==', true)
            )
            const playerAccountsSnap = await getDocs(playerAccountsQuery)
            
            if (!playerAccountsSnap.empty) {
              const playerDoc = playerAccountsSnap.docs[0]
              const data = playerDoc.data()
              
              const coach = {
                id: playerDoc.id,
                firstName: data.firstName,
                lastName: data.lastName,
                teamId: data.teamId,
                teamName: data.teamName
              }
              setCoachData(coach)
              teamId = data.teamId
            }
          }
        }

        if (teamId && teamId !== 'demo') {
          // Charger les données de l'équipe
          const teamDoc = await getDoc(doc(db, 'teams', teamId))
          if (teamDoc.exists()) {
            const teamInfo = teamDoc.data()
            
            // Compter les joueurs de l'équipe
            const teamPlayersQuery = query(
              collection(db, 'playerAccounts'),
              where('teamId', '==', teamId)
            )
            const teamPlayersSnap = await getDocs(teamPlayersQuery)
            
            setTeamData({
              name: teamInfo.name,
              logo: teamInfo.logo,
              color: teamInfo.color || '#3B82F6',
              players: teamPlayersSnap.size,
              stats: teamInfo.stats || {
                matchesPlayed: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0
              }
            })
          }

          // Charger les matchs à venir
          const now = new Date()
          const upcomingQuery = query(
            collection(db, 'matches'),
            where('teams', 'array-contains', teamId),
            where('status', '==', 'upcoming')
          )
          const upcomingSnap = await getDocs(upcomingQuery)
          const upcoming = upcomingSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date()
          })) as Match[]
          // Trier par date croissante et limiter à 3
          upcoming.sort((a, b) => a.date.getTime() - b.date.getTime())
          setUpcomingMatches(upcoming.slice(0, 3))

          // Charger les matchs récents
          const recentQuery = query(
            collection(db, 'matches'),
            where('teams', 'array-contains', teamId),
            where('status', '==', 'finished')
          )
          const recentSnap = await getDocs(recentQuery)
          const recent = recentSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date()
          })) as Match[]
          // Trier par date décroissante et limiter à 3
          recent.sort((a, b) => b.date.getTime() - a.date.getTime())
          setRecentMatches(recent.slice(0, 3))

          // Calculer le classement (simplifié)
          const allTeamsSnap = await getDocs(collection(db, 'teams'))
          const teams = allTeamsSnap.docs.map(doc => ({
            id: doc.id,
            stats: doc.data().stats || { wins: 0, draws: 0 }
          }))
          teams.sort((a, b) => {
            const pointsA = (a.stats.wins * 3) + (a.stats.draws * 1)
            const pointsB = (b.stats.wins * 3) + (b.stats.draws * 1)
            return pointsB - pointsA
          })
          const rank = teams.findIndex(t => t.id === teamId) + 1
          setTeamRanking(rank)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données entraîneur:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCoachData()
  }, [user, isAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!coachData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">{t('coach.noData')}</p>
        </div>
      </div>
    )
  }

  const stats = teamData?.stats || { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
  const winRate = stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0

  // Vérifier les alertes de composition
  const needsLineupAlert = upcomingMatches.some(match => {
    const hoursUntilMatch = (match.date.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    return hoursUntilMatch <= 24 && !match.hasLineup
  })

  const nextMatch = upcomingMatches[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
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
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {t('coach.welcomeCoach')} {coachData.firstName}! 🏆
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('coach.manageTeam')}
              </p>
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

        {/* Alerte composition manquante */}
        {needsLineupAlert && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 p-4 md:p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-2xl shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 dark:text-red-300 mb-1 text-lg">{t('coach.missingLineup')}</h3>
                <p className="text-red-700 dark:text-red-400 text-sm mb-3">
                  {t('coach.missingLineupDesc')}
                </p>
                <Link
                  href="/coach/lineups"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold text-sm"
                >
                  <Clipboard className="w-4 h-4" />
                  {t('coach.createLineupNow')}
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Team Info Card */}
        {teamData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative text-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl mb-8 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${teamData.color} 0%, ${teamData.color}dd 100%)`
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
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
                <p className="text-white/90 text-sm md:text-base">{t('coach.myTeam')}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl md:text-4xl font-bold">{teamData.players}</div>
                <p className="text-white/90 text-sm">{t('coach.players')}</p>
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
            className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">{stats.matchesPlayed}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('coach.matchesPlayed')}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-green-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">{stats.wins}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Victoires</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-purple-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">{winRate}%</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Taux de Victoire</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-orange-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
                {stats.goalsFor}/{stats.goalsAgainst}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Buts Pour/Contre</p>
            </div>
          </motion.div>
        </div>

        {/* Classement et Prochain Match */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {/* Position au classement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 text-white p-6 md:p-8 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold">{t('coach.rankingPosition')}</h3>
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-purple-100 mb-1 text-sm md:text-base">Votre équipe est</p>
                <p className="text-sm text-purple-100">
                  {stats.matchesPlayed} matchs • {stats.wins}V {stats.draws}N {stats.losses}D
                </p>
              </div>
              <div className="text-right">
                <p className="text-5xl md:text-6xl font-black">{teamRanking > 0 ? teamRanking : '-'}</p>
                <p className="text-purple-100 text-sm">ème</p>
              </div>
            </div>
          </motion.div>

          {/* Prochain match */}
          {nextMatch ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg md:text-xl">Prochain Match</h3>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold border border-blue-200 dark:border-blue-800">
                  {nextMatch.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="text-center mb-4">
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-2 font-medium">{nextMatch.homeTeam} vs {nextMatch.awayTeam}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{nextMatch.location}</p>
              </div>
              <Link
                href="/coach/lineups"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                <Plus className="w-5 h-5" />
                Créer la composition
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl flex items-center justify-center"
            >
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>Aucun match à venir</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Prochains Matchs */}
        {upcomingMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('coach.upcomingMatches')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {upcomingMatches.map((match, index) => {
                const hoursUntilMatch = (match.date.getTime() - new Date().getTime()) / (1000 * 60 * 60)
                const needsLineup = hoursUntilMatch <= 24 && !match.hasLineup
                
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className={`bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-4 md:p-6 rounded-2xl shadow-xl border-2 backdrop-blur-xl ${
                      needsLineup 
                        ? 'border-red-500 dark:border-red-600 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20' 
                        : 'border-gray-200/50 dark:border-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {match.date.toLocaleDateString('fr-FR', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      {needsLineup && (
                        <span className="px-2 py-1 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-bold border border-red-200 dark:border-red-800">
                          ⚠️ Urgent
                        </span>
                      )}
                    </div>
                    <div className="text-center mb-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{match.homeTeam}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 my-1">vs</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{match.awayTeam}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{match.location}</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Derniers Résultats */}
        {recentMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">Derniers Résultats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {recentMatches.map((match, index) => {
                const isHome = match.homeTeamId === coachData?.teamId
                const teamScore = isHome ? match.homeScore : match.awayScore
                const opponentScore = isHome ? match.awayScore : match.homeScore
                const won = (teamScore ?? 0) > (opponentScore ?? 0)
                const draw = teamScore === opponentScore
                
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className={`bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-4 md:p-6 rounded-2xl shadow-xl border backdrop-blur-xl ${
                      won 
                        ? 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                        : draw
                        ? 'border-gray-200/50 dark:border-gray-700/50'
                        : 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {match.date.toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        won 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                          : draw 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600' 
                          : 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      }`}>
                        {won ? 'V' : draw ? 'N' : 'D'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{match.homeTeam}</p>
                      <p className={`text-xl md:text-2xl font-bold ${
                        won && isHome ? 'text-green-600 dark:text-green-400' : 
                        !won && !isHome && !draw ? 'text-red-600 dark:text-red-400' :
                        'text-gray-900 dark:text-white'
                      }`}>{match.homeScore ?? '-'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{match.awayTeam}</p>
                      <p className={`text-xl md:text-2xl font-bold ${
                        won && !isHome ? 'text-green-600 dark:text-green-400' : 
                        !won && isHome && !draw ? 'text-red-600 dark:text-red-400' :
                        'text-gray-900 dark:text-white'
                      }`}>{match.awayScore ?? '-'}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Link
              href="/coach/team"
              className="block bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Mon Équipe</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gérer les joueurs</p>
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
              href="/coach/lineups"
              className="block bg-gradient-to-br from-white via-white to-green-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Clipboard className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Compositions</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Créer et gérer</p>
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
              href="/coach/matches"
              className="block bg-gradient-to-br from-white via-white to-purple-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Matchs</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Calendrier et résultats</p>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Link
              href="/coach/profile"
              className="block bg-gradient-to-br from-white via-white to-indigo-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Mon Profil</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mes informations</p>
                </div>
              </div>
            </Link>
          </motion.div>

          <Link
            href="/coach/team"
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('coach.myTeam')}</h3>
                <p className="text-sm text-gray-600">Gérer les joueurs</p>
              </div>
            </div>
          </Link>

          <Link
            href="/coach/lineups"
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition">
                <Clipboard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('coach.lineups')}</h3>
                <p className="text-sm text-gray-600">{t('coach.createLineups')}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/coach/matches"
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('coach.matches')}</h3>
                <p className="text-sm text-gray-600">{t('coach.scheduleResults')}</p>
              </div>
            </div>
          </Link>
        </div>


      </div>
    </div>
  )
}
