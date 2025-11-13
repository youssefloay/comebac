"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { CheckCircle, XCircle, Clock, User, Mail, Calendar } from "lucide-react"
import { getDeviceIcon, getDeviceLabel } from "@/lib/device-info"

interface AccountActivity {
  id: string
  email: string
  firstName?: string
  lastName?: string
  type: 'player' | 'coach' | 'user' | 'admin'
  teamName?: string
  lastLogin?: Date
  createdAt?: Date
  hasLoggedIn: boolean
  emailVerified?: boolean
  lastDevice?: string
  lastOS?: string
  lastBrowser?: string
  lastIsPWA?: boolean
}

export default function ActivityTab() {
  const [activities, setActivities] = useState<AccountActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'player' | 'coach' | 'user' | 'admin'>('all')

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const [playersSnap, coachesSnap, teamsSnap, usersSnap, userProfilesSnap] = await Promise.all([
        getDocs(collection(db, 'playerAccounts')),
        getDocs(collection(db, 'coachAccounts')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'userProfiles'))
      ])

      const teamsMap = new Map()
      teamsSnap.docs.forEach(doc => {
        teamsMap.set(doc.id, doc.data().name)
      })

      // Créer un Set des emails déjà dans playerAccounts et coachAccounts
      const accountEmails = new Set<string>()

      const playerActivities: AccountActivity[] = playersSnap.docs.map(doc => {
        const data = doc.data()
        accountEmails.add(data.email)
        return {
          id: doc.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          type: 'player' as const,
          teamName: teamsMap.get(data.teamId),
          lastLogin: data.lastLogin?.toDate(),
          createdAt: data.createdAt?.toDate(),
          hasLoggedIn: !!data.lastLogin,
          emailVerified: true,
          lastDevice: data.lastDevice,
          lastOS: data.lastOS,
          lastBrowser: data.lastBrowser,
          lastIsPWA: data.lastIsPWA
        }
      })

      const coachActivities: AccountActivity[] = coachesSnap.docs.map(doc => {
        const data = doc.data()
        accountEmails.add(data.email)
        return {
          id: doc.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          type: 'coach' as const,
          teamName: teamsMap.get(data.teamId),
          lastLogin: data.lastLogin?.toDate(),
          createdAt: data.createdAt?.toDate(),
          hasLoggedIn: !!data.lastLogin,
          emailVerified: true,
          lastDevice: data.lastDevice,
          lastOS: data.lastOS,
          lastBrowser: data.lastBrowser,
          lastIsPWA: data.lastIsPWA
        }
      })

      // Créer une map des userProfiles pour enrichir les données
      const userProfilesMap = new Map()
      userProfilesSnap.docs.forEach(doc => {
        const data = doc.data()
        if (data.email) {
          userProfilesMap.set(data.email, {
            fullName: data.fullName,
            username: data.username,
            role: data.role
          })
        }
      })

      // Ajouter les utilisateurs qui ne sont ni joueurs ni entraîneurs
      const userActivities: AccountActivity[] = usersSnap.docs
        .filter(doc => !accountEmails.has(doc.data().email))
        .map(doc => {
          const data = doc.data()
          const profile = userProfilesMap.get(data.email)
          const isAdmin = data.email === 'contact@comebac.com' || data.role === 'admin' || profile?.role === 'admin'
          
          // Utiliser fullName du profile si disponible, sinon displayName, sinon email
          const fullName = profile?.fullName || data.displayName || data.email?.split('@')[0] || 'Utilisateur'
          const nameParts = fullName.split(' ')
          
          return {
            id: doc.id,
            email: data.email,
            firstName: nameParts[0] || data.email?.split('@')[0],
            lastName: nameParts.slice(1).join(' ') || '',
            type: isAdmin ? 'admin' as const : 'user' as const,
            lastLogin: data.lastLogin?.toDate(),
            createdAt: data.createdAt?.toDate(),
            hasLoggedIn: !!data.lastLogin,
            emailVerified: data.emailVerified
          }
        })

      // Ajouter les userProfiles qui n'ont pas de compte users correspondant
      const userProfileActivities: AccountActivity[] = userProfilesSnap.docs
        .filter(doc => {
          const email = doc.data().email
          return email && !accountEmails.has(email) && !usersSnap.docs.some(u => u.data().email === email)
        })
        .map(doc => {
          const data = doc.data()
          const isAdmin = data.email === 'contact@comebac.com' || data.role === 'admin'
          const fullName = data.fullName || data.email?.split('@')[0] || 'Utilisateur'
          const nameParts = fullName.split(' ')
          
          return {
            id: doc.id,
            email: data.email,
            firstName: nameParts[0] || data.email?.split('@')[0],
            lastName: nameParts.slice(1).join(' ') || '',
            type: isAdmin ? 'admin' as const : 'user' as const,
            lastLogin: data.lastLogin?.toDate(),
            createdAt: data.createdAt?.toDate(),
            hasLoggedIn: !!data.lastLogin,
            emailVerified: true
          }
        })

      const allActivities = [...playerActivities, ...coachActivities, ...userActivities, ...userProfileActivities].sort((a, b) => {
        if (a.lastLogin && b.lastLogin) {
          return b.lastLogin.getTime() - a.lastLogin.getTime()
        }
        if (a.lastLogin) return -1
        if (b.lastLogin) return 1
        return 0
      })

      setActivities(allActivities)
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter(activity => {
    // Filtre par statut de connexion
    if (filter === 'active' && !activity.hasLoggedIn) return false
    if (filter === 'inactive' && activity.hasLoggedIn) return false
    
    // Filtre par type
    if (typeFilter !== 'all' && activity.type !== typeFilter) return false
    
    return true
  })

  const stats = {
    total: activities.length,
    active: activities.filter(a => a.hasLoggedIn).length,
    inactive: activities.filter(a => !a.hasLoggedIn).length,
    players: activities.filter(a => a.type === 'player').length,
    coaches: activities.filter(a => a.type === 'coach').length,
    users: activities.filter(a => a.type === 'user').length,
    admins: activities.filter(a => a.type === 'admin').length
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'Jamais'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return date.toLocaleDateString('fr-FR')
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des activités...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Activité des Comptes</h2>
        <p className="text-gray-600">Suivez les connexions et l'activité des joueurs et entraîneurs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">Total</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">Actifs</span>
          </div>
          <div className="text-3xl font-bold text-green-700">{stats.active}</div>
        </div>

        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700">Inactifs</span>
          </div>
          <div className="text-3xl font-bold text-red-700">{stats.inactive}</div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">👥</span>
            <span className="text-sm text-blue-700">Joueurs</span>
          </div>
          <div className="text-3xl font-bold text-blue-700">{stats.players}</div>
        </div>

        <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">🎯</span>
            <span className="text-sm text-orange-700">Entraîneurs</span>
          </div>
          <div className="text-3xl font-bold text-orange-700">{stats.coaches}</div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">👤</span>
            <span className="text-sm text-purple-700">Utilisateurs</span>
          </div>
          <div className="text-3xl font-bold text-purple-700">{stats.users}</div>
        </div>

        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">⭐</span>
            <span className="text-sm text-yellow-700">Admins</span>
          </div>
          <div className="text-3xl font-bold text-yellow-700">{stats.admins}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Filtre par statut */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Statut de connexion</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Tous ({stats.total})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Actifs ({stats.active})
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Inactifs ({stats.inactive})
            </button>
          </div>
        </div>

        {/* Filtre par type */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Type de compte</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                typeFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Tous ({stats.total})
            </button>
            <button
              onClick={() => setTypeFilter('player')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                typeFilter === 'player'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              👥 Joueurs ({stats.players})
            </button>
            <button
              onClick={() => setTypeFilter('coach')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                typeFilter === 'coach'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              🎯 Entraîneurs ({stats.coaches})
            </button>
            <button
              onClick={() => setTypeFilter('user')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                typeFilter === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              👤 Utilisateurs ({stats.users})
            </button>
            <button
              onClick={() => setTypeFilter('admin')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                typeFilter === 'admin'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              ⭐ Admins ({stats.admins})
            </button>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Équipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière connexion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        activity.type === 'player' ? 'bg-blue-600' :
                        activity.type === 'coach' ? 'bg-orange-600' :
                        activity.type === 'admin' ? 'bg-yellow-600' :
                        'bg-purple-600'
                      }`}>
                        {activity.firstName?.[0] || '?'}{activity.lastName?.[0] || ''}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {activity.firstName} {activity.lastName}
                          {activity.emailVerified === false && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              Email non vérifié
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {activity.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      activity.type === 'player' ? 'bg-blue-100 text-blue-700' :
                      activity.type === 'coach' ? 'bg-orange-100 text-orange-700' :
                      activity.type === 'admin' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {activity.type === 'player' ? '👥 Joueur' : 
                       activity.type === 'coach' ? '🎯 Entraîneur' :
                       activity.type === 'admin' ? '⭐ Admin' :
                       '👤 Utilisateur'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{activity.teamName || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {formatDate(activity.lastLogin)}
                      </div>
                      {activity.lastOS && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-lg">{getDeviceIcon(activity.lastOS, activity.lastIsPWA || false)}</span>
                          <span className={`font-medium ${activity.lastIsPWA ? 'text-green-700' : 'text-gray-600'}`}>
                            {getDeviceLabel(activity.lastDevice || 'unknown', activity.lastOS, activity.lastBrowser || 'unknown', activity.lastIsPWA || false)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {activity.hasLoggedIn ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3" />
                        Jamais connecté
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Aucun compte trouvé avec ce filtre</p>
        </div>
      )}
    </div>
  )
}
