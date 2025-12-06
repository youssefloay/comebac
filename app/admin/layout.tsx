'use client'

import React, { useState, useEffect } from 'react'
import { AdminI18nProvider } from '@/lib/i18n/admin-i18n-context'
import { useAdminI18n } from '@/lib/i18n/admin-i18n-context'
import { Globe, Sun, Moon } from 'lucide-react'

function LanguageButton() {
  const { language, setLanguage } = useAdminI18n()
  const [showMenu, setShowMenu] = useState(false)

  const handleLanguageChange = (newLang: 'fr' | 'en') => {
    console.log('🌐 Changement de langue:', newLang)
    setLanguage(newLang)
    setShowMenu(false)
    // Force re-render
    window.location.reload()
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          console.log('🌐 Bouton langue cliqué, menu:', !showMenu)
          setShowMenu(!showMenu)
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors touch-manipulation shadow-lg border border-blue-700"
        style={{ minHeight: '44px', zIndex: 10000 }}
        title={language === 'fr' ? 'Switch to English' : 'Passer en français'}
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-sm sm:text-base font-medium uppercase">{language}</span>
      </button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                language === 'fr' ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : ''
              }`}
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                language === 'en' ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : ''
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function ThemeButton() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      // Apply theme to document
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(theme)
      localStorage.setItem('theme', theme)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  // Toujours rendre le bouton pour éviter les problèmes d'hydratation
  // Utiliser un état par défaut qui correspond au rendu serveur
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white transition-colors touch-manipulation shadow-lg border border-gray-700 dark:border-gray-600"
      style={{ minHeight: '44px' }}
      title={mounted ? (theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair') : 'Toggle theme'}
    >
      {mounted ? (
        theme === 'light' ? (
          <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
        )
      ) : (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
      )}
    </button>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Language and Theme Buttons - Fixed top right - Always visible */}
      <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
        <ThemeButton />
        <LanguageButton />
      </div>
      
      {/* Content */}
      <div style={{ paddingTop: '80px' }}>
        {children}
      </div>
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminI18nProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AdminI18nProvider>
  )
}

