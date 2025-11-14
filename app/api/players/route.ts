import { NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

const adminDb = getFirestore()

/**
 * GET /api/players
 * Récupère tous les joueurs
 */
export async function GET() {
  try {
    const playersSnapshot = await adminDb.collection('players').get()
    
    const players = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(players)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des joueurs' },
      { status: 500 }
    )
  }
}
