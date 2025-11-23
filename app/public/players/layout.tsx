import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Joueurs',
  description: 'Découvrez tous les joueurs du championnat ComeBac League : statistiques individuelles, buts, passes décisives et performances.',
  keywords: ['joueurs', 'statistiques joueurs', 'buts', 'passes décisives', 'performances', 'championnat scolaire'],
  openGraph: {
    title: 'Joueurs du Championnat - ComeBac League',
    description: 'Consultez les statistiques de tous les joueurs du championnat scolaire ComeBac League.',
    type: 'website',
  },
}

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

