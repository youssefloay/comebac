"use client"

import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const ResultsTab = lazy(() => import('@/components/dashboard/tabs/results-tab').then(mod => ({ default: mod.default })))

export default function ResultsSection() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ResultsTab />
    </Suspense>
  )
}
