"use client"

import { useState } from "react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Menu, LogOut, Loader } from "lucide-react"
import TeamsTab from "./tabs/teams-tab"
import PlayersTab from "./tabs/players-tab"
import MatchesTab from "./tabs/matches-tab"
import ResultsTab from "./tabs/results-tab"
import StatisticsTab from "./tabs/statistics-tab"
import LineupsTab from "./tabs/lineups-tab"
import ActivityTab from "./tabs/activity-tab"
import MaintenanceTab from "./tabs/maintenance-tab"

type TabType = "teams" | "players" | "matches" | "results" | "statistics" | "lineups" | "registrations" | "archives" | "activity" | "accounts" | "maintenance"

export default function Dashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<TabType>("teams")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleLogout = async () => {
    await signOut(auth)
  }

  const handleGenerateMatches = async () => {
    // Demander la date du premier match
    const dateInput = prompt(
      "📅 Date du premier match (jeudi)\n\nFormat: JJ/MM/AAAA\nExemple: 15/01/2025"
    )
    
    if (!dateInput) return

    // Demander l'heure
    const timeInput = prompt(
      "⏰ Heure des matchs\n\nFormat: HH:MM\nExemple: 16:00"
    )
    
    if (!timeInput) return

    // Demander le nombre de matchs par jeudi
    const matchesPerDayInput = prompt(
      "⚽ Combien de matchs par jeudi?\n\nPar défaut: 1\n(Entrez un nombre entre 1 et 10)"
    )
    
    const matchesPerDay = matchesPerDayInput ? parseInt(matchesPerDayInput) : 1
    
    if (isNaN(matchesPerDay) || matchesPerDay < 1 || matchesPerDay > 10) {
      alert("❌ Nombre invalide. Utilisez un nombre entre 1 et 10")
      return
    }

    // Valider le format de date
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const dateMatch = dateInput.match(dateRegex)
    if (!dateMatch) {
      alert("❌ Format de date invalide. Utilisez JJ/MM/AAAA")
      return
    }

    // Valider le format d'heure
    const timeRegex = /^(\d{2}):(\d{2})$/
    const timeMatch = timeInput.match(timeRegex)
    if (!timeMatch) {
      alert("❌ Format d'heure invalide. Utilisez HH:MM")
      return
    }

    const [, day, month, year] = dateMatch
    const [, hours, minutes] = timeMatch
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes))

    // Vérifier que c'est un jeudi
    if (startDate.getDay() !== 4) {
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
      alert(`❌ Cette date est un ${dayNames[startDate.getDay()]}. Les matchs doivent être le jeudi.`)
      return
    }

    if (!confirm(
      `🏆 Générer les matchs\n\n` +
      `📅 Premier match: ${dateInput} à ${timeInput}\n` +
      `⚽ ${matchesPerDay} match(s) par jeudi\n` +
      `📆 Tous les jeudis suivants à ${timeInput}\n\n` +
      `Les matchs existants ne seront pas supprimés.\n\n` +
      `Continuer?`
    )) {
      return
    }

    setIsSeeding(true)
    setSeedMessage(null)
    try {
      const response = await fetch("/api/admin/generate-matches", { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          startDate: startDate.toISOString(),
          time: timeInput,
          matchesPerDay: matchesPerDay
        })
      })
      const data = await response.json()
      if (response.ok) {
        setSeedMessage({ type: "success", text: data.message })
        setActiveTab("matches")
      } else {
        setSeedMessage({ type: "error", text: data.error || "Erreur lors de la génération des matchs" })
      }
    } catch (error) {
      setSeedMessage({ type: "error", text: "Erreur de connexion" })
    } finally {
      setIsSeeding(false)
    }
  }





  const tabs = [
    { id: "teams", label: "Équipes", icon: "⚽" },
    { id: "players", label: "Joueurs", icon: "👥" },
    { id: "lineups", label: "Compositions", icon: "🎯" },
    { id: "matches", label: "Matchs", icon: "📅" },
    { id: "results", label: "Résultats", icon: "📊" },
    { id: "statistics", label: "Statistiques", icon: "📈" },
    { id: "activity", label: "Activité", icon: "🔔" },
    { id: "maintenance", label: "Réparations", icon: "🔧" },
    { id: "accounts", label: "Comptes", icon: "👤" },
    { id: "registrations", label: "Inscriptions", icon: "📝" },
    { id: "archives", label: "Archives", icon: "📦" },
  ]

  const handleGoToRegistrations = () => {
    window.location.href = '/admin/team-registrations'
  }

  const handleEndSeason = async () => {
    const seasonName = prompt(
      '🏁 FIN DE SAISON\n\nDonnez un nom à cette saison pour l\'archiver:\n(ex: "Saison 2024-2025", "Championnat Automne 2024")'
    )
    
    if (!seasonName) return

    if (!confirm(
      `⚠️ ATTENTION: Fin de saison "${seasonName}"\n\n` +
      `Cette action va:\n` +
      `✅ Archiver toutes les données actuelles\n` +
      `✅ Garder les équipes et joueurs\n` +
      `🗑️ Supprimer tous les matchs et résultats\n` +
      `🔄 Réinitialiser toutes les statistiques à 0\n\n` +
      `Les archives seront accessibles pour consultation.\n\n` +
      `Continuer?`
    )) {
      return
    }

    setIsSeeding(true)
    setSeedMessage(null)
    
    try {
      const response = await fetch('/api/admin/end-season', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonName })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSeedMessage({ 
          type: 'success', 
          text: `${data.message}\n${data.summary.totalMatches} matchs, ${data.summary.totalResults} résultats archivés.`
        })
        setActiveTab('teams')
      } else {
        setSeedMessage({ 
          type: 'error', 
          text: data.error || 'Erreur lors de la fin de saison' 
        })
      }
    } catch (error) {
      setSeedMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className={`font-bold text-primary ${sidebarOpen ? "text-xl" : "text-center text-lg"}`}>
            {sidebarOpen ? "⚽ Ligue" : "⚽"}
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === tab.id ? "bg-primary-light text-primary font-semibold" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => window.location.href = '/admin/search'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition text-sm font-medium"
          >
            <span>🔍</span>
            {sidebarOpen && <span>Recherche rapide</span>}
          </button>
          <button
            onClick={() => window.location.href = '/admin/impersonate'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition text-sm font-medium"
          >
            <span>👤</span>
            {sidebarOpen && <span>Se faire passer pour...</span>}
          </button>
          <button
            onClick={handleGoToRegistrations}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition text-sm font-medium"
          >
            <span>📝</span>
            {sidebarOpen && <span>Inscriptions</span>}
          </button>
          <button
            onClick={handleEndSeason}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 rounded-lg transition text-sm font-medium"
          >
            {isSeeding ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {sidebarOpen && <span>Archivage...</span>}
              </>
            ) : (
              <>
                <span>🏁</span>
                {sidebarOpen && <span>Fin de saison</span>}
              </>
            )}
          </button>
          <button
            onClick={handleGenerateMatches}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition text-sm font-medium"
          >
            {isSeeding ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {sidebarOpen && <span>Génération...</span>}
              </>
            ) : (
              <>
                <span>⚽</span>
                {sidebarOpen && <span>Générer matchs</span>}
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-4">
            {seedMessage && (
              <div
                className={`text-sm px-4 py-2 rounded-lg ${
                  seedMessage.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {seedMessage.text}
              </div>
            )}
            <div className="text-sm text-gray-600">
              Connecté en tant que: <span className="font-semibold text-gray-900">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-8 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {activeTab === "teams" && <TeamsTab />}
          {activeTab === "players" && <PlayersTab />}
          {activeTab === "lineups" && <LineupsTab />}
          {activeTab === "matches" && <MatchesTab />}
          {activeTab === "results" && <ResultsTab />}
          {activeTab === "statistics" && <StatisticsTab />}
          {activeTab === "activity" && <ActivityTab />}
          {activeTab === "maintenance" && <MaintenanceTab />}
          {activeTab === "accounts" && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestion des Comptes</h2>
              <p className="text-gray-600 mb-6">Gérez les rôles et les équipes des utilisateurs</p>
              <button
                onClick={() => window.location.href = '/admin/accounts'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                👤 Gérer les comptes
              </button>
            </div>
          )}
          {activeTab === "registrations" && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Inscriptions d'Équipes</h2>
              <p className="text-gray-600 mb-6">Gérez les demandes d'inscription des équipes</p>
              <button
                onClick={handleGoToRegistrations}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                📝 Voir les inscriptions
              </button>
            </div>
          )}
          {activeTab === "archives" && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Archives des Saisons</h2>
              <p className="text-gray-600 mb-6">Consultez les statistiques des saisons passées</p>
              <button
                onClick={() => window.location.href = '/admin/archives'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                📦 Voir les archives
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
