import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Classement',
  description: 'Consultez le classement du championnat ComeBac League : points, victoires, défaites, buts pour et contre de chaque équipe.',
  keywords: ['classement', 'points', 'victoires', 'défaites', 'buts', 'championnat scolaire'],
  openGraph: {
    title: 'Classement du Championnat - ComeBac League',
    description: 'Découvrez le classement actuel du championnat scolaire ComeBac League.',
    type: 'website',
  },
}

export default function RankingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

