"use client"

import { useState, useEffect } from 'react'
import { Search, Filter, Loader, RefreshCw } from 'lucide-react'

interface UserAccount {
  uid: string
  email: string
  name: string
  type: string
  role: string
  teamId: string | null
  teamName: string
  emailVerified: boolean
  disabled: boolean
  createdAt: string
  lastSignIn: string | null
  neverLoggedIn: boolean
  photoURL: string | null
}

interface Stats {
  total: number
  players: number
  coaches: number
  admins: number
  unknown: number
  neverLoggedIn: number
  verified: number
  disabled: number
}

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<UserAccount[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'neverLoggedIn' | 'players' | 'coaches' | 'unknown'>('all')

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [accounts, searchTerm, filter])

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/user-accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = accounts

    // Filtre par type
    if (filter === 'neverLoggedIn') {
      filtered = filtered.filter(a => a.neverLoggedIn)
    } else if (filter === 'players') {
      filtered = filtered.filter(a => a.type === 'player')
    } else if (filter === 'coaches') {
      filtered = filtered.filter(a => a.type === 'coach')
    } else if (filter === 'unknown') {
      filtered = filtered.filter(a => a.type === 'unknown')
    }

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        a.teamName.toLowerCase().includes(term)
      )
    }

    setFilteredAccounts(filtered)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Aujourd\'hui'
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays}j`
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)}sem`
    return `Il y a ${Math.floor(diffDays / 30)}mois`
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: any = {
      'Joueur': 'bg-blue-100 text-blue-700',
      'Joueur / Capitaine': 'bg-yellow-100 text-yellow-700',
      'Joueur / Coach intérimaire': 'bg-orange-100 text-orange-700',
      'Coach': 'bg-green-100 text-green-700',
      'Admin': 'bg-purple-100 text-purple-700',
      'Utilisateur': 'bg-gray-100 text-gray-700'
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des comptes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Comptes</h2>
          <p className="text-gray-600 mt-1">Tous les comptes utilisateurs (joueurs, entraîneurs, admins)</p>
        </div>
        <button
          onClick={loadAccounts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.players}</div>
            <div className="text-xs text-blue-700">Joueurs</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.coaches}</div>
            <div className="text-xs text-green-700">Coaches</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
            <div className="text-xs text-purple-700">Admins</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200 shadow-sm">
            <div className="text-2xl font-bold text-red-600">{stats.neverLoggedIn}</div>
            <div className="text-xs text-red-700">Jamais connectés</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 shadow-sm">
            <div className="text-2xl font-bold text-emerald-600">{stats.verified}</div>
            <div className="text-xs text-emerald-700">Vérifiés</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 shadow-sm">
            <div className="text-2xl font-bold text-amber-600">{stats.unknown}</div>
            <div className="text-xs text-amber-700">Inconnus</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-gray-600">{stats.disabled}</div>
            <div className="text-xs text-gray-700">Désactivés</div>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou équipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({accounts.length})
            </button>
            <button
              onClick={() => setFilter('neverLoggedIn')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'neverLoggedIn' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              ❌ Jamais connectés ({stats?.neverLoggedIn || 0})
            </button>
            <button
              onClick={() => setFilter('players')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'players' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              👥 Joueurs ({stats?.players || 0})
            </button>
            <button
              onClick={() => setFilter('coaches')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'coaches' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              🏆 Coaches ({stats?.coaches || 0})
            </button>
            <button
              onClick={() => setFilter('unknown')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'unknown' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              ⚠️ Inconnus ({stats?.unknown || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des comptes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                  Équipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
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
                    <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-lg font-medium">Aucun compte trouvé</p>
                    <p className="text-sm">Essayez de modifier vos filtres</p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.uid} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(account.role)}`}>
                        {account.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{account.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{account.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.teamName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                          📝
                        </button>
                        <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer avec nombre de résultats */}
      <div className="text-center text-sm text-gray-600">
        Affichage de {filteredAccounts.length} compte(s) sur {accounts.length}
      </div>
    </div>
  )
}
