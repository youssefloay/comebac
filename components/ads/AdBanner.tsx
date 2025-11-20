'use client'

import { AdSense } from './AdSense'

interface AdBannerProps {
  slot: string
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  className?: string
  style?: 'horizontal' | 'vertical' | 'square'
}

export function AdBanner({ 
  slot, 
  format = 'auto',
  className = '',
  style = 'horizontal'
}: AdBannerProps) {
  // Ne pas afficher les annonces si l'ID client n'est pas configuré
  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) {
    return null
  }

  const containerClass = style === 'vertical' 
    ? 'w-full max-w-[300px] mx-auto my-4' 
    : style === 'square'
    ? 'w-full max-w-[300px] mx-auto my-4'
    : 'w-full max-w-[728px] mx-auto my-4'

  return (
    <div className={`${containerClass} ${className} flex justify-center items-center min-h-[90px] opacity-90`}>
      <AdSense 
        adSlot={slot}
        adFormat={format}
        fullWidthResponsive={true}
        className="w-full"
      />
    </div>
  )
}

