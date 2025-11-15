"use client"

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import TabNavigation from '@/components/admin/TabNavigation'
import { Calendar, Award, ClipboardList, Trophy } from 'lucide-react'

type TabType = 'matches' | 'results' | 'lineups' | 'ranking'

export default function CompetitionPage() {
  const [activeTab, setActiveTab] = useState<TabType>('matches')

  const tabs = [
    { id: 'matches', label: 'Matchs', icon: '📅' },
    { id: 'results', label: 'Résultats', icon: '📊' },
    { id: 'lineups', label: 'Compositions', icon: '🎯' },
    { id: 'ranking', label: 'Classement', icon: '🏆' }
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

        {activeTab === 'matches' && <MatchesTab />}
        {activeTab === 'results' && <ResultsTab />}
        {activeTab === 'lineups' && <LineupsTab />}
        {activeTab === 'ranking' && <RankingTab />}
      </div>
    </AdminLayout>
  )
}

function MatchesTab() {
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Matchs</h2>
          <p className="text-sm text-gray-600">Gérer le calendrier des matchs</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            🎲 Générer matchs
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            + Nouveau match
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Fonctionnalité en cours de migration</p>
        <p className="text-sm text-gray-400 mb-4">
          Utilisez l'ancien dashboard pour gérer les matchs
        </p>
        <a href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
          Accéder à l'ancien dashboard →
        </a>
      </div>
    </div>
  )
}

function ResultsTab() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Résultats</h2>
        <p className="text-sm text-gray-600">Saisir et gérer les résultats des matchs</p>
      </div>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Fonctionnalité en cours de migration</p>
        <a href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
          Accéder à l'ancien dashboard →
        </a>
      </div>
    </div>
  )
}

function LineupsTab() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Compositions</h2>
        <p className="text-sm text-gray-600">Valider les compositions d'équipes</p>
      </div>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Fonctionnalité en cours de migration</p>
        <a href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
          Accéder à l'ancien dashboard →
        </a>
      </div>
    </div>
  )
}

function RankingTab() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Classement</h2>
        <p className="text-sm text-gray-600">Voir le classement en temps réel</p>
      </div>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Fonctionnalité en cours de migration</p>
        <a href="/public/ranking" className="text-blue-600 hover:text-blue-700 font-medium">
          Voir le classement public →
        </a>
      </div>
    </div>
  )
}
