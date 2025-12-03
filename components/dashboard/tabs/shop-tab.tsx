'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ShoppingBag, 
  Calendar, 
  DollarSign, 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Download,
  X
} from 'lucide-react'
import { ShopSettings, ShopOrder, ShopPeriod } from '@/lib/types/shop'
import { formatEGP } from '@/lib/shop-utils'
import ShopPeriodsSimple from './shop-periods-simple'

export default function ShopTab() {
  const [view, setView] = useState<'overview' | 'orders' | 'periods' | 'settings'>('overview')
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [periods, setPeriods] = useState<ShopPeriod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [settingsRes, ordersRes, periodsRes] = await Promise.all([
        fetch('/api/shop/settings'),
        fetch('/api/shop/orders'),
        fetch('/api/shop/periods')
      ])

      const settingsData = await settingsRes.json()
      const ordersData = await ordersRes.json()
      const periodsData = await periodsRes.json()

      setSettings(settingsData)
      setOrders(ordersData)
      setPeriods(periodsData)
    } catch (error) {
      console.error('Error fetching shop data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const currentPeriodOrders = orders.filter(o => o.periodId === settings?.currentPeriod?.id)
  const totalRevenue = currentPeriodOrders.reduce((sum, o) => sum + o.total, 0)
  const pendingOrders = currentPeriodOrders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'paid')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion de la Boutique</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les pré-commandes de merch
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('overview')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setView('orders')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'orders'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Commandes
          </button>
          <button
            onClick={() => setView('periods')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'periods'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Périodes
          </button>
          <button
            onClick={() => setView('settings')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'settings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Paramètres
          </button>
        </div>
      </div>

      {/* Overview */}
      {view === 'overview' && (
        <OverviewView
          settings={settings}
          orders={currentPeriodOrders}
          totalRevenue={totalRevenue}
          pendingOrders={pendingOrders.length}
        />
      )}

      {/* Orders */}
      {view === 'orders' && (
        <OrdersView orders={orders} onRefresh={fetchData} />
      )}

      {/* Periods */}
      {view === 'periods' && (
        <ShopPeriodsSimple periods={periods} onRefresh={fetchData} />
      )}

      {/* Settings */}
      {view === 'settings' && (
        <SettingsView settings={settings} onRefresh={fetchData} />
      )}
    </div>
  )
}

function OverviewView({ settings, orders, totalRevenue, pendingOrders }: any) {
  const jerseys = orders.filter((o: any) => o.items.some((i: any) => i.productType === 'jersey')).length
  const tshirts = orders.filter((o: any) => o.items.some((i: any) => i.productType === 'tshirt')).length
  const sweatshirts = orders.filter((o: any) => o.items.some((i: any) => i.productType === 'sweatshirt')).length

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={`p-6 rounded-xl ${
        settings?.currentPeriod?.isOpen
          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800'
      }`}>
        <div className="flex items-center gap-3">
          {settings?.currentPeriod?.isOpen ? (
            <CheckCircle className="w-8 h-8 text-green-600" />
          ) : (
            <XCircle className="w-8 h-8 text-yellow-600" />
          )}
          <div>
            <h2 className="text-xl font-bold">
              {settings?.currentPeriod?.isOpen ? 'Boutique Ouverte' : 'Boutique Fermée'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {settings?.currentPeriod?.isOpen
                ? 'Les clients peuvent passer des commandes'
                : 'Les pré-commandes ne sont pas ouvertes'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          icon={<ShoppingBag className="w-6 h-6" />}
          label="Commandes"
          value={orders.length}
          color="blue"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Revenus"
          value={formatEGP(totalRevenue)}
          color="green"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="En attente"
          value={pendingOrders}
          color="yellow"
        />
        <StatCard
          icon={<Package className="w-6 h-6" />}
          label="Produits"
          value={jerseys + tshirts + sweatshirts}
          color="purple"
        />
      </div>

      {/* Product breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">Répartition des produits</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{jerseys}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Maillots</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{tshirts}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">T-Shirts</p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{sweatshirts}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Sweatshirts</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrdersView({ orders, onRefresh }: any) {
  const [filter, setFilter] = useState<string>('all')

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((o: ShopOrder) => o.orderStatus === filter)

  const exportOrders = () => {
    // TODO: Implémenter l'export Excel
    alert('Export Excel à implémenter')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Toutes ({orders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'paid' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Payées
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'delivered' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Livrées
          </button>
        </div>
        <button
          onClick={exportOrders}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold">ID</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Client</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Équipe</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Produits</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Total</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map((order: ShopOrder) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm font-mono">{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{order.userName}</p>
                      <p className="text-xs text-gray-500">{order.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{order.teamName}</td>
                  <td className="px-4 py-3 text-sm">{order.items.length} article(s)</td>
                  <td className="px-4 py-3 font-bold">{formatEGP(order.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.orderStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-700">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PeriodsView({ periods, settings, onRefresh }: any) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [periodName, setPeriodName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)

  console.log('PeriodsView render - showCreateModal:', showCreateModal)

  const handleCreatePeriod = async () => {
    if (!periodName || !startDate || !endDate) {
      alert('Veuillez remplir tous les champs')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/shop/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: periodName,
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        })
      })

      if (res.ok) {
        alert('Période créée avec succès !')
        setShowCreateModal(false)
        setPeriodName('')
        setStartDate('')
        setEndDate('')
        onRefresh()
      } else {
        alert('Erreur lors de la création de la période')
      }
    } catch (error) {
      console.error('Error creating period:', error)
      alert('Erreur lors de la création de la période')
    } finally {
      setCreating(false)
    }
  }

  const handleOpenPeriod = async (periodId: string, period: any) => {
    if (!confirm('Voulez-vous ouvrir cette période ? La boutique sera accessible au public.')) {
      return
    }

    try {
      // Convertir les dates en ISO string si ce sont des objets Date
      const startDate = period.startDate instanceof Date 
        ? period.startDate.toISOString() 
        : period.startDate
      const endDate = period.endDate instanceof Date 
        ? period.endDate.toISOString() 
        : period.endDate

      const res = await fetch(`/api/shop/periods/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'open',
          startDate,
          endDate
        })
      })

      if (res.ok) {
        alert('Période ouverte ! La boutique est maintenant accessible.')
        onRefresh()
      } else {
        const data = await res.json()
        console.error('Error response:', data)
        alert(`Erreur lors de l'ouverture de la période: ${data.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error('Error opening period:', error)
      alert('Erreur lors de l\'ouverture de la période')
    }
  }

  const handleClosePeriod = async (periodId: string) => {
    if (!confirm('Voulez-vous fermer cette période ? Les clients ne pourront plus commander.')) {
      return
    }

    try {
      const res = await fetch(`/api/shop/periods/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      })

      if (res.ok) {
        alert('Période fermée !')
        onRefresh()
      } else {
        alert('Erreur lors de la fermeture de la période')
      }
    } catch (error) {
      console.error('Error closing period:', error)
      alert('Erreur lors de la fermeture de la période')
    }
  }

  const handleDeletePeriod = async (periodId: string) => {
    if (!confirm('⚠️ ATTENTION : Voulez-vous vraiment supprimer cette période ? Cette action est irréversible.')) {
      return
    }

    try {
      const res = await fetch(`/api/shop/periods/${periodId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        alert('Période supprimée !')
        onRefresh()
      } else {
        const data = await res.json()
        alert(`Erreur lors de la suppression: ${data.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error('Error deleting period:', error)
      alert('Erreur lors de la suppression de la période')
    }
  }

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-between items-center mb-6 relative z-20">
        <h2 className="text-xl font-bold">Périodes de pré-commandes</h2>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Bouton cliqué !', showCreateModal)
            setShowCreateModal(true)
          }}
          style={{ zIndex: 9999, position: 'relative' }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer shadow-lg"
        >
          Créer une période
        </button>
      </div>

      {periods.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Aucune période créée pour le moment
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Créer la première période
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {periods.map((period: ShopPeriod) => (
            <div
              key={period.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{period.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {period.totalOrders} commandes • {formatEGP(period.totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    ID: {period.id}
                  </p>
                </div>
                <StatusBadge status={period.status} />
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {period.status === 'upcoming' && (
                  <button
                    type="button"
                    onClick={() => handleOpenPeriod(period.id, period)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md"
                  >
                    ✓ Ouvrir
                  </button>
                )}
                {period.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => handleClosePeriod(period.id)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium shadow-md"
                  >
                    ⏸ Fermer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeletePeriod(period.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-md"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              console.log('Fermeture du modal')
              setShowCreateModal(false)
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full relative"
          >
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6">Créer une période</h2>

            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-2">Nom de la période *</label>
                <input
                  type="text"
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  placeholder="Ex: Janvier 2025"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Date de début *</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Date de fin *</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                La période sera créée avec le statut "À venir". Vous pourrez l'ouvrir ensuite.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreatePeriod}
                disabled={creating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                {creating ? 'Création...' : 'Créer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function SettingsView({ settings, onRefresh }: any) {
  const [jerseyPrice, setJerseyPrice] = useState(settings?.products.jersey.price || 950)
  const [tshirtPrice, setTshirtPrice] = useState(settings?.products.tshirt.price || 750)
  const [sweatshirtPrice, setSweatshirtPrice] = useState(settings?.products.sweatshirt.price || 1100)
  const [shippingCost, setShippingCost] = useState(settings?.deliveryOptions.shippingCost || 100)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/shop/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'products.jersey.price': jerseyPrice,
          'products.tshirt.price': tshirtPrice,
          'products.sweatshirt.price': sweatshirtPrice,
          'deliveryOptions.shippingCost': shippingCost
        })
      })
      alert('Paramètres sauvegardés !')
      onRefresh()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-6">Prix des produits</h2>
        <div className="space-y-4">
          <div>
            <label className="block font-bold mb-2">Maillot (EGP)</label>
            <input
              type="number"
              value={jerseyPrice}
              onChange={(e) => setJerseyPrice(parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block font-bold mb-2">T-Shirt (EGP)</label>
            <input
              type="number"
              value={tshirtPrice}
              onChange={(e) => setTshirtPrice(parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block font-bold mb-2">Sweatshirt (EGP)</label>
            <input
              type="number"
              value={sweatshirtPrice}
              onChange={(e) => setSweatshirtPrice(parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block font-bold mb-2">Frais de livraison (EGP)</label>
            <input
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </button>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: any) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
  }

  return (
    <div className={`${colors[color as keyof typeof colors]} rounded-xl p-6`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    production: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    upcoming: 'bg-blue-100 text-blue-800'
  }

  const labels: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payée',
    production: 'Production',
    ready: 'Prête',
    delivered: 'Livrée',
    open: 'Ouverte',
    closed: 'Fermée',
    upcoming: 'À venir'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  )
}
