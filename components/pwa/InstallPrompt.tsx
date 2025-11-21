"use client"

import { useState, useEffect } from 'react'
import { X, Download, Share, ArrowDown, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fermé le prompt (uniquement côté client)
    if (typeof window !== 'undefined') {
      const dismissedValue = localStorage.getItem('pwa-install-dismissed')
      if (dismissedValue) {
        const dismissedTime = parseInt(dismissedValue)
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
        if (daysSinceDismissed < 7) {
          // Ne pas afficher si fermé il y a moins de 7 jours
          setDismissed(true)
        } else {
          // Supprimer la valeur si plus de 7 jours
          localStorage.removeItem('pwa-install-dismissed')
        }
      }

      // Détecter si on est sur mobile
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Détecter iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)
    
    // Détecter si déjà installé - plusieurs méthodes pour être sûr
    const checkStandalone = () => {
      const standalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (navigator as any).standalone === true ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone
    setIsStandalone(standalone)
    }
    
    checkStandalone()
    
    // Vérifier périodiquement au cas où l'état change
    const interval = setInterval(checkStandalone, 1000)
    
    // Pour Android/Desktop
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeinstallprompt', handler)
    }
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
    // Sauvegarder dans localStorage pour ne plus afficher pendant 7 jours
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
    setDismissed(true)
  }

  const handleIOSInstall = () => {
    setShowIOSModal(true)
  }

  const handleIOSDismiss = () => {
    setShowIOSModal(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
    setDismissed(true)
  }

  // Ne rien afficher si déjà installé (mode standalone)
  if (isStandalone) return null

  // Ne pas afficher si l'utilisateur a déjà fermé le prompt (sauf si le modal iOS est ouvert)
  if (dismissed && !showIOSModal) return null

  // Détecter si on est sur mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <>
      {/* Bouton d'installation flottant pour mobile (iOS et Android) */}
      {isMobile && !isStandalone && !showIOSModal && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={isIOS ? handleIOSInstall : () => {
            // Pour Android, déclencher le prompt natif
            if (deferredPrompt) {
              handleInstall()
            } else {
              // Si pas de prompt natif, afficher un message
              alert('Pour installer l\'app sur Android, utilisez le menu de votre navigateur (⋮) puis "Installer l\'application"')
            }
          }}
          className="fixed bottom-20 right-4 z-[60] bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all md:hidden"
          style={{ boxShadow: '0 10px 40px rgba(37, 99, 235, 0.4)' }}
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold text-sm whitespace-nowrap">Installer</span>
        </motion.button>
      )}

      {/* Bouton d'installation flottant pour iOS (desktop aussi) */}
      {isIOS && !isStandalone && !showIOSModal && !isMobile && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={handleIOSInstall}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:from-blue-700 hover:to-blue-800 transition-all"
          style={{ boxShadow: '0 10px 40px rgba(37, 99, 235, 0.4)' }}
        >
          <Plus className="w-6 h-6" />
          <span className="font-bold text-lg">Installer l'app</span>
        </motion.button>
      )}

      {/* Modal d'instructions pour iOS */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={handleIOSDismiss}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Installer ComeBac League
                </h3>
                <button
                  onClick={handleIOSDismiss}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-1">
                      Appuyez sur le bouton <Share className="w-4 h-4 inline" /> Partager
                    </p>
                    <p className="text-gray-600 text-sm">
                      En bas de l'écran Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-1">
                      Sélectionnez "Sur l'écran d'accueil"
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: '50%' }} />
                      </div>
                      <Plus className="w-5 h-5 text-blue-600" />
                      <span className="text-xs text-gray-600">Écran d'accueil</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-1">
                      Appuyez sur "Ajouter"
                    </p>
                    <p className="text-gray-600 text-sm">
                      L'app apparaîtra sur votre écran d'accueil
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>💡 Astuce :</strong> Une fois installée, l'app fonctionnera comme une application native avec un accès rapide depuis votre écran d'accueil !
                </p>
            </div>

              <button
                onClick={handleIOSDismiss}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
              >
                J'ai compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre de prompt pour Android/Desktop */}
      <AnimatePresence>
        {showPrompt && !isIOS && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 shadow-lg"
          >
            {deferredPrompt ? (
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
    </>
  )
}
