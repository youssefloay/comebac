"use client"

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Trophy,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      exact: true
    },
    {
      name: 'Gestion',
      href: '/admin/manage',
      icon: Users
    },
    {
      name: 'Compétition',
      href: '/admin/competition',
      icon: Trophy
    },
    {
      name: 'Inscriptions',
      href: '/admin/team-registrations',
      icon: FileText
    },
    {
      name: 'Statistiques',
      href: '/admin/stats',
      icon: BarChart3
    },
    {
      name: 'Outils',
      href: '/admin/tools',
      icon: Settings
    }
  ]

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-30`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-gray-900">Admin</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                sidebarOpen ? '' : 'justify-center'
              } ${
                isActive(item.href, item.exact)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && (
                <span className="font-medium">{item.name}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition ${
              sidebarOpen ? '' : 'justify-center'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        } transition-all duration-300`}
      >
        {children}
      </div>
    </div>
  )
}
