"use client"

import { useState } from 'react'
import CustomNotificationModal from '@/components/admin/CustomNotificationModal'
import { Bell, Send, Users, Mail } from 'lucide-react'

export default function NotificationsSection() {
  const [showModal, setShowModal] = useState(false)

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
        <p className="text-gray-600 dark:text-gray-400">
          Notification history and tracking will be displayed here.
        </p>
        <button
          onClick={() => window.location.href = '/admin/notification-tracking'}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          View Notification Tracking
        </button>
      </div>

      {showModal && (
        <CustomNotificationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
