import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// Cache simple en mémoire
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes (statut joueur change rarement)

async function getCachedData(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key)
  const now = Date.now()
  
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  const data = await fetcher()
  cache.set(key, { data, timestamp: now })
  return data
}

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const data = await getCachedData(`player-status-${email}`, async () => {
      // Vérifier si l'utilisateur a des données dans playerAccounts
      const playerAccountsSnap = await adminDb
        .collection('playerAccounts')
        .where('email', '==', email)
        .limit(1)
        .get()
      
      const isPlayer = !playerAccountsSnap.empty
      
      return { isPlayer }
    })

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error: any) {
    console.error('❌ Erreur API player/status:', error)
    return NextResponse.json(
      { error: 'Failed to check player status', isPlayer: false },
      { status: 500 }
    )
  }
}

