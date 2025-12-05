import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

// GET - Récupérer les limites pour un match
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')
    const matchType = searchParams.get('matchType')

    if (!matchId || !matchType) {
      return NextResponse.json({ error: 'matchId and matchType are required' }, { status: 400 })
    }

    const limitDoc = await adminDb.collection('matchSpectatorLimits')
      .doc(`${matchType}_${matchId}`)
      .get()

    if (limitDoc.exists) {
      return NextResponse.json({
        matchId,
        matchType,
        limit: limitDoc.data()?.limit || 100,
        updatedAt: limitDoc.data()?.updatedAt?.toDate()
      })
    }

    // Retourner la limite par défaut
    return NextResponse.json({
      matchId,
      matchType,
      limit: 100,
      updatedAt: null
    })
  } catch (error: any) {
    console.error('Error fetching spectator limit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch limit' },
      { status: 500 }
    )
  }
}

// POST/PUT - Définir ou mettre à jour la limite
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const body = await request.json()
    const { matchId, matchType, limit } = body

    if (!matchId || !matchType || limit === undefined) {
      return NextResponse.json(
        { error: 'matchId, matchType, and limit are required' },
        { status: 400 }
      )
    }

    if (limit < 0) {
      return NextResponse.json(
        { error: 'Limit must be a positive number' },
        { status: 400 }
      )
    }

    const docId = `${matchType}_${matchId}`
    await adminDb.collection('matchSpectatorLimits').doc(docId).set({
      matchId,
      matchType,
      limit: parseInt(limit),
      updatedAt: Timestamp.now()
    }, { merge: true })

    return NextResponse.json({ message: 'Limit updated successfully' })
  } catch (error: any) {
    console.error('Error updating spectator limit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update limit' },
      { status: 500 }
    )
  }
}
