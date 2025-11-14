import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function POST(request: NextRequest) {
  try {
    const { emails } = await request.json()

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Liste d\'emails requise' },
        { status: 400 }
      )
    }

    const auth = getAuth()
    const statuses: Record<string, any> = {}

    for (const email of emails) {
      try {
        const userRecord = await auth.getUserByEmail(email)
        
        statuses[email] = {
          exists: true,
          hasPassword: !!userRecord.passwordHash,
          lastSignIn: userRecord.metadata.lastSignInTime,
          createdAt: userRecord.metadata.creationTime,
          emailVerified: userRecord.emailVerified,
          hasLoggedIn: !!userRecord.metadata.lastSignInTime
        }
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          statuses[email] = {
            exists: false,
            hasPassword: false,
            lastSignIn: null,
            createdAt: null,
            emailVerified: false,
            hasLoggedIn: false
          }
        } else {
          console.error(`Erreur pour ${email}:`, error)
          statuses[email] = { error: error.message }
        }
      }
    }

    return NextResponse.json({ success: true, statuses })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
