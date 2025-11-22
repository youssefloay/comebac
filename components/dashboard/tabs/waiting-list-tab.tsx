"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, AlertCircle, ToggleLeft, ToggleRight, Loader, Check, X } from "lucide-react"

interface WaitingListStatus {
  isWaitingListEnabled: boolean
  message: string
}

export default function WaitingListTab() {
  const [status, setStatus] = useState<WaitingListStatus>({
    isWaitingListEnabled: false,
    message: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [customMessage, setCustomMessage] = useState('')

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/waiting-list')
      const data = await response.json()
      setStatus(data)
      setCustomMessage(data.message || 'Nous sommes au complet pour le moment. Inscrivez-vous en liste d\'attente.')
    } catch (error) {
      console.error('Error loading waiting list status:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement du statut' })
    } finally {
      setLoading(false)
    }
  }

  const toggleWaitingList = async (enabled: boolean) => {
    try {
      setSaving(true)
      setMessage(null)
      
      const response = await fetch('/api/admin/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isWaitingListEnabled: enabled,
          waitingListMessage: customMessage
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setStatus({
          isWaitingListEnabled: enabled,
          message: customMessage
        })
        setMessage({ 
          type: 'success', 
          text: enabled 
            ? 'Waiting list activée avec succès' 
            : 'Inscriptions normales activées avec succès'
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour' })
      }
    } catch (error) {
      console.error('Error updating waiting list status:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' })
    } finally {
      setSaving(false)
    }
  }

  const saveMessage = async () => {
    await toggleWaitingList(status.isWaitingListEnabled)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Clock className="w-7 h-7 text-amber-600" />
            Gestion de la Liste d'Attente
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Activez ou désactivez le système de waiting list pour les inscriptions d'équipes
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span className={message.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
            {message.text}
          </span>
        </motion.div>
      )}

      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Statut actuel
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status.isWaitingListEnabled 
                ? 'Les nouvelles inscriptions sont en mode waiting list'
                : 'Les inscriptions normales sont activées'}
            </p>
          </div>
          <button
            onClick={() => toggleWaitingList(!status.isWaitingListEnabled)}
            disabled={saving}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              status.isWaitingListEnabled
                ? 'bg-blue-600'
                : 'bg-gray-300 dark:bg-gray-600'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                status.isWaitingListEnabled ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Info Box */}
        <div className={`p-4 rounded-lg border ${
          status.isWaitingListEnabled
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 ${
              status.isWaitingListEnabled
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-blue-600 dark:text-blue-400'
            }`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                status.isWaitingListEnabled
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-blue-800 dark:text-blue-300'
              }`}>
                {status.isWaitingListEnabled ? (
                  <>
                    <strong>Mode Waiting List activé :</strong> Les nouvelles inscriptions seront ajoutées à la liste d'attente. 
                    Les inscriptions en cours (avec lien collaboratif) peuvent continuer à ajouter des joueurs normalement.
                  </>
                ) : (
                  <>
                    <strong>Inscriptions normales :</strong> Toutes les nouvelles équipes peuvent s'inscrire normalement.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Customization */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Message personnalisé
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Ce message sera affiché aux équipes qui tentent de s'inscrire lorsque la waiting list est activée.
        </p>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Nous sommes au complet pour le moment. Inscrivez-vous en liste d'attente."
        />
        <button
          onClick={saveMessage}
          disabled={saving || customMessage === status.message}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Enregistrer le message
            </>
          )}
        </button>
      </div>
    </div>
  )
}

