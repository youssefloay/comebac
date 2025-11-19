export type Language = 'fr' | 'en'

interface Translations {
  [key: string]: {
    fr: string
    en: string
  }
}

const translations: Translations = {
  // Navigation
  'nav.home': { fr: 'Accueil', en: 'Home' },
  'nav.matches': { fr: 'Matchs', en: 'Matches' },
  'nav.ranking': { fr: 'Classement', en: 'Ranking' },
  'nav.teams': { fr: 'Équipes', en: 'Teams' },
  'nav.stats': { fr: 'Stats', en: 'Stats' },
  'nav.fantasy': { fr: 'Fantasy', en: 'Fantasy' },
  'nav.more': { fr: 'Plus', en: 'More' },
  'nav.menu': { fr: 'Menu', en: 'Menu' },
  'nav.navigation': { fr: 'Navigation', en: 'Navigation' },
  'nav.switchToPlayer': { fr: 'Basculer sur Joueur', en: 'Switch to Player' },
  'nav.switchToCoach': { fr: 'Basculer sur Coach', en: 'Switch to Coach' },
  'nav.adminPanel': { fr: 'Panneau Admin', en: 'Admin Panel' },
  'nav.administration': { fr: 'Administration', en: 'Administration' },
  'nav.followUs': { fr: 'Suivez-nous', en: 'Follow Us' },
  'nav.logout': { fr: 'Se déconnecter', en: 'Logout' },
  
  // Roles
  'role.player': { fr: 'Joueur', en: 'Player' },
  'role.coach': { fr: 'Coach', en: 'Coach' },
  'role.admin': { fr: 'Admin', en: 'Admin' },
  'role.user': { fr: 'Utilisateur', en: 'User' },
}

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

