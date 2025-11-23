"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  User, 
  Trophy, 
  Award, 
  LogOut, 
  Menu, 
  X,
  CheckCircle,
  Users,
  Home,
  BarChart3,
  Clipboard,
  Calendar,
  Target,
  Activity,
  Sun,
  Moon
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTracker } from '@/components/analytics/page-tracker'
import { useActingCoach } from '@/lib/use-acting-coach'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { useTheme } from '@/lib/theme-context'

interface PlayerData {
  id: string
  firstName: string
  lastName: string
  nickname?: string
  position: string
  jerseyNumber: number
  teamId: string
  teamName?: string
  photo?: string
}

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [loadingPlayer, setLoadingPlayer] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  
  // Vérifier si le joueur est coach intérimaire
  const actingCoachStatus = useActingCoach(user?.email || null, playerData?.teamId || null)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (isAdmin && !sessionStorage.getItem('impersonatePlayerId')) {
        // Rediriger vers admin seulement si pas en mode impersonation
        router.push('/admin')
      }
    }
  }, [user, isAdmin, loading, router])

  useEffect(() => {
    const loadPlayerData = async () => {
      if (!user?.email && !isAdmin) return

      try {
        // Vérifier si on est en mode impersonation
        const impersonatePlayerId = sessionStorage.getItem('impersonatePlayerId')
        
        if (isAdmin && impersonatePlayerId) {
          // Charger les données du joueur impersonné
          const playerDocRef = doc(db, 'playerAccounts', impersonatePlayerId)
          const playerDocSnap = await getDoc(playerDocRef)
          if (playerDocSnap.exists()) {
            const data = playerDocSnap.data()
            setPlayerData({
              id: playerDocSnap.id,
              firstName: data.firstName,
              lastName: data.lastName,
              nickname: data.nickname,
              position: data.position,
              jerseyNumber: data.jerseyNumber,
              teamId: data.teamId,
              teamName: data.teamName,
              photo: data.photo
            })
          }
          setLoadingPlayer(false)
          return
        }

        const playerAccountsQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', user?.email || '')
        )
        const playerAccountsSnap = await getDocs(playerAccountsQuery)

        if (!playerAccountsSnap.empty) {
          const playerDoc = playerAccountsSnap.docs[0]
          const data = playerDoc.data()
          
          setPlayerData({
            id: playerDoc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            nickname: data.nickname,
            position: data.position,
            jerseyNumber: data.jerseyNumber,
            teamId: data.teamId,
            teamName: data.teamName,
            photo: data.photo
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données joueur:', error)
      } finally {
        setLoadingPlayer(false)
      }
    }

    loadPlayerData()
  }, [user, isAdmin])


  if (loading || loadingPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !playerData) {
    return null
  }

  const navItems = [
    { href: '/player', icon: Home, label: 'Tableau de bord' },
    { href: '/player/team', icon: Users, label: 'Équipe' },
    { href: '/player/ranking', icon: BarChart3, label: 'Classement' },
    { href: '/player/matches', icon: Calendar, label: 'Matchs' }
  ]

  const extraMenuItems = [
    { href: '/player/profile', icon: User, label: 'Profil' },
    { href: '/player/badges', icon: Award, label: 'Badges' },
    { href: '/player/stats', icon: Activity, label: 'Statistiques' },
    { href: '/player/fantasy', icon: Trophy, label: 'Fantasy' }
  ]

  const menuItems = [...navItems, ...extraMenuItems]
  
  // Ajouter l'accès coach si le joueur est coach intérimaire
  const allMenuItems = actingCoachStatus.isActingCoach 
    ? [
        ...menuItems,
        { href: '/coach/lineups', icon: Clipboard, label: '⚽ Compositions (Coach)', isCoachItem: true }
      ]
    : menuItems

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-br from-white/95 via-white/95 to-gray-50/95 dark:from-gray-800/95 dark:via-gray-800/95 dark:to-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 z-40 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
                </Link>
              </motion.div>
            )
          })}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Menu className="w-6 h-6" />
            <span className="text-xs font-medium">Menu</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile Floating Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="lg:hidden fixed inset-0 z-50 flex items-end justify-end p-4"
            >
              <div className="w-full max-w-sm">
                <div className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
                  <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase text-blue-100 mb-1">Connecté en tant que</p>
                        <p className="font-bold text-white text-lg">{playerData.firstName} {playerData.lastName}</p>
                        <p className="text-sm text-blue-100 mt-1">{playerData.teamName}</p>
                      </div>
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition backdrop-blur-sm"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                    {allMenuItems.map((item: any, index: number) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      const isCoachItem = item.isCoachItem || false
                      const isInBar = navItems.some(tab => tab.href === item.href)
                      if (isInBar && !isCoachItem) return null
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                              isActive
                                ? isCoachItem
                                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                : isCoachItem
                                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800'
                                  : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <div className="flex-1">
                              <span className="font-semibold">{item.label}</span>
                              {isCoachItem && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">Accès coach intérimaire</p>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      )
                    })}

                    {actingCoachStatus.isActingCoach && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href="/coach"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl transition-all"
                        >
                          <Clipboard className="w-5 h-5" />
                          <span className="font-semibold">Basculer sur Interface Coach</span>
                        </Link>
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href="/public"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        <Home className="w-5 h-5" />
                        <span className="font-semibold">Basculer sur Public</span>
                      </Link>
                    </motion.div>
                    
                    {/* Theme Toggle */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={toggleTheme}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
                      >
                        {theme === 'light' ? (
                          <>
                            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Mode Sombre</span>
                          </>
                        ) : (
                          <>
                            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Mode Clair</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  </div>

                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    {isAdmin && sessionStorage.getItem('impersonatePlayerId') ? (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          sessionStorage.removeItem('impersonatePlayerId')
                          sessionStorage.removeItem('impersonatePlayerName')
                          window.location.href = '/admin/impersonate'
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30 transition-all font-semibold"
                      >
                        <span>👤</span>
                        Quitter le mode impersonation
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          logout()
                          setMobileMenuOpen(false)
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:from-red-100 hover:to-pink-100 dark:hover:from-red-900/30 dark:hover:to-pink-900/30 transition-all font-semibold"
                      >
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 bottom-0 w-80 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 border-r border-gray-200/50 dark:border-gray-700/50 overflow-y-auto backdrop-blur-xl">
        <div className="p-6">
          {/* Player Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl border-4 border-white dark:border-gray-800">
                  {playerData.photo ? (
                    <img 
                      src={playerData.photo} 
                      alt={`${playerData.firstName} ${playerData.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    `${playerData.firstName[0]}${playerData.lastName[0]}`
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-4 border-white dark:border-gray-800 shadow-lg">
                  {playerData.jerseyNumber}
                </div>
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {playerData.firstName} {playerData.lastName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{playerData.position}</p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl mb-2"
            >
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">Joueur vérifié</span>
            </motion.div>
            {playerData.teamName && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
              >
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{playerData.teamName}</span>
              </motion.div>
            )}
          </motion.div>

          {/* Menu Items */}
          <nav className="space-y-2 mb-6">
            {allMenuItems.map((item: any, index: number) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isCoachItem = item.isCoachItem || false
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? isCoachItem 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                        : isCoachItem
                          ? 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800'
                          : 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{item.label}</span>
                  </Link>
                </motion.div>
              )
            })}
          </nav>
          
          {/* Acting Coach Badge */}
          {actingCoachStatus.isActingCoach && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clipboard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-bold text-orange-900 dark:text-orange-300">Coach Intérimaire</span>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed mb-3">
                Vous avez accès aux fonctions de coach jusqu'à ce qu'un coach soit assigné à votre équipe.
              </p>
              <Link
                href="/coach"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl text-sm font-semibold"
              >
                <Clipboard className="w-4 h-4" />
                Basculer sur Interface Coach
              </Link>
            </motion.div>
          )}

          {/* Theme Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-4"
          >
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all shadow-lg hover:shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 font-semibold"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-gray-700 dark:text-gray-300">Mode Sombre</span>
                </>
              ) : (
                <>
                  <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-gray-700 dark:text-gray-300">Mode Clair</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Toggle Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mb-6"
          >
            <Link
              href="/public"
              className="flex items-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <Home className="w-5 h-5" />
              <span>Basculer sur Utilisateur</span>
            </Link>
          </motion.div>

          {/* Exit Impersonation Button (if admin) */}
          {isAdmin && sessionStorage.getItem('impersonatePlayerId') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-4"
            >
              <button
                onClick={() => {
                  sessionStorage.removeItem('impersonatePlayerId')
                  sessionStorage.removeItem('impersonatePlayerName')
                  window.location.href = '/admin/impersonate'
                }}
                className="flex items-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30 rounded-xl transition-all font-semibold"
              >
                <span>👤</span>
                <span>Quitter le mode impersonation</span>
              </button>
            </motion.div>
          )}

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all font-semibold"
            >
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-80 pb-20 lg:pb-0">
        {children}
      </div>
      
      {/* Page Analytics Tracker */}
      <PageTracker />
    </div>
  )
}

