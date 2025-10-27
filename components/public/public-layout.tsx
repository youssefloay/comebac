"use client"

import type React from "react"
import { SofaNavigation } from '@/components/sofa/navigation'
import { UserMenuFAB } from '@/components/sofa/user-menu-fab'
import { FloatingMenu } from '@/components/sofa/floating-menu'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
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
      </div>
    )
  }

  return (
    <div className="sofa-theme">
      <SofaNavigation />
      <main className="min-h-screen">
        {children}
      </main>
      <FloatingMenu />
      <UserMenuFAB />
    </div>
  )
}
