import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Statistiques',
  description: 'Analysez les statistiques complètes de la ligue scolaire ComeBac League : données détaillées sur les équipes, joueurs et matchs.',
  keywords: ['statistiques', 'analyses', 'données', 'performances', 'championnat scolaire'],
  openGraph: {
    title: 'Statistiques du Championnat - ComeBac League',
    description: 'Explorez les statistiques détaillées de la ligue scolaire ComeBac League.',
    type: 'website',
  },
}

export default function StatisticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

