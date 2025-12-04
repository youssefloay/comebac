'use client'

import { useEffect, useRef } from 'react'
import { ProductType } from '@/lib/types/shop'

interface ProductMockup3DProps {
  productType: ProductType
  teamName: string
  teamLogo?: string
  customization?: {
    name?: string
    number?: number
  }
  size?: string
}

export default function ProductMockup3D({
  productType,
  teamName,
  teamLogo,
  customization,
  size = 'M'
}: ProductMockup3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw based on product type
    if (productType === 'jersey') {
      drawJersey(ctx, teamName, teamLogo, customization)
    } else if (productType === 'tshirt') {
      drawTShirt(ctx, teamName, teamLogo)
    } else if (productType === 'sweatshirt') {
      drawSweatshirt(ctx, teamName, teamLogo)
    }
  }, [productType, teamName, teamLogo, customization])

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={400}
        height={500}
        className="max-w-full max-h-full object-contain"
        style={{ imageRendering: 'crisp-edges' }}
      />
      {size && (
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">
          Taille: {size}
        </div>
      )}
    </div>
  )
}

function drawJersey(
  ctx: CanvasRenderingContext2D,
  teamName: string,
  teamLogo?: string,
  customization?: { name?: string; number?: number }
) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  // Enable anti-aliasing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Jersey body - BLACK with subtle gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#1a1a1a')
  gradient.addColorStop(0.5, '#0a0a0a')
  gradient.addColorStop(1, '#000000')
  ctx.fillStyle = gradient
  
  // Main body
  ctx.beginPath()
  ctx.moveTo(width * 0.2, height * 0.15)
  ctx.lineTo(width * 0.8, height * 0.15)
  ctx.lineTo(width * 0.85, height * 0.25)
  ctx.lineTo(width * 0.85, height * 0.75)
  ctx.lineTo(width * 0.75, height * 0.85)
  ctx.lineTo(width * 0.25, height * 0.85)
  ctx.lineTo(width * 0.15, height * 0.75)
  ctx.lineTo(width * 0.15, height * 0.25)
  ctx.closePath()
  ctx.fill()

  // Gold trim on sleeves
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 4
  ctx.stroke()

  // V-neck collar with gold trim
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.moveTo(width * 0.45, height * 0.15)
  ctx.lineTo(width * 0.5, height * 0.2)
  ctx.lineTo(width * 0.55, height * 0.15)
  ctx.closePath()
  ctx.fill()
  
  // Gold collar outline
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 3
  ctx.stroke()

  // Sleeves with gold trim
  ctx.fillStyle = '#0a0a0a'
  // Left sleeve
  ctx.beginPath()
  ctx.moveTo(width * 0.2, height * 0.15)
  ctx.lineTo(width * 0.05, height * 0.25)
  ctx.lineTo(width * 0.1, height * 0.35)
  ctx.lineTo(width * 0.15, height * 0.25)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 3
  ctx.stroke()
  
  // Right sleeve
  ctx.beginPath()
  ctx.moveTo(width * 0.8, height * 0.15)
  ctx.lineTo(width * 0.95, height * 0.25)
  ctx.lineTo(width * 0.9, height * 0.35)
  ctx.lineTo(width * 0.85, height * 0.25)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 3
  ctx.stroke()

  // ComeBac logo (top left) - Gold
  ctx.fillStyle = '#D4AF37'
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('CB', width * 0.25, height * 0.28)
  
  // Team logo placeholder (top right) - Gold circle
  ctx.beginPath()
  ctx.arc(width * 0.75, height * 0.25, 25, 0, Math.PI * 2)
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 3
  ctx.stroke()

  // Player name (center) - GOLD
  if (customization?.name) {
    ctx.fillStyle = '#D4AF37'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(customization.name.toUpperCase(), width * 0.5, height * 0.48)
  }

  // Player number (large, center) - GOLD with black outline
  if (customization?.number !== undefined) {
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 8
    ctx.font = 'bold 120px Arial'
    ctx.textAlign = 'center'
    ctx.strokeText(customization.number.toString(), width * 0.5, height * 0.65)
    
    ctx.fillStyle = '#D4AF37'
    ctx.fillText(customization.number.toString(), width * 0.5, height * 0.65)
  }

  // Sponsor text (center) - Gold
  ctx.fillStyle = '#D4AF37'
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(teamName.substring(0, 12), width * 0.5, height * 0.38)
}

