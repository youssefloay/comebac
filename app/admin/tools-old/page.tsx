"use client"

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import MaintenanceTab from '@/components/dashboard/tabs/maintenance-tab'
import ActivityTab from '@/components/dashboard/tabs/activity-tab'
import TabNavigation from '@/components/admin/TabNavigation'

type TabType = 'maintenance' | 'activity'

export default function ToolsOldPage() {
  const [activeTab, setActiveTab] = useState<TabType>('maintenance')

  const tabs = [
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'activity', label: 'Activité', icon: '🔔' }
  ]

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Outils Admin</h1>
          <p className="text-gray-600">
            Maintenance et activité de la plateforme
          </p>
        </div>

        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabType)} />

        <div className="mt-6">
          {activeTab === 'maintenance' && <MaintenanceTab />}
          {activeTab === 'activity' && <ActivityTab />}
        </div>
      </div>
    </AdminLayout>
  )
}
