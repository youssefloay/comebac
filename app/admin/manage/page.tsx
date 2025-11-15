"use client"

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import TabNavigation from '@/components/admin/TabNavigation'
import DataTable from '@/components/admin/DataTable'
import { Users, Shield, UserCog, User } from 'lucide-react'

type TabType = 'teams' | 'players' | 'coaches' | 'accounts'

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState<TabType>('teams')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/general-stats')
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'teams', label: 'Équipes', icon: '⚽' },
    { id: 'players', label: 'Joueurs', icon: '👥' },
    { id: 'coaches', label: 'Coaches', icon: '🏆' },
    { id: 'accounts', label: 'Comptes', icon: '👤' }
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion</h1>
          <p className="text-gray-600">
            Gérer les équipes, joueurs, coaches et comptes
          </p>
        </div>

        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabType)} />

        {activeTab === 'teams' && data && (
          <TeamsTab teams={data.teamStats} onUseFullVersion={() => window.location.href = '/admin/manage-old'} />
        )}

        {activeTab === 'players' && data && (
          <PlayersTab players={data.allPlayers} onUseFullVersion={() => window.location.href = '/admin/manage-old'} />
        )}

        {activeTab === 'coaches' && data && (
          <CoachesTab coaches={data.allCoaches} onUseFullVersion={() => window.location.href = '/admin/manage-old'} />
        )}

        {activeTab === 'accounts' && (
          <AccountsTab onUseFullVersion={() => window.location.href = '/admin/manage-old'} />
        )}
      </div>
    </AdminLayout>
  )
}

// Teams Tab
function TeamsTab({ teams, onUseFullVersion }: { teams: any[], onUseFullVersion: () => void }) {
  const columns = [
    { key: 'name', label: 'Équipe' },
    { key: 'schoolName', label: 'École' },
    { 
      key: 'playersCount', 
      label: 'Joueurs',
      render: (value: number) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          {value}
        </span>
      )
    },
    { 
      key: 'hasCoach', 
      label: 'Coach',
      render: (value: boolean) => value ? '✅' : '⚠️'
    },
    { key: 'captain', label: 'Capitaine' }
  ]

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Équipes ({teams.length})</h2>
          <p className="text-sm text-gray-600">Gérer toutes les équipes</p>
        </div>
        <button 
          onClick={onUseFullVersion}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🔧 Version complète
        </button>
      </div>
      <DataTable 
        columns={columns} 
        data={teams}
        searchPlaceholder="Rechercher une équipe..."
        onRowClick={(team) => window.location.href = `/admin/teams?id=${team.id}`}
      />
    </div>
  )
}

// Players Tab
function PlayersTab({ players, onUseFullVersion }: { players: any[], onUseFullVersion: () => void }) {
  const columns = [
    { 
      key: 'number', 
      label: 'N°',
      render: (value: number) => (
        <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-sm">
          {value}
        </span>
      )
    },
    { key: 'name', label: 'Nom' },
    { key: 'position', label: 'Position' },
    { key: 'teamName', label: 'Équipe' },
    { 
      key: 'isCaptain', 
      label: 'Rôle',
      render: (value: boolean, row: any) => (
        <div className="flex gap-1">
          {value && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">👑 Capitaine</span>}
          {row.isActingCoach && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🏆 Coach</span>}
        </div>
      )
    },
    { 
      key: 'hasAccount', 
      label: 'Compte',
      render: (value: boolean) => value ? 
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✅ Actif</span> : 
        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">❌ Inactif</span>
    }
  ]

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Joueurs ({players.length})</h2>
          <p className="text-sm text-gray-600">Gérer tous les joueurs</p>
        </div>
        <button 
          onClick={onUseFullVersion}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          🔧 Version complète
        </button>
      </div>
      <DataTable 
        columns={columns} 
        data={players}
        searchPlaceholder="Rechercher un joueur..."
      />
    </div>
  )
}

// Coaches Tab
function CoachesTab({ coaches, onUseFullVersion }: { coaches: any[], onUseFullVersion: () => void }) {
  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'teamName', label: 'Équipe' }
  ]

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Coaches ({coaches.length})</h2>
          <p className="text-sm text-gray-600">Gérer tous les coaches</p>
        </div>
        <button 
          onClick={onUseFullVersion}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
        >
          🔧 Version complète
        </button>
      </div>
      {coaches.length > 0 ? (
        <DataTable 
          columns={columns} 
          data={coaches}
          searchPlaceholder="Rechercher un coach..."
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UserCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">Aucun coach enregistré</p>
          <p className="text-gray-400 text-sm">Ajoutez un coach pour commencer</p>
        </div>
      )}
    </div>
  )
}

// Accounts Tab
function AccountsTab({ onUseFullVersion }: { onUseFullVersion: () => void }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Comptes utilisateurs</h2>
        <p className="text-sm text-gray-600">Gérer les comptes et permissions</p>
      </div>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Gestion complète des comptes</p>
        <button 
          onClick={onUseFullVersion}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
        >
          🔧 Accéder à la gestion complète
        </button>
      </div>
    </div>
  )
}
