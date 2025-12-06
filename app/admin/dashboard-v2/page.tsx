"use client"

import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Home, 
  Users, 
  User, 
  Calendar, 
  Trophy, 
  BarChart3,
  Settings,
  ShoppingBag,
  Bell,
  Archive,
  FileText,
  Activity,
  Shield,
  Mail,
  Image as ImageIcon,
  Download,
  Upload,
  Wrench,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Menu,
  X,
  LogOut,
  Search
} from 'lucide-react'
import TeamsSection from './sections/teams-section'
import PlayersSection from './sections/players-section'
import MatchesSection from './sections/matches-section'
import ResultsSection from './sections/results-section'
import LineupsSection from './sections/lineups-section'
import StatisticsSection from './sections/statistics-section'
import RankingsSection from './sections/rankings-section'
import MiniLeagueSection from './sections/mini-league-section'
import PreseasonSection from './sections/preseason-section'
import TestMatchesSection from './sections/test-matches-section'
import CompareTeamsSection from './sections/compare-teams-section'
import AccountsSection from './sections/accounts-section'
import RegistrationsSection from './sections/registrations-section'
import SpectatorsSection from './sections/spectators-section'
import ShopSection from './sections/shop-section'
import ActivitySection from './sections/activity-section'
import MaintenanceSection from './sections/maintenance-section'
import NotificationsSection from './sections/notifications-section'
import MediaSection from './sections/media-section'
import ArchivesSection from './sections/archives-section'
import SearchSection from './sections/search-section'
import ImpersonateSection from './sections/impersonate-section'
import DuplicatePlayersSection from './sections/duplicate-players-section'

