"use client"

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user && mounted) {
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user, mounted])

  const fetchUnreadCount = async () => {
    try {
      const { auth } = await import('@/lib/firebase')
      const currentUser = auth.currentUser
      
      if (!currentUser) return

      const response = await fetch(`/api/notifications?userId=${currentUser.uid}`)
      const data = await response.json()
      
      if (data.success) {
        const unread = data.notifications.filter((n: any) => !n.read).length
        setUnreadCount(unread)
      }
    } catch (error) {
      // Silently fail
    }
  }

  const getNotificationLink = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      if (path.startsWith('/coach')) return '/coach/notifications'
      if (path.startsWith('/player')) return '/player/notifications'
      if (path.startsWith('/public')) return '/public/notifications'
    }
    return '/public/notifications'
  }

  // Toujours afficher la cloche, même si pas connecté
  const linkHref = user ? getNotificationLink() : '/login'
  
  return (
    <Link
      href={linkHref}
      className="relative flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
      aria-label={user ? `Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}` : 'Se connecter pour voir les notifications'}
      title={user ? 'Notifications' : 'Se connecter'}
    >
      <Bell className="w-5 h-5 flex-shrink-0" />
      {user && unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center animate-pulse shadow-lg">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
