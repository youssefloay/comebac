import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, userType, page } = await request.json()

    // Enregistrer le clic
    await adminDb.collection('fantasyClicks').add({
      userId: userId || 'anonymous',
      userEmail: userEmail || 'anonymous',
      userType: userType || 'public',
      page: page || 'unknown',
      timestamp: FieldValue.serverTimestamp(),
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erreur tracking:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
