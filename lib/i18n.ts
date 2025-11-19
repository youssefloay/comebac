import { translations as translationsData } from './translations'

export type Language = 'fr' | 'en'

interface Translations {
  [key: string]: {
    fr: string
    en: string
  }
}

const translations: Translations = translationsData

let currentLanguage: Language = 'en'

export function setLanguage(lang: Language) {
  currentLanguage = lang
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang)
  }
}

export function getLanguage(): Language {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language') as Language
    if (saved) return saved
  }
  return currentLanguage
}

export function t(key: string): string {
  const lang = getLanguage()
  const translation = translations[key]
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`)
    return key
  }
  return translation[lang] || translation.fr
}

export function addTranslations(newTranslations: Partial<Translations>) {
  Object.assign(translations, newTranslations)
}

