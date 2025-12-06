"use client"

import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Redirect to compare teams page
export default function CompareTeamsSection() {
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/compare-teams'
  }
  
  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  )
}
