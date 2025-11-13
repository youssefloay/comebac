"use client"

import { useState } from "react"
import { Loader, Wrench, CheckCircle, AlertCircle } from "lucide-react"

export default function MaintenanceTab() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleCapitalizeData = async () => {
    if (!confirm(
      "📝 Capitaliser tous les noms\n\n" +
      "Cette action va mettre en majuscule la première lettre de:\n" +
      "• Noms et prénoms des joueurs\n" +
      "• Noms et prénoms des entraîneurs\n" +
      "• Noms des équipes et écoles\n\n" +
      "Continuer?"
    )) {
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/capitalize-data", { method: "POST" })
      const data = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: data.message })
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de la capitalisation" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur de connexion" })
    } finally {
      setLoading(false)
    }
  }

  const handleFixEmails = async () => {
    if (!confirm(
      "📧 Corriger les emails\n\n" +
      "Cette action va corriger les fautes de frappe dans les emails:\n" +
      "• @outlool → @outlook\n" +
      "• @gmai → @gmail\n" +
      "• @yahooo → @yahoo\n" +
      "• @hotmial → @hotmail\n\n" +
      "Continuer?"
    )) {
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/fix-emails", { method: "POST" })
      const data = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: data.message })
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de la correction" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur de connexion" })
    } finally {
      setLoading(false)
    }
  }

  const handleFixMatchStatus = async () => {
    if (!confirm("Corriger le statut des matchs qui ont des résultats ?")) {
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch("/api/fix-match-status", { method: "POST" })
      const data = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: data.message })
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de la correction du statut" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur de connexion" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Outils de Réparation</h2>
        <p className="text-gray-600">Outils de maintenance et correction des données</p>
      </div>

      {/* Message de résultat */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                message.type === "success" ? "text-green-800" : "text-red-800"
              }`}
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Outils de réparation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Capitaliser les noms */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Capitaliser les noms</h3>
              <p className="text-xs text-gray-600">Mettre en majuscule</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Met en majuscule la première lettre des noms, prénoms et noms d'équipes
          </p>
          <button
            onClick={handleCapitalizeData}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-medium text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Traitement...
              </span>
            ) : (
              "Exécuter"
            )}
          </button>
        </div>

        {/* Corriger les emails */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-teal-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📧</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Corriger les emails</h3>
              <p className="text-xs text-gray-600">Fautes de frappe</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Corrige les fautes courantes: @outlool → @outlook, @gmai → @gmail
          </p>
          <button
            onClick={handleFixEmails}
            disabled={loading}
            className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition font-medium text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Traitement...
              </span>
            ) : (
              "Exécuter"
            )}
          </button>
        </div>

        {/* Corriger statuts matchs */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-yellow-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔧</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Corriger statuts matchs</h3>
              <p className="text-xs text-gray-600">Synchronisation</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Met à jour le statut des matchs qui ont des résultats
          </p>
          <button
            onClick={handleFixMatchStatus}
            disabled={loading}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition font-medium text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Traitement...
              </span>
            ) : (
              "Exécuter"
            )}
          </button>
        </div>
      </div>

      {/* Avertissement */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Wrench className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-orange-900 mb-1">⚠️ Attention</h4>
            <p className="text-sm text-orange-800">
              Ces outils modifient directement la base de données. Assurez-vous de comprendre ce que fait chaque outil avant de l'exécuter.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
