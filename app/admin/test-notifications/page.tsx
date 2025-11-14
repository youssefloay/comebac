"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Bell } from 'lucide-react'

export default function TestNotificationsPage() {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Accès refusé - Admin uniquement</p>
      </div>
    )
  }

  const createTestNotification = async () => {
    if (!user) return

    setLoading(true)
    setMessage('')

    try {
      const { db } = await import('@/lib/firebase')
      const { collection, addDoc, Timestamp } = await import('firebase/firestore')

      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: '🎉 Notification de test',
        message: 'Ceci est une notification de test créée à ' + new Date().toLocaleTimeString(),
        type: 'info',
        read: false,
        createdAt: Timestamp.now()
      })

      setMessage('✅ Notification créée avec succès !')
    } catch (error) {
      console.error('Erreur:', error)
      setMessage('❌ Erreur lors de la création: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold">Test des Notifications</h1>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              Utilisateur connecté: <strong>{user?.email}</strong>
            </p>
            <p className="text-gray-600">
              UID: <strong>{user?.uid}</strong>
            </p>

            <button
              onClick={createTestNotification}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {loading ? 'Création...' : 'Créer une notification de test'}
            </button>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.startsWith('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
                <li>Clique sur le bouton pour créer une notification</li>
                <li>Vérifie que la cloche dans le header affiche un badge rouge</li>
                <li>Clique sur la cloche pour voir la notification</li>
                <li>Ouvre la console du navigateur pour voir les logs</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
