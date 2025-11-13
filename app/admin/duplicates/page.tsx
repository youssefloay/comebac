"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AlertTriangle, Users, Trash2, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Account {
  collection: string
  id: string
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
  displayName?: string
  type: string
  teamName?: string
  teamId?: string
  position?: string
  jerseyNumber?: number
  uid?: string
  createdAt?: any
  lastLogin?: any
  hasLoggedIn?: boolean
  emailVerified?: boolean
}

interface Duplicate {
  email?: string
  reason: string
  count: number
  accounts: Account[]
}

export default function DuplicatesPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [duplicates, setDuplicates] = useState<Duplicate[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!isAdmin) {
        router.push('/public')
      }
    }
  }, [user, authLoading, isAdmin, router])

  useEffect(() => {
    if (user && isAdmin) {
      loadDuplicates()
    }
  }, [user, isAdmin])

  const loadDuplicates = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/detect-duplicates')
      const data = await response.json()

      if (response.ok) {
        setDuplicates(data.duplicates)
        setSummary(data.summary)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du chargement' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setLoading(false)
    }
  }

  const getAccountName = (account: Account) => {
    if (account.firstName && account.lastName) {
      return `${account.firstName} ${account.lastName}`
    }
    if (account.fullName) {
      return account.fullName
    }
    if (account.displayName) {
      return account.displayName
    }
    return account.email.split('@')[0]
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Jamais'
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'À l\'instant'
      if (minutes < 60) return `Il y a ${minutes}min`
      if (hours < 24) return `Il y a ${hours}h`
      if (days < 7) return `Il y a ${days}j`
      
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return 'Date invalide'
    }
  }

  const toggleAccountSelection = (accountId: string) => {
    const newSelected = new Set(selectedAccounts)
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId)
    } else {
      newSelected.add(accountId)
    }
    setSelectedAccounts(newSelected)
  }

  const handleDeleteAccount = async (account: Account) => {
    const accountName = getAccountName(account)
    
    if (!confirm(
      `⚠️ SUPPRIMER CE COMPTE ?\n\n` +
      `Nom: ${accountName}\n` +
      `Email: ${account.email}\n` +
      `Type: ${getCollectionLabel(account.collection)}\n` +
      `Collection: ${account.collection}\n\n` +
      `Cette action est IRRÉVERSIBLE !\n\n` +
      `Êtes-vous sûr ?`
    )) {
      return
    }

    setDeleting(account.id)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          collection: account.collection,
          uid: account.uid
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `✅ Compte "${accountName}" supprimé avec succès !` 
        })
        // Retirer de la sélection
        const newSelected = new Set(selectedAccounts)
        newSelected.delete(account.id)
        setSelectedAccounts(newSelected)
        // Recharger les doublons
        setTimeout(() => {
          loadDuplicates()
        }, 1000)
      } else {
        setMessage({ 
          type: 'error', 
          text: `❌ Erreur: ${data.error}` 
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessage({ 
        type: 'error', 
        text: '❌ Erreur de connexion lors de la suppression' 
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteSelected = async (duplicateAccounts: Account[]) => {
    const accountsToDelete = duplicateAccounts.filter(acc => selectedAccounts.has(acc.id))
    
    if (accountsToDelete.length === 0) {
      alert('⚠️ Aucun compte sélectionné !')
      return
    }

    if (!confirm(
      `⚠️ SUPPRIMER ${accountsToDelete.length} COMPTE(S) SÉLECTIONNÉ(S) ?\n\n` +
      accountsToDelete.map(acc => 
        `• ${getAccountName(acc)} (${getCollectionLabel(acc.collection)})`
      ).join('\n') +
      `\n\nCette action est IRRÉVERSIBLE !\n\nContinuer ?`
    )) {
      return
    }

    setMessage(null)
    let successCount = 0
    let errorCount = 0

    for (const account of accountsToDelete) {
      try {
        const response = await fetch('/api/admin/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: account.id,
            collection: account.collection,
            uid: account.uid
          })
        })

        if (response.ok) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        errorCount++
      }
    }

    if (errorCount === 0) {
      setMessage({ 
        type: 'success', 
        text: `✅ ${successCount} compte(s) supprimé(s) avec succès !` 
      })
    } else {
      setMessage({ 
        type: 'error', 
        text: `⚠️ ${successCount} réussi(s), ${errorCount} erreur(s)` 
      })
    }

    setSelectedAccounts(new Set())
    setTimeout(() => loadDuplicates(), 1000)
  }

  const getCollectionLabel = (collection: string) => {
    switch (collection) {
      case 'playerAccounts': return '👥 Joueur'
      case 'coachAccounts': return '🎯 Entraîneur'
      case 'users': return '👤 Utilisateur'
      case 'userProfiles': return '📋 Profil'
      default: return collection
    }
  }

  const getCollectionColor = (collection: string) => {
    switch (collection) {
      case 'playerAccounts': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'coachAccounts': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'users': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'userProfiles': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l'admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                Détection des Doublons
              </h1>
              <p className="text-gray-600">
                Emails utilisés dans plusieurs collections
              </p>
            </div>
            <button
              onClick={loadDuplicates}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-5 h-5" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Comptes</div>
              <div className="text-3xl font-bold text-gray-900">{summary.totalAccounts}</div>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="text-sm text-blue-700 mb-1">Joueurs</div>
              <div className="text-3xl font-bold text-blue-900">{summary.players}</div>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
              <div className="text-sm text-orange-700 mb-1">Entraîneurs</div>
              <div className="text-3xl font-bold text-orange-900">{summary.coaches}</div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
              <div className="text-sm text-purple-700 mb-1">Utilisateurs</div>
              <div className="text-3xl font-bold text-purple-900">{summary.users}</div>
            </div>
            <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
              <div className="text-sm text-red-700 mb-1">⚠️ Doublons</div>
              <div className="text-3xl font-bold text-red-900">{duplicates.length}</div>
            </div>
          </div>
        )}

        {/* Duplicates List */}
        {duplicates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ✅ Aucun doublon détecté !
            </h3>
            <p className="text-gray-600">
              Tous les emails sont uniques dans la base de données.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {duplicates.map((duplicate, index) => (
              <div
                key={duplicate.email || `duplicate-${index}`}
                className="bg-white rounded-lg border-2 border-red-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      {duplicate.email && (
                        <h3 className="text-xl font-bold text-gray-900">
                          {duplicate.email}
                        </h3>
                      )}
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                        {duplicate.count} comptes
                      </span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        {duplicate.reason}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {duplicate.email 
                        ? `Cet email est utilisé dans ${duplicate.count} collections différentes`
                        : `${duplicate.count} comptes avec des noms similaires détectés`
                      }
                    </p>
                  </div>
                </div>

                {/* Sélection rapide */}
                <div className="mb-4 flex items-center gap-3 flex-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Sélection rapide :</span>
                  <button
                    onClick={() => {
                      const newSelected = new Set(selectedAccounts)
                      duplicate.accounts.forEach(acc => newSelected.add(acc.id))
                      setSelectedAccounts(newSelected)
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition"
                  >
                    ✓ Tout sélectionner
                  </button>
                  <button
                    onClick={() => {
                      const newSelected = new Set(selectedAccounts)
                      duplicate.accounts.forEach(acc => newSelected.delete(acc.id))
                      setSelectedAccounts(newSelected)
                    }}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-xs font-bold hover:bg-gray-700 transition"
                  >
                    ✗ Tout désélectionner
                  </button>
                  <button
                    onClick={() => {
                      const newSelected = new Set(selectedAccounts)
                      duplicate.accounts.slice(1).forEach(acc => newSelected.add(acc.id))
                      setSelectedAccounts(newSelected)
                    }}
                    className="px-3 py-1 bg-orange-600 text-white rounded text-xs font-bold hover:bg-orange-700 transition"
                  >
                    🎯 Sélectionner tous sauf le 1er
                  </button>
                  <button
                    onClick={() => {
                      const newSelected = new Set(selectedAccounts)
                      duplicate.accounts.filter(acc => !acc.hasLoggedIn).forEach(acc => newSelected.add(acc.id))
                      setSelectedAccounts(newSelected)
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition"
                  >
                    ⚠️ Sélectionner jamais connectés
                  </button>
                </div>

                {/* Accounts */}
                <div className="grid grid-cols-1 gap-4">
                  {duplicate.accounts.map((account, accountIndex) => (
                    <div
                      key={`${account.collection}-${account.id}`}
                      className={`p-5 rounded-lg border-2 ${getCollectionColor(account.collection)}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox de sélection */}
                        <div className="flex flex-col items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedAccounts.has(account.id)}
                            onChange={() => toggleAccountSelection(account.id)}
                            className="w-6 h-6 cursor-pointer accent-red-600"
                            title="Sélectionner pour suppression"
                          />
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {accountIndex + 1}
                          </div>
                        </div>

                        {/* Informations */}
                        <div className="flex-1 space-y-3">
                          {/* Actions rapides pour ce compte */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {(account.type === 'player' || account.type === 'coach') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (account.type === 'coach') {
                                    sessionStorage.setItem('impersonateCoachId', account.id)
                                    sessionStorage.setItem('impersonateCoachName', getAccountName(account))
                                    window.location.href = '/coach'
                                  } else {
                                    sessionStorage.setItem('impersonatePlayerId', account.id)
                                    sessionStorage.setItem('impersonatePlayerName', getAccountName(account))
                                    window.location.href = '/player'
                                  }
                                }}
                                className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-bold hover:bg-purple-700 transition"
                                title="Se faire passer pour cet utilisateur"
                              >
                                👤 Impersonate
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(account.id)
                                alert('ID copié !')
                              }}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-xs font-bold hover:bg-gray-700 transition"
                              title="Copier l'ID"
                            >
                              📋 Copier ID
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(account.email)
                                alert('Email copié !')
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition"
                              title="Copier l'email"
                            >
                              📧 Copier Email
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteAccount(account)
                              }}
                              disabled={deleting === account.id}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                              title="Supprimer ce compte"
                            >
                              {deleting === account.id ? '⏳ Suppression...' : '🗑️ Supprimer'}
                            </button>
                          </div>
                          {/* En-tête */}
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-xl mb-1">
                                {getAccountName(account)}
                              </div>
                              <div className="text-sm font-medium">
                                {getCollectionLabel(account.collection)}
                              </div>
                            </div>
                            {account.hasLoggedIn ? (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                ✓ Actif
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                                ✗ Jamais connecté
                              </span>
                            )}
                          </div>

                          {/* Détails en grille */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {/* Colonne 1 */}
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-700 min-w-[80px]">📧 Email:</span>
                                <span className="font-mono text-xs break-all">{account.email}</span>
                              </div>
                              
                              {account.firstName && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">👤 Prénom:</span>
                                  <span>{account.firstName}</span>
                                </div>
                              )}
                              
                              {account.lastName && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">👤 Nom:</span>
                                  <span>{account.lastName}</span>
                                </div>
                              )}

                              {account.fullName && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">📝 Nom complet:</span>
                                  <span>{account.fullName}</span>
                                </div>
                              )}

                              {account.displayName && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">🏷️ Display:</span>
                                  <span>{account.displayName}</span>
                                </div>
                              )}

                              {account.teamName && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">⚽ Équipe:</span>
                                  <span className="font-medium">{account.teamName}</span>
                                </div>
                              )}

                              {account.position && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">📍 Position:</span>
                                  <span>{account.position}</span>
                                </div>
                              )}

                              {account.jerseyNumber && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]"># Numéro:</span>
                                  <span className="font-bold">{account.jerseyNumber}</span>
                                </div>
                              )}
                            </div>

                            {/* Colonne 2 */}
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-700 min-w-[100px]">🗂️ Collection:</span>
                                <code className="bg-white px-2 py-0.5 rounded text-xs">
                                  {account.collection}
                                </code>
                              </div>

                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-700 min-w-[100px]">🆔 ID:</span>
                                <code className="bg-white px-2 py-0.5 rounded text-xs break-all">
                                  {account.id}
                                </code>
                              </div>

                              {account.uid && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[100px]">🔑 UID:</span>
                                  <code className="bg-white px-2 py-0.5 rounded text-xs break-all">
                                    {account.uid}
                                  </code>
                                </div>
                              )}

                              {account.lastLogin && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[100px]">🕐 Dernière co:</span>
                                  <span className="text-xs">
                                    {formatDate(account.lastLogin)}
                                  </span>
                                </div>
                              )}

                              {account.createdAt && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[100px]">📅 Créé le:</span>
                                  <span className="text-xs">
                                    {formatDate(account.createdAt)}
                                  </span>
                                </div>
                              )}

                              {account.emailVerified !== undefined && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[100px]">✉️ Email vérifié:</span>
                                  <span className={`font-bold ${account.emailVerified ? 'text-green-700' : 'text-red-700'}`}>
                                    {account.emailVerified ? '✓ Oui' : '✗ Non'}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-700 min-w-[100px]">📊 Utilisation:</span>
                                <span className={`font-bold ${account.hasLoggedIn ? 'text-green-700' : 'text-red-700'}`}>
                                  {account.hasLoggedIn ? '✓ Utilisé' : '✗ Jamais utilisé'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t-2 border-red-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900 text-lg">Actions disponibles</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Supprimer les comptes sélectionnés */}
                    <button
                      onClick={() => handleDeleteSelected(duplicate.accounts)}
                      disabled={deleting !== null || duplicate.accounts.filter(acc => selectedAccounts.has(acc.id)).length === 0}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <span>🗑️</span>
                      <span>
                        Supprimer sélectionnés ({duplicate.accounts.filter(acc => selectedAccounts.has(acc.id)).length})
                      </span>
                    </button>

                    {/* Voir les comptes */}
                    <button
                      onClick={() => window.location.href = '/admin/accounts'}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      <span>👁️</span>
                      <span>Gérer les comptes</span>
                    </button>

                    {/* Se faire passer pour */}
                    {(duplicate.accounts[0].type === 'player' || duplicate.accounts[0].type === 'coach') && (
                      <button
                        onClick={() => {
                          const account = duplicate.accounts[0]
                          if (account.type === 'coach') {
                            sessionStorage.setItem('impersonateCoachId', account.id)
                            sessionStorage.setItem('impersonateCoachName', getAccountName(account))
                            window.location.href = '/coach'
                          } else {
                            sessionStorage.setItem('impersonatePlayerId', account.id)
                            sessionStorage.setItem('impersonatePlayerName', getAccountName(account))
                            window.location.href = '/player'
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                      >
                        <span>👤</span>
                        <span>Se faire passer pour</span>
                      </button>
                    )}

                    {/* Rechercher */}
                    <button
                      onClick={() => window.location.href = '/admin/search'}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      <span>🔍</span>
                      <span>Rechercher</span>
                    </button>
                  </div>

                  {/* Recommandation */}
                  <div className="mt-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-bold text-yellow-900 mb-2">
                          💡 Recommandation
                        </h4>
                        <div className="space-y-2 text-sm text-yellow-800">
                          <p>
                            <strong>Compte à garder :</strong> {getCollectionLabel(duplicate.accounts[0].collection)} 
                            {duplicate.accounts[0].hasLoggedIn && ' (✓ Utilisé)'}
                          </p>
                          <p>
                            <strong>Comptes à supprimer :</strong> Les {duplicate.accounts.length - 1} autres comptes
                          </p>
                          <p className="text-xs mt-2 pt-2 border-t border-yellow-200">
                            Allez dans <strong>Gérer les comptes</strong> pour supprimer les doublons manuellement
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Pourquoi des doublons ?
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Un utilisateur s'est inscrit puis a été ajouté comme joueur/entraîneur</li>
            <li>• Import de données avec emails existants</li>
            <li>• Création manuelle de comptes multiples</li>
          </ul>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              💡 Conseil : Gardez le compte le plus complet (généralement playerAccounts ou coachAccounts)
              et supprimez les autres pour éviter les conflits.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
