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
  Bell, 
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

  const menuItems = [
    { href: '/coach', icon: Home, label: 'Tableau de bord' },
    { href: '/coach/team', icon: Users, label: 'Mon Équipe' },
    { href: '/coach/ranking', icon: Trophy, label: 'Classement' },
    { href: '/coach/lineups', icon: Clipboard, label: 'Compositions' },
    { href: '/coach/matches', icon: Calendar, label: 'Matchs' },
    { href: '/coach/stats', icon: BarChart3, label: 'Statistiques' },
    { href: '/coach/notifications', icon: Bell, label: 'Notifications' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around px-2 py-3">
          {menuItems.slice(0, 4).map((item) => {
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

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-80 bg-white shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>

                {/* Coach Info */}
                <div className="mb-6 pt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white text-xl font-bold">
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
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs border-2 border-white">
                        <Trophy className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        {coachData.firstName} {coachData.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">Entraîneur</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Entraîneur vérifié</span>
                  </div>
                  {coachData.teamName && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">{coachData.teamName}</span>
                    </div>
                  )}
                </div>

                {/* All Menu Items */}
                <nav className="space-y-1 mb-4">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
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

                <div className="my-4 border-t border-gray-200"></div>

                {/* Toggle Button */}
                <div className="mb-4">
                  <Link
                    href="/public"
                    onClick={() => setMobileMenuOpen(false)}
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
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Déconnexion</span>
                  </button>
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
