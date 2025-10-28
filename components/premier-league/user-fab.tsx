"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronUp,
  Home
} from 'lucide-react'

export function PremierLeagueUserFAB() {
  const { user, userProfile, logout, isAdmin } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Check if mobile menu is open
  useEffect(() => {
    const checkMobileMenu = () => {
      setIsMobileMenuOpen(document.body.classList.contains('mobile-menu-open'))
    }

    checkMobileMenu()
    const observer = new MutationObserver(checkMobileMenu)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  if (!user || isMobileMenuOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-40" ref={menuRef}>
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 pl-user-menu"
            style={{ position: 'relative', right: 'auto', top: 'auto', marginTop: 0 }}
          >
            <div className="pl-user-menu-header">
              <div className="font-semibold text-sm truncate">
                {userProfile?.fullName || user.email}
              </div>
              <div className="text-xs opacity-70">
                @{userProfile?.username || 'user'} • {isAdmin ? 'Admin' : 'User'}
              </div>
            </div>
            
            <div className="pl-user-menu-content">
              <Link
                href="/public"
                className="pl-user-menu-item"
                onClick={() => setShowMenu(false)}
              >
                <Home className="w-4 h-4" />
                Accueil
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="pl-user-menu-item"
                  onClick={() => setShowMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  Administration
                </Link>
              )}
              
              <button
                onClick={() => {
                  logout()
                  setShowMenu(false)
                }}
                className="pl-user-menu-item text-red-500 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
        className="pl-fab"
        style={{
          background: showMenu 
            ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
            : "linear-gradient(135deg, #e90052 0%, #d946ef 100%)"
        }}
      >
        <motion.div
          animate={{ rotate: showMenu ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {showMenu ? (
            <ChevronUp className="w-6 h-6 text-white" />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </motion.div>
      </motion.button>
    </div>
  )
}