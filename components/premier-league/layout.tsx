"use client"

import type React from "react"
import { PremierLeagueNavigation } from './navigation'
import { PremierLeagueUserFAB } from './user-fab'
import { PremierLeagueFloatingMenu } from './floating-menu'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import '@/styles/premier-league-theme.css'

export default function PremierLeagueLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="premier-league-theme min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="premier-league-theme min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-pl-text-primary">Accès Restreint</h2>
          <p className="text-pl-text-secondary mb-6">Vous devez être connecté pour accéder à cette page.</p>
          <a href="/login" className="pl-btn pl-btn-primary">
            Se Connecter
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="premier-league-theme">
      <PremierLeagueNavigation />
      <main className="min-h-screen">
        {children}
      </main>
      <PremierLeagueFloatingMenu />
      <PremierLeagueUserFAB />
    </div>
  )
}