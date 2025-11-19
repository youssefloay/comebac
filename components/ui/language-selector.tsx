"use client"

import { useState, useEffect } from 'react'
import { setLanguage, getLanguage, type Language } from '@/lib/i18n'
import { Globe } from 'lucide-react'

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setCurrentLang(getLanguage())
  }, [])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setCurrentLang(lang)
    setIsOpen(false)
    // Reload page to apply translations
    window.location.reload()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-2xl">{currentLang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                currentLang === 'fr' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <span className="text-2xl">🇫🇷</span>
              <span className="font-medium">Français</span>
              {currentLang === 'fr' && (
                <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
              )}
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                currentLang === 'en' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <span className="text-2xl">🇬🇧</span>
              <span className="font-medium">English</span>
              {currentLang === 'en' && (
                <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

