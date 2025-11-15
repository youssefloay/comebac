"use client"

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import TeamsTab from '@/components/dashboard/tabs/teams-tab'
import PlayersTab from '@/components/dashboard/tabs/players-tab'
import AccountsTab from '@/components/dashboard/tabs/accounts-tab'
import TabNavigation from '@/components/admin/TabNavigation'

type TabType = 'teams' | 'players' | 'accounts'

export default function ManageOldPage() {
  const [activeTab, setActiveTab] = useState<TabType>('teams')

  const tabs = [
    { id: 'teams', label: 'Équipes', icon: '⚽' },
    { id: 'players', label: 'Joueurs', icon: '👥' },
    { id: 'accounts', label: 'Comptes', icon: '👤' }
  ]

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion</h1>
          <p className="text-gray-600">
            Gérer les équipes, joueurs et comptes
          </p>
        </div>

        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabType)} />

        <div className="mt-6">
          {activeTab === 'teams' && <TeamsTab />}
          {activeTab === 'players' && <PlayersTab />}
          {activeTab === 'accounts' && <AccountsTab />}
        </div>
      </div>
    </AdminLayout>
  )
}
