'use client'

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="sofa-theme min-h-screen flex items-center justify-center">
      <div className="text-center px-6">
        <div className="mb-8">
          <div className="w-24 h-24 bg-sofa-text-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚽</span>
          </div>
          <h1 className="text-6xl font-bold text-sofa-text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-sofa-text-secondary mb-2">
            Page non trouvée
          </h2>
          <p className="text-sofa-text-muted max-w-md mx-auto">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/public">
            <button className="sofa-btn flex items-center gap-2">
              <Home className="w-4 h-4" />
              Retour à l'accueil
            </button>
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="sofa-btn-secondary sofa-btn flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Page précédente
          </button>
        </div>
      </div>
    </div>
  )
}