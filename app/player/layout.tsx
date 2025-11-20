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
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTracker } from '@/components/analytics/page-tracker'
import { useActingCoach } from '@/lib/use-acting-coach'
import { NotificationBell } from '@/components/notifications/notification-bell'

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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition text-gray-600"
          >
            <Menu className="w-6 h-6" />
            <span className="text-xs font-medium">Menu</span>
          </button>
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
                <div className="sofa-user-menu rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-sofa-border flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-sofa-text-muted">Connecté en tant que</p>
                      <p className="font-semibold text-sofa-text-primary">{playerData.firstName} {playerData.lastName}</p>
                      <p className="text-xs text-sofa-text-muted">{playerData.teamName}</p>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-full hover:bg-sofa-bg-hover transition"
                    >
                      <X className="w-4 h-4 text-sofa-text-muted" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                    {allMenuItems.map((item: any) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      const isCoachItem = item.isCoachItem || false
                      const isInBar = navItems.some(tab => tab.href === item.href)
                      if (isInBar && !isCoachItem) return null
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                            isActive
                              ? 'bg-sofa-bg-hover text-sofa-text-primary'
                              : 'text-sofa-text-secondary hover:bg-sofa-bg-hover'
                          } ${isCoachItem ? 'border border-dashed border-orange-300' : ''}`}
                        >
                          <Icon className="w-5 h-5" />
                          <div className="flex-1">
                            <span className="font-medium">{item.label}</span>
                            {isCoachItem && (
                              <p className="text-xs text-orange-500">Accès coach intérimaire</p>
                            )}
                          </div>
                        </Link>
                      )
                    })}

                    {actingCoachStatus.isActingCoach && (
                      <Link
                        href="/coach"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                      >
                        <Clipboard className="w-4 h-4" />
                        <span className="font-medium">Basculer sur Interface Coach</span>
                      </Link>
                    )}
                    <Link
                      href="/public"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                    >
                      <Home className="w-4 h-4" />
                      <span className="font-medium">Basculer sur Public</span>
                    </Link>
                  </div>

                  <div className="p-4 border-t border-sofa-border">
                    {isAdmin && sessionStorage.getItem('impersonatePlayerId') ? (
                      <button
                        onClick={() => {
                          sessionStorage.removeItem('impersonatePlayerId')
                          sessionStorage.removeItem('impersonatePlayerName')
                          window.location.href = '/admin/impersonate'
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-yellow-200 text-yellow-700 hover:bg-yellow-50 transition"
                      >
                        <span>👤</span>
                        Quitter le mode impersonation
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          logout()
                          setMobileMenuOpen(false)
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 bottom-0 w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          {/* Player Info */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
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
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                  {playerData.jerseyNumber}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {playerData.firstName} {playerData.lastName}
                </h3>
                <p className="text-sm text-gray-600">{playerData.position}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Joueur vérifié</span>
            </div>
            {playerData.teamName && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{playerData.teamName}</span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="space-y-1 mb-6">
            {allMenuItems.map((item: any) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isCoachItem = item.isCoachItem || false
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? isCoachItem 
                        ? 'bg-orange-600 text-white'
                        : 'bg-blue-600 text-white'
                      : isCoachItem
                        ? 'text-orange-700 bg-orange-50 hover:bg-orange-100'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
          
          {/* Acting Coach Badge */}
          {actingCoachStatus.isActingCoach && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clipboard className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-bold text-orange-900">Coach Intérimaire</span>
              </div>
              <p className="text-xs text-orange-700 leading-relaxed mb-3">
                Vous avez accès aux fonctions de coach jusqu'à ce qu'un coach soit assigné à votre équipe.
              </p>
              <Link
                href="/coach"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-md text-sm font-medium"
              >
                <Clipboard className="w-4 h-4" />
                Basculer sur Interface Coach
              </Link>
            </div>
          )}

          {/* Toggle Button */}
          <div className="mb-6">
            <Link
              href="/public"
              className="flex items-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition shadow-md"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Basculer sur Utilisateur</span>
            </Link>
          </div>

          {/* Exit Impersonation Button (if admin) */}
          {isAdmin && sessionStorage.getItem('impersonatePlayerId') && (
            <div className="mb-4">
              <button
                onClick={() => {
                  sessionStorage.removeItem('impersonatePlayerId')
                  sessionStorage.removeItem('impersonatePlayerName')
                  window.location.href = '/admin/impersonate'
                }}
                className="flex items-center gap-3 w-full px-4 py-3 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-lg transition font-medium"
              >
                <span>👤</span>
                <span>Quitter le mode impersonation</span>
              </button>
            </div>
          )}

          {/* Logout Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
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
