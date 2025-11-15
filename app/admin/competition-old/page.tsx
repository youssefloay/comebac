"use client"

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import MatchesTab from '@/components/dashboard/tabs/matches-tab'
import ResultsTab from '@/components/dashboard/tabs/results-tab'
import LineupsTab from '@/components/dashboard/tabs/lineups-tab'
import StatisticsTab from '@/components/dashboard/tabs/statistics-tab'
import TabNavigation from '@/components/admin/TabNavigation'

type TabType = 'matches' | 'results' | 'lineups' | 'statistics'

export default function CompetitionOldPage() {
  const [activeTab, setActiveTab] = useState<TabType>('matches')

  const tabs = [
    { id: 'matches', label: 'Matchs', icon: '📅' },
    { id: 'results', label: 'Résultats', icon: '📊' },
    { id: 'lineups', label: 'Compositions', icon: '🎯' },
    { id: 'statistics', label: 'Classement', icon: '🏆' }
  ]

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Compétition</h1>
          <p className="text-gray-600">
            Gérer les matchs, résultats, compositions et classement
          </p>
        </div>

        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabType)} />

        <div className="mt-6">
          {activeTab === 'matches' && <MatchesTab />}
          {activeTab === 'results' && <ResultsTab />}
          {activeTab === 'lineups' && <LineupsTab />}
          {activeTab === 'statistics' && <StatisticsTab />}
        </div>
      </div>
    </AdminLayout>
  )
}