export default function DashboardV2Page() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (!isAdmin) {
        router.push('/public')
      }
    }
  }, [user, loading, isAdmin, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  const categories = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      color: 'blue',
      sections: []
    },
    {
      id: 'competition',
      label: 'Competition',
      icon: Trophy,
      color: 'green',
      sections: [
        { id: 'teams', label: 'Teams', icon: Users },
        { id: 'players', label: 'Players', icon: User },
        { id: 'matches', label: 'Matches', icon: Calendar },
        { id: 'results', label: 'Results', icon: FileText },
        { id: 'lineups', label: 'Lineups', icon: Shield },
        { id: 'rankings', label: 'Rankings', icon: TrendingUp },
        { id: 'statistics', label: 'Statistics', icon: BarChart3 },
        { id: 'mini-league', label: 'Mini-League', icon: Trophy },
        { id: 'preseason', label: 'Preseason', icon: Calendar },
        { id: 'test-matches', label: 'Test Matches', icon: Calendar },
        { id: 'compare-teams', label: 'Compare Teams', icon: Users }
      ]
    },
    {
      id: 'users',
      label: 'Users & Accounts',
      icon: User,
      color: 'purple',
      sections: [
        { id: 'accounts', label: 'Accounts', icon: User },
        { id: 'registrations', label: 'Registrations', icon: FileText },
        { id: 'spectators', label: 'Spectators', icon: Eye },
        { id: 'search', label: 'Search', icon: Search },
        { id: 'impersonate', label: 'Impersonate', icon: User },
        { id: 'duplicate-players', label: 'Duplicate Players', icon: Users }
      ]
    },
    {
      id: 'shop',
      label: 'Shop & Activity',
      icon: ShoppingBag,
      color: 'orange',
      sections: [
        { id: 'shop', label: 'Shop', icon: ShoppingBag },
        { id: 'activity', label: 'Activity', icon: Activity }
      ]
    },
    {
      id: 'settings',
      label: 'Settings & Maintenance',
      icon: Settings,
      color: 'gray',
      sections: [
        { id: 'maintenance', label: 'Maintenance', icon: Wrench },
        { id: 'export-import', label: 'Export/Import', icon: Download },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'media', label: 'Media', icon: ImageIcon },
        { id: 'archives', label: 'Archives', icon: Archive }
      ]
    }
  ]

  const handleLogout = async () => {
    const { signOut } = await import('firebase/auth')
    const { auth } = await import('@/lib/firebase')
    await signOut(auth)
  }

  const renderContent = () => {
    if (!activeCategory) {
      return <HomeView />
    }

    const category = categories.find(c => c.id === activeCategory)
    if (!category) return null

    if (!activeSection && category.sections.length > 0) {
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {category.label}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition text-left"
              >
                <section.icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {section.label}
                </h3>
              </button>
            ))}
          </div>
        </div>
      )
    }

    // Render section content
    return (
      <div className="p-6">
        <div className="mb-4">
          <button
            onClick={() => {
              setActiveSection(null)
              if (category.sections.length === 0) setActiveCategory(null)
            }}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 flex items-center gap-2"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeSection ? category.sections.find(s => s.id === activeSection)?.label : category.label}
          </h2>
        </div>
        <SectionContent category={category.id} section={activeSection} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-lg text-gray-900 dark:text-white">Admin</span>
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">BETA</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {categories.map((category) => (
              <div key={category.id}>
                <button
                  onClick={() => {
                    setActiveCategory(category.id)
                    setActiveSection(category.sections.length === 0 ? null : null)
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition
                    ${activeCategory === category.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <category.icon className="w-5 h-5" />
                  <span className="font-medium">{category.label}</span>
                </button>
                {activeCategory === category.id && category.sections.length > 0 && (
                  <div className="ml-8 mt-1 space-y-1">
                    {category.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`
                          w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition
                          ${activeSection === section.id
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        <section.icon className="w-4 h-4" />
                        {section.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => router.push('/admin')}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              ← Old Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded mt-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user.displayName || user.email}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

function SectionContent({ category, section }: { category: string; section: string | null }) {
  if (!section) return null

  // Competition sections
  if (category === 'competition') {
    switch (section) {
      case 'teams':
        return <TeamsSection />
      case 'players':
        return <PlayersSection />
      case 'matches':
        return <MatchesSection />
      case 'results':
        return <ResultsSection />
      case 'lineups':
        return <LineupsSection />
      case 'statistics':
        return <StatisticsSection />
      case 'rankings':
        return <RankingsSection />
      case 'mini-league':
        return <MiniLeagueSection />
      case 'preseason':
        return <PreseasonSection />
      case 'test-matches':
        return <TestMatchesSection />
      case 'compare-teams':
        return <CompareTeamsSection />
      default:
        return null
    }
  }

  // Users & Accounts sections
  if (category === 'users') {
    switch (section) {
      case 'accounts':
        return <AccountsSection />
      case 'registrations':
        return <RegistrationsSection />
      case 'spectators':
        return <SpectatorsSection />
      case 'search':
        return <SearchSection />
      case 'impersonate':
        return <ImpersonateSection />
      case 'duplicate-players':
        return <DuplicatePlayersSection />
      default:
        return null
    }
  }

  // Shop & Activity sections
  if (category === 'shop') {
    switch (section) {
      case 'shop':
        return <ShopSection />
      case 'activity':
        return <ActivitySection />
      default:
        return null
    }
  }

  // Settings & Maintenance sections
  if (category === 'settings') {
    switch (section) {
      case 'maintenance':
        return <MaintenanceSection />
      case 'export-import':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export/Import Data</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export</h4>
                <div className="flex gap-2">
                  <a
                    href="/api/admin/export/all"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    download
                  >
                    Export All Data
                  </a>
                  <a
                    href="/api/admin/export/teams"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    download
                  >
                    Export Teams
                  </a>
                  <a
                    href="/api/admin/export/players"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    download
                  >
                    Export Players
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Import</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Import players from Excel file.
                </p>
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Go to Import in Old Dashboard
                </button>
              </div>
            </div>
          </div>
        )
      case 'notifications':
        return <NotificationsSection />
      case 'media':
        return <MediaSection />
      case 'archives':
        return <ArchivesSection />
      default:
        return null
    }
  }

  return null
}

function HomeView() {
  const [stats, setStats] = useState({
    teams: 0,
    players: 0,
    upcomingMatches: 0,
    pendingRequests: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [teamsRes, playersRes, matchesRes, requestsRes] = await Promise.all([
        fetch('/api/admin/teams'),
        fetch('/api/admin/players'),
        fetch('/api/admin/matches'),
        fetch('/api/spectators/requests')
      ])

      const teams = teamsRes.ok ? await teamsRes.json() : []
      const players = playersRes.ok ? await playersRes.json() : []
      const matches = matchesRes.ok ? await matchesRes.json() : []
      const requests = requestsRes.ok ? await requestsRes.json() : []

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const upcomingMatches = matches.filter((m: any) => {
        const matchDate = m.date?.toDate ? m.date.toDate() : new Date(m.date)
        return matchDate >= today
      }).length

      const pendingRequests = requests.filter((r: any) => r.status === 'pending').length

      setStats({
        teams: Array.isArray(teams) ? teams.length : 0,
        players: Array.isArray(players) ? players.length : 0,
        upcomingMatches,
        pendingRequests
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { 
      label: 'Generate Matches', 
      icon: Calendar, 
      action: () => window.location.href = '/admin',
      color: 'blue' 
    },
    { 
      label: 'Enter Result', 
      icon: FileText, 
      action: () => window.location.href = '/admin',
      color: 'green' 
    },
    { 
      label: 'Approve Request', 
      icon: CheckCircle2, 
      action: () => window.location.href = '/admin/spectators/check-in',
      color: 'purple' 
    },
    { 
      label: 'Team Registrations', 
      icon: FileText, 
      action: () => window.location.href = '/admin/team-registrations',
      color: 'orange' 
    }
  ]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to the new admin dashboard. Quick access to all features.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Teams</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.teams}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Players</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.players}</p>
            </div>
            <User className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Matches</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingMatches}</p>
            </div>
            <Calendar className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingRequests}</p>
            </div>
            <Clock className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition text-left"
            >
              <action.icon className={`w-6 h-6 mb-2 text-${action.color}-500`} />
              <p className="font-medium text-gray-900 dark:text-white">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/admin/search'}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition text-left"
          >
            <Search className="w-6 h-6 mb-2 text-blue-500" />
            <p className="font-medium text-gray-900 dark:text-white">Search</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Search for teams, players, matches</p>
          </button>
          <button
            onClick={() => window.location.href = '/admin/spectators/check-in'}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition text-left"
          >
            <Eye className="w-6 h-6 mb-2 text-green-500" />
            <p className="font-medium text-gray-900 dark:text-white">Spectator Check-in</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">QR code scanning for check-in</p>
          </button>
          <button
            onClick={() => window.location.href = '/admin/preseason/matches'}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition text-left"
          >
            <Trophy className="w-6 h-6 mb-2 text-orange-500" />
            <p className="font-medium text-gray-900 dark:text-white">Preseason</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage preseason matches</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <RecentActivityView />
      </div>
    </div>
  )
}

function RecentActivityView() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentActivity()
  }, [])

  const loadRecentActivity = async () => {
    try {
      // Load recent spectator requests
      const requestsRes = await fetch('/api/spectators/requests')
      if (requestsRes.ok) {
        const requests = await requestsRes.json()
        const recentRequests = Array.isArray(requests)
          ? requests
              .filter((r: any) => r.status === 'pending')
              .slice(0, 5)
              .map((r: any) => ({
                type: 'spectator_request',
                message: `New spectator request from ${r.firstName} ${r.lastName}`,
                time: r.createdAt,
                link: '/admin/dashboard-v2'
              }))
          : []

        setActivities(recentRequests)
      }
    } catch (error) {
      console.error('Error loading activity:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size="sm" />
  }

  if (activities.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        No recent activity to display.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="flex-1">
            <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activity.time ? new Date(activity.time).toLocaleString() : 'Recently'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
