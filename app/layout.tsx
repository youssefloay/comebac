import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-context"
import { RegisterSW } from "@/components/pwa/RegisterSW"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"
import { AdSenseScript } from "@/components/ads/AdSenseScript"
import "./globals.css"
import "@/styles/sofascore-theme.css"
import "@/styles/fifa-cards.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: "ComeBac League - Championnat Scolaire de Football",
    template: "%s | ComeBac League"
  },
  description: "Application de ligue scolaire ComeBac League : suivez votre ligue, équipes et joueurs en temps réel. Résultats de matchs, classements, statistiques détaillées et performances individuelles.",
  keywords: ["ligue scolaire", "football scolaire", "suivi ligue", "application ligue", "équipes scolaires", "joueurs scolaires", "matchs", "classement", "statistiques", "ComeBac League"],
  authors: [{ name: "ComeBac League" }],
  creator: "ComeBac League",
  publisher: "ComeBac League",
  generator: "Next.js",
  applicationName: "ComeBac League",
  referrer: "origin-when-cross-origin",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://comebac.com'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/icons/icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/icons/icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/icons/icon-57x57.png', sizes: '57x57', type: 'image/png' },
    ],
    other: [
      { rel: 'apple-touch-icon-precomposed', url: '/icons/icon-180x180.png' },
      { rel: 'shortcut icon', url: '/icons/icon-32x32.png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ComeBac League',
    startupImage: [
      {
        url: '/icons/icon-512x512.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/',
    siteName: 'ComeBac League',
    title: 'ComeBac League - Championnat Scolaire de Football',
    description: 'Application de ligue scolaire ComeBac League : suivez votre ligue, équipes et joueurs. Résultats, classements et statistiques en temps réel.',
    images: [
      {
        url: '/comebac.png',
        width: 1200,
        height: 630,
        alt: 'ComeBac League - Championnat Scolaire de Football',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ComeBac League - Championnat Scolaire de Football',
    description: 'Application de ligue scolaire ComeBac League : suivez votre ligue, équipes et joueurs. Résultats et statistiques en temps réel.',
    images: ['/comebac.png'],
    creator: '@comebac_league',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="shortcut icon" type="image/png" href="/icons/icon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/icon-57x57.png" />
        <link rel="apple-touch-icon-precomposed" href="/icons/icon-180x180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ComeBac League" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="ComeBac League" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="theme-color" content="#10b981" />
        <meta name="google-adsense-account" content="ca-pub-6906465408852552" />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <AdSenseScript />
        <ThemeProvider>
          <AuthProvider>
            {children}
            <InstallPrompt />
          </AuthProvider>
        </ThemeProvider>
        <RegisterSW />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
