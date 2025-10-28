import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-context"
import "./globals.css"
import "@/styles/sofascore-theme.css"
import "@/styles/fifa-cards.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "ComeBac League - Championnat Scolaire",
  description: "Application de gestion du championnat scolaire ComeBac League",
  generator: "v0.app",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: '/comebac.png', sizes: '32x32', type: 'image/png' },
      { url: '/comebac.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/comebac.png', sizes: '180x180', type: 'image/png' },
      { url: '/comebac.png', sizes: '152x152', type: 'image/png' },
      { url: '/comebac.png', sizes: '144x144', type: 'image/png' },
      { url: '/comebac.png', sizes: '120x120', type: 'image/png' },
      { url: '/comebac.png', sizes: '114x114', type: 'image/png' },
      { url: '/comebac.png', sizes: '76x76', type: 'image/png' },
      { url: '/comebac.png', sizes: '72x72', type: 'image/png' },
      { url: '/comebac.png', sizes: '60x60', type: 'image/png' },
      { url: '/comebac.png', sizes: '57x57', type: 'image/png' },
    ],
    other: [
      { rel: 'apple-touch-icon-precomposed', url: '/comebac.png' },
      { rel: 'shortcut icon', url: '/comebac.png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ComeBac League',
    startupImage: [
      {
        url: '/comebac.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'ComeBac League',
    title: 'ComeBac League - Championnat Scolaire',
    description: 'Application de gestion du championnat scolaire ComeBac League',
    images: [
      {
        url: '/comebac.png',
        width: 1200,
        height: 630,
        alt: 'ComeBac League Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ComeBac League - Championnat Scolaire',
    description: 'Application de gestion du championnat scolaire ComeBac League',
    images: ['/comebac.png'],
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
        <link rel="icon" type="image/png" href="/comebac.png" />
        <link rel="shortcut icon" type="image/png" href="/comebac.png" />
        <link rel="apple-touch-icon" href="/comebac.png" />
        <link rel="apple-touch-icon-precomposed" href="/comebac.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ComeBac League" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="ComeBac League" />
        <meta name="msapplication-TileImage" content="/comebac.png" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
