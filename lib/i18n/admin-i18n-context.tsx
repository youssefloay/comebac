'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations, AdminTranslations } from './admin-translations'

interface AdminI18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: AdminTranslations
}

const AdminI18nContext = createContext<AdminI18nContextType | undefined>(undefined)

export function AdminI18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  const [mounted, setMounted] = useState(false)

  // Load language from localStorage on mount
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('admin-language') as Language | null
      if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
        setLanguageState(savedLanguage)
      }
    }
  }, [])

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-language', lang)
    }
  }

  const value: AdminI18nContextType = {
    language,
    setLanguage,
    t: translations[language],
  }

  return (
    <AdminI18nContext.Provider value={value}>
      {children}
    </AdminI18nContext.Provider>
  )
}

export function useAdminI18n() {
  const context = useContext(AdminI18nContext)
  if (context === undefined) {
    throw new Error('useAdminI18n must be used within an AdminI18nProvider')
  }
  return context
}

