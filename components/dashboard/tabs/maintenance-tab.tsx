"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader, Wrench, CheckCircle, AlertCircle } from "lucide-react"
import CustomNotificationModal from "@/components/admin/CustomNotificationModal"

interface Team {
  id: string
  name: string
  schoolName?: string
  teamGrade?: string
  school?: string
}

interface PlayerAccount {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  phone?: string
  position?: string
  jerseyNumber?: number
  birthDate?: string
  height?: string
  tshirtSize?: string
  foot?: string
  nickname?: string
}

interface CoachAccount {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  phone?: string
  birthDate?: string
}

export default function MaintenanceTab() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [isCoach, setIsCoach] = useState(false)
  const [editingAccount, setEditingAccount] = useState<{ id: string; type: 'player' | 'coach'; data: PlayerAccount | CoachAccount } | null>(null)
  const [teamAccounts, setTeamAccounts] = useState<{ players: PlayerAccount[]; coaches: CoachAccount[] }>({ players: [], coaches: [] })
  const [showForm, setShowForm] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (selectedTeamId) {
      loadTeamAccounts()
    } else {
      setTeamAccounts({ players: [], coaches: [] })
    }
  }, [selectedTeamId])

  // Scroll vers le formulaire quand il s'ouvre
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [showForm])

  // Récupérer l'équipe sélectionnée
  const selectedTeam = selectedTeamId ? teams.find(t => t.id === selectedTeamId) : null

  const loadTeamAccounts = async () => {
    if (!selectedTeamId) return
    try {
      const response = await fetch('/api/admin/team-accounts')
      if (response.ok) {
        const data = await response.json()
        const team = data.teams?.find((t: any) => t.id === selectedTeamId)
        if (team) {
          setTeamAccounts({
            players: team.players || [],
            coaches: team.coaches || []
          })
        }
      }
    } catch (error) {
      console.error('Erreur chargement comptes:', error)
    }
  }

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

  const handleCreateMissingAccounts = async () => {
    if (!confirm(
      "👥 Créer les comptes manquants\n\n" +
      "Cette action va créer des comptes pour tous les joueurs qui sont dans l'équipe mais n'ont pas encore de compte.\n\n" +
      "Continuer?"
    )) {
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/create-missing-accounts", { method: "POST" })
      const data = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: data.message })
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de la création des comptes" })
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

        {/* Créer comptes manquants */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Créer comptes manquants</h3>
              <p className="text-xs text-gray-600">Joueurs sans compte</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Crée les comptes pour les joueurs qui sont dans une équipe mais n'ont pas encore de compte
          </p>
          <button
            onClick={handleCreateMissingAccounts}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Traitement...
              </span>
            ) : (
              "Créer les comptes"
            )}
          </button>
        </div>

        {/* Comptes par équipe */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Comptes par équipe</h3>
              <p className="text-xs text-gray-600">Connexion & activations</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Liste les joueurs connectés, jamais connectés ou sans compte pour chaque équipe
          </p>
          <button
            onClick={() => router.push('/admin/team-accounts')}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
          >
            Ouvrir la page
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

        {/* Nettoyer doublons users */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧹</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Nettoyer doublons users</h3>
              <p className="text-xs text-gray-600">Users basiques</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Supprime les comptes "users" basiques si l'email existe déjà en tant que joueur ou coach
          </p>
          <button
            onClick={async () => {
              if (!confirm(
                '🧹 Nettoyer les doublons users\n\n' +
                'Cette action va supprimer les comptes dans la collection "users" ' +
                'si le même email existe déjà dans "playerAccounts" ou "coachAccounts".\n\n' +
                'Continuer?'
              )) return
              
              setLoading(true)
              setMessage(null)
              try {
                const response = await fetch('/api/admin/clean-duplicate-users', { method: 'POST' })
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
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition font-medium text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Traitement...
              </span>
            ) : (
              "Nettoyer"
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
            onClick={() => {
              // Utiliser setTimeout pour éviter de bloquer l'UI
              setTimeout(async () => {
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
              }, 0)
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
            onClick={() => {
              setEditingAccount(null)
              setIsCoach(false)
              setShowForm(false)
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
              setTeamAccounts({ players: [], coaches: [] })
              setShowAddPlayerModal(true)
            }}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
          >
            Gérer joueurs/coaches
          </button>
        </div>

        {/* Envoyer notification personnalisée */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📢</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Notification personnalisée</h3>
              <p className="text-xs text-gray-600">Avec suivi de lecture</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Envoyer une notification à tous, joueurs, coaches ou une équipe spécifique avec suivi
          </p>
          <button
            onClick={() => setShowNotificationModal(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            Envoyer
          </button>
        </div>

        {/* Voir statistiques notifications */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Suivi notifications</h3>
              <p className="text-xs text-gray-600">Qui a lu quoi</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Voir qui a lu les notifications, taux de lecture, statistiques détaillées
          </p>
          <button
            onClick={() => window.location.href = '/admin/notification-tracking'}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
          >
            Voir les stats
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

      {/* Modal Notification personnalisée */}
      <CustomNotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        teams={teams}
      />

      {/* Modal Gérer joueurs/coaches */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => {
          setShowAddPlayerModal(false)
          setEditingAccount(null)
          setShowForm(false)
        }}>
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {editingAccount ? `Modifier ${editingAccount.type === 'coach' ? 'l\'entraîneur' : 'le joueur'}` : 'Gérer joueurs/coaches'}
              </h2>
              <button
                onClick={() => {
                  setShowAddPlayerModal(false)
                  setEditingAccount(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Sélection équipe */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Équipe *</label>
              <select
                value={selectedTeamId}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value)
                  setEditingAccount(null)
                }}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Sélectionner une équipe</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Liste des joueurs/coaches si équipe sélectionnée */}
            {selectedTeamId && (
              <div className="mb-6 space-y-4">
                {/* Liste des joueurs */}
                {teamAccounts.players.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Joueurs ({teamAccounts.players.length})</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {teamAccounts.players.map((player) => (
                        <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-gray-600">{player.email}</p>
                            {player.position && <p className="text-xs text-gray-500">#{player.jerseyNumber} - {player.position}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                setIsCoach(false)
                                setShowForm(true)
                                setLoading(true)
                                try {
                                  // Charger les données complètes du joueur
                                  const response = await fetch(`/api/admin/get-account-details?accountId=${player.id}&accountType=player`)
                                  const accountData = await response.json()
                                  
                                  if (response.ok && accountData) {
                                    setEditingAccount({ id: player.id, type: 'player', data: accountData })
                                    setPlayerData({
                                      firstName: accountData.firstName || '',
                                      lastName: accountData.lastName || '',
                                      nickname: accountData.nickname || '',
                                      email: accountData.email || '',
                                      phone: accountData.phone || '',
                                      birthDate: accountData.birthDate || '',
                                      height: accountData.height?.toString() || '',
                                      tshirtSize: accountData.tshirtSize || 'M',
                                      position: accountData.position || '',
                                      foot: accountData.foot || '',
                                      jerseyNumber: accountData.jerseyNumber?.toString() || ''
                                    })
                                  } else {
                                    // Fallback sur les données disponibles
                                    setEditingAccount({ id: player.id, type: 'player', data: player })
                                    setPlayerData({
                                      firstName: player.firstName || '',
                                      lastName: player.lastName || '',
                                      nickname: player.nickname || '',
                                      email: player.email || '',
                                      phone: player.phone || '',
                                      birthDate: player.birthDate || '',
                                      height: player.height?.toString() || '',
                                      tshirtSize: player.tshirtSize || 'M',
                                      position: player.position || '',
                                      foot: player.foot || '',
                                      jerseyNumber: player.jerseyNumber?.toString() || ''
                                    })
                                  }
                                } catch (error) {
                                  console.error('Erreur chargement données:', error)
                                  // Fallback sur les données disponibles
                                  setEditingAccount({ id: player.id, type: 'player', data: player })
                                  setPlayerData({
                                    firstName: player.firstName || '',
                                    lastName: player.lastName || '',
                                    nickname: player.nickname || '',
                                    email: player.email || '',
                                    phone: player.phone || '',
                                    birthDate: player.birthDate || '',
                                    height: player.height?.toString() || '',
                                    tshirtSize: player.tshirtSize || 'M',
                                    position: player.position || '',
                                    foot: player.foot || '',
                                    jerseyNumber: player.jerseyNumber?.toString() || ''
                                  })
                                } finally {
                                  setLoading(false)
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Supprimer ${player.name} ?`)) return
                                setLoading(true)
                                try {
                                  const response = await fetch('/api/admin/delete-account', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      accountId: player.id,
                                      accountType: 'player',
                                      email: player.email
                                    })
                                  })
                                  const data = await response.json()
                                  if (response.ok) {
                                    setMessage({ type: 'success', text: data.message })
                                    loadTeamAccounts()
                                  } else {
                                    setMessage({ type: 'error', text: data.error })
                                  }
                                } catch (error) {
                                  setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
                                } finally {
                                  setLoading(false)
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste des coaches */}
                {teamAccounts.coaches.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Coaches ({teamAccounts.coaches.length})</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {teamAccounts.coaches.map((coach) => (
                        <div key={coach.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium">{coach.name}</p>
                            <p className="text-sm text-gray-600">{coach.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                setIsCoach(true)
                                setShowForm(true)
                                setLoading(true)
                                try {
                                  // Charger les données complètes du coach
                                  const response = await fetch(`/api/admin/get-account-details?accountId=${coach.id}&accountType=coach`)
                                  const accountData = await response.json()
                                  
                                  if (response.ok && accountData) {
                                    setEditingAccount({ id: coach.id, type: 'coach', data: accountData })
                                    setPlayerData({
                                      firstName: accountData.firstName || '',
                                      lastName: accountData.lastName || '',
                                      nickname: '',
                                      email: accountData.email || '',
                                      phone: accountData.phone || '',
                                      birthDate: accountData.birthDate || '',
                                      height: '',
                                      tshirtSize: 'M',
                                      position: '',
                                      foot: '',
                                      jerseyNumber: ''
                                    })
                                  } else {
                                    // Fallback sur les données disponibles
                                    setEditingAccount({ id: coach.id, type: 'coach', data: coach })
                                    setPlayerData({
                                      firstName: coach.firstName || '',
                                      lastName: coach.lastName || '',
                                      nickname: '',
                                      email: coach.email || '',
                                      phone: coach.phone || '',
                                      birthDate: coach.birthDate || '',
                                      height: '',
                                      tshirtSize: 'M',
                                      position: '',
                                      foot: '',
                                      jerseyNumber: ''
                                    })
                                  }
                                } catch (error) {
                                  console.error('Erreur chargement données:', error)
                                  // Fallback sur les données disponibles
                                  setEditingAccount({ id: coach.id, type: 'coach', data: coach })
                                  setPlayerData({
                                    firstName: coach.firstName || '',
                                    lastName: coach.lastName || '',
                                    nickname: '',
                                    email: coach.email || '',
                                    phone: coach.phone || '',
                                    birthDate: coach.birthDate || '',
                                    height: '',
                                    tshirtSize: 'M',
                                    position: '',
                                    foot: '',
                                    jerseyNumber: ''
                                  })
                                } finally {
                                  setLoading(false)
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Supprimer ${coach.name} ?`)) return
                                setLoading(true)
                                try {
                                  const response = await fetch('/api/admin/delete-account', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      accountId: coach.id,
                                      accountType: 'coach',
                                      email: coach.email
                                    })
                                  })
                                  const data = await response.json()
                                  if (response.ok) {
                                    setMessage({ type: 'success', text: data.message })
                                    loadTeamAccounts()
                                  } else {
                                    setMessage({ type: 'error', text: data.error })
                                  }
                                } catch (error) {
                                  setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
                                } finally {
                                  setLoading(false)
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Boutons ajouter et modifier */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditingAccount(null)
                      setIsCoach(false)
                      setShowForm(true)
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
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + Ajouter un joueur
                  </button>
                  <button
                    onClick={() => {
                      setEditingAccount(null)
                      setIsCoach(true)
                      setShowForm(true)
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
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    + Ajouter un coach
                  </button>
                  {(teamAccounts.players.length > 0 || teamAccounts.coaches.length > 0) && (
                    <button
                      onClick={() => {
                        // Afficher un message pour guider l'utilisateur
                        if (teamAccounts.players.length === 0 && teamAccounts.coaches.length === 0) {
                          alert('Aucun joueur ou coach à modifier. Ajoutez-en d\'abord.')
                          return
                        }
                        // Si un seul joueur, le modifier directement
                        if (teamAccounts.players.length === 1 && teamAccounts.coaches.length === 0) {
                          const player = teamAccounts.players[0]
                          setIsCoach(false)
                          setShowForm(true)
                          setLoading(true)
                          fetch(`/api/admin/get-account-details?accountId=${player.id}&accountType=player`)
                            .then(res => res.json())
                            .then(accountData => {
                              if (accountData && accountData.id) {
                                setEditingAccount({ id: player.id, type: 'player', data: accountData })
                                setPlayerData({
                                  firstName: accountData.firstName || '',
                                  lastName: accountData.lastName || '',
                                  nickname: accountData.nickname || '',
                                  email: accountData.email || '',
                                  phone: accountData.phone || '',
                                  birthDate: accountData.birthDate || '',
                                  height: accountData.height?.toString() || '',
                                  tshirtSize: accountData.tshirtSize || 'M',
                                  position: accountData.position || '',
                                  foot: accountData.foot || '',
                                  jerseyNumber: accountData.jerseyNumber?.toString() || ''
                                })
                              }
                            })
                            .catch(err => console.error('Erreur:', err))
                            .finally(() => setLoading(false))
                        } else if (teamAccounts.coaches.length === 1 && teamAccounts.players.length === 0) {
                          const coach = teamAccounts.coaches[0]
                          setIsCoach(true)
                          setShowForm(true)
                          setLoading(true)
                          fetch(`/api/admin/get-account-details?accountId=${coach.id}&accountType=coach`)
                            .then(res => res.json())
                            .then(accountData => {
                              if (accountData && accountData.id) {
                                setEditingAccount({ id: coach.id, type: 'coach', data: accountData })
                                setPlayerData({
                                  firstName: accountData.firstName || '',
                                  lastName: accountData.lastName || '',
                                  nickname: '',
                                  email: accountData.email || '',
                                  phone: accountData.phone || '',
                                  birthDate: accountData.birthDate || '',
                                  height: '',
                                  tshirtSize: 'M',
                                  position: '',
                                  foot: '',
                                  jerseyNumber: ''
                                })
                              }
                            })
                            .catch(err => console.error('Erreur:', err))
                            .finally(() => setLoading(false))
                        } else {
                          // S'il y a plusieurs joueurs/coaches, afficher un message
                          alert('Il y a plusieurs joueurs/coaches. Veuillez cliquer sur "Modifier" à côté de celui que vous souhaitez modifier dans la liste ci-dessus.')
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      ✏️ Modifier
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Formulaire d'ajout/modification */}
            {selectedTeamId && showForm && (
              <div ref={formRef} className="mt-6 border-t-2 border-gray-200 pt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">{editingAccount ? '✏️ Modifier' : '➕ Ajouter'} un {isCoach ? 'entraîneur' : 'joueur'}</h3>
            
            {/* Type - seulement si on ajoute (pas en mode édition) */}
            {!editingAccount && (
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
            )}

            {/* Infos de l'équipe sélectionnée */}
            {selectedTeam && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Informations de l'équipe</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Équipe:</span> {selectedTeam.name}</p>
                  {(selectedTeam.schoolName || selectedTeam.school) && (
                    <p><span className="font-medium">École:</span> {selectedTeam.schoolName || selectedTeam.school}</p>
                  )}
                  {selectedTeam.teamGrade && (
                    <p><span className="font-medium">Classe:</span> {selectedTeam.teamGrade}</p>
                  )}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  ℹ️ Le joueur/coach sera {editingAccount ? 'modifié' : 'ajouté'} à cette équipe avec ces informations communes
                </p>
              </div>
            )}

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
                onClick={() => {
                  setShowForm(false)
                  setEditingAccount(null)
                }}
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
                    if (editingAccount) {
                      // Mode modification
                      const response = await fetch('/api/admin/update-account', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          accountId: editingAccount.id,
                          accountType: editingAccount.type,
                          teamId: selectedTeamId,
                          updates: {
                            firstName: playerData.firstName,
                            lastName: playerData.lastName,
                            email: playerData.email,
                            phone: playerData.phone,
                            birthDate: playerData.birthDate,
                            ...(isCoach ? {} : {
                              nickname: playerData.nickname,
                              height: playerData.height,
                              tshirtSize: playerData.tshirtSize,
                              foot: playerData.foot,
                              position: playerData.position,
                              jerseyNumber: parseInt(playerData.jerseyNumber) || 0
                            })
                          }
                        })
                      })
                      
                      const data = await response.json()
                      if (response.ok) {
                        setMessage({ type: 'success', text: `${editingAccount.type === 'coach' ? 'Entraîneur' : 'Joueur'} modifié avec succès!` })
                        setEditingAccount(null)
                        setShowForm(false)
                        loadTeamAccounts()
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
                      } else {
                        setMessage({ type: 'error', text: data.error })
                      }
                    } else {
                      // Mode ajout
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
                        setShowForm(false)
                        loadTeamAccounts()
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
                        setIsCoach(false)
                      } else {
                        setMessage({ type: 'error', text: data.error })
                      }
                    }
                  } catch (error) {
                    setMessage({ type: 'error', text: `Erreur lors de ${editingAccount ? 'la modification' : 'l\'ajout'}` })
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (editingAccount ? 'Modification en cours...' : 'Ajout en cours...') : (editingAccount ? 'Modifier' : 'Ajouter')}
              </button>
            </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
