"use client"

import { useState, lazy, Suspense, useEffect } from "react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Menu, LogOut, Loader, X } from "lucide-react"
import TeamsTab from "./tabs/teams-tab"
import PlayersTab from "./tabs/players-tab"
import MatchesTab from "./tabs/matches-tab"
import ResultsTab from "./tabs/results-tab"
import LineupsTab from "./tabs/lineups-tab"
import ActivityTab from "./tabs/activity-tab"
import MiniLeagueTab from "./tabs/mini-league-tab"
import WaitingListTab from "./tabs/waiting-list-tab"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAdminI18n } from "@/lib/i18n/admin-i18n-context"

// Lazy load des composants lourds pour améliorer les performances
const StatisticsTab = lazy(() => import("./tabs/statistics-tab"))
const MaintenanceTab = lazy(() => import("./tabs/maintenance-tab"))
const AccountsTab = lazy(() => import("./tabs/accounts-tab"))
const ShopTab = lazy(() => import("./tabs/shop-tab"))
const SpectatorsTab = lazy(() => import("./tabs/spectators-tab"))

type TabType = "teams" | "players" | "matches" | "results" | "statistics" | "lineups" | "registrations" | "archives" | "activity" | "accounts" | "maintenance" | "test-matches" | "mini-league" | "waiting-list" | "shop" | "preseason" | "spectators"

