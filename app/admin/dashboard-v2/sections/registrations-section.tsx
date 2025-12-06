"use client"

import { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useRouter } from 'next/navigation'

export default function RegistrationsSection() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Redirect to the dedicated registrations page
    setLoading(true)
    router.push('/admin/team-registrations')
  }, [router])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Redirecting to Team Registrations page...
        </p>
      </div>
    </div>
  )
}
