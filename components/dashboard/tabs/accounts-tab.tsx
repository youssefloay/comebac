"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader, Users, Mail, Phone, Shield, User, Send, Edit, Save, X } from "lucide-react"

interface Account {
  id: string
  type: 'player' | 'coach' | 'admin'
  firstName: string
  lastName: string
  email: string
  phone?: string
  teamName?: string
  teamId?: string
  position?: string
  jerseyNumber?: number
}

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'player' | 'coach' | 'admin'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [editedPhone, setEditedPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const allAccounts: Account[] = []

      // Charger les joueurs
      const playersSnap = await getDocs(collection(db, 'playerAccounts'))
      playersSnap.forEach(doc => {
        const data = doc.data()
        allAccounts.push({
          id: doc.id,
          type: 'player',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          teamName: data.teamName || '',
          teamId: data.teamId || '',
          position: data.position || '',
          jerseyNumber: data.jerseyNumber || 0
        })
      })

      // Charger les entraîneurs
      const coachesSnap = await getDocs(collection(db, 'coachAccounts'))
      coachesSnap.forEach(doc => {
        const data = doc.data()
        allAccounts.push({
          id: doc.id,
          type: 'coach',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          teamName: data.teamName || '',
          teamId: data.teamId || ''
        })
      })

      // Charger les admins
      const adminsSnap = await getDocs(collection(db, 'users'))
      adminsSnap.forEach(doc => {
        const data = doc.data()
        if (data.role === 'admin') {
          allAccounts.push({
            id: doc.id,
            type: 'admin',
            firstName: data.firstName || '',
            lastName: data.lastName || data.displayName?.split(' ')[0] || '',
            email: data.email || '',
            phone: data.phone || ''
          })
        }
      })

      setAccounts(allAccounts)
    } catch (error) {
      console.error('Erreur lors du chargement des comptes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAccounts = accounts.filter(account => {
    // Filtre par type
    if (filter !== 'all' && account.type !== filter) return false

    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        account.firstName.toLowerCase().includes(search) ||
        account.lastName.toLowerCase().includes(search) ||
        account.email.toLowerCase().includes(search) ||
        account.teamName?.toLowerCase().includes(search)
      )
    }

    return true
  })

  const stats = {
    total: accounts.length,
    players: accounts.filter(a => a.type === 'player').length,
    coaches: accounts.filter(a => a.type === 'coach').length,
    admins: accounts.filter(a => a.type === 'admin').length
  }

  const sendPasswordResetEmail = async (account: Account) => {
    if (!confirm(`Envoyer un email de réinitialisation de mot de passe à ${account.firstName} ${account.lastName} (${account.email}) ?`)) {
      return
    }

    setSendingEmail(account.id)
    setMessage(null)

    try {
      // Utiliser l'API appropriée selon le type de compte
      const apiUrl = account.type === 'coach' 
        ? '/api/admin/resend-coach-email' 
        : '/api/admin/resend-player-email'

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          teamName: account.teamName || 'ComeBac League',
          // Pour l'API player (rétrocompatibilité)
          playerEmail: account.email,
          playerName: `${account.firstName} ${account.lastName}`
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Email envoyé à ${account.firstName} ${account.lastName}` 
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Erreur lors de l\'envoi' 
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessage({ 
        type: 'error', 
        text: 'Erreur de connexion' 
      })
    } finally {
      setSendingEmail(null)
      // Masquer le message après 5 secondes
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const startEdit = (account: Account) => {
    setEditingAccount(account.id)
    setEditedPhone(account.phone || '')
  }

  const cancelEdit = () => {
    setEditingAccount(null)
    setEditedPhone('')
  }

  const savePhone = async (account: Account) => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/update-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          accountType: account.type,
          phone: editedPhone,
          email: account.email
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Téléphone mis à jour pour ${account.firstName} ${account.lastName}` 
        })
        // Mettre à jour localement
        setAccounts(accounts.map(a => 
          a.id === account.id ? { ...a, phone: editedPhone } : a
        ))
        setEditingAccount(null)
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Erreur lors de la mise à jour' 
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessage({ 
        type: 'error', 
        text: 'Erreur de connexion' 
      })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 5000)
    }
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Comptes</h2>
        <p className="text-gray-600">Tous les comptes utilisateurs (joueurs, entraîneurs, admins)</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-gray-400 opacity-20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Joueurs</p>
              <p className="text-3xl font-bold text-green-600">{stats.players}</p>
            </div>
            <User className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entraîneurs</p>
              <p className="text-3xl font-bold text-blue-600">{stats.coaches}</p>
            </div>
            <User className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-3xl font-bold text-purple-600">{stats.admins}</p>
            </div>
            <Shield className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Filtres par type */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({stats.total})
            </button>
            <button
              onClick={() => setFilter('player')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'player' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Joueurs ({stats.players})
            </button>
            <button
              onClick={() => setFilter('coach')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'coach' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Entraîneurs ({stats.coaches})
            </button>
            <button
              onClick={() => setFilter('admin')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Admins ({stats.admins})
            </button>
          </div>

          {/* Recherche */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, email, équipe..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des comptes */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Équipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Détails
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucun compte trouvé
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.type === 'player' ? 'bg-green-100 text-green-800' :
                        account.type === 'coach' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {account.type === 'player' ? '⚽ Joueur' :
                         account.type === 'coach' ? '👔 Entraîneur' :
                         '🛡️ Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {account.firstName} {account.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {account.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingAccount === account.id ? (
                        <input
                          type="tel"
                          value={editedPhone}
                          onChange={(e) => setEditedPhone(e.target.value)}
                          placeholder="Numéro de téléphone"
                          className="px-2 py-1 border border-blue-300 rounded text-sm w-full"
                        />
                      ) : account.phone ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {account.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Non renseigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {account.teamName && (
                        <div className="text-sm text-gray-900">
                          {account.teamName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {account.type === 'player' && account.position && (
                        <span>{account.position} #{account.jerseyNumber}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {editingAccount === account.id ? (
                          <>
                            <button
                              onClick={() => savePhone(account)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                              title="Sauvegarder"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="inline-flex items-center gap-1 px-2 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(account)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition"
                              title="Modifier le téléphone"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => sendPasswordResetEmail(account)}
                              disabled={sendingEmail === account.id}
                              className="inline-flex items-center gap-1 px-2 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition font-medium border border-orange-700"
                              title="Réinitialiser le mot de passe"
                            >
                              {sendingEmail === account.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Résumé */}
      <div className="text-sm text-gray-600 text-center">
        Affichage de {filteredAccounts.length} compte(s) sur {stats.total} au total
      </div>
    </div>
  )
}
