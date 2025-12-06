"use client"

import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const ShopTab = lazy(() => import('@/components/dashboard/tabs/shop-tab').then(mod => ({ default: mod.default })))

export default function ShopSection() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ShopTab />
    </Suspense>
  )
}
