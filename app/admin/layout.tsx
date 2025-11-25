'use client'

import { AdminI18nProvider } from '@/lib/i18n/admin-i18n-context'
import { useAdminI18n } from '@/lib/i18n/admin-i18n-context'
import { Globe } from 'lucide-react'
import { useState } from 'react'

function LanguageButton() {
  const { language, setLanguage } = useAdminI18n()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors touch-manipulation shadow-md border border-gray-200 dark:border-gray-700"
        style={{ minHeight: '40px' }}
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
              onClick={() => {
                setLanguage('fr')
                setShowMenu(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                language === 'fr' ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : ''
              }`}
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => {
                setLanguage('en')
                setShowMenu(false)
              }}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Language Button - Fixed top right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageButton />
      </div>
      
      {/* Content */}
      <div className="pt-16 sm:pt-4">
        {children}
      </div>
    </div>
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

