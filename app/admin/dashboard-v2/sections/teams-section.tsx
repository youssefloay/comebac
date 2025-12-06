"use client"

import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Lazy load the TeamsTab component
const TeamsTab = lazy(() => import('@/components/dashboard/tabs/teams-tab').then(mod => ({ default: mod.default })))

export default function TeamsSection() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <TeamsTab />
    </Suspense>
  )
}
