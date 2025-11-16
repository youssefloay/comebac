"use client"

import { useState, useEffect } from "react"
import { X, Send, Users, User, Shield, Target, AlertCircle, CheckCircle } from "lucide-react"

interface Team {
  id: string
  name: string
}

interface CustomNotificationModalProps {
  isOpen: boolean
  onClose: () => void
  teams: Team[]
}

export default function CustomNotificationModal({ isOpen, onClose, teams }: CustomNotificationModalProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetType: 'all',
    teamId: '',
    specificEmails: '',
    priority: 'normal',
    actionUrl: ''
  })

  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setFormData({
        title: '',
        message: '',
        targetType: 'all',
        teamId: '',
        specificEmails: '',
        priority: 'normal',
        actionUrl: ''
      })
      setMessage(null)
      setStats(null)
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      setMessage({ type: 'error', text: 'Titre et message requis' })
      return
    }

    if (formData.targetType === 'team' && !formData.teamId) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une équipe' })
      return
    }

    if (formData.targetType === 'specific' && !formData.specificEmails) {
      setMessage({ type: 'error', text: 'Veuillez entrer au moins un email' })
      return
    }

    if (!confirm(
      `📢 Envoyer cette notification ?\n\n` +
      `Titre: ${formData.title}\n` +
      `Message: ${formData.message}\n` +
      `Cible: ${formData.targetType === 'all' ? 'Tout le monde' : 
               formData.targetType === 'players' ? 'Tous les joueurs' :
               formData.targetType === 'coaches' ? 'Tous les coaches' :
               formData.targetType === 'team' ? 'Une équipe' : 'Emails spécifiques'}\n\n` +
      `Continuer?`
    )) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/send-custom-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          specificEmails: formData.specificEmails ? formData.specificEmails.split(',').map(e => e.trim()) : []
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${data.sentCount} notification(s) envoyée(s) sur ${data.recipientCount} destinataire(s)` 
        })
        setStats(data)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'envoi' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Envoyer une notification</h2>
              <p className="text-sm text-gray-600">Notification personnalisée avec suivi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message de résultat */}
          {message && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm font-medium ${
                message.type === "success" ? "text-green-800" : "text-red-800"
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de la notification *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Nouveau match ajouté"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 caractères</p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Ex: Un nouveau match a été programmé pour votre équipe. Consultez le calendrier pour plus de détails."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.message.length}/500 caractères</p>
          </div>

          {/* Cible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Destinataires *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({ ...formData, targetType: 'all' })}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  formData.targetType === 'all'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 text-blue-600 mb-2" />
                <div className="font-medium">Tout le monde</div>
                <div className="text-xs text-gray-600">Joueurs + Coaches</div>
              </button>

              <button
                onClick={() => setFormData({ ...formData, targetType: 'players' })}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  formData.targetType === 'players'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 text-green-600 mb-2" />
                <div className="font-medium">Tous les joueurs</div>
                <div className="text-xs text-gray-600">Uniquement joueurs</div>
              </button>

              <button
                onClick={() => setFormData({ ...formData, targetType: 'coaches' })}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  formData.targetType === 'coaches'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Shield className="w-5 h-5 text-orange-600 mb-2" />
                <div className="font-medium">Tous les coaches</div>
                <div className="text-xs text-gray-600">Uniquement coaches</div>
              </button>

              <button
                onClick={() => setFormData({ ...formData, targetType: 'team' })}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  formData.targetType === 'team'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Target className="w-5 h-5 text-purple-600 mb-2" />
                <div className="font-medium">Une équipe</div>
                <div className="text-xs text-gray-600">Joueurs + Coach</div>
              </button>
            </div>
          </div>

          {/* Sélection équipe */}
          {formData.targetType === 'team' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner l'équipe
              </label>
              <select
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choisir une équipe...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Emails spécifiques */}
          {formData.targetType === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emails (séparés par des virgules)
              </label>
              <textarea
                value={formData.specificEmails}
                onChange={(e) => setFormData({ ...formData, specificEmails: e.target.value })}
                placeholder="email1@example.com, email2@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          )}

          {/* Priorité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priorité
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormData({ ...formData, priority: 'low' })}
                className={`flex-1 px-4 py-2 border-2 rounded-lg transition ${
                  formData.priority === 'low'
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Basse
              </button>
              <button
                onClick={() => setFormData({ ...formData, priority: 'normal' })}
                className={`flex-1 px-4 py-2 border-2 rounded-lg transition ${
                  formData.priority === 'normal'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Normale
              </button>
              <button
                onClick={() => setFormData({ ...formData, priority: 'high' })}
                className={`flex-1 px-4 py-2 border-2 rounded-lg transition ${
                  formData.priority === 'high'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Haute
              </button>
            </div>
          </div>

          {/* URL d'action (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lien d'action (optionnel)
            </label>
            <input
              type="url"
              value={formData.actionUrl}
              onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              placeholder="Ex: /matches ou /calendar"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lien vers lequel rediriger quand l'utilisateur clique sur la notification
            </p>
          </div>

          {/* Stats après envoi */}
          {stats && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">📊 Résumé de l'envoi</h3>
              <div className="space-y-1 text-sm text-green-800">
                <p>✅ {stats.sentCount} notification(s) envoyée(s)</p>
                <p>👥 {stats.recipientCount} destinataire(s)</p>
                {stats.errorCount > 0 && <p>❌ {stats.errorCount} erreur(s)</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !formData.title || !formData.message}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Envoyer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
