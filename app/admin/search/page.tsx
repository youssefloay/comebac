"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ArrowLeft, Users, UserCog } from 'lucide-react'
import Link from 'next/link'
import { SearchBar, SearchResult } from '@/components/admin/search-bar'

export default function AdminSearchPage() {
  const router = useRouter()
  const [searchData, setSearchData] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Charger les entraîneurs
      const coachesSnap = await getDocs(collection(db, 'coachAccounts'))
      const coaches = coachesSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          type: 'coach' as const,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          teamName: data.teamName,
          teamId: data.teamId,
          uid: data.uid,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
          hasLoggedIn: !!data.lastLogin,
          emailVerified: true
        }
      }) as SearchResult[]

      // Charger les joueurs
      const playersSnap = await getDocs(collection(db, 'playerAccounts'))
      const players = playersSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          type: 'player' as const,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          teamName: data.teamName,
          teamId: data.teamId,
          position: data.position,
          jerseyNumber: data.jerseyNumber,
          uid: data.uid,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
          hasLoggedIn: !!data.lastLogin,
          emailVerified: true
        }
      }) as SearchResult[]

      // Charger les utilisateurs réguliers
      const usersSnap = await getDocs(collection(db, 'users'))
      const users = usersSnap.docs.map(doc => {
        const data = doc.data()
        const isAdmin = data.email === 'contact@comebac.com' || data.role === 'admin'
        return {
          id: doc.id,
          type: isAdmin ? 'admin' as const : 'user' as const,
          firstName: data.firstName || data.displayName?.split(' ')[0] || 'Utilisateur',
          lastName: data.lastName || data.displayName?.split(' ')[1] || '',
          email: data.email,
          role: data.role,
          teamName: data.teamName,
          uid: data.uid || doc.id,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
          hasLoggedIn: !!data.lastLogin,
          emailVerified: data.emailVerified
        }
      }) as SearchResult[]

      // Charger les profils utilisateurs
      const profilesSnap = await getDocs(collection(db, 'userProfiles'))
      const profiles = profilesSnap.docs
        .filter(doc => {
          // Éviter les doublons avec users
          const email = doc.data().email
          return !users.some(u => u.email === email)
        })
        .map(doc => {
          const data = doc.data()
          const isAdmin = data.email === 'contact@comebac.com' || data.role === 'admin'
          const fullName = data.fullName || data.email?.split('@')[0] || 'Utilisateur'
          const nameParts = fullName.split(' ')
          return {
            id: doc.id,
            type: isAdmin ? 'admin' as const : 'user' as const,
            firstName: nameParts[0] || data.email?.split('@')[0] || 'Utilisateur',
            lastName: nameParts.slice(1).join(' ') || '',
            email: data.email,
            role: data.role,
            teamName: data.teamName,
            uid: data.uid || doc.id,
            createdAt: data.createdAt,
            lastLogin: data.lastLogin,
            hasLoggedIn: !!data.lastLogin,
            emailVerified: true
          }
        }) as SearchResult[]

      setSearchData([...coaches, ...players, ...users, ...profiles])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (result: SearchResult) => {
    setSelectedResult(result)
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<Partial<SearchResult>>({})
  const [isSaving, setIsSaving] = useState(false)

  const handleImpersonate = () => {
    if (!selectedResult) return

    if (selectedResult.type === 'coach') {
      sessionStorage.setItem('impersonateCoachId', selectedResult.id)
      sessionStorage.setItem('impersonateCoachName', `${selectedResult.firstName} ${selectedResult.lastName}`)
      router.push('/coach')
    } else if (selectedResult.type === 'player') {
      sessionStorage.setItem('impersonatePlayerId', selectedResult.id)
      sessionStorage.setItem('impersonatePlayerName', `${selectedResult.firstName} ${selectedResult.lastName}`)
      router.push('/player')
    } else {
      alert('Impossible de se faire passer pour ce type d\'utilisateur')
    }
  }

  const handleEdit = () => {
    if (!selectedResult) return
    setEditedData({ ...selectedResult })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedData({})
  }

  const handleSaveEdit = async () => {
    if (!selectedResult || !editedData) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/update-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedResult.id,
          accountType: selectedResult.type,
          uid: selectedResult.uid,
          teamId: selectedResult.teamId,
          updates: editedData
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Compte mis à jour avec succès dans toutes les collections!')
        setIsEditing(false)
        // Recharger les données
        await loadData()
        // Mettre à jour le résultat sélectionné
        setSelectedResult({ ...selectedResult, ...editedData })
      } else {
        alert(`❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur lors de la mise à jour')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l'admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recherche globale
          </h1>
          <p className="text-gray-600">
            Recherchez rapidement un joueur ou un entraîneur
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            data={searchData}
            onSelect={handleSelect}
            placeholder="Tapez un nom, email, équipe ou position..."
            maxSuggestions={10}
          />
        </div>

        {/* Résultat sélectionné */}
        {selectedResult && (
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-500">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                  selectedResult.type === 'coach'
                    ? 'bg-gradient-to-br from-orange-600 to-red-600'
                    : selectedResult.type === 'player'
                    ? 'bg-gradient-to-br from-blue-600 to-green-600'
                    : selectedResult.type === 'admin'
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600'
                    : 'bg-gradient-to-br from-gray-600 to-gray-800'
                }`}>
                  {(isEditing ? editedData.firstName?.[0] : selectedResult.firstName[0])}
                  {(isEditing ? editedData.lastName?.[0] : selectedResult.lastName[0])}
                </div>
                {selectedResult.type === 'player' && (isEditing ? editedData.jerseyNumber : selectedResult.jerseyNumber) && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                    {isEditing ? editedData.jerseyNumber : selectedResult.jerseyNumber}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {!isEditing ? (
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedResult.firstName} {selectedResult.lastName}
                      </h2>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editedData.firstName || ''}
                          onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-xl font-bold"
                          placeholder="Prénom"
                        />
                        <input
                          type="text"
                          value={editedData.lastName || ''}
                          onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-xl font-bold"
                          placeholder="Nom"
                        />
                      </div>
                    )}
                    {selectedResult.type === 'coach' ? (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <UserCog className="w-4 h-4" />
                        Entraîneur
                      </span>
                    ) : selectedResult.type === 'player' ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Joueur
                      </span>
                    ) : selectedResult.type === 'admin' ? (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <UserCog className="w-4 h-4" />
                        Administrateur
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Utilisateur
                      </span>
                    )}
                  </div>
                  
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                    >
                      ✏️ Modifier
                    </button>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  {/* Email */}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 w-32">Email:</span>
                    {!isEditing ? (
                      <span className="text-gray-900">{selectedResult.email}</span>
                    ) : (
                      <input
                        type="email"
                        value={editedData.email || ''}
                        onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Email"
                      />
                    )}
                  </div>

                  {/* Équipe */}
                  {(selectedResult.teamName || isEditing) && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 w-32">Équipe:</span>
                      {!isEditing ? (
                        <span className="text-gray-900">{selectedResult.teamName}</span>
                      ) : (
                        <input
                          type="text"
                          value={editedData.teamName || ''}
                          onChange={(e) => setEditedData({ ...editedData, teamName: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Nom de l'équipe"
                        />
                      )}
                    </div>
                  )}

                  {/* Position (joueurs uniquement) */}
                  {selectedResult.type === 'player' && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 w-32">Position:</span>
                      {!isEditing ? (
                        <span className="text-gray-900">{selectedResult.position || 'Non définie'}</span>
                      ) : (
                        <select
                          value={editedData.position || ''}
                          onChange={(e) => setEditedData({ ...editedData, position: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Sélectionner une position</option>
                          <option value="Gardien">Gardien</option>
                          <option value="Défenseur">Défenseur</option>
                          <option value="Milieu">Milieu</option>
                          <option value="Attaquant">Attaquant</option>
                        </select>
                      )}
                    </div>
                  )}

                  {/* Numéro de maillot (joueurs uniquement) */}
                  {selectedResult.type === 'player' && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 w-32">N° Maillot:</span>
                      {!isEditing ? (
                        <span className="text-gray-900">{selectedResult.jerseyNumber || 'Non défini'}</span>
                      ) : (
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={editedData.jerseyNumber || ''}
                          onChange={(e) => setEditedData({ ...editedData, jerseyNumber: parseInt(e.target.value) || undefined })}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="N°"
                        />
                      )}
                    </div>
                  )}

                  {/* Rôle (utilisateurs) */}
                  {selectedResult.role && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 w-32">Rôle:</span>
                      {!isEditing ? (
                        <span className="text-gray-900">{selectedResult.role}</span>
                      ) : (
                        <input
                          type="text"
                          value={editedData.role || ''}
                          onChange={(e) => setEditedData({ ...editedData, role: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Rôle"
                        />
                      )}
                    </div>
                  )}

                  {/* UID */}
                  {selectedResult.uid && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 w-32">UID:</span>
                      <span className="text-gray-600 font-mono text-sm">{selectedResult.uid}</span>
                    </div>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3">
                  {!isEditing ? (
                    <>
                      {(selectedResult.type === 'coach' || selectedResult.type === 'player') && (
                        <button
                          onClick={handleImpersonate}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          👤 Se faire passer pour {selectedResult.firstName}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-400"
                      >
                        {isSaving ? '⏳ Enregistrement...' : '✅ Enregistrer'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium disabled:bg-gray-400"
                      >
                        ❌ Annuler
                      </button>
                    </>
                  )}
                </div>

                {/* Avertissement lors de l'édition */}
                {isEditing && (
                  <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ <strong>Attention:</strong> Les modifications seront appliquées dans TOUTES les collections de la base de données (coachAccounts, playerAccounts, users, userProfiles, teams, lineups, results, statistics, etc.)
                    </p>
                  </div>
                )}

                {/* Informations de synchronisation */}
                {!isEditing && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      🔄 <strong>Synchronisation automatique:</strong>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {selectedResult.type === 'coach' ? 'coachAccounts' : selectedResult.type === 'player' ? 'playerAccounts' : 'users'}
                      </span>
                      {selectedResult.uid && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          userProfiles
                        </span>
                      )}
                      {selectedResult.teamId && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          teams
                        </span>
                      )}
                      {selectedResult.type === 'player' && (
                        <>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            lineups
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            statistics
                          </span>
                        </>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        results
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      Toute modification sera propagée automatiquement dans ces collections
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <UserCog className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Entraîneurs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {searchData.filter((d: SearchResult) => d.type === 'coach').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Joueurs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {searchData.filter((d: SearchResult) => d.type === 'player').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <UserCog className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {searchData.filter((d: SearchResult) => d.type === 'admin').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {searchData.filter((d: SearchResult) => d.type === 'user').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
