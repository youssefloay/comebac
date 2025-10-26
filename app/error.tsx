'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="sofa-theme min-h-screen flex items-center justify-center">
      <div className="text-center px-6">
        <div className="mb-8">
          <div className="w-24 h-24 bg-sofa-red rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-sofa-text-primary mb-4">
            Oups ! Une erreur s'est produite
          </h1>
          <p className="text-sofa-text-muted max-w-md mx-auto mb-6">
            Quelque chose s'est mal passé. Veuillez réessayer ou retourner à l'accueil.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="sofa-card p-4 text-left max-w-lg mx-auto mb-6">
              <p className="text-sm text-sofa-text-secondary font-mono">
                {error.message}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={reset}
            className="sofa-btn flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <Link href="/public">
            <button className="sofa-btn-secondary sofa-btn flex items-center gap-2">
              <Home className="w-4 h-4" />
              Retour à l'accueil
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}