'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Calendar, Clock, MapPin } from 'lucide-react'
import type { PreseasonMatch } from '@/lib/types'

export default function PreseasonMatchesPage() {
  const [matches, setMatches] = useState<PreseasonMatch[]>([])
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMatch, setEditingMatch] = useState<PreseasonMatch | null>(null)
  const [formData, setFormData] = useState({
    teamAId: '',
    teamBId: '',
    date: '',
    time: '',
    location: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [matchesRes, teamsRes] = await Promise.all([
        fetch('/api/preseason/matches'),
        fetch('/api/admin/teams?includeInactive=true'),
      ])

      const matchesData = await matchesRes.json()
      const teamsData = await teamsRes.json()

      // Convertir les dates string en Date objects
      const matchesWithDates = (matchesData.matches || []).map((match: any) => ({
        ...match,
        date: match.date instanceof Date 
          ? match.date 
          : typeof match.date === 'string' 
            ? new Date(match.date) 
            : new Date(match.date),
        createdAt: match.createdAt instanceof Date 
          ? match.createdAt 
          : match.createdAt 
            ? new Date(match.createdAt) 
            : new Date(),
        updatedAt: match.updatedAt instanceof Date 
          ? match.updatedAt 
          : match.updatedAt 
            ? new Date(match.updatedAt) 
            : new Date(),
      }))

      setMatches(matchesWithDates)
      setTeams(Array.isArray(teamsData) ? teamsData : teamsData.teams || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.teamAId === formData.teamBId) {
      alert('Les deux équipes doivent être différentes')
      return
    }

    try {
      const url = editingMatch
        ? '/api/preseason/matches'
        : '/api/preseason/matches'

      const method = editingMatch ? 'PUT' : 'POST'
      const body = editingMatch
        ? { id: editingMatch.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }

      await loadData()
      setShowForm(false)
      setEditingMatch(null)
      setFormData({ teamAId: '', teamBId: '', date: '', time: '', location: '' })
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) return

    try {
      const response = await fetch(`/api/preseason/matches?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      await loadData()
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression')
    }
  }

  const handleEdit = (match: PreseasonMatch) => {
    setEditingMatch(match)
    
    // Gérer la date qui peut être un Date object ou une string
    let dateString = ''
    if (match.date instanceof Date) {
      dateString = match.date.toISOString().split('T')[0]
    } else if (typeof match.date === 'string') {
      // Si c'est une string, essayer de la convertir
      const dateObj = new Date(match.date)
      if (!isNaN(dateObj.getTime())) {
        dateString = dateObj.toISOString().split('T')[0]
      } else {
        // Si la conversion échoue, utiliser la string directement si elle est au format YYYY-MM-DD
        dateString = match.date.split('T')[0]
      }
    } else {
      // Fallback: essayer de créer une date
      const dateObj = new Date(match.date as any)
      if (!isNaN(dateObj.getTime())) {
        dateString = dateObj.toISOString().split('T')[0]
      }
    }
    
    setFormData({
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      date: dateString,
      time: match.time,
      location: match.location,
    })
    setShowForm(true)
    
    // Scroll vers le formulaire après un court délai pour laisser le DOM se mettre à jour
    setTimeout(() => {
      const formElement = document.querySelector('[data-preseason-form]')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) {
      return 'Date invalide'
    }
    return dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      finished: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }
    const labels = {
      upcoming: 'À venir',
      in_progress: 'En cours',
      finished: 'Terminé',
    }
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Matchs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Créez et gérez les matchs de présaison
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingMatch(null)
            setFormData({ teamAId: '', teamBId: '', date: '', time: '', location: '' })
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau Match
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" data-preseason-form>
          <h3 className="text-lg font-semibold mb-4">
            {editingMatch ? 'Modifier le match' : 'Nouveau match'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Équipe A</label>
                <select
                  value={formData.teamAId}
                  onChange={(e) => setFormData({ ...formData, teamAId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">Sélectionner une équipe</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Équipe B</label>
                <select
                  value={formData.teamBId}
                  onChange={(e) => setFormData({ ...formData, teamBId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">Sélectionner une équipe</option>
                  {teams
                    .filter((team) => team.id !== formData.teamAId)
                    .map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Heure</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Lieu</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Ex: Terrain principal"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingMatch ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingMatch(null)
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Matches List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lieu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Aucun match créé
                  </td>
                </tr>
              ) : (
                matches.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{formatDate(match.date)}</div>
                          <div className="text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {match.time}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {match.teamAName} vs {match.teamBName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        {match.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(match.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {match.status === 'finished' ? (
                        <div>
                          <div className="font-medium">
                            {match.scoreA} - {match.scoreB}
                          </div>
                          {match.penaltiesA !== undefined && match.penaltiesB !== undefined && (
                            <div className="text-xs text-gray-500">
                              (P: {match.penaltiesA} - {match.penaltiesB})
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {match.status !== 'finished' && (
                          <button
                            onClick={() => handleEdit(match)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(match.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  )
}

