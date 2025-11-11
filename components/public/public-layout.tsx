"use client"

import type React from "react"
import { SofaNavigation } from '@/components/sofa/navigation'
import { BottomNavigation } from '@/components/sofa/bottom-navigation'
import { UserMenuFAB } from '@/components/sofa/user-menu-fab'
import { SimpleLogo } from '@/components/ui/logo'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import '@/styles/sofascore-theme.css'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

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
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3">
            <SimpleLogo 
              className="w-8 h-8 object-contain rounded"
              alt="ComeBac League"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">ComeBac League</h1>
            </div>
          </div>
        </div>
      </div>

      <main className="min-h-screen pb-20 md:pb-0 w-full overflow-x-hidden">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
      
      {/* User Menu FAB - Available on all screen sizes */}
      <UserMenuFAB />
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  )
}
