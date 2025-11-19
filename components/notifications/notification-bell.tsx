"use client"

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

interface NotificationItem {
  id: string
  title?: string
  message?: string
  createdAt?: any
  read?: boolean
}

export function NotificationBell() {
  const { user } = useAuth()
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

  const preview = notifications
    .filter(n => !n.read)
    .slice(0, 3)
    .map((notif) => ({
      id: notif.id,
      title: notif.title || 'Notification',
      message: notif.message || '',
      date: notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString('fr-FR') : notif.createdAt
    }))

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="relative flex items-center justify-center p-0"
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
                preview.map((notif) => (
                  <div key={notif.id || notif.title} className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{notif.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notif.message || 'Consulte la page notifications pour plus de détails.'}
                    </p>
                    {notif.date && (
                      <p className="text-xs text-gray-400 mt-2">{notif.date}</p>
                    )}
                  </div>
                ))
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
