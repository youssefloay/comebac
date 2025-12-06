"use client"

import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const AccountsTab = lazy(() => import('@/components/dashboard/tabs/accounts-tab').then(mod => ({ default: mod.default })))

export default function AccountsSection() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <AccountsTab />
    </Suspense>
  )
}
