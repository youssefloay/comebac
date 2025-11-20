"use client"

import type React from "react"
import Link from 'next/link'
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

  if (!user) {
    return (
      <div className="sofa-theme min-h-screen flex items-center justify-center">
        <div className="text-center text-sofa-text-primary">
          <h2 className="text-2xl font-bold mb-4">Accès Restreint</h2>
          <p className="text-sofa-text-secondary mb-6">Vous devez être connecté pour accéder à cette page.</p>
          <a href="/login" className="sofa-btn">
            Se Connecter
          </a>
        </div>
        {/* User Menu FAB - Shows login button for non-authenticated users */}
        <UserMenuFAB />
      </div>
    )
  }

  return (
    <div className="sofa-theme">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <SofaNavigation />
      </div>
      
      {/* Mobile Header - Simplified */}
      <div className="md:hidden px-4 py-3 shadow-sm" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SimpleLogo 
              className="w-8 h-8 object-contain rounded"
              alt="ComeBac League"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">ComeBac League</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Language Selector - Only for non-admin pages */}
            {!isAdminPage && <LanguageSelector />}
            
            {/* Fantasy Button */}
            <FantasyButton href="/public/fantasy" page="header" />
            
            {/* Theme Toggle */}
            <button
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
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            
            {/* Notification Dropdown */}
            <NotificationDropdown />
          </div>
        </div>
      </div>

      {/* Spacer for fixed headers */}
      <div className="h-16"></div>
      
      <main className="min-h-screen pb-20 md:pb-0 w-full overflow-x-hidden">
        {children}
      </main>
      
      {/* Footer discret */}
      <footer className="py-4 px-4 border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Link 
            href="/public/privacy" 
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Politique de confidentialité
          </Link>
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
    </div>
  )
}
