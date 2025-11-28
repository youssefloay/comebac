"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader, Wrench, CheckCircle, AlertCircle, X } from "lucide-react"
import CustomNotificationModal from "@/components/admin/CustomNotificationModal"

interface Team {
  id: string
  name: string
  schoolName?: string
  teamGrade?: string
  school?: string
}

export default function MaintenanceTab() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  const [showTeamSelectModal, setShowTeamSelectModal] = useState(false)
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
    nickname: true,
    number: true,
    tshirtSize: true,
    fullName: false,
    email: false,
    phone: false,
    position: false,
    height: false,
    birthDate: false,
    teamName: false,
    grade: false,
    foot: false
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

        {/* Joueurs dans plusieurs équipes */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Joueurs dans 2 équipes</h3>
              <p className="text-xs text-gray-600">Détection & réparation</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Détecte les joueurs inscrits dans plusieurs équipes et permet de les retirer d'une équipe
          </p>
          <button
            onClick={() => router.push('/admin/duplicate-players')}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium text-sm"
          >
            Voir et réparer
          </button>
        </div>

        {/* Comparer deux équipes */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Comparer deux équipes</h3>
              <p className="text-xs text-gray-600">Joueurs communs</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Compare deux équipes pour trouver les joueurs présents dans les deux équipes
          </p>
          <button
            onClick={() => router.push('/admin/compare-teams')}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
          >
            Comparer
          </button>
        </div>

        {/* Envoyer liens mise à jour max joueurs */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📧</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Mise à jour max joueurs</h3>
              <p className="text-xs text-gray-600">Passer à 11 joueurs</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Envoie un lien de mise à jour aux équipes déjà enregistrées pour passer le maximum de 10 à 11 joueurs
          </p>
          <button
            onClick={async () => {
              if (!confirm('Envoyer un lien de mise à jour à toutes les équipes enregistrées ?\n\nCela permettra aux équipes de mettre à jour leur inscription pour passer de 10 à 11 joueurs maximum.')) return
              setLoading(true)
              setMessage(null)
              try {
                const response = await fetch('/api/admin/send-update-links', { method: 'POST' })
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
                Envoi en cours...
              </span>
            ) : (
              "Envoyer les liens"
            )}
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

        {/* Exporter équipes en Excel - BOUTON VISIBLE */}
        <div className="bg-white rounded-xl p-6 border-2 border-green-500 hover:border-green-600 transition-colors shadow-xl" style={{ minHeight: '200px' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Exporter équipes Excel</h3>
              <p className="text-xs text-gray-600">Surnom, numéro, taille</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Exporte une ou plusieurs équipes dans un fichier Excel. Chaque équipe aura sa propre feuille avec le surnom, numéro et taille de t-shirt de chaque joueur.
          </p>
          <button
            onClick={() => {
              console.log('🔘 Bouton cliqué, teams:', teams.length)
              if (teams.length === 0) {
                alert('Aucune équipe disponible. Veuillez recharger la page.')
                return
              }
              console.log('🔘 Ouverture modal')
              setShowTeamSelectModal(true)
            }}
            disabled={loading}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold text-base shadow-lg"
            style={{ minHeight: '48px' }}
          >
            {teams.length === 0 ? 'Chargement...' : "📊 Choisir les équipes"}
          </button>
        </div>

        {/* Modal de sélection d'équipes */}
        {showTeamSelectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Export Excel - Configuration</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedTeamIds.length > 0 
                      ? `${selectedTeamIds.length} équipe(s) sélectionnée(s)`
                      : 'Sélectionnez les équipes et colonnes à exporter'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTeamSelectModal(false)
                    setSelectedTeamIds([])
                    // Réinitialiser les colonnes aux valeurs par défaut
                    setSelectedColumns({
                      nickname: true,
                      number: true,
                      tshirtSize: true,
                      fullName: false,
                      email: false,
                      phone: false,
                      position: false,
                      height: false,
                      birthDate: false,
                      teamName: false,
                      grade: false,
                      foot: false
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Sélection des colonnes */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Colonnes à exporter</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries({
                    nickname: 'Surnom',
                    fullName: 'Nom complet',
                    number: 'Numéro',
                    tshirtSize: 'Taille T-shirt',
                    email: 'Email',
                    phone: 'Téléphone',
                    position: 'Position',
                    height: 'Taille (cm)',
                    birthDate: 'Date de naissance',
                    teamName: 'Équipe',
                    grade: 'Classe',
                    foot: 'Pied fort'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColumns[key] || false}
                        onChange={(e) => {
                          setSelectedColumns({
                            ...selectedColumns,
                            [key]: e.target.checked
                          })
                        }}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      const allSelected = Object.keys(selectedColumns).reduce((acc, key) => {
                        acc[key] = true
                        return acc
                      }, {} as Record<string, boolean>)
                      setSelectedColumns(allSelected)
                    }}
                    className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={() => {
                      const allUnselected = Object.keys(selectedColumns).reduce((acc, key) => {
                        acc[key] = false
                        return acc
                      }, {} as Record<string, boolean>)
                      setSelectedColumns(allUnselected)
                    }}
                    className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              {/* Sélection des équipes */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-3">Équipes à exporter</h4>
                <div className="mb-3 flex gap-2">
                  <button
                    onClick={() => {
                      if (selectedTeamIds.length === teams.length) {
                        setSelectedTeamIds([])
                      } else {
                        setSelectedTeamIds(teams.map(t => t.id))
                      }
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    {selectedTeamIds.length === teams.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {teams.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Chargement des équipes...</p>
                  </div>
                ) : (
                  teams.map((team) => {
                    const isSelected = selectedTeamIds.includes(team.id)
                    return (
                      <label
                        key={team.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition cursor-pointer ${
                          isSelected
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeamIds([...selectedTeamIds, team.id])
                            } else {
                              setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.id))
                            }
                          }}
                          className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{team.name}</div>
                          {team.schoolName && (
                            <div className="text-sm text-gray-600">{team.schoolName}</div>
                          )}
                        </div>
                      </label>
                    )
                  })
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTeamSelectModal(false)
                    setSelectedTeamIds([])
                    // Réinitialiser les colonnes aux valeurs par défaut
                    setSelectedColumns({
                      nickname: true,
                      number: true,
                      tshirtSize: true,
                      fullName: false,
                      email: false,
                      phone: false,
                      position: false,
                      height: false,
                      birthDate: false,
                      teamName: false,
                      grade: false,
                      foot: false
                    })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    if (selectedTeamIds.length === 0) {
                      alert('Veuillez sélectionner au moins une équipe')
                      return
                    }

                    setShowTeamSelectModal(false)
                    setLoading(true)
                    setMessage(null)
                    
                    try {
                      // Vérifier qu'au moins une colonne est sélectionnée
                      const selectedCols = Object.entries(selectedColumns)
                        .filter(([_, selected]) => selected)
                        .map(([key, _]) => key)
                      
                      if (selectedCols.length === 0) {
                        alert('Veuillez sélectionner au moins une colonne à exporter')
                        return
                      }

                      // Envoyer les IDs séparés par des virgules et les colonnes
                      const teamIdsParam = selectedTeamIds.join(',')
                      const columnsParam = selectedCols.join(',')
                      const response = await fetch(`/api/admin/export/teams-excel?teamIds=${teamIdsParam}&columns=${columnsParam}`)
                      if (response.ok) {
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `equipes_${new Date().toISOString().split('T')[0]}.xlsx`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                        setMessage({ type: 'success', text: `Export Excel réussi ! ${selectedTeamIds.length} équipe(s) exportée(s).` })
                      } else {
                        const data = await response.json()
                        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'export' })
                      }
                    } catch (error) {
                      setMessage({ type: 'error', text: 'Erreur de connexion' })
                    } finally {
                      setLoading(false)
                      setSelectedTeamIds([])
                    }
                  }}
                  disabled={selectedTeamIds.length === 0 || loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Export...
                    </span>
                  ) : (
                    `Exporter ${selectedTeamIds.length > 0 ? `(${selectedTeamIds.length})` : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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

      {/* Section Export/Import */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📥 Export / Import de données</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Export Équipes */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📤</span>
              </div>
          <div>
                <h3 className="font-bold text-gray-900">Export Équipes</h3>
                <p className="text-xs text-gray-600">Format CSV</p>
          </div>
        </div>
            <p className="text-sm text-gray-600 mb-4">
              Télécharger toutes les équipes au format CSV
            </p>
              <button
                onClick={() => {
                window.location.href = '/api/admin/export/teams'
                }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
              >
              Exporter CSV
              </button>
            </div>
            
          {/* Export Joueurs */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📤</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Export Joueurs</h3>
                <p className="text-xs text-gray-600">Format CSV</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Télécharger tous les joueurs au format CSV
            </p>
            <button
              onClick={() => {
                window.location.href = '/api/admin/export/players'
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            >
              Exporter CSV
            </button>
            </div>

          {/* Export Matchs */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📤</span>
              </div>
                  <div>
                <h3 className="font-bold text-gray-900">Export Matchs</h3>
                <p className="text-xs text-gray-600">Format CSV</p>
                          </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Télécharger tous les matchs au format CSV
            </p>
                            <button
              onClick={() => {
                window.location.href = '/api/admin/export/matches'
              }}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
            >
              Exporter CSV
                            </button>
          </div>

          {/* Export Résultats */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📤</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Export Résultats</h3>
                <p className="text-xs text-gray-600">Format CSV</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Télécharger tous les résultats au format CSV
            </p>
                            <button
              onClick={() => {
                window.location.href = '/api/admin/export/results'
              }}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium text-sm"
            >
              Exporter CSV
                            </button>
                          </div>

          {/* Export Complet */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-red-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💾</span>
                        </div>
              <div>
                <h3 className="font-bold text-gray-900">Backup Complet</h3>
                <p className="text-xs text-gray-600">Format JSON</p>
                    </div>
                  </div>
            <p className="text-sm text-gray-600 mb-4">
              Télécharger toutes les données (équipes, joueurs, matchs, résultats) en JSON
            </p>
            <button
              onClick={() => {
                window.location.href = '/api/admin/export/all'
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
            >
              Exporter Backup
            </button>
          </div>

          {/* Backup Automatique avec Upload */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
                  <div>
                <h3 className="font-bold text-gray-900">Backup Automatique</h3>
                <p className="text-xs text-gray-600">100% Gratuit</p>
                          </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Créer un backup complet et le sauvegarder automatiquement (local ou email)
            </p>
            <div className="space-y-2">
                            <button
                              onClick={async () => {
                  setBackupLoading(true)
                  setMessage(null)
                  try {
                    const response = await fetch('/api/admin/backup', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ destination: 'local', upload: true })
                    })
                    const data = await response.json()
                    if (response.ok) {
                      setMessage({ 
                        type: 'success', 
                        text: `✅ Backup créé et sauvegardé localement!\n${data.backup?.sizeMB} MB - ${data.backup?.totalDocuments} documents` 
                      })
                    } else {
                      setMessage({ type: 'error', text: data.error || 'Erreur lors du backup' })
                                  }
                                } catch (error) {
                    setMessage({ type: 'error', text: 'Erreur de connexion' })
                                } finally {
                    setBackupLoading(false)
                  }
                }}
                disabled={backupLoading}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {backupLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Backup en cours...
                  </>
                ) : (
                  '💾 Sauvegarder Localement'
                )}
                            </button>
                            <button
                              onClick={async () => {
                  setBackupLoading(true)
                  setMessage(null)
                                try {
                    const response = await fetch('/api/admin/backup', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ destination: 'email', upload: true })
                                  })
                                  const data = await response.json()
                                  if (response.ok) {
                      setMessage({ 
                        type: 'success', 
                        text: `✅ Backup envoyé par email!\nVérifiez votre boîte mail.` 
                      })
                                  } else {
                      setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'envoi' })
                                  }
                                } catch (error) {
                    setMessage({ type: 'error', text: 'Erreur de connexion' })
                                } finally {
                    setBackupLoading(false)
                  }
                }}
                disabled={backupLoading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {backupLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  '📧 Envoyer par Email'
                )}
                  </button>
                  <button
                    onClick={() => {
                  window.location.href = '/api/admin/backup'
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-sm"
              >
                📥 Télécharger Directement
                  </button>
                </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tous les backups sont 100% gratuits
                </p>
              </div>

          {/* Import Joueurs */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-cyan-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📥</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Import Joueurs</h3>
                <p className="text-xs text-gray-600">Format CSV</p>
              </div>
                </div>
            <p className="text-sm text-gray-600 mb-4">
              Importer des joueurs depuis un fichier CSV
            </p>
                <input
              type="file"
              accept=".csv"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return

                const formData = new FormData()
                formData.append('file', file)
                  
                  setLoading(true)
                setMessage(null)
                  try {
                  const response = await fetch('/api/admin/import/players', {
                        method: 'POST',
                    body: formData
                      })
                      
                      const data = await response.json()
                      if (response.ok) {
                    let msg = `✅ Import réussi!\n`
                    msg += `${data.created} joueur(s) créé(s)\n`
                    msg += `${data.updated} joueur(s) mis à jour`
                    if (data.errors && data.errors.length > 0) {
                      msg += `\n\n⚠️ ${data.errors.length} erreur(s):\n${data.errors.slice(0, 5).join('\n')}`
                      if (data.errors.length > 5) {
                        msg += `\n... et ${data.errors.length - 5} autre(s)`
                      }
                    }
                    setMessage({ type: 'success', text: msg })
                    } else {
                    setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'import' })
                    }
                  } catch (error) {
                  setMessage({ type: 'error', text: 'Erreur de connexion' })
                  } finally {
                    setLoading(false)
                  // Reset input
                  e.target.value = ''
                }
              }}
              className="hidden"
              id="import-players-file"
            />
            <label
              htmlFor="import-players-file"
              className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-medium text-sm cursor-pointer flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Import...
                </span>
              ) : (
                'Importer CSV'
              )}
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Colonnes requises: Email, Prénom, Nom
            </p>
          </div>
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
    </div>
  )
}
