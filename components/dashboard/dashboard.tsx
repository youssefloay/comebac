"use client"

import { useState } from "react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Menu, LogOut } from "lucide-react"
import TeamsTab from "./tabs/teams-tab"
import PlayersTab from "./tabs/players-tab"
import MatchesTab from "./tabs/matches-tab"
import ResultsTab from "./tabs/results-tab"
import StatisticsTab from "./tabs/statistics-tab"

type TabType = "teams" | "players" | "matches" | "results" | "statistics"

export default function Dashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<TabType>("teams")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = async () => {
    await signOut(auth)
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

        <div className="p-4 border-t border-gray-200">
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
          <div className="text-sm text-gray-600">
            Connecté en tant que: <span className="font-semibold text-gray-900">{user.email}</span>
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
