import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, page, timeSpent, sessionId } = await request.json()

    await adminDb.collection('timeSpent').add({
      userId: userId || 'anonymous',
      userEmail: userEmail || 'anonymous',
      page,
      timeSpent, // en secondes
      sessionId,
      timestamp: FieldValue.serverTimestamp()
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erreur tracking temps:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
