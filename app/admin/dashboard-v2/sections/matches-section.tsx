"use client"

import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const MatchesTab = lazy(() => import('@/components/dashboard/tabs/matches-tab').then(mod => ({ default: mod.default })))

export default function MatchesSection() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <MatchesTab />
    </Suspense>
  )
}
