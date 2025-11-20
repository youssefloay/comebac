'use client'

import { useEffect, useRef } from 'react'

interface AdSenseProps {
  adSlot: string
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  fullWidthResponsive?: boolean
  className?: string
}

export function AdSense({ 
  adSlot, 
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = ''
}: AdSenseProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    // Ne pas charger si déjà chargé ou si pas de référence
    if (loadedRef.current || !adRef.current) {
      return
    }

    // Attendre un peu pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      if (!adRef.current || loadedRef.current) {
        return
      }

      try {
        // Vérifier si l'élément ins existe déjà et a déjà été traité
        const insElement = adRef.current.querySelector('ins.adsbygoogle')
        if (insElement) {
          // @ts-ignore
          const status = insElement.getAttribute('data-adsbygoogle-status')
          if (status === 'done' || status === 'filled') {
            loadedRef.current = true
            return // Déjà chargé
          }
        }

        // Marquer comme chargé avant de push
        loadedRef.current = true

        // @ts-ignore
        if (window.adsbygoogle) {
          // @ts-ignore
          window.adsbygoogle.push({})
        }
      } catch (err) {
        console.error('AdSense error:', err)
        loadedRef.current = false // Réinitialiser en cas d'erreur
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [adSlot]) // Inclure adSlot dans les dépendances

  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={String(fullWidthResponsive)}
      />
    </div>
  )
}
