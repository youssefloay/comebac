import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Matchs',
  description: 'Consultez tous les matchs du championnat ComeBac League : matchs à venir, résultats en direct, calendrier complet et statistiques des rencontres.',
  keywords: ['matchs', 'calendrier', 'résultats', 'rencontres', 'programme', 'championnat scolaire'],
  openGraph: {
    title: 'Matchs du Championnat - ComeBac League',
    description: 'Suivez tous les matchs du championnat scolaire ComeBac League en temps réel.',
    type: 'website',
  },
}

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

