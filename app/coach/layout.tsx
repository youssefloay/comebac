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
  Users, 
  LogOut, 
  Menu, 
  X,
  CheckCircle,
  Home,
  Clipboard,
  BarChart3,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { NotificationBell } from '@/components/notifications/notification-bell'

interface CoachData {
  id: string
  firstName: string
  lastName: string
  teamId: string
  teamName?: string
  photo?: string
}

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [coachData, setCoachData] = useState<CoachData | null>(null)
  const [loadingCoach, setLoadingCoach] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      }
      // Les admins peuvent accéder à l'espace coach
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadCoachData = async () => {
      if (!user?.email && !isAdmin) return

      try {
        // Vérifier si on est en mode impersonation
        const impersonateCoachId = sessionStorage.getItem('impersonateCoachId')
        
        if (isAdmin && impersonateCoachId) {
          // Charger les données du coach impersonné
          const coachDocRef = doc(db, 'coachAccounts', impersonateCoachId)
          const coachDocSnap = await getDoc(coachDocRef)
          if (coachDocSnap.exists()) {
            const data = coachDocSnap.data()
            setCoachData({
              id: coachDocSnap.id,
              firstName: data.firstName,
              lastName: data.lastName,
              teamId: data.teamId,
              teamName: data.teamName,
              photo: data.photo
            })
          }
          setLoadingCoach(false)
          return
        }

        // Si c'est un admin sans impersonation, utiliser des données de démo
        if (isAdmin) {
          setCoachData({
            id: 'admin',
            firstName: 'Admin',
            lastName: 'Comebac',
            teamId: 'demo',
            teamName: 'Équipe Demo',
            photo: ''
          })
          setLoadingCoach(false)
          return
        }

        const coachAccountsQuery = query(
          collection(db, 'coachAccounts'),
          where('email', '==', user?.email || '')
        )
        const coachAccountsSnap = await getDocs(coachAccountsQuery)

        if (!coachAccountsSnap.empty) {
          const coachDoc = coachAccountsSnap.docs[0]
          const data = coachDoc.data()
          
          setCoachData({
            id: coachDoc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            teamId: data.teamId,
            teamName: data.teamName,
            photo: data.photo
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données entraîneur:', error)
      } finally {
        setLoadingCoach(false)
      }
    }

    loadCoachData()
  }, [user, isAdmin])


  if (loading || loadingCoach) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !coachData) {
    return null
  }

  const navItems = [
    { href: '/coach', icon: Home, label: 'Tableau de bord' },
    { href: '/coach/team', icon: Users, label: 'Équipe' },
    { href: '/coach/lineups', icon: Clipboard, label: 'Compositions' },
    { href: '/coach/matches', icon: Calendar, label: 'Matchs' }
  ]

  const extraMenuItems = [
    { href: '/coach/ranking', icon: Trophy, label: 'Classement' },
    { href: '/coach/stats', icon: BarChart3, label: 'Statistiques' }
  ]

  const menuItems = [...navItems, ...extraMenuItems]

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
                      <p className="font-semibold text-sofa-text-primary">{coachData.firstName} {coachData.lastName}</p>
                      <p className="text-xs text-sofa-text-muted">{coachData.teamName}</p>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-full hover:bg-sofa-bg-hover transition"
                    >
                      <X className="w-4 h-4 text-sofa-text-muted" />
                    </button>
                  </div>

                    <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                    {menuItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      const isInBar = navItems.some(tab => tab.href === item.href)
                      if (isInBar) return null
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                            isActive
                              ? 'bg-sofa-bg-hover text-sofa-text-primary'
                              : 'text-sofa-text-secondary hover:bg-sofa-bg-hover'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      )
                    })}

                    <Link
                      href="/public"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                    >
                      <Home className="w-4 h-4" />
                      <span className="font-medium">Basculer sur Public</span>
                    </Link>
                  </div>

                  <div className="p-4 border-t border-sofa-border">
                    {isAdmin && sessionStorage.getItem('impersonateCoachId') ? (
                      <button
                        onClick={() => {
                          sessionStorage.removeItem('impersonateCoachId')
                          sessionStorage.removeItem('impersonateCoachName')
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
          {/* Coach Info */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white text-2xl font-bold">
                  {coachData.photo ? (
                    <img 
                      src={coachData.photo} 
                      alt={`${coachData.firstName} ${coachData.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    `${coachData.firstName[0]}${coachData.lastName[0]}`
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-600 rounded-full flex items-center justify-center text-white border-2 border-white">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {coachData.firstName} {coachData.lastName}
                </h3>
                <p className="text-sm text-gray-600">Entraîneur</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg mb-2">
              <CheckCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Entraîneur vérifié</span>
            </div>
            {coachData.teamName && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{coachData.teamName}</span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="space-y-1 mb-6">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

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
          {isAdmin && sessionStorage.getItem('impersonateCoachId') && (
            <div className="mb-4">
              <button
                onClick={() => {
                  sessionStorage.removeItem('impersonateCoachId')
                  sessionStorage.removeItem('impersonateCoachName')
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
    </div>
  )
}
