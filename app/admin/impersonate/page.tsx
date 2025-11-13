"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Users, UserCog, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SearchBar, SearchResult } from '@/components/admin/search-bar'

interface Coach {
  id: string
  firstName: string
  lastName: string
  email: string
  teamName: string
  teamId?: string
  uid?: string
  createdAt?: any
  lastLogin?: any
}

interface Player {
  id: string
  firstName: string
  lastName: string
  email: string
  teamName: string
  position: string
  jerseyNumber: number
  teamId?: string
  uid?: string
  createdAt?: any
  lastLogin?: any
}

export default function ImpersonatePage() {
  const router = useRouter()
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'coaches' | 'players'>('coaches')
  const [searchData, setSearchData] = useState<SearchResult[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Charger les entraîneurs
      const coachesSnap = await getDocs(collection(db, 'coachAccounts'))
      const coachesData = coachesSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          teamName: data.teamName,
          teamId: data.teamId,
          uid: data.uid,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin
        }
      }) as Coach[]
      coachesData.sort((a, b) => a.lastName.localeCompare(b.lastName))
      setCoaches(coachesData)

      // Charger les joueurs
      const playersSnap = await getDocs(collection(db, 'playerAccounts'))
      const playersData = playersSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          teamName: data.teamName,
          teamId: data.teamId,
          position: data.position,
          jerseyNumber: data.jerseyNumber,
          uid: data.uid,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin
        }
      }) as Player[]
      playersData.sort((a, b) => a.lastName.localeCompare(b.lastName))
      setPlayers(playersData)

      // Charger les utilisateurs réguliers
      const usersSnap = await getDocs(collection(db, 'users'))
      const usersData = usersSnap.docs.map(doc => {
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
      })

      // Charger les profils utilisateurs
      const profilesSnap = await getDocs(collection(db, 'userProfiles'))
      const profilesData = profilesSnap.docs
        .filter(doc => {
          // Éviter les doublons avec users
          const email = doc.data().email
          return !usersData.some(u => u.email === email)
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
        })

      // Combiner pour la recherche
      const allData: SearchResult[] = [
        ...coachesData.map(c => ({ 
          ...c, 
          type: 'coach' as const,
          hasLoggedIn: !!c.lastLogin,
          emailVerified: true
        })),
        ...playersData.map(p => ({ 
          ...p, 
          type: 'player' as const,
          hasLoggedIn: !!p.lastLogin,
          emailVerified: true
        })),
        ...usersData,
        ...profilesData
      ]
      setSearchData(allData)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonateCoach = (coach: Coach) => {
    // Stocker l'ID du coach dans le sessionStorage
    sessionStorage.setItem('impersonateCoachId', coach.id)
    sessionStorage.setItem('impersonateCoachName', `${coach.firstName} ${coach.lastName}`)
    router.push('/coach')
  }

  const handleImpersonatePlayer = (player: Player) => {
    // Stocker l'ID du joueur dans le sessionStorage
    sessionStorage.setItem('impersonatePlayerId', player.id)
    sessionStorage.setItem('impersonatePlayerName', `${player.firstName} ${player.lastName}`)
    router.push('/player')
  }

  const handleSearchSelect = (result: SearchResult) => {
    if (result.type === 'coach') {
      handleImpersonateCoach(result as Coach)
    } else if (result.type === 'player') {
      handleImpersonatePlayer(result as Player)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Se faire passer pour...
          </h1>
          <p className="text-gray-600">
            Sélectionnez un entraîneur ou un joueur pour voir son interface
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('coaches')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'coaches'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <UserCog className="w-5 h-5" />
            Entraîneurs ({coaches.length})
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'players'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            Joueurs ({players.length})
          </button>
        </div>

        {/* Search avec autocomplétion */}
        <div className="mb-6">
          <SearchBar
            data={searchData}
            onSelect={handleSearchSelect}
            placeholder="Rechercher par nom, email, équipe ou position..."
          />
        </div>

        {/* Coaches List */}
        {activeTab === 'coaches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <UserCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun entraîneur trouvé</p>
              </div>
            ) : (
              coaches.map((coach) => (
                <button
                  key={coach.id}
                  onClick={() => handleImpersonateCoach(coach)}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-500 transition text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {coach.firstName[0]}{coach.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {coach.firstName} {coach.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 truncate">{coach.email}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {coach.teamName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-blue-600 font-medium">
                      Voir comme entraîneur →
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Players List */}
        {activeTab === 'players' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun joueur trouvé</p>
              </div>
            ) : (
              players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleImpersonatePlayer(player)}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-500 transition text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-xl font-bold">
                        {player.firstName[0]}{player.lastName[0]}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                        {player.jerseyNumber}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {player.firstName} {player.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 truncate">{player.email}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          {player.position}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {player.teamName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-blue-600 font-medium">
                      Voir comme joueur →
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
