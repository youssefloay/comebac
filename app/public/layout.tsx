import type React from "react"
import type { Metadata } from "next"
import PublicLayout from "@/components/public/public-layout"

export const metadata: Metadata = {
  title: "Championnat Scolaire - ComeBac League",
  description: "Application de ligue scolaire ComeBac League : suivez votre ligue, équipes et joueurs en temps réel. Résultats de matchs, classements, statistiques détaillées et performances individuelles.",
  keywords: ["championnat scolaire", "football", "résultats matchs", "classement", "statistiques", "équipes", "joueurs"],
  openGraph: {
    title: "ComeBac League - Championnat Scolaire de Football",
    description: "Suivez votre ligue scolaire ComeBac League : matchs, résultats, classements, équipes et joueurs en temps réel.",
    type: "website",
    locale: "fr_FR",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}
