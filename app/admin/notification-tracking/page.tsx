"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Eye, EyeOff, Users, TrendingUp, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  title: string
  message: string
  targetType: string
  priority: string
  createdAt: any
  recipientCount: number
  readCount: number
  unreadCount: number
  readPercentage: number
}

interface NotificationDetail extends Notification {
  recipients: Array<{
    email: string
    name: string
    type: string
    teamName?: string
    read: boolean
    readAt: any
  }>
}

export default function NotificationTrackingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNotification, setSelectedNotification] = useState<NotificationDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notification-stats')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNotificationDetail = async (id: string) => {
    setLoadingDetail(true)
    try {
      const response = await fetch(`/api/admin/notification-stats?id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedNotification(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'all': return 'Tout le monde'
      case 'players': return 'Joueurs'
      case 'coaches': return 'Coaches'
      case 'users': return 'Utilisateurs'
      case 'team': return 'Une équipe'
      case 'specific': return 'Spécifique'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Suivi des notifications</h1>
              <p className="text-gray-600">Statistiques de lecture et engagement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {notifications.reduce((sum, n) => sum + n.recipientCount, 0)}
              </div>
            </div>
            <p className="text-sm text-gray-600">Total destinataires</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {notifications.reduce((sum, n) => sum + n.readCount, 0)}
              </div>
            </div>
            <p className="text-sm text-gray-600">Notifications lues</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {notifications.length > 0
                  ? Math.round(
                      (notifications.reduce((sum, n) => sum + n.readCount, 0) /
                        notifications.reduce((sum, n) => sum + n.recipientCount, 0)) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
            <p className="text-sm text-gray-600">Taux de lecture moyen</p>
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Historique des notifications</h2>
          </div>

          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">Aucune notification envoyée pour le moment</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => loadNotificationDetail(notif.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(notif.priority)}`}>
                          {notif.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>📅 {formatDate(notif.createdAt)}</span>
                        <span>🎯 {getTargetTypeLabel(notif.targetType)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {notif.readCount} / {notif.recipientCount} lues
                      </span>
                      <span className="font-semibold text-gray-900">
                        {notif.readPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${notif.readPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal détails */}
        {selectedNotification && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedNotification(null)}
          >
            <div
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedNotification.title}</h2>
                <p className="text-sm text-gray-600">{selectedNotification.message}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span>📅 {formatDate(selectedNotification.createdAt)}</span>
                  <span>👥 {selectedNotification.recipientCount} destinataires</span>
                  <span>✅ {selectedNotification.readCount} lues ({selectedNotification.readPercentage}%)</span>
                </div>
              </div>

              {/* Liste des destinataires */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Détails par destinataire</h3>
                <div className="space-y-2">
                  {selectedNotification.recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        recipient.read ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {recipient.read ? (
                            <Eye className="w-5 h-5 text-green-600" />
                          ) : (
                            <EyeOff className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{recipient.name}</p>
                            <p className="text-sm text-gray-600">{recipient.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            recipient.type === 'coach' ? 'bg-orange-100 text-orange-800' : 
                            recipient.type === 'player' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {recipient.type === 'coach' ? '🏆 Coach' : 
                             recipient.type === 'player' ? '⚽ Joueur' : 
                             '👤 User'}
                          </span>
                          {recipient.teamName && (
                            <p className="text-xs text-gray-500 mt-1">{recipient.teamName}</p>
                          )}
                          {recipient.read && recipient.readAt && (
                            <p className="text-xs text-green-600 mt-1">
                              Lu le {formatDate(recipient.readAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
