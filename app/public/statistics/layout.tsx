import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Statistiques',
  description: 'Analysez les statistiques complètes du championnat ComeBac League : données détaillées sur les équipes, joueurs et matchs.',
  keywords: ['statistiques', 'analyses', 'données', 'performances', 'championnat scolaire'],
  openGraph: {
    title: 'Statistiques du Championnat - ComeBac League',
    description: 'Explorez les statistiques détaillées du championnat scolaire ComeBac League.',
    type: 'website',
  },
}

export default function StatisticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

