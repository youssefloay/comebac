"use client"

import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Détecter iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)
    
    // Détecter si déjà installé
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
    setIsStandalone(standalone)
    
    // Pour iOS, afficher le prompt si pas encore installé
    if (iOS && !standalone) {
      setShowPrompt(true)
    }
    
    // Pour Android/Desktop
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    console.log(`User response to install prompt: ${outcome}`)
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Le popup réapparaîtra au prochain rechargement de page
  }

  // Ne rien afficher si déjà installé
  if (isStandalone) return null

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 shadow-lg"
        >
          {isIOS ? (
            // Barre pour iOS
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Share className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight">
                      Installer l'app: <Share className="w-3 h-3 inline" /> → "Sur l'écran d'accueil"
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : deferredPrompt ? (
            // Barre pour Android/Desktop
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Download className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Installer ComeBac League
                    </p>
                    <p className="text-xs opacity-90">
                      Accédez rapidement à l'app depuis votre écran d'accueil
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInstall}
                    className="px-4 py-1.5 bg-white text-green-700 rounded-lg hover:bg-green-50 transition font-medium text-sm whitespace-nowrap"
                  >
                    Installer
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
