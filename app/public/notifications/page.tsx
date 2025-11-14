"use client"

import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  created_at: string
  read: boolean
}

export default function PublicNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [showPermissionBanner, setShowPermissionBanner] = useState(false)

  useEffect(() => {
    fetchNotifications()
    checkNotificationPermission()
  }, [])

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission === 'default') {
        setShowPermissionBanner(true)
      }
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      setShowPermissionBanner(false)
      
      if (permission === 'granted') {
        console.log('Notifications activées')
      }
    }
  }

  const fetchNotifications = async () => {
    try {
      const { auth } = await import('@/lib/firebase')
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        setLoading(false)
        return
      }

      const response = await fetch(`/api/notifications?userId=${currentUser.uid}`)
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { auth } = await import('@/lib/firebase')
      const currentUser = auth.currentUser
      
      if (!currentUser) return

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, userId: currentUser.uid })
      })

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ))
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return 'À l\'instant'
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`
    if (diffInDays === 1) return 'Hier'
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`
    return date.toLocaleDateString('fr-FR')
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />
      default:
        return <Bell className="w-6 h-6 text-gray-600" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            Notifications
          </h1>
          <p className="text-gray-600">
            Restez informé des dernières actualités de la ligue
          </p>
        </div>

        {/* Permission Banner */}
        {showPermissionBanner && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-md">
            <div className="flex items-start gap-4">
              <Bell className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">
                  Activer les notifications
                </h3>
                <p className="text-gray-700 mb-4">
                  Recevez des alertes en temps réel pour les matchs, résultats et actualités de la ligue.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={requestNotificationPermission}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Activer les notifications
                  </button>
                  <button
                    onClick={() => setShowPermissionBanner(false)}
                    className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Status */}
        {notificationPermission === 'denied' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 text-sm">
                Les notifications sont bloquées. Activez-les dans les paramètres de votre navigateur.
              </p>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 rounded-lg shadow-md border ${getBgColor(notification.type)} ${
                !notification.read ? 'border-l-4' : ''
              } cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{notification.title}</h3>
                    {!notification.read && (
                      <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{notification.message}</p>
                  <p className="text-sm text-gray-500">{getTimeAgo(notification.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-md border border-gray-200 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune notification</p>
            <p className="text-gray-400 text-sm mt-2">
              Vous serez notifié des événements importants ici
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
