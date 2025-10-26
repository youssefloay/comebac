"use client"

import { AlertTriangle, ExternalLink, Copy } from 'lucide-react'
import { useState } from 'react'

interface DomainErrorProps {
  currentDomain?: string
}

export function DomainError({ currentDomain }: DomainErrorProps) {
  const [copied, setCopied] = useState(false)

  const copyDomain = async () => {
    if (currentDomain) {
      await navigator.clipboard.writeText(currentDomain)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="sofa-card p-6 max-w-md mx-auto border-l-4 border-sofa-red">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-sofa-red" />
        <h3 className="text-lg font-semibold text-sofa-text-primary">
          Domaine non autorisé
        </h3>
      </div>
      
      <p className="text-sofa-text-secondary mb-4">
        Ce domaine n'est pas autorisé pour l'authentification Firebase.
      </p>

      {currentDomain && (
        <div className="bg-sofa-bg-tertiary p-3 rounded-lg mb-4">
          <p className="text-sm text-sofa-text-muted mb-2">Domaine actuel :</p>
          <div className="flex items-center gap-2">
            <code className="text-sofa-text-accent text-sm flex-1">
              {currentDomain}
            </code>
            <button
              onClick={copyDomain}
              className="p-1 hover:bg-sofa-bg-hover rounded transition-colors"
              title="Copier le domaine"
            >
              <Copy className="w-4 h-4 text-sofa-text-muted" />
            </button>
          </div>
          {copied && (
            <p className="text-xs text-sofa-green mt-1">Copié !</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h4 className="font-medium text-sofa-text-primary">
          Pour résoudre ce problème :
        </h4>
        
        <ol className="text-sm text-sofa-text-secondary space-y-2 list-decimal list-inside">
          <li>Aller dans la Console Firebase</li>
          <li>Authentication → Settings → Authorized domains</li>
          <li>Ajouter ce domaine : <code className="text-sofa-text-accent">{currentDomain}</code></li>
          <li>Ou ajouter <code className="text-sofa-text-accent">*.vercel.app</code> pour tous les domaines Vercel</li>
        </ol>

        <a
          href="https://console.firebase.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sofa-text-accent hover:text-sofa-green transition-colors text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir Firebase Console
        </a>
      </div>
    </div>
  )
}