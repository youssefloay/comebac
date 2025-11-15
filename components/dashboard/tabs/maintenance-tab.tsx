"use client"

import { useState, useEffect } from "react"
import { Loader, Wrench, CheckCircle, AlertCircle } from "lucide-react"

interface Team {
  id: string
  name: string
}

export default function MaintenanceTab() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [isCoach, setIsCoach] = useState(false)
  const [playerData, setPlayerData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    email: '',
    phone: '',
    birthDate: '',
    height: '',
    tshirtSize: 'M',
    position: '',
    foot: '',
    jerseyNumber: ''
  })

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/admin/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error('Erreur chargement équipes:', error)
    }
  }

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

  const handleDeleteTeam = async () => {
    if (teams.length === 0) {
      alert('Aucune équipe disponible')
      return
    }

    const teamList = teams.map((t, i) => `${i + 1}. ${t.name}`).join('\n')
    const teamIndex = prompt(`Sélectionnez l'équipe à supprimer:\n\n${teamList}\n\nEntrez le numéro:`)
    
    if (!teamIndex) return
    
    const index = parseInt(teamIndex) - 1
    if (index < 0 || index >= teams.length) {
      alert('Numéro invalide')
      return
    }

    const selectedTeam = teams[index]

    if (!confirm(
      `⚠️ SUPPRIMER COMPLÈTEMENT "${selectedTeam.name}"?\n\n` +
      `Cela supprimera DÉFINITIVEMENT:\n` +
      `✅ Tous les joueurs\n` +
      `✅ Tous les coaches\n` +
      `✅ Tous les comptes Firebase Auth\n` +
      `✅ Tous les matchs\n` +
      `✅ Toutes les statistiques\n` +
      `✅ Tous les résultats\n` +
      `✅ Toutes les compositions\n` +
      `✅ Tous les favoris\n\n` +
      `Cette action est IRRÉVERSIBLE!`
    )) {
      return
    }

    const confirmation = prompt(`Tapez "SUPPRIMER" en majuscules pour confirmer:`)
    if (confirmation !== 'SUPPRIMER') {
      alert('Suppression annulée')
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/delete-team-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeam.id, teamName: selectedTeam.name })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const report = data.report
        let msg = `✅ Équipe "${selectedTeam.name}" supprimée!\n`
        msg += `${report.players.length} joueur(s), ${report.coaches.length} coach(es), `
        msg += `${report.firebaseAccounts.length} compte(s) Firebase supprimés`
        setMessage({ type: 'success', text: msg })
        await loadTeams()
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la suppression' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
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

        {/* Détecter les doublons */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-red-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Détecter les doublons</h3>
              <p className="text-xs text-gray-600">Emails multiples</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Trouve les emails utilisés dans plusieurs collections (joueurs, entraîneurs, users)
          </p>
          <button
            onClick={() => window.location.href = '/admin/duplicates'}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
          >
            Voir les doublons
          </button>
        </div>

        {/* Mettre à jour infos appareils */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Infos appareils</h3>
              <p className="text-xs text-gray-600">Initialisation</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Initialise les informations d'appareil pour les comptes existants
          </p>
          <button
            onClick={async () => {
              if (!confirm('Initialiser les infos d\'appareil pour tous les comptes ?')) return
              setLoading(true)
              setMessage(null)
              try {
                const response = await fetch('/api/admin/update-device-info', { method: 'POST' })
                const data = await response.json()
                if (response.ok) {
                  setMessage({ type: 'success', text: data.message })
                } else {
                  setMessage({ type: 'error', text: data.error })
                }
              } catch (error) {
                setMessage({ type: 'error', text: 'Erreur de connexion' })
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium text-sm"
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

        {/* Synchroniser noms d'équipes */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚽</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Synchroniser équipes</h3>
              <p className="text-xs text-gray-600">Noms partout</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Met à jour les noms d'équipes dans toutes les collections (joueurs, matchs, résultats)
          </p>
          <button
            onClick={async () => {
              if (!confirm('Synchroniser les noms d\'équipes partout ?')) return
              setLoading(true)
              setMessage(null)
              try {
                const response = await fetch('/api/admin/sync-team-names', { method: 'POST' })
                const data = await response.json()
                if (response.ok) {
                  setMessage({ type: 'success', text: data.message })
                } else {
                  setMessage({ type: 'error', text: data.error })
                }
              } catch (error) {
                setMessage({ type: 'error', text: 'Erreur de connexion' })
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-medium text-sm"
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

        {/* Remplacer un email */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-pink-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Remplacer un email</h3>
              <p className="text-xs text-gray-600">Partout</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Remplace un email dans toutes les collections
          </p>
          <button
            onClick={async () => {
              const oldEmail = prompt('Ancien email à remplacer:')
              if (!oldEmail) return
              
              const newEmail = prompt('Nouveau email:')
              if (!newEmail) return
              
              if (!confirm(`Remplacer "${oldEmail}" par "${newEmail}" partout ?`)) return
              
              setLoading(true)
              setMessage(null)
              try {
                const response = await fetch('/api/admin/replace-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ oldEmail, newEmail })
                })
                const data = await response.json()
                if (response.ok) {
                  setMessage({ type: 'success', text: data.message })
                } else {
                  setMessage({ type: 'error', text: data.error })
                }
              } catch (error) {
                setMessage({ type: 'error', text: 'Erreur de connexion' })
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400 transition font-medium text-sm"
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

        {/* Corriger @gmaill.com */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✉️</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Corriger @gmaill.com</h3>
              <p className="text-xs text-gray-600">Double "l"</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Corrige les emails avec @gmaill.com (double l) en @gmail.com
          </p>
          <button
            onClick={async () => {
              if (!confirm('Corriger tous les emails @gmaill.com → @gmail.com ?')) return
              setLoading(true)
              setMessage(null)
              try {
                const response = await fetch('/api/admin/fix-gmaill', { method: 'POST' })
                const data = await response.json()
                if (response.ok) {
                  setMessage({ type: 'success', text: data.message })
                } else {
                  setMessage({ type: 'error', text: data.error })
                }
              } catch (error) {
                setMessage({ type: 'error', text: 'Erreur de connexion' })
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium text-sm"
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

        {/* Définir les capitaines depuis inscriptions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-yellow-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👑</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Définir capitaines</h3>
              <p className="text-xs text-gray-600">Depuis inscriptions</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Définit les capitaines selon les informations du formulaire d'inscription
          </p>
          <button
            onClick={async () => {
              if (!confirm('Définir les capitaines depuis les inscriptions validées ?')) return
              setLoading(true)
              setMessage(null)
              try {
                const response = await fetch('/api/admin/set-captains-from-registration', { method: 'POST' })
                const data = await response.json()
                if (response.ok) {
                  setMessage({ type: 'success', text: data.message })
                } else {
                  setMessage({ type: 'error', text: data.error })
                }
              } catch (error) {
                setMessage({ type: 'error', text: 'Erreur de connexion' })
              } finally {
                setLoading(false)
              }
            }}
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

        {/* Mettre à jour nom d'équipe dans inscriptions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-cyan-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Nom équipe inscription</h3>
              <p className="text-xs text-gray-600">teamRegistrations</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Met à jour le nom d'une équipe dans les inscriptions validées
          </p>
          <button
            onClick={async () => {
              const oldName = prompt('Ancien nom de l\'équipe:')
              if (!oldName) return
              
              const newName = prompt('Nouveau nom de l\'équipe:')
              if (!newName) return
              
              if (!confirm(`Mettre à jour "${oldName}" → "${newName}" dans les inscriptions ?`)) return
              
              setLoading(true)
              setMessage(null)
              try {
                const response = await fetch('/api/admin/update-team-name-in-registration', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ oldName, newName })
                })
                const data = await response.json()
                if (response.ok) {
                  setMessage({ type: 'success', text: data.message })
                } else {
                  setMessage({ type: 'error', text: data.error })
                }
              } catch (error) {
                setMessage({ type: 'error', text: 'Erreur de connexion' })
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 transition font-medium text-sm"
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

        {/* Mettre à jour email Firebase Auth */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-amber-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Mettre à jour Auth</h3>
              <p className="text-xs text-gray-600">Firebase Auth uniquement</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Met à jour un email dans Firebase Auth seulement (si déjà changé dans Firestore)
          </p>
          <button
            onClick={async () => {
              const oldEmail = prompt('Ancien email dans Firebase Auth:')
              if (!oldEmail) return
              
              const newEmail = prompt('Nouveau email:')
              if (!newEmail) return
              
              if (!confirm(`Mettre à jour Firebase Auth: "${oldEmail}" → "${newEmail}" ?`)) return
              
              setLoading(true)
              setMessage(null)
              try {
                const response = await fetch('/api/admin/update-auth-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ oldEmail, newEmail })
                })
                const data = await response.json()
                if (response.ok) {
                  setMessage({ type: 'success', text: data.message })
                } else {
                  setMessage({ type: 'error', text: data.error })
                }
              } catch (error) {
                setMessage({ type: 'error', text: 'Erreur de connexion' })
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 transition font-medium text-sm"
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

        {/* Envoyer emails aux comptes jamais connectés */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📬</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Emails jamais connectés</h3>
              <p className="text-xs text-gray-600">Rappel d'activation</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Envoie un email de rappel à tous les comptes qui ne se sont jamais connectés
          </p>
          <button
            onClick={async () => {
              if (!confirm(
                '📧 Envoyer des emails de rappel\n\n' +
                'Cette action va envoyer un email à tous les comptes (joueurs et coaches) qui ne se sont jamais connectés.\n\n' +
                'L\'email contiendra:\n' +
                '• Un lien pour créer leur mot de passe\n' +
                '• Les informations de contact (email, WhatsApp, Instagram)\n\n' +
                'Continuer?'
              )) return
              
              setLoading(true)
              setMessage(null)
              try {
                const response = await fetch('/api/admin/send-never-logged-in-emails', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ dryRun: false })
                })
                const data = await response.json()
                if (response.ok) {
                  const sent = data.results.filter((r: any) => r.status === 'sent').length
                  const failed = data.results.filter((r: any) => r.status === 'failed').length
                  setMessage({ 
                    type: 'success', 
                    text: `✅ ${sent} email(s) envoyé(s) sur ${data.totalFound} compte(s) jamais connecté(s)${failed > 0 ? ` (${failed} échec(s))` : ''}`
                  })
                } else {
                  setMessage({ type: 'error', text: data.error })
                }
              } catch (error) {
                setMessage({ type: 'error', text: 'Erreur de connexion' })
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition font-medium text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </span>
            ) : (
              "Envoyer"
            )}
          </button>
        </div>

        {/* Supprimer une équipe complètement */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-red-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🗑️</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Supprimer une équipe</h3>
              <p className="text-xs text-gray-600">Suppression complète</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Supprime complètement une équipe avec tous ses joueurs, coaches et comptes Firebase
          </p>
          <button
            onClick={handleDeleteTeam}
            disabled={loading || teams.length === 0}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Suppression...
              </span>
            ) : (
              "Supprimer"
            )}
          </button>
        </div>

        {/* Statistiques d'utilisation */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Stats d'utilisation</h3>
              <p className="text-xs text-gray-600">Notifications & Fantasy</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Voir qui a activé les notifications et qui clique sur Fantasy
          </p>
          <button
            onClick={() => window.location.href = '/admin/stats'}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
          >
            Voir les statistiques
          </button>
        </div>

        {/* Prévisualiser les emails */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-sky-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📬</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Prévisualiser emails</h3>
              <p className="text-xs text-gray-600">Templates</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Voir les templates d'emails envoyés aux joueurs et coaches
          </p>
          <button
            onClick={() => window.location.href = '/admin/email-preview'}
            className="w-full px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-medium text-sm"
          >
            Voir les templates
          </button>
        </div>

        {/* Ajouter un joueur/coach */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">➕</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Ajouter joueur/coach</h3>
              <p className="text-xs text-gray-600">À une équipe validée</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Ajouter un joueur ou entraîneur à une équipe déjà validée
          </p>
          <button
            onClick={() => setShowAddPlayerModal(true)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
          >
            Ajouter
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

      {/* Modal Ajouter joueur/coach */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddPlayerModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Ajouter un {isCoach ? 'entraîneur' : 'joueur'}</h2>
            
            {/* Type */}
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isCoach}
                  onChange={(e) => setIsCoach(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">C'est un entraîneur</span>
              </label>
            </div>

            {/* Équipe */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Équipe *</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Sélectionner une équipe</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Formulaire */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prénom *</label>
                <input
                  type="text"
                  value={playerData.firstName}
                  onChange={(e) => setPlayerData({...playerData, firstName: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nom *</label>
                <input
                  type="text"
                  value={playerData.lastName}
                  onChange={(e) => setPlayerData({...playerData, lastName: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              {!isCoach && (
                <div>
                  <label className="block text-sm font-medium mb-2">Surnom</label>
                  <input
                    type="text"
                    value={playerData.nickname}
                    onChange={(e) => setPlayerData({...playerData, nickname: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    maxLength={15}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={playerData.email}
                  onChange={(e) => setPlayerData({...playerData, email: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone *</label>
                <input
                  type="tel"
                  value={playerData.phone}
                  onChange={(e) => setPlayerData({...playerData, phone: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date de naissance</label>
                <input
                  type="date"
                  value={playerData.birthDate}
                  onChange={(e) => setPlayerData({...playerData, birthDate: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              {!isCoach && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Taille (cm)</label>
                    <input
                      type="number"
                      value={playerData.height}
                      onChange={(e) => setPlayerData({...playerData, height: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Taille T-shirt</label>
                    <select
                      value={playerData.tshirtSize}
                      onChange={(e) => setPlayerData({...playerData, tshirtSize: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Position *</label>
                    <select
                      value={playerData.position}
                      onChange={(e) => setPlayerData({...playerData, position: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Gardien">Gardien</option>
                      <option value="Défenseur">Défenseur</option>
                      <option value="Milieu">Milieu</option>
                      <option value="Attaquant">Attaquant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Pied *</label>
                    <select
                      value={playerData.foot}
                      onChange={(e) => setPlayerData({...playerData, foot: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Droitier">Droitier</option>
                      <option value="Gaucher">Gaucher</option>
                      <option value="Ambidextre">Ambidextre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">N° Maillot *</label>
                    <input
                      type="number"
                      value={playerData.jerseyNumber}
                      onChange={(e) => setPlayerData({...playerData, jerseyNumber: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      min="1"
                      max="99"
                      required
                    />
                  </div>
                </>
              )}
            </div>

            {/* Boutons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddPlayerModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!selectedTeamId || !playerData.firstName || !playerData.lastName || !playerData.email || !playerData.phone) {
                    alert('Veuillez remplir tous les champs obligatoires')
                    return
                  }
                  if (!isCoach && (!playerData.position || !playerData.foot || !playerData.jerseyNumber)) {
                    alert('Veuillez remplir tous les champs obligatoires du joueur')
                    return
                  }
                  
                  setLoading(true)
                  try {
                    const response = await fetch('/api/admin/add-player-to-team', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        teamId: selectedTeamId,
                        player: playerData,
                        isCoach
                      })
                    })
                    
                    const data = await response.json()
                    if (response.ok) {
                      setMessage({ type: 'success', text: data.message })
                      setShowAddPlayerModal(false)
                      setPlayerData({
                        firstName: '',
                        lastName: '',
                        nickname: '',
                        email: '',
                        phone: '',
                        birthDate: '',
                        height: '',
                        tshirtSize: 'M',
                        position: '',
                        foot: '',
                        jerseyNumber: ''
                      })
                      setSelectedTeamId('')
                      setIsCoach(false)
                    } else {
                      setMessage({ type: 'error', text: data.error })
                    }
                  } catch (error) {
                    setMessage({ type: 'error', text: 'Erreur lors de l\'ajout' })
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Ajout en cours...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
