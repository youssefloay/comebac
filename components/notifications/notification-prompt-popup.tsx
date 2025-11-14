"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, X } from "lucide-react"

export function NotificationPromptPopup() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    // Vérifier si on doit afficher le prompt
    const checkNotificationStatus = async () => {
      // Ne pas afficher si déjà demandé ou accordé
      const hasAsked = localStorage.getItem('notificationPromptShown')
      
      if (hasAsked) return

      // Vérifier si les notifications sont supportées
      if (!('Notification' in window)) return

      // Si déjà accordé ou refusé, ne pas afficher
      if (Notification.permission !== 'default') {
        localStorage.setItem('notificationPromptShown', 'true')
        return
      }

      // Attendre 2 secondes après le chargement de la page
      setTimeout(() => {
        setShowPrompt(true)
      }, 2000)
    }

    checkNotificationStatus()
  }, [])

  const handleEnable = async () => {
    setIsRequesting(true)
    
    try {
      const permission = await Notification.requestPermission()
      
      // Tracker la réponse
      try {
        // Récupérer les infos utilisateur si disponibles
        const userEmail = localStorage.getItem('userEmail') || 'anonymous'
        const userId = localStorage.getItem('userId') || 'anonymous'
        
        await fetch('/api/track-notification-permission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            userEmail,
            userType: userId !== 'anonymous' ? 'authenticated' : 'public',
            permission,
            source: 'popup'
          })
        })
      } catch (trackError) {
        console.error('Erreur tracking:', trackError)
      }
      
      if (permission === 'granted') {
        console.log('✅ Notifications activées')
      }
      
      localStorage.setItem('notificationPromptShown', 'true')
      setShowPrompt(false)
    } catch (error) {
      console.error('Erreur demande notifications:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('notificationPromptShown', 'true')
    setShowPrompt(false)
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header avec gradient */}
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>

                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="inline-block mb-4"
                >
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <Bell className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  Restez informé ! 🔔
                </h2>
                <p className="text-blue-100">
                  Activez les notifications pour ne rien manquer
                </p>
              </div>

              {/* Contenu */}
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">⚽</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Résultats des matchs</p>
                      <p className="text-sm text-gray-600">Soyez alerté dès qu'un match se termine</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📅</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Matchs à venir</p>
                      <p className="text-sm text-gray-600">Rappels avant les matchs importants</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🏆</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Actualités</p>
                      <p className="text-sm text-gray-600">Nouveautés et annonces importantes</p>
                    </div>
                  </div>
                </div>

                {/* Boutons */}
                <div className="space-y-3">
                  <button
                    onClick={handleEnable}
                    disabled={isRequesting}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isRequesting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Activation...
                      </span>
                    ) : (
                      "Activer les notifications"
                    )}
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition"
                  >
                    Plus tard
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Vous pouvez modifier ce choix à tout moment dans les paramètres
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
