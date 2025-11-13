import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

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
    const { oldEmail, newEmail } = await request.json()

    if (!oldEmail || !newEmail) {
      return NextResponse.json(
        { error: 'oldEmail et newEmail sont requis' },
        { status: 400 }
      )
    }

    const auth = getAuth()

    // Trouver l'utilisateur par l'ancien email
    try {
      const userRecord = await auth.getUserByEmail(oldEmail)
      
      // Mettre à jour l'email dans Firebase Auth
      await auth.updateUser(userRecord.uid, { email: newEmail })
      
      console.log(`✅ Firebase Auth mis à jour: ${oldEmail} → ${newEmail}`)
      
      return NextResponse.json({
        success: true,
        message: `✅ Email Firebase Auth mis à jour: "${oldEmail}" → "${newEmail}"`,
        uid: userRecord.uid
      })
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: `Aucun utilisateur trouvé avec l'email "${oldEmail}" dans Firebase Auth` },
          { status: 404 }
        )
      }
      throw authError
    }
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
