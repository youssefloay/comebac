"use client"

import { Bell, Trophy, Calendar, Award } from 'lucide-react'

const notifications = [
  {
    id: 1,
    type: 'match',
    icon: Trophy,
    title: 'Nouveau match programmé',
    message: 'Match contre Les Pharaons FC le 15 novembre à 14h00',
    time: 'Il y a 2 heures',
    read: false
  },
  {
    id: 2,
    type: 'badge',
    icon: Award,
    title: 'Nouveau badge débloqué!',
    message: 'Vous avez débloqué le badge "Passeur Décisif"',
    time: 'Il y a 1 jour',
    read: false
  },
  {
    id: 3,
    type: 'reminder',
    icon: Calendar,
    title: 'Rappel: Match demain',
    message: 'N\'oubliez pas votre match contre Les Sphinx FC demain à 16h00',
    time: 'Il y a 2 jours',
    read: true
  },
]

export default function NotificationsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Restez informé de toutes les actualités</p>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => {
            const Icon = notification.icon
            return (
              <div
                key={notification.id}
                className={`p-6 rounded-lg border transition ${
                  notification.read
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    notification.read ? 'bg-gray-100' : 'bg-blue-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      notification.read ? 'text-gray-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500">{notification.time}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucune notification pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}
