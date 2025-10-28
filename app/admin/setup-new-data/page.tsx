"use client"

import { useState } from "react"
import { RefreshCw, CheckCircle, AlertCircle, Trash2, Users, School } from "lucide-react"

export default function SetupNewDataPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const resetDatabase = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to reset database')
      const data = await response.json()
      setResult({ ...data, step: 'reset' })
    } catch (err) {
      setError("Erreur lors de la réinitialisation")
      console.error("Error resetting database:", err)
    } finally {
      setLoading(false)
    }
  }

  const createTestTeams = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/create-test-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to create teams')
      const data = await response.json()
      setResult({ ...data, step: 'teams' })
    } catch (err) {
      setError("Erreur lors de la création des équipes")
      console.error("Error creating teams:", err)
    } finally {
      setLoading(false)
    }
  }

  const createTestPlayers = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/create-test-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to create players')
      const data = await response.json()
      setResult({ ...data, step: 'players' })
    } catch (err) {
      setError("Erreur lors de la création des joueurs")
      console.error("Error creating players:", err)
    } finally {
      setLoading(false)
    }
  }

  const setupCompleteDatabase = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Étape 1: Reset
      setResult({ step: 'resetting', message: 'Suppression des anciennes données...' })
      await fetch('/api/admin/reset-database', { method: 'POST' })

      // Étape 2: Créer les équipes
      setResult({ step: 'creating-teams', message: 'Création des équipes...' })
      await fetch('/api/admin/create-test-teams', { method: 'POST' })

      // Étape 3: Créer les joueurs
      setResult({ step: 'creating-players', message: 'Création des joueurs...' })
      const playersResponse = await fetch('/api/admin/create-test-players', { method: 'POST' })
      const playersData = await playersResponse.json()

      setResult({ 
        step: 'complete', 
        message: 'Configuration terminée avec succès!',
        ...playersData
      })
    } catch (err) {
      setError("Erreur lors de la configuration complète")
      console.error("Error in complete setup:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Configuration des nouvelles données FIFA
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Cette page permet de configurer la base de données avec les nouvelles cartes FIFA 
              qui affichent les informations personnelles au lieu des statistiques FIFA classiques.
            </p>
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
                {result.step === 'complete' && (
                  <p className="text-green-700 text-sm mt-1">
                    {result.players} joueurs créés dans {result.teams} équipes
                  </p>
                )}
                {result.step === 'reset' && result.deleted && (
                  <p className="text-green-700 text-sm mt-1">
                    Supprimé: {result.deleted.players} joueurs, {result.deleted.teams} équipes
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Configuration complète */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Configuration complète
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Supprime toutes les données existantes et crée de nouvelles équipes et joueurs 
                avec les informations personnelles.
              </p>
              <button
                onClick={setupCompleteDatabase}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? "Configuration..." : "Configuration complète"}
              </button>
            </div>

            {/* Actions individuelles */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Actions individuelles</h3>
              <div className="space-y-2">
                <button
                  onClick={resetDatabase}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer toutes les données
                </button>
                
                <button
                  onClick={createTestTeams}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  <School className="w-4 h-4" />
                  Créer les équipes
                </button>
                
                <button
                  onClick={createTestPlayers}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  <Users className="w-4 h-4" />
                  Créer les joueurs
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Note :</strong> La configuration complète supprimera toutes les données existantes 
              (équipes, joueurs, matchs, résultats) et créera de nouvelles données de test avec 
              les informations personnelles des joueurs.
            </p>
          </div>

          <div className="mt-6 text-center">
            <a 
              href="/test-fifa-card" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
            >
              Voir un exemple de carte FIFA →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}