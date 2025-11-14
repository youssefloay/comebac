import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, page, sessionId, timestamp } = await request.json()

    await adminDb.collection('pageViews').add({
      userId: userId || 'anonymous',
      userEmail: userEmail || 'anonymous',
      page,
      sessionId,
      timestamp: FieldValue.serverTimestamp(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || 'direct'
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erreur tracking page view:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
