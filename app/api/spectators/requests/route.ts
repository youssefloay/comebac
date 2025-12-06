import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET - Récupérer toutes les demandes (admin)
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'approved', 'rejected', ou null pour tous
    const matchId = searchParams.get('matchId')
    const matchType = searchParams.get('matchType')

    let query = adminDb.collection('spectatorRequests')

    if (status) {
      query = query.where('status', '==', status)
    }
    if (matchId) {
      query = query.where('matchId', '==', matchId)
    }
    if (matchType) {
      query = query.where('matchType', '==', matchType)
    }

    // Essayer avec orderBy, sinon récupérer sans tri et trier en mémoire
    let snapshot
    try {
      snapshot = await query.orderBy('createdAt', 'desc').get()
    } catch (error: any) {
      // Si l'index n'existe pas, récupérer sans orderBy et trier en mémoire
      if (error.code === 9 || error.message?.includes('index')) {
        console.warn('Composite index not found, fetching without orderBy and sorting in memory')
        snapshot = await query.get()
      } else {
        throw error
      }
    }
    
    const requests = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
        checkedInAt: data.checkedInAt?.toDate ? data.checkedInAt.toDate() : (data.checkedInAt ? new Date(data.checkedInAt) : undefined)
      }
    })

    // Trier par date de création (desc) si on n'a pas pu utiliser orderBy
    requests.sort((a, b) => {
      const dateA = a.createdAt?.getTime() || 0
      const dateB = b.createdAt?.getTime() || 0
      return dateB - dateA // Descending order
    })

    return NextResponse.json(requests)
  } catch (error: any) {
    console.error('Error fetching spectator requests:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}
