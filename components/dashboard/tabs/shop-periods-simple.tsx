'use client'

import { useState } from 'react'

interface Period {
  id: string
  name: string
  status: string
  totalOrders: number
  totalRevenue: number
  startDate: any
  endDate: any
}

export default function ShopPeriodsSimple({ 
  periods, 
  onRefresh 
}: { 
  periods: Period[]
  onRefresh: () => void 
}) {
  const [creating, setCreating] = useState(false)
  const [newPeriodName, setNewPeriodName] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')

  const handleCreate = async () => {
    if (!newPeriodName || !newStartDate || !newEndDate) {
      alert('Remplissez tous les champs')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/shop/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPeriodName,
          startDate: newStartDate,
          endDate: newEndDate
        })
      })

      if (res.ok) {
        alert('✅ Période créée !')
        setNewPeriodName('')
        setNewStartDate('')
        setNewEndDate('')
        onRefresh()
      } else {
        alert('❌ Erreur création')
      }
    } catch (error) {
      alert('❌ Erreur: ' + error)
    } finally {
      setCreating(false)
    }
  }

  const handleOpen = async (periodId: string, period: Period) => {
    if (!confirm('Ouvrir cette période ?')) return

    try {
      const startDate = period.startDate instanceof Date 
        ? period.startDate.toISOString() 
        : period.startDate
      const endDate = period.endDate instanceof Date 
        ? period.endDate.toISOString() 
        : period.endDate

      const res = await fetch(`/api/shop/periods/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open', startDate, endDate })
      })

      if (res.ok) {
        alert('✅ Période ouverte !')
        onRefresh()
      } else {
        alert('❌ Erreur ouverture')
      }
    } catch (error) {
      alert('❌ Erreur: ' + error)
    }
  }

  const handleClose = async (periodId: string) => {
    if (!confirm('Fermer cette période ?')) return

    try {
      const res = await fetch(`/api/shop/periods/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      })

      if (res.ok) {
        alert('✅ Période fermée !')
        onRefresh()
      } else {
        alert('❌ Erreur fermeture')
      }
    } catch (error) {
      alert('❌ Erreur: ' + error)
    }
  }

  const handleDelete = async (periodId: string) => {
    if (!confirm('⚠️ SUPPRIMER cette période ?')) return

    try {
      const res = await fetch(`/api/shop/periods/${periodId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        alert('✅ Période supprimée !')
        onRefresh()
      } else {
        alert('❌ Erreur suppression')
      }
    } catch (error) {
      alert('❌ Erreur: ' + error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulaire de création */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
        <h3 className="font-bold text-lg mb-4">Créer une nouvelle période</h3>
        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Nom (ex: Février 2025)"
            value={newPeriodName}
            onChange={(e) => setNewPeriodName(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-white dark:bg-gray-800"
          />
          <input
            type="datetime-local"
            value={newStartDate}
            onChange={(e) => setNewStartDate(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-white dark:bg-gray-800"
          />
          <input
            type="datetime-local"
            value={newEndDate}
            onChange={(e) => setNewEndDate(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-white dark:bg-gray-800"
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:bg-gray-400"
          >
            {creating ? 'Création...' : '➕ Créer la période'}
          </button>
        </div>
      </div>

      {/* Liste des périodes */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Périodes existantes ({periods.length})</h3>
        
        {periods.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune période</p>
        ) : (
          periods.map((period) => (
            <div
              key={period.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold">{period.name}</h4>
                  <p className="text-sm text-gray-500">
                    {period.totalOrders} commandes • {period.totalRevenue} EGP
                  </p>
                  <p className="text-xs text-gray-400 mt-1">ID: {period.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  period.status === 'open' ? 'bg-green-100 text-green-800' :
                  period.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {period.status === 'open' ? '🟢 Ouverte' :
                   period.status === 'upcoming' ? '🔵 À venir' :
                   '⚫ Fermée'}
                </span>
              </div>

              <div className="flex gap-2 flex-wrap">
                {period.status === 'upcoming' && (
                  <button
                    onClick={() => handleOpen(period.id, period)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    ✅ Ouvrir
                  </button>
                )}
                {period.status === 'open' && (
                  <button
                    onClick={() => handleClose(period.id)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
                  >
                    ⏸️ Fermer
                  </button>
                )}
                <button
                  onClick={() => handleDelete(period.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
