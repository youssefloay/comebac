'use client'

import { useState, useEffect } from 'react'
import { Trophy, Save } from 'lucide-react'
import type { PreseasonMatch } from '@/lib/types'

export default function PreseasonResultsPage() {
  const [matches, setMatches] = useState<PreseasonMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, {
    scoreA: number
    scoreB: number
    penaltiesA?: number
    penaltiesB?: number
  }>>({})

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

  const handleResultChange = (matchId: string, field: string, value: number) => {
    setResults((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (match: PreseasonMatch) => {
    const result = results[match.id]
    if (!result || result.scoreA === undefined || result.scoreB === undefined) {
      alert('Veuillez remplir les scores')
      return
    }

    // Check if it's a draw and penalties are required
    if (result.scoreA === result.scoreB) {
      if (result.penaltiesA === undefined || result.penaltiesB === undefined) {
        alert('En cas d\'égalité, les tirs au but sont requis')
        return
      }
      if (result.penaltiesA === result.penaltiesB) {
        alert('Les tirs au but ne peuvent pas être égaux')
        return
      }
    }

    try {
      setSubmitting(match.id)
      const response = await fetch('/api/preseason/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          scoreA: result.scoreA,
          scoreB: result.scoreB,
          penaltiesA: result.penaltiesA,
          penaltiesB: result.penaltiesB,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la soumission')
      }

      await loadMatches()
      setResults((prev) => {
        const newResults = { ...prev }
        delete newResults[match.id]
        return newResults
      })
      alert('Résultat enregistré avec succès')
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la soumission')
    } finally {
      setSubmitting(null)
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          Enregistrez les résultats des matchs de présaison
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
          {matches.map((match) => {
            const result = results[match.id] || { scoreA: 0, scoreB: 0 }
            const isDraw = result.scoreA === result.scoreB

            return (
              <div
                key={match.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">
                    {formatDate(match.date)} à {match.time} - {match.location}
                  </div>
                  <h3 className="text-lg font-semibold">
                    {match.teamAName} vs {match.teamBName}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Score */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Score</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={result.scoreA}
                        onChange={(e) =>
                          handleResultChange(match.id, 'scoreA', parseInt(e.target.value) || 0)
                        }
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 text-center"
                        placeholder="0"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        min="0"
                        value={result.scoreB}
                        onChange={(e) =>
                          handleResultChange(match.id, 'scoreB', parseInt(e.target.value) || 0)
                        }
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 text-center"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Penalties (only if draw) */}
                  {isDraw && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Tirs au but <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={result.penaltiesA || ''}
                          onChange={(e) =>
                            handleResultChange(
                              match.id,
                              'penaltiesA',
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 text-center"
                          placeholder="0"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          min="0"
                          value={result.penaltiesB || ''}
                          onChange={(e) =>
                            handleResultChange(
                              match.id,
                              'penaltiesB',
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 text-center"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Points explanation */}
                {isDraw && result.penaltiesA !== undefined && result.penaltiesB !== undefined && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <div className="font-medium mb-1">Points attribués :</div>
                    <div>
                      {result.penaltiesA > result.penaltiesB ? (
                        <>
                          <strong>{match.teamAName}</strong> : 2 pts (victoire aux tirs au but)
                          <br />
                          <strong>{match.teamBName}</strong> : 1 pt (défaite aux tirs au but)
                        </>
                      ) : (
                        <>
                          <strong>{match.teamAName}</strong> : 1 pt (défaite aux tirs au but)
                          <br />
                          <strong>{match.teamBName}</strong> : 2 pts (victoire aux tirs au but)
                        </>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleSubmit(match)}
                  disabled={submitting === match.id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting === match.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enregistrer le résultat
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

