import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

const SETTINGS_DOC_ID = 'registrationSettings'

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 })
    }

    const settingsRef = adminDb.collection('settings').doc(SETTINGS_DOC_ID)
    const settingsDoc = await settingsRef.get()

    if (!settingsDoc.exists) {
      // Par défaut, waiting list désactivée
      return NextResponse.json({ 
        isWaitingListEnabled: false,
        message: 'Inscriptions normales activées'
      })
    }

    const data = settingsDoc.data()
    return NextResponse.json({
      isWaitingListEnabled: data?.isWaitingListEnabled || false,
      message: data?.waitingListMessage || 'Nous sommes au complet pour le moment. Inscrivez-vous en liste d\'attente.'
    })
  } catch (error: any) {
    console.error('Error fetching waiting list status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waiting list status', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 })
    }

    const body = await request.json()
    const { isWaitingListEnabled, waitingListMessage } = body

    if (typeof isWaitingListEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'isWaitingListEnabled must be a boolean' },
        { status: 400 }
      )
    }

    const settingsRef = adminDb.collection('settings').doc(SETTINGS_DOC_ID)
    
    await settingsRef.set({
      isWaitingListEnabled,
      waitingListMessage: waitingListMessage || 'Nous sommes au complet pour le moment. Inscrivez-vous en liste d\'attente.',
      updatedAt: new Date()
    }, { merge: true })

    return NextResponse.json({ 
      success: true,
      isWaitingListEnabled,
      message: isWaitingListEnabled 
        ? 'Waiting list activée' 
        : 'Inscriptions normales activées'
    })
  } catch (error: any) {
    console.error('Error updating waiting list status:', error)
    return NextResponse.json(
      { error: 'Failed to update waiting list status', details: error.message },
      { status: 500 }
    )
  }
}

