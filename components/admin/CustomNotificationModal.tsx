"use client"

import { useState, useEffect } from "react"
import { X, Send, Users, User, Shield, Target, AlertCircle, CheckCircle, Search, CheckSquare, Square } from "lucide-react"

interface Team {
  id: string
  name: string
}

interface UserListItem {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  type: 'player' | 'coach' | 'user'
  teamName?: string
  teamId?: string
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
  const [allUsers, setAllUsers] = useState<UserListItem[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'player' | 'coach' | 'user'>('all')
  const [loadingUsers, setLoadingUsers] = useState(false)

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
      setSelectedUsers(new Set())
      setSearchTerm('')
      setFilterType('all')
      
      // Charger les utilisateurs si nécessaire
      if (allUsers.length === 0) {
        loadAllUsers()
      }
    }
  }, [isOpen])

  const loadAllUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('/api/admin/all-users')
      const data = await response.json()
      if (data.success) {
        setAllUsers(data.users || [])
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUserToggle = (email: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(email)) {
        newSet.delete(email)
      } else {
        newSet.add(email)
      }
      // Mettre à jour les emails dans formData
      setFormData({
        ...formData,
        specificEmails: Array.from(newSet).join(', ')
      })
      return newSet
    })
  }

  const handleSelectAll = () => {
    const filtered = getFilteredUsers()
    const allEmails = filtered.map(u => u.email)
    const newSet = new Set(allEmails)
    setSelectedUsers(newSet)
    setFormData({
      ...formData,
      specificEmails: Array.from(newSet).join(', ')
    })
  }

  const handleDeselectAll = () => {
    setSelectedUsers(new Set())
    setFormData({
      ...formData,
      specificEmails: ''
    })
  }

  const getFilteredUsers = () => {
    return allUsers.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.teamName && user.teamName.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesType = filterType === 'all' || user.type === filterType
      
      return matchesSearch && matchesType
    })
  }

  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      setMessage({ type: 'error', text: 'Titre et message requis' })
      return
    }

    if (formData.targetType === 'team' && !formData.teamId) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une équipe' })
      return
    }

    if (formData.targetType === 'specific' && selectedUsers.size === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins une personne' })
      return
    }

    if (!confirm(
      `📢 Envoyer cette notification ?\n\n` +
      `Titre: ${formData.title}\n` +
      `Message: ${formData.message}\n` +
      `Cible: ${formData.targetType === 'all' ? 'Tout le monde' : 
               formData.targetType === 'players' ? 'Tous les joueurs' :
               formData.targetType === 'coaches' ? 'Tous les coaches' :
               formData.targetType === 'team' ? 'Une équipe' : 
               formData.targetType === 'specific' ? `${selectedUsers.size} personne(s) spécifique(s)` : 'Emails spécifiques'}\n\n` +
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
                <div className="text-xs text-gray-600">Tous les comptes</div>
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
                onClick={() => setFormData({ ...formData, targetType: 'users' })}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  formData.targetType === 'users'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 text-cyan-600 mb-2" />
                <div className="font-medium">Utilisateurs basiques</div>
                <div className="text-xs text-gray-600">Collection users</div>
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

              <button
                onClick={() => setFormData({ ...formData, targetType: 'specific' })}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  formData.targetType === 'specific'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 text-pink-600 mb-2" />
                <div className="font-medium">Personnes spécifiques</div>
                <div className="text-xs text-gray-600">Sélection manuelle</div>
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

          {/* Sélection de personnes spécifiques */}
          {formData.targetType === 'specific' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Sélectionner les personnes ({selectedUsers.size} sélectionné{selectedUsers.size > 1 ? 's' : ''})
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              {/* Barre de recherche et filtres */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par nom, email ou équipe..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous</option>
                  <option value="player">Joueurs</option>
                  <option value="coach">Coachs</option>
                  <option value="user">Utilisateurs</option>
                </select>
              </div>

              {/* Liste des utilisateurs */}
              <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                {loadingUsers ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Chargement des utilisateurs...
                  </div>
                ) : getFilteredUsers().length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {getFilteredUsers().map((user) => {
                      const isSelected = selectedUsers.has(user.email)
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleUserToggle(user.email)}
                          className={`p-3 hover:bg-gray-50 cursor-pointer transition ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 truncate">
                                  {user.name}
                                </p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  user.type === 'player' ? 'bg-green-100 text-green-800' :
                                  user.type === 'coach' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.type === 'player' ? 'Joueur' :
                                   user.type === 'coach' ? 'Coach' : 'User'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate">{user.email}</p>
                              {user.teamName && (
                                <p className="text-xs text-gray-500">Équipe: {user.teamName}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Emails sélectionnés (pour affichage/édition manuelle si besoin) */}
              {selectedUsers.size > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emails sélectionnés (modifiable)
                  </label>
                  <textarea
                    value={formData.specificEmails}
                    onChange={(e) => {
                      setFormData({ ...formData, specificEmails: e.target.value })
                      // Mettre à jour selectedUsers depuis les emails
                      const emails = e.target.value.split(',').map(e => e.trim()).filter(Boolean)
                      setSelectedUsers(new Set(emails))
                    }}
                    placeholder="Les emails seront remplis automatiquement lors de la sélection"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              )}
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
            disabled={
              loading || 
              !formData.title || 
              !formData.message ||
              (formData.targetType === 'team' && !formData.teamId) ||
              (formData.targetType === 'specific' && selectedUsers.size === 0)
            }
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
