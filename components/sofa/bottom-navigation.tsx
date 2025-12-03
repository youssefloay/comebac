"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { t, getLanguage } from "@/lib/i18n"
import { LanguageSelector } from "@/components/ui/language-selector"
import {
  Home,
  Trophy,
  Calendar,
  BarChart3,
  Users,
  MoreHorizontal,
  X,
  LogOut,
  LogIn,
  Settings,
  User,
  Gamepad2,
  Bell,
  Sparkles,
  Flame
} from "lucide-react"

// Main tabs (always visible) - will use i18n in component
const mainTabs = [
  { href: "/public", labelKey: "nav.home", icon: Home },
  { href: "/public/matches", labelKey: "nav.matches", icon: Calendar },
  { href: "/preseason", labelKey: "Preseason", icon: Flame },
  { href: "/public/teams", labelKey: "nav.teams", icon: Users },
]

// Secondary tabs (in the "More" menu)
const secondaryTabs = [
  { href: "/public/statistics", labelKey: "nav.stats", icon: BarChart3 },
  { href: "/public/fantasy", labelKey: "nav.fantasy", icon: Sparkles },
  { href: "/public/ranking", labelKey: "nav.ranking", icon: Trophy },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const { user, userProfile, logout, isAdmin } = useAuth()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [isPlayer, setIsPlayer] = useState(false)
  const [isCoach, setIsCoach] = useState(false)
  const [lang, setLang] = useState(getLanguage())

  // Check if we're on admin pages (keep French)
  const isAdminPage = pathname?.startsWith('/admin')
  
  // Force French for admin, use i18n for others
  const useTranslation = !isAdminPage

  const roleLabels: string[] = []
  if (isAdmin) roleLabels.push(useTranslation ? t('role.admin') : 'Admin')
  if (isCoach) roleLabels.push(useTranslation ? t('role.coach') : 'Coach')
  if (isPlayer) roleLabels.push(useTranslation ? t('role.player') : 'Joueur')
  if (!roleLabels.length) roleLabels.push(useTranslation ? t('role.user') : 'Utilisateur')
  
  // Update lang when it changes
  useEffect(() => {
    setLang(getLanguage())
  }, [])

  // Check if user is a player
  useEffect(() => {
    if (!user?.email) return
    
    const checkPlayer = async () => {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        
        const playerAccountsQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', user.email)
        )
        const playerAccountsSnap = await getDocs(playerAccountsQuery)
        const hasPlayerAccount = !playerAccountsSnap.empty
        const allowPlayerAccess = hasPlayerAccount && (!userProfile || (userProfile as any).role === 'player' || (userProfile as any).role === 'admin')
        setIsPlayer(allowPlayerAccess)
      } catch (error) {
        console.error('Error checking player status:', error)
      }
    }
    
    checkPlayer()
  }, [user, userProfile])

  // Check if user is a coach
  useEffect(() => {
    if (!user?.email) return

    const checkCoach = async () => {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')

        const coachQuery = query(
          collection(db, 'coachAccounts'),
          where('email', '==', user.email)
        )
        const coachSnap = await getDocs(coachQuery)
        setIsCoach(!coachSnap.empty)
      } catch (error) {
        console.error('Error checking coach status:', error)
      }
    }

    checkCoach()
  }, [user])

  // For non-authenticated users, show a simplified menu with login button
  if (!user) {
    return (
      <>
        {/* Main Navigation Tabs - Always visible */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg md:hidden">
          <div className="flex items-center justify-around h-16 px-2">
            {mainTabs.map((tab) => {
              const isActive = pathname === tab.href
              const Icon = tab.icon
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                    isActive 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[10px] font-semibold">{useTranslation ? t(tab.labelKey) : tab.labelKey}</span>
                </Link>
              )
            })}
            
            {/* Login Button in Navigation */}
            <Link
              href="/login"
              className="flex flex-col items-center justify-center flex-1 h-full text-green-600 dark:text-green-400"
            >
              <LogIn className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-semibold">{useTranslation ? t('Login') : 'Connexion'}</span>
            </Link>
          </div>
        </nav>
      </>
    )
  }

  return (
    <>
      {/* Bottom Navigation Bar - Modern 2025 */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white/95 via-white/90 to-white/95 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 safe-area-pb shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
        role="navigation"
        aria-label="Main mobile navigation"
      >
        <div className="flex items-center justify-around px-2 py-3">
          {/* Main Tabs - Modern 2025 */}
          {mainTabs.map((tab) => {
            const isActive = pathname === tab.href
            const Icon = tab.icon

            return (
              <motion.div
                key={tab.href}
                whileTap={{ scale: 0.95 }}
                className="flex-1 min-w-0"
              >
                <Link
                  href={tab.href}
                  className={`group flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all duration-300 relative ${
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={useTranslation ? t(tab.labelKey) : t(tab.labelKey)}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeBottomTab"
                      className={`absolute inset-0 rounded-2xl ${
                        tab.icon === Flame
                          ? 'bg-gradient-to-br from-orange-50 to-red-50/50 dark:from-orange-900/20 dark:to-red-800/10'
                          : 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10'
                      }`}
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                  <div className={`relative z-10 p-1.5 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? tab.icon === Flame 
                        ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30' 
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                      : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
                  }`}>
                    <Icon 
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive 
                          ? 'text-white scale-110' 
                          : tab.icon === Flame 
                            ? 'text-orange-500 group-hover:text-orange-600 group-hover:scale-110' 
                            : 'group-hover:scale-110'
                      }`} 
                      aria-hidden="true"
                    />
                  </div>
                  <span className={`text-[10px] font-semibold mt-1.5 transition-all duration-300 ${
                    isActive 
                      ? tab.icon === Flame 
                        ? 'text-orange-600 dark:text-orange-400' 
                        : 'text-blue-600 dark:text-blue-400'
                      : ''
                  }`}>
                    {useTranslation ? t(tab.labelKey) : t(tab.labelKey)}
                  </span>
                </Link>
              </motion.div>
            )
          })}

          {/* More Button - Modern 2025 */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex-1 min-w-0"
          >
            <button
              onClick={() => setShowMoreMenu(true)}
              className={`group flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all duration-300 relative w-full ${
                secondaryTabs.some(tab => pathname === tab.href)
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              aria-label="Open additional menu"
              aria-expanded={showMoreMenu}
            >
              {secondaryTabs.some(tab => pathname === tab.href) && (
                <motion.div
                  layoutId="activeBottomTab"
                  className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-2xl"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
              <div className={`relative z-10 p-1.5 rounded-xl transition-all duration-300 ${
                secondaryTabs.some(tab => pathname === tab.href)
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30'
                  : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
              }`}>
                <MoreHorizontal className={`w-5 h-5 transition-all duration-300 ${
                  secondaryTabs.some(tab => pathname === tab.href) ? 'text-white scale-110' : 'group-hover:scale-110'
                }`} aria-hidden="true" />
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 transition-all duration-300 ${
                secondaryTabs.some(tab => pathname === tab.href) ? 'text-purple-600 dark:text-purple-400' : ''
              }`}>
                {useTranslation ? t('nav.more') : 'Plus'}
              </span>
            </button>
          </motion.div>
        </div>
      </nav>

      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowMoreMenu(false)}
            />

            {/* Menu Content - Modern 2025 */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto border-t border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
            >
              {/* Header - Modern 2025 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50">
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {useTranslation ? t('nav.menu') : 'Menu'}
                </h3>
                <motion.button
                  onClick={() => setShowMoreMenu(false)}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </div>

              {/* User Info - Modern 2025 */}
              <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-purple-900/20 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 dark:text-white truncate text-base">
                      {userProfile?.fullName || user.email}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      @{userProfile?.username || "user"} • {roleLabels.join(' / ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Items - Modern 2025 */}
              <div className="p-4">
                <div className="space-y-2 mb-6">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                    {useTranslation ? t('nav.navigation') : 'Navigation'}
                  </div>
                  {secondaryTabs.map((tab) => {
                    const isActive = pathname === tab.href
                    const Icon = tab.icon

                    return (
                      <motion.div
                        key={tab.href}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href={tab.href}
                          onClick={() => setShowMoreMenu(false)}
                          className={`group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 shadow-sm' 
                              : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className={`p-2 rounded-xl transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg' 
                              : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                          }`}>
                            <Icon className={`w-5 h-5 transition-all duration-300 ${
                              isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                            }`} />
                          </div>
                          <span className="font-semibold flex-1">
                            {useTranslation ? t(tab.labelKey) : t(tab.labelKey)}
                          </span>
                          {isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
                            />
                          )}
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Player Toggle Button - Modern 2025 */}
                {isPlayer && (
                  <motion.div 
                    className="mb-6"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href="/player"
                      onClick={() => setShowMoreMenu(false)}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 text-white hover:from-purple-700 hover:via-purple-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl group"
                    >
                      <div className="p-2 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <span className="font-bold">
                        {useTranslation ? t('nav.switchToPlayer') : 'Basculer sur Joueur'}
                      </span>
                    </Link>
                  </motion.div>
                )}

                {/* Coach Toggle Button - Modern 2025 */}
                {isCoach && (
                  <motion.div 
                    className="mb-6"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href="/coach"
                      onClick={() => setShowMoreMenu(false)}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-indigo-600 text-white hover:from-blue-700 hover:via-indigo-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl group"
                    >
                      <div className="p-2 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="font-bold">
                        {useTranslation ? t('nav.switchToCoach') : 'Basculer sur Coach'}
                      </span>
                    </Link>
                  </motion.div>
                )}

                {/* Admin Section - Modern 2025 */}
                {isAdmin && (
                  <div className="space-y-2 mb-6">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                      {useTranslation ? t('nav.administration') : 'Administration'}
                    </div>
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Link
                        href="/admin"
                        onClick={() => setShowMoreMenu(false)}
                        className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 text-gray-700 dark:text-gray-300 transition-all"
                      >
                        <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                          <Settings className="w-5 h-5" />
                        </div>
                        <span className="font-semibold">
                          {useTranslation ? t('nav.adminPanel') : 'Panneau Admin'}
                        </span>
                      </Link>
                    </motion.div>
                  </div>
                )}

                {/* Social Links - Modern 2025 */}
                <div className="space-y-2 mb-6">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                    {useTranslation ? t('nav.followUs') : 'Suivez-nous'}
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <motion.a
                      href="https://www.instagram.com/comebac.league/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowMoreMenu(false)}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-2xl border border-pink-200 dark:border-pink-800/50 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/30 dark:hover:to-rose-900/30 transition-all text-pink-600 dark:text-pink-400 shadow-sm hover:shadow-md"
                      aria-label="Instagram comebac"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm6.406-1.683c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </motion.a>
                    <motion.a
                      href="https://www.tiktok.com/@comebac_leaguee"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowMoreMenu(false)}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all text-gray-900 dark:text-gray-200 shadow-sm hover:shadow-md"
                      aria-label="TikTok comebac"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M21 9.31c-1.56 0-3.04-.5-4.24-1.35v6.03c0 4.33-3.51 8.01-7.81 8.01C4.65 22 1 18.32 1 13.99c0-4.34 3.65-8.01 7.95-8.01.24 0 .48.01.72.03V9.6a4.27 4.27 0 0 0-.72-.06c-2.3 0-4.17 1.89-4.17 4.2 0 2.29 1.87 4.16 4.17 4.16 2.29 0 4.16-1.87 4.16-4.16V2h3.35c.14 1.74 1.16 3.26 2.71 4 .65.31 1.37.48 2.13.48v2.83z" />
                      </svg>
                    </motion.a>
                    <motion.button
                      onClick={() => window.location.href = 'mailto:contact@comebac.com'}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md"
                      aria-label="Email contact"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Quick Actions - Modern 2025 */}
                <div className="space-y-2 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 mb-4">
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 text-gray-700 dark:text-gray-300 transition-all w-full"
                  >
                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800">
                      <NotificationBell />
                    </div>
                    <span className="font-semibold">
                      {useTranslation ? t('notifications.title') : 'Notifications'}
                    </span>
                  </motion.div>
                  <LanguageSelector />
                </div>

                {/* Actions - Modern 2025 */}
                <div className="space-y-2 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                  <motion.button
                    onClick={() => {
                      logout()
                      setShowMoreMenu(false)
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 dark:hover:from-red-900/20 dark:hover:to-red-800/20 text-red-600 dark:text-red-400 transition-all w-full text-left border border-red-200/50 dark:border-red-800/50"
                  >
                    <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">
                      {useTranslation ? t('nav.logout') : 'Se déconnecter'}
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Safe Area Bottom */}
              <div className="h-8 bg-gradient-to-b from-white to-transparent dark:from-gray-900" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for bottom navigation */}
      <div className="h-20" />
    </>
  )
}
