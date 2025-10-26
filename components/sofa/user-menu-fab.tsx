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

export function UserMenuFAB() {
  const { user, logout, isAdmin } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
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

  if (!user) return null

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={menuRef}>
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 sofa-user-menu min-w-[200px]"
          >
            <div className="p-3 border-b border-sofa-border">
              <p className="text-sm font-medium text-sofa-text-primary truncate">
                {user.email}
              </p>
              <p className="text-xs text-sofa-text-muted">
                {isAdmin ? 'Administrateur' : 'Utilisateur'}
              </p>
            </div>
            
            <div className="p-2 space-y-1">
              <Link
                href="/public"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <Home className="w-4 h-4" />
                Accueil
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
              )}
              
              <button
                onClick={() => {
                  logout()
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-red hover:bg-sofa-bg-hover rounded-lg transition-colors"
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
        className="w-14 h-14 sofa-fab rounded-full flex items-center justify-center"
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