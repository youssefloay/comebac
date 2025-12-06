"use client"

import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Redirect to test matches page
export default function TestMatchesSection() {
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/test-matches'
  }
  
  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  )
}
