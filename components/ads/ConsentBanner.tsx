'use client'

import { useState, useEffect } from 'react'
import { X, Settings, Check, X as XIcon } from 'lucide-react'

export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showManageOptions, setShowManageOptions] = useState(false)
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null)

  useEffect(() => {
    // Initialiser l'API de consentement Google avant d'afficher le banner
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.dataLayer = window.dataLayer || []
      // @ts-ignore
      function gtag() {
        // @ts-ignore
        window.dataLayer.push(arguments)
      }
      // @ts-ignore
      window.gtag = window.gtag || gtag

      // Définir le consentement par défaut comme "refusé" jusqu'à ce que l'utilisateur choisisse
      // @ts-ignore
      gtag('consent', 'default', {
        'ad_storage': 'denied',
        'analytics_storage': 'denied',
        'wait_for_update': 500
      })
    }

    // Vérifier si le consentement a déjà été donné
    const consent = localStorage.getItem('cookie-consent')
    if (consent === null) {
      // Afficher le banner seulement si pas de consentement enregistré
      setShowBanner(true)
    } else {
      setConsentGiven(consent === 'true')
      // Mettre à jour le consentement si déjà défini
      if (typeof window !== 'undefined') {
        // @ts-ignore
        if (window.gtag) {
          // @ts-ignore
          window.gtag('consent', 'update', {
            'ad_storage': consent === 'true' ? 'granted' : 'denied',
            'analytics_storage': consent === 'true' ? 'granted' : 'denied'
          })
        }
      }
    }
  }, [])

  const handleConsent = (accepted: boolean) => {
    setConsentGiven(accepted)
    localStorage.setItem('cookie-consent', accepted.toString())
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShowBanner(false)
    setShowManageOptions(false)

    // Notifier Google AdSense du consentement via l'API de consentement
    if (typeof window !== 'undefined') {
      // @ts-ignore
      if (window.gtag) {
        // @ts-ignore
        window.gtag('consent', 'update', {
          'ad_storage': accepted ? 'granted' : 'denied',
          'analytics_storage': accepted ? 'granted' : 'denied'
        })
      }
    }
  }

  const handleManageOptions = () => {
    setShowManageOptions(true)
  }

  if (!showBanner && !showManageOptions) {
    return null
  }

  return (
    <>
      {/* Banner de consentement compact */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-600 flex-1">
                🍪 Nous utilisons des cookies pour améliorer votre expérience.{' '}
                <a href="/public/privacy" className="text-blue-600 hover:underline">
                  En savoir plus
                </a>
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleConsent(false)}
                  className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Refuser
                </button>
                <button
                  onClick={handleManageOptions}
                  className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Gérer
                </button>
                <button
                  onClick={() => handleConsent(true)}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des options */}
      {showManageOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Gestion des préférences de cookies
                </h2>
                <button
                  onClick={() => {
                    setShowManageOptions(false)
                    if (consentGiven === null) {
                      setShowBanner(true)
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Cookies essentiels
                      </h3>
                      <p className="text-sm text-gray-600">
                        Nécessaires au fonctionnement du site
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-500">
                      Toujours actifs
                    </span>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Cookies de performance et d'analyse
                      </h3>
                      <p className="text-sm text-gray-600">
                        Nous aident à comprendre comment les visiteurs utilisent notre site
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={consentGiven !== false}
                        className="sr-only peer"
                        onChange={(e) => {
                          // Géré par le bouton de consentement global
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Cookies publicitaires
                      </h3>
                      <p className="text-sm text-gray-600">
                        Utilisés pour afficher des publicités personnalisées via Google AdSense
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={consentGiven !== false}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note :</strong> Vous pouvez modifier vos préférences à tout moment en cliquant 
                    sur le lien "Gérer les cookies" dans le footer du site.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => handleConsent(false)}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Tout refuser
                  </button>
                  <button
                    onClick={() => handleConsent(true)}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Tout accepter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

