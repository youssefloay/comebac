"use client"

import type React from "react"
import { SofaNavigation } from '@/components/sofa/navigation'
import { UserMenuFAB } from '@/components/sofa/user-menu-fab'
import '@/styles/sofascore-theme.css'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sofa-theme">
      <SofaNavigation />
      <main className="min-h-screen">
        {children}
      </main>
      <UserMenuFAB />
    </div>
  )
}
