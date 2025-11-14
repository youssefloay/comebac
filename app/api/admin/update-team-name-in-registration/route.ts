import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
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
    const { oldName, newName } = await request.json()

    if (!oldName || !newName) {
      return NextResponse.json(
        { error: 'Ancien et nouveau nom requis' },
        { status: 400 }
      )
    }

    const db = getFirestore()

    // Trouver et mettre à jour dans teamRegistrations
    const registrationsSnap = await db.collection('teamRegistrations')
      .where('teamName', '==', oldName)
      .get()

    if (registrationsSnap.empty) {
      return NextResponse.json(
        { error: `Aucune inscription trouvée pour "${oldName}"` },
        { status: 404 }
      )
    }

    let updated = 0
    for (const doc of registrationsSnap.docs) {
      await doc.ref.update({ teamName: newName })
      updated++
      console.log(`✅ Inscription mise à jour: ${doc.id}`)
    }

    return NextResponse.json({
      success: true,
      message: `${updated} inscription(s) mise(s) à jour: "${oldName}" → "${newName}"`
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
