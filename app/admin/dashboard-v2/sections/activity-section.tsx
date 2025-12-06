"use client"

import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const ActivityTab = lazy(() => import('@/components/dashboard/tabs/activity-tab').then(mod => ({ default: mod.default })))

export default function ActivitySection() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ActivityTab />
    </Suspense>
  )
}