export default function Dashboard({ user }: { user: any }) {
  const { t, language } = useAdminI18n()
  const [activeTab, setActiveTab] = useState<TabType>("teams")
  const [sidebarOpen, setSidebarOpen] = useState(false) // Fermé par défaut sur mobile
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showFinalsModal, setShowFinalsModal] = useState(false)

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Sur desktop, sidebar ouverte par défaut
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Écouter les événements pour ouvrir le modal depuis Mini-League
  useEffect(() => {
    const handleOpenGenerateModal = (event: CustomEvent) => {
      setShowGenerateModal(true)
      if (event.detail?.mode) {
        setGenerateFormData(prev => ({
          ...prev,
          mode: event.detail.mode as 'CLASSIC' | 'MINI_LEAGUE',
          isTest: true // Mode test par défaut
        }))
      }
    }

    window.addEventListener('openGenerateModal', handleOpenGenerateModal as EventListener)
    return () => window.removeEventListener('openGenerateModal', handleOpenGenerateModal as EventListener)
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
  }

  const [finalsFormData, setFinalsFormData] = useState({
    finalDate: '',
    time: '16:00'
  })

  const handleGenerateFinals = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!finalsFormData.finalDate || !finalsFormData.time) {
      setSeedMessage({ type: "error", text: "Veuillez remplir tous les champs requis" })
      return
    }

    // Parse date and time
    const [year, month, day] = finalsFormData.finalDate.split('-').map(Number)
    const finalDate = new Date(year, month - 1, day)

    // Vérifier que c'est un jeudi
    if (finalDate.getDay() !== 4) {
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
      setSeedMessage({ type: "error", text: `Cette date est un ${dayNames[finalDate.getDay()]}. Les finales doivent être le jeudi.` })
      return
    }

    setIsSeeding(true)
    setSeedMessage(null)
    setShowFinalsModal(false)
    
    try {
      const response = await fetch("/api/admin/generate-finals", { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          finalDate: finalDate.toISOString(),
          time: finalsFormData.time
        })
      })
      const data = await response.json()
      if (response.ok) {
        setSeedMessage({ type: "success", text: data.message })
        setActiveTab("matches")
        if (isMobile) setSidebarOpen(false)
        // Reset form
        setFinalsFormData({
          finalDate: '',
          time: '16:00'
        })
      } else {
        setSeedMessage({ type: "error", text: data.error || "Erreur lors de la génération des finales" })
      }
    } catch (error) {
      setSeedMessage({ type: "error", text: "Erreur de connexion" })
    } finally {
      setIsSeeding(false)
    }
  }

  const [allTeams, setAllTeams] = useState<Array<{ id: string; name: string }>>([])
  const [generateFormData, setGenerateFormData] = useState({
    mode: 'CLASSIC' as 'CLASSIC' | 'MINI_LEAGUE',
    startDate: '',
    time: '16:00',
    matchesPerDay: '1',
    selectedTeamIds: [] as string[],
    isTest: false, // Mode test par défaut
    timeMode: 'interval' as 'interval' | 'specific', // Mode de gestion des heures
    timeInterval: '90', // Écart en minutes entre les matchs
    match1Time: '16:00', // Heure du 1er match
    match2Time: '17:30', // Heure du 2e match
    match3Time: '19:00' // Heure du 3e match
  })

  // Charger les équipes au montage
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetch('/api/admin/teams')
        if (response.ok) {
          const teams = await response.json()
          setAllTeams(teams.map((t: any) => ({ id: t.id, name: t.name || 'Sans nom' })))
          // Sélectionner toutes les équipes par défaut
          setGenerateFormData(prev => ({
            ...prev,
            selectedTeamIds: teams.map((t: any) => t.id),
            isTest: true // Mode test par défaut pour éviter d'afficher au public
          }))
        }
      } catch (error) {
        console.error('Error loading teams:', error)
      }
    }
    loadTeams()
  }, [])

  const handleGenerateMatches = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!generateFormData.startDate || !generateFormData.time) {
      setSeedMessage({ type: "error", text: t.dashboard.generateMatches.fillAllFields })
      return
    }

    const mode = generateFormData.mode
    const matchesPerDay = mode === 'MINI_LEAGUE' ? 3 : parseInt(generateFormData.matchesPerDay) || 1

    if (mode === 'CLASSIC' && (isNaN(matchesPerDay) || matchesPerDay < 1 || matchesPerDay > 10)) {
      setSeedMessage({ type: "error", text: t.dashboard.generateMatches.matchesPerDayRange })
      return
    }

    // Parse date and time
    const [year, month, day] = generateFormData.startDate.split('-').map(Number)
    const [hours, minutes] = generateFormData.time.split(':').map(Number)
    const startDate = new Date(year, month - 1, day, hours, minutes)

    // Vérifier que c'est un jeudi
    if (startDate.getDay() !== 4) {
      const dayNames = [
        t.dashboard.generateMatches.days.sunday,
        t.dashboard.generateMatches.days.monday,
        t.dashboard.generateMatches.days.tuesday,
        t.dashboard.generateMatches.days.wednesday,
        t.dashboard.generateMatches.days.thursday,
        t.dashboard.generateMatches.days.friday,
        t.dashboard.generateMatches.days.saturday,
      ]
      setSeedMessage({ type: "error", text: `${t.dashboard.generateMatches.mustBeThursday.replace('jeudi', dayNames[startDate.getDay()])}. ${t.dashboard.generateMatches.mustBeThursday}` })
      return
    }

    setIsSeeding(true)
    setSeedMessage(null)
    setShowGenerateModal(false)
    
    try {
      const response = await fetch("/api/admin/generate-matches", { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          startDate: startDate.toISOString(),
          time: generateFormData.time,
          matchesPerDay: matchesPerDay,
          mode: mode,
          teamIds: generateFormData.selectedTeamIds,
          isTest: generateFormData.isTest,
          timeMode: generateFormData.timeMode,
          timeInterval: generateFormData.timeMode === 'interval' ? parseInt(generateFormData.timeInterval) : undefined,
          matchTimes: generateFormData.timeMode === 'specific' ? [
            generateFormData.match1Time,
            generateFormData.match2Time,
            generateFormData.match3Time
          ] : undefined
        })
      })
      let data: any = {}
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        data = { error: `Erreur ${response.status}: ${response.statusText}` }
      }
      
      if (response.ok) {
        setSeedMessage({ type: "success", text: data.message || t.dashboard.generateMatches.success })
        setActiveTab("matches")
        if (isMobile) setSidebarOpen(false)
        // Reset form
        setGenerateFormData({
          mode: 'CLASSIC',
          startDate: '',
          time: '16:00',
          matchesPerDay: '1',
          selectedTeamIds: allTeams.map(t => t.id),
          isTest: true, // Garder le mode test par défaut
          timeMode: 'interval',
          timeInterval: '90',
          match1Time: '16:00',
          match2Time: '17:30',
          match3Time: '19:00'
        })
      } else {
        const errorMessage = data.error || `Erreur ${response.status}: ${response.statusText}` || t.dashboard.generateMatches.error
        const errorDetails = data.details ? `\n\n${t.common.details}: ${data.details}` : ''
        setSeedMessage({ type: "error", text: `${errorMessage}${errorDetails}` })
        console.error('Error generating matches:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        })
      }
    } catch (error: any) {
      const errorMessage = error?.message || t.dashboard.endSeason.connectionError
      setSeedMessage({ type: "error", text: errorMessage })
      console.error("Error generating matches:", error)
    } finally {
      setIsSeeding(false)
    }
  }

  const tabs = [
    { id: "teams", label: t.dashboard.tabs.teams, icon: "⚽" },
    { id: "players", label: t.dashboard.tabs.players, icon: "👥" },
    { id: "lineups", label: t.dashboard.tabs.lineups, icon: "🎯" },
    { id: "matches", label: t.dashboard.tabs.matches, icon: "📅" },
    { id: "results", label: t.dashboard.tabs.results, icon: "📊" },
    { id: "statistics", label: t.dashboard.tabs.statistics, icon: "📈" },
    { id: "mini-league", label: t.dashboard.tabs.miniLeague, icon: "🏆" },
    { id: "preseason", label: t.dashboard.tabs.preseason, icon: "🔥" },
    { id: "shop", label: t.dashboard.tabs.shop, icon: "🛍️" },
    { id: "activity", label: t.dashboard.tabs.activity, icon: "🔔" },
    { id: "accounts", label: t.dashboard.tabs.accounts, icon: "👤" },
    { id: "registrations", label: t.dashboard.tabs.registrations, icon: "📝" },
    { id: "waiting-list", label: t.dashboard.tabs.waitingList, icon: "⏳" },
    { id: "spectators", label: t.dashboard.tabs.spectators, icon: "👀" },
    { id: "archives", label: t.dashboard.tabs.archives, icon: "📦" },
    { id: "maintenance", label: t.dashboard.tabs.maintenance, icon: "🔧" },
    { id: "test-matches", label: t.dashboard.tabs.testMatches, icon: "🧪" },
  ]

  const handleGoToRegistrations = () => {
    window.location.href = '/admin/team-registrations'
  }

  const handleEndSeason = async () => {
    const seasonName = prompt(t.dashboard.endSeason.prompt)
    
    if (!seasonName) return

    if (!confirm(
      `${t.dashboard.endSeason.confirm} "${seasonName}"\n\n${t.dashboard.endSeason.confirmMessage}`
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
          text: `${data.message || t.dashboard.endSeason.success}\n${data.summary.totalMatches} ${t.dashboard.tabs.matches}, ${data.summary.totalResults} ${t.dashboard.tabs.results} ${language === 'fr' ? 'archivés' : 'archived'}.`
        })
        setActiveTab('teams')
        if (isMobile) setSidebarOpen(false)
      } else {
        setSeedMessage({ 
          type: 'error', 
          text: data.error || t.dashboard.endSeason.error
        })
      }
    } catch (error) {
      setSeedMessage({ type: 'error', text: t.dashboard.endSeason.connectionError })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    if (isMobile) {
      setSidebarOpen(false) // Fermer le drawer après sélection sur mobile
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Overlay pour mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Drawer sur mobile, fixe sur desktop */}
      <div
        className={`
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : `${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300`
          }
          bg-white border-r border-gray-200 flex flex-col shadow-lg md:shadow-none
        `}
      >
        {/* Header Sidebar */}
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
          <h1 className={`font-bold text-primary ${sidebarOpen ? "text-xl" : "text-center text-lg"} ${isMobile ? "text-xl" : ""}`}>
            {sidebarOpen ? "⚽ Ligue" : "⚽"}
          </h1>
          {isMobile && sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === tab.id 
                  ? "bg-blue-50 text-blue-600 font-semibold" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl flex-shrink-0">{tab.icon}</span>
              {(sidebarOpen || isMobile) && <span className="truncate">{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-gray-200 space-y-2 overflow-y-auto">
          <button
            onClick={() => {
              window.location.href = '/admin/search'
              if (isMobile) setSidebarOpen(false)
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition text-sm font-medium"
          >
            <span>🔍</span>
            {(sidebarOpen || isMobile) && <span>Recherche</span>}
          </button>
          <button
            onClick={() => {
              window.location.href = '/admin/impersonate'
              if (isMobile) setSidebarOpen(false)
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition text-sm font-medium"
          >
            <span>👤</span>
            {(sidebarOpen || isMobile) && <span>Impersonate</span>}
          </button>
          <button
            onClick={() => {
              setShowFinalsModal(true)
              if (isMobile) setSidebarOpen(false)
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition text-sm font-medium"
          >
            <span>🏆</span>
            {(sidebarOpen || isMobile) && <span>{t.dashboard.generateFinals.title}</span>}
          </button>
          <button
            onClick={() => {
              handleGoToRegistrations()
              if (isMobile) setSidebarOpen(false)
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition text-sm font-medium"
          >
            <span>📝</span>
            {(sidebarOpen || isMobile) && <span>Inscriptions</span>}
          </button>
          <button
            onClick={handleEndSeason}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 rounded-lg transition text-sm font-medium"
          >
            {isSeeding ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {(sidebarOpen || isMobile) && <span>Archivage...</span>}
              </>
            ) : (
              <>
                <span>🏁</span>
                {(sidebarOpen || isMobile) && <span>Fin de saison</span>}
              </>
            )}
          </button>
          <button
            onClick={() => {
              setShowGenerateModal(true)
              if (isMobile) setSidebarOpen(false)
            }}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition text-sm font-medium"
          >
            <span>⚽</span>
            {(sidebarOpen || isMobile) && <span>{t.dashboard.generateMatches.title}</span>}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(sidebarOpen || isMobile) && <span>Déconnexion</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header - Responsive */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
            </button>
            {/* Tab title visible sur mobile */}
            {isMobile && (
              <h2 className="text-lg font-semibold text-gray-900">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            )}
          </div>
          <button
            onClick={() => window.location.href = '/admin/dashboard-v2'}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold text-sm flex items-center gap-2 shadow-md"
          >
            <span>✨</span>
            <span>Switch to New Dashboard (Beta)</span>
          </button>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            {seedMessage && (
              <div
                className={`text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-lg ${
                  seedMessage.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {seedMessage.text}
              </div>
            )}
            <div className="text-xs md:text-sm text-gray-600 hidden sm:block">
              <span className="hidden md:inline">Connecté: </span>
              <span className="font-semibold text-gray-900 truncate max-w-[150px] md:max-w-none">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Content - Responsive padding */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {activeTab === "teams" && <TeamsTab />}
          {activeTab === "players" && <PlayersTab />}
          {activeTab === "lineups" && <LineupsTab />}
          {activeTab === "matches" && <MatchesTab />}
          {activeTab === "results" && <ResultsTab />}
          {activeTab === "statistics" && (
            <Suspense fallback={<div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>}>
              <StatisticsTab />
            </Suspense>
          )}
          {activeTab === "activity" && <ActivityTab />}
          {activeTab === "maintenance" && (
            <Suspense fallback={<div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>}>
              <MaintenanceTab />
            </Suspense>
          )}
          {activeTab === "accounts" && (
            <Suspense fallback={<div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>}>
              <AccountsTab />
            </Suspense>
          )}
          {activeTab === "test-matches" && (
            <div className="text-center py-8 md:py-12">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{t.dashboard.testMatches.title}</h2>
              <p className="text-gray-600 mb-6">Consultez les matchs générés en mode test</p>
              <button
                onClick={() => window.location.href = '/admin/test-matches'}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
              >
                🧪 Voir les matchs de test
              </button>
            </div>
          )}
          {activeTab === "mini-league" && (
            <Suspense fallback={<div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>}>
              <MiniLeagueTab />
            </Suspense>
          )}
          {activeTab === "preseason" && (
            <div className="text-center py-8 md:py-12">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">Preseason</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Gérez les matchs et résultats de la présaison</p>
              <button
                onClick={() => window.location.href = '/admin/preseason/matches'}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition font-medium shadow-lg"
              >
                🔥 Accéder à Preseason
              </button>
            </div>
          )}
          {activeTab === "shop" && (
            <Suspense fallback={<div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>}>
              <ShopTab />
            </Suspense>
          )}
          {activeTab === "waiting-list" && <WaitingListTab />}
          {activeTab === "spectators" && (
            <Suspense fallback={<div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>}>
              <SpectatorsTab />
            </Suspense>
          )}
          {activeTab === "registrations" && (
            <div className="text-center py-8 md:py-12">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{t.dashboard.teamRegistrations.title}</h2>
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
            <div className="text-center py-8 md:py-12">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{t.dashboard.archives.title}</h2>
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

      {/* Modal Génération de Matchs */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowGenerateModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t.dashboard.generateMatches.title}</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content */}
            <form onSubmit={handleGenerateMatches} className="p-6 space-y-6">
              {/* Mode de tournoi */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">{t.dashboard.generateMatches.mode}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setGenerateFormData({ ...generateFormData, mode: 'CLASSIC' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      generateFormData.mode === 'CLASSIC'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        generateFormData.mode === 'CLASSIC' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {generateFormData.mode === 'CLASSIC' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900 mb-1">{t.dashboard.generateMatches.classic}</h3>
                        <p className="text-sm text-gray-600">Matchs aller-retour entre toutes les équipes</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setGenerateFormData({ ...generateFormData, mode: 'MINI_LEAGUE' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      generateFormData.mode === 'MINI_LEAGUE'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        generateFormData.mode === 'MINI_LEAGUE' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {generateFormData.mode === 'MINI_LEAGUE' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900 mb-1">{t.dashboard.generateMatches.miniLeague}</h3>
                        <p className="text-sm text-gray-600">10 équipes, 6 journées avec finales</p>
                        <p className="text-xs text-gray-500 mt-1">Phase qualif: Jours 1-5 (3 matchs max/jour)</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Date de début */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t.dashboard.generateMatches.startDate} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={generateFormData.startDate}
                  onChange={(e) => setGenerateFormData({ ...generateFormData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{t.dashboard.generateMatches.startDateHint}</p>
              </div>

              {/* Mode de gestion des heures */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Gestion des heures des matchs</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setGenerateFormData({ ...generateFormData, timeMode: 'interval' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      generateFormData.timeMode === 'interval'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        generateFormData.timeMode === 'interval' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {generateFormData.timeMode === 'interval' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">Écart entre matchs</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setGenerateFormData({ ...generateFormData, timeMode: 'specific' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      generateFormData.timeMode === 'specific'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        generateFormData.timeMode === 'specific' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {generateFormData.timeMode === 'specific' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">Heures spécifiques</span>
                    </div>
                  </button>
                </div>

                {generateFormData.timeMode === 'interval' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heure du premier match <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={generateFormData.time}
                        onChange={(e) => setGenerateFormData({ ...generateFormData, time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Écart entre les matchs (en minutes) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="180"
                        step="15"
                        value={generateFormData.timeInterval}
                        onChange={(e) => setGenerateFormData({ ...generateFormData, timeInterval: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Exemple: 90 minutes = 1h30 entre chaque match</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.dashboard.generateMatches.match1Time} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={generateFormData.match1Time}
                        onChange={(e) => setGenerateFormData({ ...generateFormData, match1Time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.dashboard.generateMatches.match2Time} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={generateFormData.match2Time}
                        onChange={(e) => setGenerateFormData({ ...generateFormData, match2Time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.dashboard.generateMatches.match3Time} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={generateFormData.match3Time}
                        onChange={(e) => setGenerateFormData({ ...generateFormData, match3Time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Nombre de matchs par jeudi (uniquement pour CLASSIC) */}
              {generateFormData.mode === 'CLASSIC' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Nombre de matchs par jeudi
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="11"
                    value={generateFormData.matchesPerDay}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, matchesPerDay: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nombre de matchs à programmer chaque jeudi (entre 1 et 10)</p>
                </div>
              )}

              {/* Sélection des équipes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t.dashboard.generateMatches.participatingTeams} <span className="text-red-500">*</span>
                  {generateFormData.mode === 'MINI_LEAGUE' && (
                    <span className="text-xs text-gray-500 ml-2">(Exactement 10 équipes requises)</span>
                  )}
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">
                      {generateFormData.selectedTeamIds.length} équipe(s) sélectionnée(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (generateFormData.selectedTeamIds.length === allTeams.length) {
                          setGenerateFormData({ ...generateFormData, selectedTeamIds: [] })
                        } else {
                          setGenerateFormData({ ...generateFormData, selectedTeamIds: allTeams.map(t => t.id) })
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {generateFormData.selectedTeamIds.length === allTeams.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {allTeams.map((team) => (
                      <label
                        key={team.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={generateFormData.selectedTeamIds.includes(team.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGenerateFormData({
                                ...generateFormData,
                                selectedTeamIds: [...generateFormData.selectedTeamIds, team.id]
                              })
                            } else {
                              setGenerateFormData({
                                ...generateFormData,
                                selectedTeamIds: generateFormData.selectedTeamIds.filter(id => id !== team.id)
                              })
                            }
                          }}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900">{team.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {generateFormData.mode === 'MINI_LEAGUE' && generateFormData.selectedTeamIds.length !== 10 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Le mode Mini-League nécessite exactement 10 équipes ({generateFormData.selectedTeamIds.length} sélectionnée(s))
                  </p>
                )}
              </div>

              {generateFormData.mode === 'MINI_LEAGUE' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>ℹ️ Mode Mini-League:</strong> Maximum 3 matchs par journée automatiquement configuré.
                    Les finales (Jour 6) seront générées séparément après le Jour 5.
                  </p>
                </div>
              )}

              {/* Mode Test */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateFormData.isTest}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, isTest: e.target.checked })}
                    className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-yellow-900">Mode Test</span>
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-medium">Recommandé</span>
                    </div>
                    <p className="text-xs text-yellow-800">
                      Les matchs générés en mode test ne seront <strong>pas visibles</strong> dans les pages publiques (classement, statistiques, etc.).
                      Ils resteront visibles uniquement dans l'admin pour vos tests.
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSeeding}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium flex items-center justify-center gap-2"
                >
                  {isSeeding ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      {t.dashboard.generateMatches.generating}
                    </>
                  ) : (
                    <>
                      <span>⚽</span>
                      {t.dashboard.generateMatches.generate}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Génération de Finales */}
      {showFinalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowFinalsModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t.dashboard.generateFinals.title}</h2>
              <button
                onClick={() => setShowFinalsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content */}
            <form onSubmit={handleGenerateFinals} className="p-6 space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-900">
                  <strong>🏆 Finales Mini-League:</strong> Génère les matchs de finale du Jour 6 basés sur le classement après les Jours 1-5.
                </p>
                <ul className="text-xs text-orange-800 mt-2 space-y-1 list-disc list-inside">
                  <li>🥇 Grande Finale: 1er vs 2ème</li>
                  <li>🥉 Petite Finale: 3ème vs 4ème (2h plus tard)</li>
                </ul>
              </div>

              {/* Date des finales */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t.dashboard.generateFinals.finalDate} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={finalsFormData.finalDate}
                  onChange={(e) => setFinalsFormData({ ...finalsFormData, finalDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{t.dashboard.generateFinals.finalDateHint}</p>
              </div>

              {/* Heure */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {t.dashboard.generateFinals.finalTime} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={finalsFormData.time}
                  onChange={(e) => setFinalsFormData({ ...finalsFormData, time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">La Petite Finale sera automatiquement programmée 2 heures plus tard</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowFinalsModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSeeding}
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition font-medium flex items-center justify-center gap-2"
                >
                  {isSeeding ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <span>🏆</span>
                      {t.dashboard.generateFinals.generate}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
