import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET - Récupérer tous les matchs (pour admin)
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    let query = adminDb.collection('matches').orderBy('date', 'asc')
    
    if (teamId) {
      query = adminDb.collection('matches')
        .where('teams', 'array-contains', teamId)
        .orderBy('date', 'asc')
    }

    const snapshot = await query.get()
    const matches = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      }
    })

    return NextResponse.json(matches)
  } catch (error: any) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}
