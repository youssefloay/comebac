"use client"

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NotificationItem {
  id: string
  title?: string
  message?: string
  createdAt?: any
  read?: boolean
  actionUrl?: string
}

export function NotificationBell() {
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user || !mounted) return

    const loadNotifications = async () => {
      try {
        const { auth } = await import('@/lib/firebase')
        const currentUser = auth.currentUser
        if (!currentUser) return

        const response = await fetch(`/api/notifications?userId=${currentUser.uid}`)
        const data = await response.json()

        if (data.success) {
          setNotifications(data.notifications || [])
          setUnreadCount((data.notifications || []).filter((n: NotificationItem) => !n.read).length)
        }
      } catch (error) {
        console.error('Erreur chargement notifications:', error)
      }
    }

    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [user, mounted])

  const getNotificationLink = () => {
    if (typeof window === 'undefined') return '/public/notifications'
    const path = window.location.pathname
    if (path.startsWith('/coach')) return '/coach/notifications'
    if (path.startsWith('/player')) return '/player/notifications'
    return '/public/notifications'
  }

  const formatDate = (dateValue: any): string | null => {
    if (!dateValue) return null
    
    try {
      // Si c'est un objet Firestore Timestamp avec _seconds et _nanoseconds (sérialisé)
      if (typeof dateValue === 'object' && '_seconds' in dateValue) {
        const timestamp = dateValue._seconds * 1000 + (dateValue._nanoseconds || 0) / 1000000
        return new Date(timestamp).toLocaleString('fr-FR')
      }
      
      // Si c'est un objet Firestore Timestamp avec méthode toDate()
      if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleString('fr-FR')
      }
      
      // Si c'est déjà une string ISO
      if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleString('fr-FR')
      }
      
      // Si c'est une Date
      if (dateValue instanceof Date) {
        return dateValue.toLocaleString('fr-FR')
      }
      
      return null
    } catch (error) {
      console.error('Erreur formatage date:', error)
      return null
    }
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      // Marquer comme lue si ce n'est pas déjà fait
      if (!notification.read && user) {
        try {
          const { auth } = await import('@/lib/firebase')
          const currentUser = auth.currentUser
          if (currentUser) {
            await fetch('/api/notifications', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                notificationId: notification.id, 
                userId: currentUser.uid 
              })
            })
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour:', error)
        }
      }

      // Fermer le dropdown
      setOpen(false)

      // Rediriger vers actionUrl si présent, sinon vers la page des notifications
      if (notification.actionUrl) {
        router.push(notification.actionUrl)
      } else {
        router.push(getNotificationLink())
      }
    } catch (error) {
      console.error('Erreur lors du clic sur la notification:', error)
      // En cas d'erreur, rediriger vers la page des notifications
      setOpen(false)
      router.push(getNotificationLink())
    }
  }

  const preview = notifications
    .filter(n => !n.read)
    .slice(0, 3)
    .map((notif) => ({
      id: notif.id,
      title: notif.title || 'Notification',
      message: notif.message || '',
      date: formatDate((notif as any).created_at || notif.createdAt),
      actionUrl: notif.actionUrl
    }))

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="relative flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 flex-shrink-0" />
        {user && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 uppercase">Notifications</p>
                <p className="text-lg font-semibold text-gray-900">
                  {unreadCount > 0 ? `${unreadCount} à lire` : 'Aucune notification'}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {preview.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400 text-sm">
                  <Bell className="w-8 h-8 mb-3" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                preview.map((notif) => {
                  const notification = notifications.find(n => n.id === notif.id)
                  return (
                    <div 
                      key={notif.id || notif.title} 
                      className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => notification && handleNotificationClick(notification)}
                    >
                      <p className="font-semibold text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notif.message || 'Consulte la page notifications pour plus de détails.'}
                      </p>
                      {notif.date && (
                        <p className="text-xs text-gray-400 mt-2">{notif.date}</p>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <Link
                href={getNotificationLink()}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                onClick={() => setOpen(false)}
              >
                Voir toutes les notifications
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