function drawTShirt(
  ctx: CanvasRenderingContext2D,
  teamName: string,
  teamLogo?: string
) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  // T-shirt body - BLACK
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#1a1a1a')
  gradient.addColorStop(0.5, '#0a0a0a')
  gradient.addColorStop(1, '#000000')
  ctx.fillStyle = gradient
  
  // Main body
  ctx.beginPath()
  ctx.moveTo(width * 0.25, height * 0.2)
  ctx.lineTo(width * 0.75, height * 0.2)
  ctx.lineTo(width * 0.8, height * 0.3)
  ctx.lineTo(width * 0.8, height * 0.8)
  ctx.lineTo(width * 0.2, height * 0.8)
  ctx.lineTo(width * 0.2, height * 0.3)
  ctx.closePath()
  ctx.fill()

  // Round neck
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(width * 0.5, height * 0.2, width * 0.06, 0, Math.PI)
  ctx.fill()

  // Short sleeves
  ctx.fillStyle = '#0a0a0a'
  // Left sleeve
  ctx.beginPath()
  ctx.moveTo(width * 0.25, height * 0.2)
  ctx.lineTo(width * 0.1, height * 0.3)
  ctx.lineTo(width * 0.15, height * 0.35)
  ctx.lineTo(width * 0.2, height * 0.3)
  ctx.closePath()
  ctx.fill()
  
  // Right sleeve
  ctx.beginPath()
  ctx.moveTo(width * 0.75, height * 0.2)
  ctx.lineTo(width * 0.9, height * 0.3)
  ctx.lineTo(width * 0.85, height * 0.35)
  ctx.lineTo(width * 0.8, height * 0.3)
  ctx.closePath()
  ctx.fill()

  // Logo shield (top center) - GOLD
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(width * 0.5, height * 0.32)
  ctx.lineTo(width * 0.45, height * 0.35)
  ctx.lineTo(width * 0.45, height * 0.42)
  ctx.lineTo(width * 0.5, height * 0.45)
  ctx.lineTo(width * 0.55, height * 0.42)
  ctx.lineTo(width * 0.55, height * 0.35)
  ctx.closePath()
  ctx.stroke()
  
  // Crown in shield
  ctx.fillStyle = '#D4AF37'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('♔', width * 0.5, height * 0.41)

  // "ICONS" text (center) - GOLD
  ctx.fillStyle = '#D4AF37'
  ctx.font = 'bold 32px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('ICONS', width * 0.5, height * 0.55)
  
  // Team logo placeholder (top right) - Small gold circle
  ctx.beginPath()
  ctx.arc(width * 0.75, height * 0.35, 20, 0, Math.PI * 2)
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 2
  ctx.stroke()

  // Another logo shield (center bottom) - GOLD
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(width * 0.5, height * 0.62)
  ctx.lineTo(width * 0.45, height * 0.65)
  ctx.lineTo(width * 0.45, height * 0.72)
  ctx.lineTo(width * 0.5, height * 0.75)
  ctx.lineTo(width * 0.55, height * 0.72)
  ctx.lineTo(width * 0.55, height * 0.65)
  ctx.closePath()
  ctx.stroke()
  
  ctx.fillStyle = '#D4AF37'
  ctx.font = 'bold 16px Arial'
  ctx.fillText('♔', width * 0.5, height * 0.71)
}

function drawSweatshirt(
  ctx: CanvasRenderingContext2D,
  teamName: string,
  teamLogo?: string
) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  // Sweatshirt body - BLACK
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#1a1a1a')
  gradient.addColorStop(0.5, '#0a0a0a')
  gradient.addColorStop(1, '#000000')
  ctx.fillStyle = gradient
  
  // Main body
  ctx.beginPath()
  ctx.moveTo(width * 0.2, height * 0.15)
  ctx.lineTo(width * 0.8, height * 0.15)
  ctx.lineTo(width * 0.85, height * 0.25)
  ctx.lineTo(width * 0.85, height * 0.85)
  ctx.lineTo(width * 0.15, height * 0.85)
  ctx.lineTo(width * 0.15, height * 0.25)
  ctx.closePath()
  ctx.fill()

  // Long sleeves
  ctx.fillStyle = '#0a0a0a'
  // Left sleeve
  ctx.beginPath()
  ctx.moveTo(width * 0.2, height * 0.15)
  ctx.lineTo(width * 0.05, height * 0.25)
  ctx.lineTo(width * 0.05, height * 0.6)
  ctx.lineTo(width * 0.15, height * 0.55)
  ctx.lineTo(width * 0.15, height * 0.25)
  ctx.closePath()
  ctx.fill()
  
  // Right sleeve
  ctx.beginPath()
  ctx.moveTo(width * 0.8, height * 0.15)
  ctx.lineTo(width * 0.95, height * 0.25)
  ctx.lineTo(width * 0.95, height * 0.6)
  ctx.lineTo(width * 0.85, height * 0.55)
  ctx.lineTo(width * 0.85, height * 0.25)
  ctx.closePath()
  ctx.fill()

  // Hood
  ctx.fillStyle = '#0a0a0a'
  ctx.beginPath()
  ctx.arc(width * 0.5, height * 0.15, width * 0.12, Math.PI, 0)
  ctx.fill()

  // Pocket with gold outline
  ctx.fillStyle = '#000000'
  ctx.fillRect(width * 0.3, height * 0.5, width * 0.4, height * 0.15)
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 2
  ctx.strokeRect(width * 0.3, height * 0.5, width * 0.4, height * 0.15)

  // ComeBac logo (center top) - GOLD
  ctx.fillStyle = '#D4AF37'
  ctx.font = 'bold 32px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('COMEBAC', width * 0.5, height * 0.35)
  
  // Team name (center) - GOLD
  ctx.font = 'bold 20px Arial'
  ctx.fillText(teamName.substring(0, 20), width * 0.5, height * 0.45)

  // Drawstrings - GOLD
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(width * 0.45, height * 0.15)
  ctx.lineTo(width * 0.45, height * 0.25)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(width * 0.55, height * 0.15)
  ctx.lineTo(width * 0.55, height * 0.25)
  ctx.stroke()
  
  // Small circles at end of drawstrings
  ctx.fillStyle = '#D4AF37'
  ctx.beginPath()
  ctx.arc(width * 0.45, height * 0.25, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(width * 0.55, height * 0.25, 3, 0, Math.PI * 2)
  ctx.fill()
}
