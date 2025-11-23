import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Équipes',
  description: 'Suivez toutes les équipes de la ligue scolaire ComeBac League : compositions, statistiques, joueurs et résultats de chaque équipe.',
  keywords: ['équipes', 'compositions', 'joueurs', 'statistiques équipes', 'championnat scolaire'],
  openGraph: {
    title: 'Équipes du Championnat - ComeBac League',
    description: 'Consultez toutes les équipes de la ligue scolaire ComeBac League.',
    type: 'website',
  },
}

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

