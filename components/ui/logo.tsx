"use client"

import { useState } from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  alt?: string
  width?: number
  height?: number
}

export function Logo({ 
  className = "w-8 h-8 object-contain", 
  alt = "ComeBac League",
  width = 32,
  height = 32
}: LogoProps) {
  const [imageError, setImageError] = useState(false)

  // Fallback SVG logo si l'image PNG ne charge pas
  const FallbackLogo = () => (
    <img
      src="/comebac-logo.svg"
      alt={alt}
      className={className}
      onError={() => {
        // Si même le SVG échoue, utiliser un fallback CSS
        return (
          <div className={`${className} bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
            CB
          </div>
        )
      }}
    />
  )

  if (imageError) {
    return <FallbackLogo />
  }

  return (
    <Image
      src="/comebac-logo.svg"
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setImageError(true)}
      priority
      unoptimized // Pour éviter les problèmes d'optimisation Next.js
    />
  )
}

// Version simple et robuste avec fallbacks multiples
export function SimpleLogo({ 
  className = "w-8 h-8 object-contain", 
  alt = "ComeBac League"
}: Omit<LogoProps, 'width' | 'height'>) {
  const [imageError, setImageError] = useState(false)
  const [svgError, setSvgError] = useState(false)

  // Fallback final en CSS pur
  if (imageError && svgError) {
    return (
      <div className={`${className} bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold`}>
        <span className="text-xs">⚽</span>
      </div>
    )
  }

  // Fallback SVG si PNG échoue
  if (imageError) {
    return (
      <img
        src="/comebac-logo.svg"
        alt={alt}
        className={className}
        onError={() => setSvgError(true)}
      />
    )
  }

  // Essayer d'abord le SVG (nouveau logo)
  return (
    <img
      src="/comebac-logo.svg"
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
    />
  )
}