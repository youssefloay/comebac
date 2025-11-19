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
  Settings,
  User,
  Gamepad2,
  Bell,
  Sparkles
} from "lucide-react"

// Main tabs (always visible) - will use i18n in component
const mainTabs = [
  { href: "/public", labelKey: "nav.home", icon: Home },
  { href: "/public/matches", labelKey: "nav.matches", icon: Calendar },
  { href: "/public/ranking", labelKey: "nav.ranking", icon: Trophy },
  { href: "/public/teams", labelKey: "nav.teams", icon: Users },
]

// Secondary tabs (in the "More" menu)
const secondaryTabs = [
  { href: "/public/statistics", labelKey: "nav.stats", icon: BarChart3 },
  { href: "/public/fantasy", labelKey: "nav.fantasy", icon: Sparkles },
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

  if (!user) return null

  return (
    <>
      {/* Bottom Navigation Bar - Improved */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border-t border-sofa-border safe-area-pb shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        role="navigation"
        aria-label="Main mobile navigation"
      >
        <div className="flex items-center justify-around px-1 py-2">
          {/* Main Tabs - Improved accessibility */}
          {mainTabs.map((tab) => {
            const isActive = pathname === tab.href
            const Icon = tab.icon

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0 flex-1 relative ${
                  isActive 
                    ? 'text-sofa-text-accent bg-sofa-text-accent/10' 
                    : 'text-sofa-text-muted hover:text-sofa-text-primary hover:bg-sofa-bg-hover'
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={useTranslation ? t(tab.labelKey) : t(tab.labelKey)}
              >
                <Icon 
                  className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''} transition-transform`} 
                  aria-hidden="true"
                />
                <span className="text-xs font-medium truncate">
                  {useTranslation ? t(tab.labelKey) : t(tab.labelKey)}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeBottomTab"
                    className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-sofa-text-accent rounded-full"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            )
          })}

          {/* More Button - Improved */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0 flex-1 relative ${
              secondaryTabs.some(tab => pathname === tab.href)
                ? 'text-sofa-text-accent bg-sofa-text-accent/10'
                : 'text-sofa-text-muted hover:text-sofa-text-primary hover:bg-sofa-bg-hover'
            }`}
            aria-label="Open additional menu"
            aria-expanded={showMoreMenu}
          >
            <MoreHorizontal className="w-5 h-5 mb-1" aria-hidden="true" />
            <span className="text-xs font-medium">
              {useTranslation ? t('nav.more') : 'Plus'}
            </span>
            {secondaryTabs.some(tab => pathname === tab.href) && (
              <motion.div
                layoutId="activeBottomTab"
                className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-sofa-text-accent rounded-full"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </button>
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

            {/* Menu Content */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  {useTranslation ? t('nav.menu') : 'Menu'}
                </h3>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Info */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {userProfile?.fullName || user.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      @{userProfile?.username || "user"} • {roleLabels.join(' / ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-4">
                <div className="space-y-2 mb-6">
                  <div className="text-sm font-medium text-gray-500 px-3 py-2">
                    {useTranslation ? t('nav.navigation') : 'Navigation'}
                  </div>
                  {secondaryTabs.map((tab) => {
                    const isActive = pathname === tab.href
                    const Icon = tab.icon

                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        onClick={() => setShowMoreMenu(false)}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">
                          {useTranslation ? t(tab.labelKey) : t(tab.labelKey)}
                        </span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-green-600 rounded-full" />
                        )}
                      </Link>
                    )
                  })}
                </div>

                {/* Player Toggle Button */}
                {isPlayer && (
                  <div className="mb-6">
                    <Link
                      href="/player"
                      onClick={() => setShowMoreMenu(false)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
                    >
                      <Gamepad2 className="w-5 h-5" />
                      <span className="font-semibold">
                        {useTranslation ? t('nav.switchToPlayer') : 'Basculer sur Joueur'}
                      </span>
                    </Link>
                  </div>
                )}

                {/* Coach Toggle Button */}
                {isCoach && (
                  <div className="mb-6">
                    <Link
                      href="/coach"
                      onClick={() => setShowMoreMenu(false)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                    >
                      <Users className="w-5 h-5" />
                      <span className="font-semibold">
                        {useTranslation ? t('nav.switchToCoach') : 'Basculer sur Coach'}
                      </span>
                    </Link>
                  </div>
                )}

                {/* Admin Section */}
                {isAdmin && (
                  <div className="space-y-2 mb-6">
                    <div className="text-sm font-medium text-gray-500 px-3 py-2">
                      {useTranslation ? t('nav.administration') : 'Administration'}
                    </div>
                    <Link
                      href="/admin"
                      onClick={() => setShowMoreMenu(false)}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-all"
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-medium">
                        {useTranslation ? t('nav.adminPanel') : 'Panneau Admin'}
                      </span>
                    </Link>
                  </div>
                )}

                {/* Social Links */}
                <div className="space-y-2 mb-6">
                  <div className="text-sm font-medium text-gray-500 px-3 py-2">
                    {useTranslation ? t('nav.followUs') : 'Suivez-nous'}
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <a
                      href="https://www.instagram.com/comebac.league/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowMoreMenu(false)}
                      className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition text-pink-500"
                      aria-label="Instagram comebac"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm6.406-1.683c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    <a
                      href="https://www.tiktok.com/@comebac_leaguee"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowMoreMenu(false)}
                      className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition text-black"
                      aria-label="TikTok comebac"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M21 9.31c-1.56 0-3.04-.5-4.24-1.35v6.03c0 4.33-3.51 8.01-7.81 8.01C4.65 22 1 18.32 1 13.99c0-4.34 3.65-8.01 7.95-8.01.24 0 .48.01.72.03V9.6a4.27 4.27 0 0 0-.72-.06c-2.3 0-4.17 1.89-4.17 4.2 0 2.29 1.87 4.16 4.17 4.16 2.29 0 4.16-1.87 4.16-4.16V2h3.35c.14 1.74 1.16 3.26 2.71 4 .65.31 1.37.48 2.13.48v2.83z" />
                      </svg>
                    </a>
                    <button
                      onClick={() => window.location.href = 'mailto:contact@comebac.com'}
                      className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition text-gray-700"
                      aria-label="Email contact"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2 pt-4 border-t border-gray-100 mb-4">
                  <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-all w-full">
                    <NotificationBell />
                    <span className="font-medium">
                      {useTranslation ? t('notifications.title') : 'Notifications'}
                    </span>
                  </div>
                  <LanguageSelector />
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      logout()
                      setShowMoreMenu(false)
                    }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-all w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">
                      {useTranslation ? t('nav.logout') : 'Se déconnecter'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Safe Area Bottom */}
              <div className="h-8 bg-white" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for bottom navigation */}
      <div className="h-20" />
    </>
  )
}
