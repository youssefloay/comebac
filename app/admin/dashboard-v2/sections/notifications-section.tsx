"use client"

import { useState, useEffect, lazy, Suspense } from 'react'
import { Bell, Send, Users, Mail } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Lazy load the modal component
const CustomNotificationModal = lazy(() => 
  import('@/components/admin/CustomNotificationModal').then(mod => ({ default: mod.default }))
)

export default function NotificationsSection() {
  const [showModal, setShowModal] = useState(false)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      const res = await fetch('/api/admin/teams')
      if (res.ok) {
        const data = await res.json()
        setTeams(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error loading teams:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send Custom Notification
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send to Users</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Send custom notifications to specific users or groups.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Open Notification Modal
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Notifications</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Send emails to users who haven't logged in or need updates.
          </p>
          <button
            onClick={() => window.location.href = '/admin'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go to Email Tools
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification History</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          View notification history and tracking.
        </p>
        <button
          onClick={() => window.location.href = '/admin/notification-tracking'}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          View Notification Tracking
        </button>
      </div>

      {showModal && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <CustomNotificationModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            teams={teams}
          />
        </Suspense>
      )}
    </div>
  )
}
