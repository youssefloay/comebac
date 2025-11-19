"use client"

import { useState, useEffect } from 'react'
import { setLanguage, getLanguage, type Language } from '@/lib/i18n'

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<Language>('en')

  useEffect(() => {
    setCurrentLang(getLanguage())
  }, [])

  const handleLanguageToggle = () => {
    const newLang: Language = currentLang === 'fr' ? 'en' : 'fr'
    setLanguage(newLang)
    setCurrentLang(newLang)
    // Reload page to apply translations
    window.location.reload()
  }

  return (
    <button
      onClick={handleLanguageToggle}
      className="flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-all w-full text-left"
      aria-label={currentLang === 'fr' ? 'Switch to English' : 'Switch to French'}
    >
      <span className="text-xl">
        {currentLang === 'fr' ? '🇫🇷' : '🇬🇧'}
      </span>
    </button>
  )
}

