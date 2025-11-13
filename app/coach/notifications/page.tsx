"use client"

import { Bell, CheckCircle, AlertCircle, Info, Trophy } from 'lucide-react'

export default function CoachNotificationsPage() {
  // Mock notifications - à remplacer par de vraies données
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Match gagné!',
      message: 'Votre équipe a remporté le match 3-1',
      time: 'Il y a 2 heures',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Nouveau match programmé',
      message: 'Match contre Les Aigles le 15 décembre',
      time: 'Il y a 5 heures',
      read: false
    },
    {
      id: 3,
      type: 'warning',
      title: 'Joueur blessé',
      message: 'Ahmed Mohamed est indisponible pour le prochain match',
      time: 'Hier',
      read: true
    },
    {
      id: 4,
      type: 'success',
      title: 'Composition validée',
      message: 'Votre composition pour le match de samedi a été validée',
      time: 'Il y a 2 jours',
      read: true
    }
  ]

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
            Restez informé des dernières actualités de votre équipe
          </p>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 rounded-lg shadow-md border ${getBgColor(notification.type)} ${
                !notification.read ? 'border-l-4' : ''
              }`}
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
                  <p className="text-sm text-gray-500">{notification.time}</p>
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
