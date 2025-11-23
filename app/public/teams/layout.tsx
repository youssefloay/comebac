import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Équipes',
  description: 'Découvrez toutes les équipes du championnat ComeBac League : compositions, statistiques, joueurs et résultats de chaque équipe.',
  keywords: ['équipes', 'compositions', 'joueurs', 'statistiques équipes', 'championnat scolaire'],
  openGraph: {
    title: 'Équipes du Championnat - ComeBac League',
    description: 'Consultez toutes les équipes participantes au championnat scolaire ComeBac League.',
    type: 'website',
  },
}

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

