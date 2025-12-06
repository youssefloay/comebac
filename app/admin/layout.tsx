'use client'

import React, { useState } from 'react'
import { AdminI18nProvider } from '@/lib/i18n/admin-i18n-context'
import { useAdminI18n } from '@/lib/i18n/admin-i18n-context'
import { Globe } from 'lucide-react'

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

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Language Button - Fixed top right - Always visible */}
      <div className="fixed top-4 right-4 z-[9999]" style={{ position: 'fixed', top: '16px', right: '16px' }}>
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

