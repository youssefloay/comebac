"use client"

import type React from "react"
import Link from 'next/link'
import { motion } from "framer-motion"
import { SofaNavigation } from '@/components/sofa/navigation'
import { BottomNavigation } from '@/components/sofa/bottom-navigation'
import { UserMenuFAB } from '@/components/sofa/user-menu-fab'
import { SimpleLogo } from '@/components/ui/logo'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { NotificationPromptPopup } from '@/components/notifications/notification-prompt-popup'
import { FantasyButton } from '@/components/fantasy/fantasy-button'
import { PageTracker } from '@/components/analytics/page-tracker'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { LanguageSelector } from '@/components/ui/language-selector'
import { ConsentBanner } from '@/components/ads/ConsentBanner'
import { usePathname } from 'next/navigation'
import '@/styles/sofascore-theme.css'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  if (loading) {
    return (
      <div className="sofa-theme min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Permettre l'accès même sans authentification - version publique en lecture seule

  return (
    <div className="sofa-theme">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <SofaNavigation />
      </div>
      
      {/* Mobile Header - Modern 2025 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white/95 via-white/95 to-white/95 dark:from-gray-900/95 dark:via-gray-900/95 dark:to-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between">
            <Link href="/public" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <SimpleLogo 
                  className="w-8 h-8 object-contain"
                  alt="ComeBac League"
                />
              </motion.div>
              <div>
                <h1 className="text-sm font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                  ComeBac League
                </h1>
              </div>
            </Link>
            
            <div className="flex items-center gap-1.5">
              {/* Language Selector - Only for non-admin pages */}
              {!isAdminPage && <LanguageSelector />}
              
              {/* Fantasy Button */}
              <FantasyButton href="/public/fantasy" page="header" />
              
              {/* Theme Toggle - Modern 2025 */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  const html = document.documentElement
                  const isDark = html.classList.contains('dark')
                  if (isDark) {
                    html.classList.remove('dark')
                    localStorage.setItem('theme', 'light')
                  } else {
                    html.classList.add('dark')
                    localStorage.setItem('theme', 'dark')
                  }
                }}
                className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all"
              >
                <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </motion.button>
              
              {/* Login Button - Only if user is not logged in */}
              {!user && (
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Connexion
                  </motion.button>
                </Link>
              )}
              
              {/* Notification Dropdown - Only if user is logged in */}
              {user && <NotificationDropdown />}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed headers */}
      <div className="h-14 md:h-16"></div>
      
      <main className="min-h-screen pb-20 md:pb-0 w-full overflow-x-hidden">
        {children}
      </main>
      
      {/* Footer Modern 2025 */}
      <footer className="relative mt-12 sm:mt-16 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/50 dark:from-gray-900/50 dark:via-gray-900 dark:to-gray-900/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/public/privacy" 
                className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium px-3 py-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 transition-all shadow-sm hover:shadow-md"
              >
                Politique de confidentialité
              </Link>
            </motion.div>
            <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-600">•</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                localStorage.removeItem('cookie-consent')
                localStorage.removeItem('cookie-consent-date')
                window.location.reload()
              }}
              className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium px-3 py-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 transition-all shadow-sm hover:shadow-md"
            >
              Gérer les cookies
            </motion.button>
          </div>
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
              © {new Date().getFullYear()} ComeBac League. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
      
      {/* User Menu FAB - Available on all screen sizes */}
      <UserMenuFAB />
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
      
      {/* Notification Prompt Popup */}
      <NotificationPromptPopup />
      
      {/* Page Analytics Tracker */}
      <PageTracker />
      
      {/* Consent Banner */}
      <ConsentBanner />
    </div>
  )
}
