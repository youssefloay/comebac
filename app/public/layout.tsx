import type React from "react"
import type { Metadata } from "next"
import PublicLayout from "@/components/public/public-layout"

export const metadata: Metadata = {
  title: "Championnat Scolaire - ComeBac League",
  description: "Suivez le championnat scolaire ComeBac League : résultats de matchs, classements, statistiques des équipes et joueurs. Championnat de football inter-écoles en temps réel.",
  keywords: ["championnat scolaire", "football", "résultats matchs", "classement", "statistiques", "équipes", "joueurs"],
  openGraph: {
    title: "ComeBac League - Championnat Scolaire de Football",
    description: "Suivez tous les matchs, résultats et classements du championnat scolaire ComeBac League en temps réel.",
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
