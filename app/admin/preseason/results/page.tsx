'use client'

import { useState, useEffect } from 'react'
import { Trophy, Save, Calendar, Clock, MapPin } from 'lucide-react'
import type { PreseasonMatch } from '@/lib/types'
import { PreseasonResultForm } from '@/components/preseason/preseason-result-form'

export default function PreseasonResultsPage() {
  const [matches, setMatches] = useState<PreseasonMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<PreseasonMatch | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/preseason/results')
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (result: any) => {
    try {
      setSubmitting(true)
      const response = await fetch('/api/preseason/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch!.id,
          ...result,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la soumission')
      }

      await loadMatches()
      setSelectedMatch(null)
      alert('Résultat enregistré avec succès')
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (selectedMatch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedMatch(null)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ← Retour à la liste
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Saisie des résultats
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {selectedMatch.teamAName} vs {selectedMatch.teamBName}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(selectedMatch.date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{selectedMatch.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{selectedMatch.location}</span>
              </div>
            </div>
          </div>

          <PreseasonResultForm
            match={selectedMatch}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Saisie des Résultats
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Enregistrez les résultats des matchs de présaison avec tous les détails
        </p>
      </div>

      {/* Matches List */}
      {matches.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun match disponible pour la saisie des résultats</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedMatch(match)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(match.date)}</span>
                    <Clock className="w-4 h-4 ml-2" />
                    <span>{match.time}</span>
                    <MapPin className="w-4 h-4 ml-2" />
                    <span>{match.location}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {match.teamAName} vs {match.teamBName}
                  </h3>
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                    match.status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {match.status === 'in_progress' ? 'En cours' : 'À venir'}
                  </span>
                </div>
                <div className="ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedMatch(match)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Saisir le résultat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
