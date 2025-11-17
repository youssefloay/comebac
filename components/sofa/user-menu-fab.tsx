"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronUp,
  Home,
  Users,
  LogIn,
  Trophy,
  Target,
  Award,
  Bell,
  Activity
} from 'lucide-react'

interface PlayerData {
  id: string
  firstName: string
  lastName: string
  nickname?: string
  position: string
  jerseyNumber: number
  teamId: string
  photo?: string
}

interface CoachData {
  id: string
  firstName?: string
  lastName?: string
  teamId?: string
  teamName?: string
}

export function UserMenuFAB() {
  const { user, userProfile, logout, isAdmin } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [loadingPlayer, setLoadingPlayer] = useState(true)
  const [coachData, setCoachData] = useState<CoachData | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const hasPlayerSection = !!playerData && (!userProfile || userProfile.role === 'player' || userProfile.role === 'admin')
  const visiblePlayerData = hasPlayerSection ? playerData : null
  const isOnPlayerArea = pathname?.startsWith('/player')
  const isOnCoachArea = pathname?.startsWith('/coach')
  const showPlayerSection = !!visiblePlayerData && isOnPlayerArea
  const showCoachSection = !!coachData && isOnCoachArea

  // Load player data if user is a player
  useEffect(() => {
    const loadPlayerData = async () => {
      if (!user?.email) {
        setLoadingPlayer(false)
        return
      }

      try {
        // Chercher d'abord dans players
        const playersQuery = query(
          collection(db, 'players'),
          where('email', '==', user.email)
        )
        const playersSnap = await getDocs(playersQuery)

        if (!playersSnap.empty) {
          const playerDoc = playersSnap.docs[0]
          setPlayerData({ id: playerDoc.id, ...playerDoc.data() } as PlayerData)
        } else {
          // Si pas trouvé, chercher dans playerAccounts
          const playerAccountsQuery = query(
            collection(db, 'playerAccounts'),
            where('email', '==', user.email)
          )
          const playerAccountsSnap = await getDocs(playerAccountsQuery)

          if (!playerAccountsSnap.empty) {
            const playerDoc = playerAccountsSnap.docs[0]
            const data = { id: playerDoc.id, ...playerDoc.data() } as PlayerData
            console.log('✅ Player data loaded in FAB:', data)
            setPlayerData(data)
          } else {
            console.log('ℹ️ No player data found for:', user.email)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil joueur:', error)
      } finally {
        setLoadingPlayer(false)
      }
    }

    loadPlayerData()
  }, [user])

  // Load coach data if account exists
  useEffect(() => {
    const loadCoachData = async () => {
      if (!user?.email) {
        setCoachData(null)
        return
      }

      try {
        const coachQuery = query(
          collection(db, 'coachAccounts'),
          where('email', '==', user.email)
        )
        const coachSnap = await getDocs(coachQuery)

        if (!coachSnap.empty) {
          const coachDoc = coachSnap.docs[0]
          setCoachData({
            id: coachDoc.id,
            ...coachDoc.data()
          } as CoachData)
        } else {
          setCoachData(null)
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil coach:', error)
        setCoachData(null)
      }
    }

    loadCoachData()
  }, [user])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Check if mobile menu is open
  useEffect(() => {
    const checkMobileMenu = () => {
      setIsMobileMenuOpen(document.body.classList.contains('mobile-menu-open'))
    }

    checkMobileMenu()
    const observer = new MutationObserver(checkMobileMenu)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  // Hide FAB when mobile menu is open
  if (isMobileMenuOpen) return null

  // Show login FAB for non-authenticated users (desktop only)
  if (!user) {
    return (
      <div className="hidden md:block fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50">
        <Link href="/login">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 sofa-fab rounded-full flex items-center justify-center"
            title="Se connecter"
          >
            <LogIn className="w-6 h-6 text-white" />
          </motion.button>
        </Link>
      </div>
    )
  }

  return (
    <div className="hidden md:block fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50" ref={menuRef}>
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 sofa-user-menu min-w-[240px]"
          >
            {/* Header avec photo/avatar */}
            <div className="p-4 border-b border-sofa-border">
              <div className="flex items-center gap-3">
                {/* Avatar ou photo */}
                <div className="relative flex-shrink-0">
                  {visiblePlayerData ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sofa-blue to-sofa-green flex items-center justify-center text-white text-lg font-bold">
                      {visiblePlayerData.photo ? (
                        <img 
                          src={visiblePlayerData.photo} 
                          alt={`${visiblePlayerData.firstName} ${visiblePlayerData.lastName}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        `${visiblePlayerData.firstName[0]}${visiblePlayerData.lastName[0]}`
                      )}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-sofa-bg-secondary flex items-center justify-center">
                      <User className="w-6 h-6 text-sofa-text-muted" />
                    </div>
                  )}
                  {visiblePlayerData && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-sofa-green rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                      {visiblePlayerData.jerseyNumber}
                    </div>
                  )}
                </div>

                {/* Infos utilisateur */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sofa-text-primary truncate">
                    {visiblePlayerData 
                      ? `${visiblePlayerData.firstName} ${visiblePlayerData.lastName}`
                      : userProfile?.fullName || user.email
                    }
                  </p>
                  <div className="flex items-center gap-2">
                    {visiblePlayerData && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sofa-green bg-opacity-10 text-sofa-green rounded text-xs font-medium">
                        <Activity className="w-3 h-3" />
                        Joueur
                      </span>
                    )}
                    {coachData && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        <Users className="w-3 h-3" />
                        Coach
                      </span>
                    )}
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sofa-blue bg-opacity-10 text-sofa-blue rounded text-xs font-medium">
                        <Settings className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-2 space-y-1">
              {/* Section Joueur si applicable */}
              {showPlayerSection && (
                <>
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-sofa-text-muted uppercase tracking-wider">
                      Espace Joueur
                    </p>
                  </div>
                  
                  <Link
                    href="/player/profile"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Mon Profil
                  </Link>

                  <Link
                    href="/player/matches"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Trophy className="w-4 h-4" />
                    Mes Matchs
                  </Link>

                  <Link
                    href="/player/stats"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Target className="w-4 h-4" />
                    Mes Stats
                  </Link>

                  <Link
                    href="/player/badges"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Award className="w-4 h-4" />
                    Badges
                  </Link>

                  <Link
                    href="/player/notifications"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Bell className="w-4 h-4" />
                    Notifications
                  </Link>
                </>
              )}

              {/* Section Coach si applicable */}
              {showCoachSection && (
                <>
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-sofa-text-muted uppercase tracking-wider">
                      Espace Coach
                    </p>
                  </div>

                  <Link
                    href="/coach"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Activity className="w-4 h-4" />
                    Tableau de bord
                  </Link>

                  <Link
                    href="/coach/team"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Users className="w-4 h-4" />
                    Mon équipe
                  </Link>

                  <Link
                    href="/coach/matches"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Trophy className="w-4 h-4" />
                    Matchs & compos
                  </Link>

                  <Link
                    href="/coach/stats"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Target className="w-4 h-4" />
                    Statistiques
                  </Link>

                  <div className="my-2 border-t border-sofa-border"></div>
                </>
              )}

              {/* Navigation */}
              <div className="my-2 border-t border-sofa-border"></div>
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-sofa-text-muted uppercase tracking-wider">
                  Navigation
                </p>
              </div>
              <Link
                href="/public"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <Home className="w-4 h-4" />
                Accueil Public
              </Link>

              {/* Toggle Buttons */}
              {(visiblePlayerData || coachData) && (
                <>
                  <div className="my-2 border-t border-sofa-border"></div>
                  {visiblePlayerData && !isOnPlayerArea && (
                    <Link
                      href="/player"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 rounded-lg transition-colors font-medium shadow-md"
                      onClick={() => setShowMenu(false)}
                    >
                      <Activity className="w-4 h-4" />
                      Basculer sur Joueur
                    </Link>
                  )}
                  {coachData && !isOnCoachArea && (
                    <Link
                      href="/coach"
                      className="mt-2 flex items-center gap-2 w-full px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-colors font-medium shadow-md"
                      onClick={() => setShowMenu(false)}
                    >
                      <Users className="w-4 h-4" />
                      Basculer sur Coach
                    </Link>
                  )}
                </>
              )}

              {!visiblePlayerData && (
                <Link
                  href="/public/fantasy"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  <Users className="w-4 h-4" />
                  Fantasy ✨
                </Link>
              )}

              {isAdmin && (
                <>
                  <div className="my-2 border-t border-sofa-border"></div>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-blue hover:bg-sofa-bg-hover rounded-lg transition-colors font-medium"
                    onClick={() => setShowMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Administration
                  </Link>
                </>
              )}
              
              <div className="my-2 border-t border-sofa-border"></div>
              
              <button
                onClick={() => {
                  logout()
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-red hover:bg-sofa-bg-hover rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button avec photo si joueur */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
        className="w-14 h-14 sofa-fab rounded-full flex items-center justify-center overflow-hidden"
      >
        {playerData && !showMenu ? (
          <div className="w-full h-full bg-gradient-to-br from-sofa-blue to-sofa-green flex items-center justify-center text-white text-xl font-bold">
            {playerData.photo ? (
              <img 
                src={playerData.photo} 
                alt={`${playerData.firstName} ${playerData.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              `${playerData.firstName[0]}${playerData.lastName[0]}`
            )}
          </div>
        ) : (
          <motion.div
            animate={{ rotate: showMenu ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {showMenu ? (
              <ChevronUp className="w-6 h-6 text-white" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </motion.div>
        )}
      </motion.button>
    </div>
  )
}
