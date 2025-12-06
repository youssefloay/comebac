"use client"

import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const MiniLeagueTab = lazy(() => import('@/components/dashboard/tabs/mini-league-tab'))

export default function MiniLeagueSection() {
  return (
    <div className="p-6">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <MiniLeagueTab />
      </Suspense>
    </div>
  )
}
