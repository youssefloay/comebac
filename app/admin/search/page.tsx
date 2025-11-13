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
                  {selectedResult.firstName[0]}{selectedResult.lastName[0]}
                </div>
                {selectedResult.type === 'player' && selectedResult.jerseyNumber && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                    {selectedResult.jerseyNumber}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedResult.firstName} {selectedResult.lastName}
                  </h2>
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

                <div className="space-y-2 mb-4">
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {selectedResult.email}
                  </p>
                  {selectedResult.teamName && (
                    <p className="text-gray-600">
                      <span className="font-medium">Équipe:</span> {selectedResult.teamName}
                    </p>
                  )}
                  {selectedResult.position && (
                    <p className="text-gray-600">
                      <span className="font-medium">Position:</span> {selectedResult.position}
                    </p>
                  )}
                  {selectedResult.role && (
                    <p className="text-gray-600">
                      <span className="font-medium">Rôle:</span> {selectedResult.role}
                    </p>
                  )}
                </div>

                {(selectedResult.type === 'coach' || selectedResult.type === 'player') && (
                  <button
                    onClick={handleImpersonate}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Se faire passer pour {selectedResult.firstName}
                  </button>
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
                  {searchData.filter(d => d.type === 'coach').length}
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
                  {searchData.filter(d => d.type === 'player').length}
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
                  {searchData.filter(d => d.type === 'admin').length}
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
                  {searchData.filter(d => d.type === 'user').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
