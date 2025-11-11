"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Home,
  Trophy,
  Calendar,
  BarChart3,
  Users,
  MoreHorizontal,
  X,
  LogOut,
  Settings,
  User,
  Gamepad2
} from "lucide-react"

// Onglets principaux (toujours visibles)
const mainTabs = [
  { href: "/public", label: "Accueil", icon: Home },
  { href: "/public/matches", label: "Matchs", icon: Calendar },
  { href: "/public/ranking", label: "Classement", icon: Trophy },
  { href: "/public/statistics", label: "Stats", icon: BarChart3 },
]

// Onglets secondaires (dans le menu "Plus")
const secondaryTabs = [
  { href: "/public/teams", label: "Équipes", icon: Users },
  { href: "/public/players", label: "Cartes FIFA", icon: Gamepad2 },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const { user, userProfile, logout, isAdmin } = useAuth()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  if (!user) return null

  return (
    <>
      {/* Bottom Navigation Bar - Improved */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 bg-sofa-bg-card border-t border-sofa-border safe-area-pb"
        role="navigation"
        aria-label="Navigation mobile principale"
      >
        <div className="flex items-center justify-around px-1 py-2">
          {/* Main Tabs - Improved accessibility */}
          {mainTabs.map((tab) => {
            const isActive = pathname === tab.href
            const Icon = tab.icon

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0 flex-1 relative ${
                  isActive 
                    ? 'text-sofa-text-accent bg-sofa-text-accent/10' 
                    : 'text-sofa-text-muted hover:text-sofa-text-primary hover:bg-sofa-bg-hover'
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={tab.label}
              >
                <Icon 
                  className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''} transition-transform`} 
                  aria-hidden="true"
                />
                <span className="text-xs font-medium truncate">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeBottomTab"
                    className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-sofa-text-accent rounded-full"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            )
          })}

          {/* More Button - Improved */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0 flex-1 relative ${
              secondaryTabs.some(tab => pathname === tab.href)
                ? 'text-sofa-text-accent bg-sofa-text-accent/10'
                : 'text-sofa-text-muted hover:text-sofa-text-primary hover:bg-sofa-bg-hover'
            }`}
            aria-label="Ouvrir le menu supplémentaire"
            aria-expanded={showMoreMenu}
          >
            <MoreHorizontal className="w-5 h-5 mb-1" aria-hidden="true" />
            <span className="text-xs font-medium">Plus</span>
            {secondaryTabs.some(tab => pathname === tab.href) && (
              <motion.div
                layoutId="activeBottomTab"
                className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-sofa-text-accent rounded-full"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </button>
        </div>
      </nav>

      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowMoreMenu(false)}
            />

            {/* Menu Content */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Menu</h3>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Info */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {userProfile?.fullName || user.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      @{userProfile?.username || "user"} • {isAdmin ? "Admin" : "Utilisateur"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-4">
                <div className="space-y-2 mb-6">
                  <div className="text-sm font-medium text-gray-500 px-3 py-2">Navigation</div>
                  {secondaryTabs.map((tab) => {
                    const isActive = pathname === tab.href
                    const Icon = tab.icon

                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        onClick={() => setShowMoreMenu(false)}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-green-600 rounded-full" />
                        )}
                      </Link>
                    )
                  })}
                </div>

                {/* Admin Section */}
                {isAdmin && (
                  <div className="space-y-2 mb-6">
                    <div className="text-sm font-medium text-gray-500 px-3 py-2">Administration</div>
                    <Link
                      href="/admin"
                      onClick={() => setShowMoreMenu(false)}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-all"
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-medium">Panneau Admin</span>
                    </Link>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      logout()
                      setShowMoreMenu(false)
                    }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-all w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Se déconnecter</span>
                  </button>
                </div>
              </div>

              {/* Safe Area Bottom */}
              <div className="h-8 bg-white" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for bottom navigation */}
      <div className="h-20" />
    </>
  )
}