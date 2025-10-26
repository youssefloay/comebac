"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { 
  Home, 
  Trophy, 
  Calendar, 
  BarChart3, 
  Users, 
  Target,
  TrendingUp,
  LogOut,
  User,
  Settings,
  ChevronDown
} from 'lucide-react'

const navigationItems = [
  { href: '/public', label: 'Accueil', icon: Home },
  { href: '/public/matches', label: 'Matchs', icon: Calendar },
  { href: '/public/ranking', label: 'Classement', icon: Trophy },
  { href: '/public/statistics', label: 'Statistiques', icon: BarChart3 },
  { href: '/public/teams', label: 'Équipes', icon: Users },
]

export function SofaNavigation() {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="sofa-nav">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/public" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-sofa-green to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚽</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-sofa-text-primary">
                Ligue Scolaire
              </h1>
              <p className="text-xs text-sofa-text-muted">
                Championnat de Football
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sofa-nav-item relative ${isActive ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-sofa-text-accent"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-sofa-red rounded-full animate-pulse"></div>
              <span className="text-sm text-sofa-text-secondary hidden sm:inline">
                En Direct
              </span>
            </div>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 sofa-nav-item"
                >
                  <div className="w-8 h-8 bg-sofa-text-accent rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden md:inline text-sofa-text-primary">
                    {isAdmin ? 'Admin' : 'Utilisateur'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-sofa-text-muted" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 sofa-user-menu z-50"
                  >
                    <div className="p-3 border-b border-sofa-border">
                      <p className="text-sm font-medium text-sofa-text-primary">
                        {user.email}
                      </p>
                      <p className="text-xs text-sofa-text-muted">
                        {isAdmin ? 'Administrateur' : 'Utilisateur'}
                      </p>
                    </div>
                    
                    <div className="p-2">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Tableau de bord Admin
                        </Link>
                      )}
                      
                      <button
                        onClick={() => {
                          logout()
                          setShowUserMenu(false)
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-red hover:bg-sofa-bg-hover rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <button className="sofa-btn text-sm px-4 py-2">
                  Se connecter
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}