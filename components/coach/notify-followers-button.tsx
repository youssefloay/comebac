"use client"

import { useState } from 'react'
import { Bell, Send, X } from 'lucide-react'

interface NotifyFollowersButtonProps {
  teamId: string
  teamName: string
}

export function NotifyFollowersButton({ teamId, teamName }: NotifyFollowersButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSend = async () => {
    if (!announcement.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/coach/notify-followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          teamName,
          announcement: announcement.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setAnnouncement('')
        setTimeout(() => {
          setSuccess(false)
          setIsOpen(false)
        }, 2000)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Bell className="w-4 h-4" />
        <span className="text-sm font-medium">Notifier les followers</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                📢 Annonce aux followers
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Envoyez une notification à tous ceux qui suivent {teamName}
            </p>

            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Ex: Entraînement annulé demain, match reporté à samedi..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={200}
            />

            <div className="flex items-center justify-between mt-2 mb-4">
              <span className="text-xs text-gray-500">
                {announcement.length}/200 caractères
              </span>
            </div>

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Notification envoyée avec succès !
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !announcement.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
