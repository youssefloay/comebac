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

type TabType = "teams" | "players" | "matches" | "results" | "statistics"

export default function Dashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<TabType>("teams")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleLogout = async () => {
    await signOut(auth)
  }

  const handleInitializeData = async () => {
    setIsSeeding(true)
    setSeedMessage(null)
    try {
      const response = await fetch("/api/seed", { method: "POST" })
      const data = await response.json()
      if (response.ok) {
        setSeedMessage({ type: "success", text: "Données de test créées avec succès!" })
        setActiveTab("teams")
      } else {
        setSeedMessage({ type: "error", text: data.error || "Erreur lors de la création des données" })
      }
    } catch (error) {
      setSeedMessage({ type: "error", text: "Erreur de connexion" })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleClearData = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer toutes les données (équipes, joueurs, matchs) ? Cette action est irréversible.")) {
      return
    }
    
    setIsSeeding(true)
    setSeedMessage(null)
    try {
      const response = await fetch("/api/admin/clear-data", { method: "DELETE" })
      const data = await response.json()
      if (response.ok) {
        setSeedMessage({ type: "success", text: data.message || "Toutes les données ont été supprimées!" })
        setActiveTab("teams")
      } else {
        setSeedMessage({ type: "error", text: data.error || "Erreur lors de la suppression des données" })
      }
    } catch (error) {
      setSeedMessage({ type: "error", text: "Erreur de connexion" })
    } finally {
      setIsSeeding(false)
    }
  }



  const handleGenerateMatches = async () => {
    if (!confirm("Générer automatiquement tous les matchs ? Cela supprimera les matchs existants.")) {
      return
    }

    setIsSeeding(true)
    setSeedMessage(null)
    try {
      const response = await fetch("/api/admin/generate-matches", { method: "POST" })
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

  const handleCreateTestMatch = async () => {
    setIsSeeding(true)
    setSeedMessage(null)
    try {
      const response = await fetch("/api/admin/create-test-match", { method: "POST" })
      const data = await response.json()
      if (response.ok) {
        setSeedMessage({ type: "success", text: data.message })
        setActiveTab("matches")
      } else {
        setSeedMessage({ type: "error", text: data.error || "Erreur lors de la création du match de test" })
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
    { id: "matches", label: "Matchs", icon: "📅" },
    { id: "results", label: "Résultats", icon: "📊" },
    { id: "statistics", label: "Statistiques", icon: "📈" },
  ]

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
            onClick={handleCreateTestMatch}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 rounded-lg transition text-sm font-medium"
          >
            {isSeeding ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {sidebarOpen && <span>Création...</span>}
              </>
            ) : (
              <>
                <span>🧪</span>
                {sidebarOpen && <span>Match test</span>}
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
            onClick={handleInitializeData}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 rounded-lg transition text-sm font-medium"
          >
            {isSeeding ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {sidebarOpen && <span>Initialisation...</span>}
              </>
            ) : (
              <>
                <span>🌱</span>
                {sidebarOpen && <span>Données test</span>}
              </>
            )}
          </button>
          <button
            onClick={handleClearData}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 rounded-lg transition text-sm font-medium"
          >
            <span>🗑️</span>
            {sidebarOpen && <span>Vider données</span>}
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
        <div className="flex-1 overflow-auto p-8">
          {activeTab === "teams" && <TeamsTab />}
          {activeTab === "players" && <PlayersTab />}
          {activeTab === "matches" && <MatchesTab />}
          {activeTab === "results" && <ResultsTab />}
          {activeTab === "statistics" && <StatisticsTab />}
        </div>
      </div>
    </div>
  )
}
