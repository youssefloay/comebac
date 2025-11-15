"use client"

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import TabNavigation from '@/components/admin/TabNavigation'
import { Wrench, Archive, UserCheck, Mail, Image } from 'lucide-react'
import Link from 'next/link'

type TabType = 'maintenance' | 'archives' | 'impersonate' | 'emails' | 'media'

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('maintenance')

  const tabs = [
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'archives', label: 'Archives', icon: '📦' },
    { id: 'impersonate', label: 'Impersonation', icon: '👤' },
    { id: 'emails', label: 'Emails', icon: '📧' },
    { id: 'media', label: 'Médias', icon: '🖼️' }
  ]

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Outils Admin</h1>
          <p className="text-gray-600">
            Maintenance, archives et outils avancés
          </p>
        </div>

        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabType)} />

        {activeTab === 'maintenance' && <MaintenanceTab />}
        {activeTab === 'archives' && <ArchivesTab />}
        {activeTab === 'impersonate' && <ImpersonateTab />}
        {activeTab === 'emails' && <EmailsTab />}
        {activeTab === 'media' && <MediaTab />}
      </div>
    </AdminLayout>
  )
}

function MaintenanceTab() {
  const tools = [
    {
      title: 'Détecter les doublons',
      description: 'Trouver et fusionner les comptes en double',
      icon: '🔍',
      href: '/admin/duplicates',
      color: 'blue'
    },
    {
      title: 'Recherche avancée',
      description: 'Rechercher dans toute la base de données',
      icon: '🔎',
      href: '/admin/search',
      color: 'purple'
    },
    {
      title: 'Réparations',
      description: 'Outils de réparation de la base de données',
      icon: '🔧',
      href: '/admin',
      color: 'orange'
    }
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Maintenance</h2>
        <p className="text-sm text-gray-600">Outils de maintenance et réparation</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <div className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-${tool.color}-500`}>
              <div className="text-4xl mb-3">{tool.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{tool.title}</h3>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ArchivesTab() {
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Archives</h2>
          <p className="text-sm text-gray-600">Gérer les archives des saisons passées</p>
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          🏁 Terminer la saison
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Fonctionnalité en cours de migration</p>
        <a href="/admin/archives" className="text-blue-600 hover:text-blue-700 font-medium">
          Accéder aux archives →
        </a>
      </div>
    </div>
  )
}

function ImpersonateTab() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Impersonation</h2>
        <p className="text-sm text-gray-600">Se connecter en tant qu'un autre utilisateur</p>
      </div>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Fonctionnalité en cours de migration</p>
        <a href="/admin/impersonate" className="text-blue-600 hover:text-blue-700 font-medium">
          Accéder à l'impersonation →
        </a>
      </div>
    </div>
  )
}

function EmailsTab() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Emails</h2>
        <p className="text-sm text-gray-600">Prévisualiser et envoyer des emails</p>
      </div>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Fonctionnalité en cours de migration</p>
        <a href="/admin/email-preview" className="text-blue-600 hover:text-blue-700 font-medium">
          Accéder à la prévisualisation →
        </a>
      </div>
    </div>
  )
}

function MediaTab() {
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Médias</h2>
          <p className="text-sm text-gray-600">Gérer les images et fichiers</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          📤 Upload fichier
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Fonctionnalité en cours de migration</p>
        <a href="/admin/media" className="text-blue-600 hover:text-blue-700 font-medium">
          Accéder à la gestion des médias →
        </a>
      </div>
    </div>
  )
}
