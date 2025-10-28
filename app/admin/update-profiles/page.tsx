"use client"

import { useState } from "react"
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

export default function UpdateProfilesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    totalPlayers?: number
    updatedPlayers?: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpdateProfiles = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/update-player-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to update profiles')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError("Erreur lors de la mise à jour des profils")
      console.error("Error updating profiles:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Mise à jour des profils joueurs
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Cette action va mettre à jour tous les joueurs existants avec les nouvelles informations personnelles :
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-6">
              <li>Date de naissance et âge</li>
              <li>Taille et poids</li>
              <li>École et classe</li>
              <li>Ville de naissance</li>
              <li>Matière préférée</li>
              <li>Langues parlées</li>
              <li>Pied fort</li>
              <li>Années d'expérience</li>
              <li>Positions alternatives</li>
              <li>Numéro préféré</li>
              <li>Note générale</li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">{result.message}</p>
                {result.totalPlayers && result.updatedPlayers !== undefined && (
                  <p className="text-green-700 text-sm mt-1">
                    {result.updatedPlayers} joueurs mis à jour sur {result.totalPlayers} au total
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleUpdateProfiles}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Mise à jour en cours..." : "Mettre à jour les profils"}
          </button>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Note :</strong> Cette opération ne modifiera que les joueurs qui n'ont pas encore 
              les nouvelles informations personnelles. Les joueurs déjà mis à jour ne seront pas affectés.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}