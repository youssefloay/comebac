import type { Metadata } from 'next'
import type React from 'react'

export const metadata: Metadata = {
  title: 'Joueurs',
  description: 'Suivez tous les joueurs de la ligue scolaire ComeBac League : statistiques individuelles, buts, passes décisives et performances.',
  keywords: ['joueurs', 'statistiques joueurs', 'buts', 'passes décisives', 'performances', 'championnat scolaire'],
  openGraph: {
    title: 'Joueurs du Championnat - ComeBac League',
    description: 'Consultez les statistiques de tous les joueurs de la ligue scolaire ComeBac League.',
    type: 'website',
  },
}

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

