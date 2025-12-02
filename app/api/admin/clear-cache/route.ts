import { NextResponse } from 'next/server'

// Cache maps partagés (si on veut les vider)
// Note: En production, utiliser Redis ou un système de cache distribué

export async function POST() {
  try {
    // Pour l'instant, on retourne juste un message
    // Le cache sera automatiquement invalidé après CACHE_DURATION
    return NextResponse.json({ 
      success: true, 
      message: 'Cache sera invalidé automatiquement dans 30 secondes. Pour forcer la mise à jour, redémarrez le serveur Next.js.' 
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 })
  }
}

