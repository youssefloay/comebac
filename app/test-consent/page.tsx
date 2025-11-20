"use client"

import { useState, useEffect } from 'react'

export default function TestConsentPage() {
  const [consent, setConsent] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setConsent(localStorage.getItem('cookie-consent'))
      setDate(localStorage.getItem('cookie-consent-date'))
    }
  }, [])

  const clearConsent = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cookie-consent')
      localStorage.removeItem('cookie-consent-date')
      alert('Consentement effacé ! Rechargez la page pour voir le banner.')
      window.location.reload()
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test du Banner de Consentement</h1>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">État actuel :</h2>
        <p className="mb-2">
          <strong>Consentement :</strong> {consent ? (consent === 'true' ? '✅ Accepté' : '❌ Refusé') : '⏳ Non défini'}
        </p>
        {date && (
          <p className="mb-4">
            <strong>Date :</strong> {new Date(date).toLocaleString('fr-FR')}
          </p>
        )}
        
        <button
          onClick={clearConsent}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Effacer le consentement et recharger
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Instructions :</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Cliquez sur "Effacer le consentement" ci-dessus</li>
          <li>La page va se recharger</li>
          <li>Le banner de consentement devrait apparaître en bas de la page</li>
          <li>Testez les boutons "Accepter", "Refuser" et "Gérer"</li>
        </ol>
      </div>

      <div className="mt-6">
        <a 
          href="/public" 
          className="text-blue-600 hover:underline"
        >
          ← Retour à l'accueil
        </a>
      </div>
    </div>
  )
}

