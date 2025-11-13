import { NextRequest, NextResponse } from 'next/server'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

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
    const { accountId, collection, uid } = await request.json()

    if (!accountId || !collection) {
      return NextResponse.json(
        { error: 'accountId et collection sont requis' },
        { status: 400 }
      )
    }

    // Supprimer le document Firestore
    await deleteDoc(doc(db, collection, accountId))

    // Supprimer l'utilisateur Firebase Auth si UID fourni
    if (uid) {
      try {
        const auth = getAuth()
        await auth.deleteUser(uid)
      } catch (authError: any) {
        console.log('Erreur lors de la suppression Auth (peut-être déjà supprimé):', authError.message)
        // Continue même si l'utilisateur Auth n'existe pas
      }
    }

    return NextResponse.json({
      success: true,
      message: `Compte supprimé avec succès de ${collection}`
    })

  } catch (error: any) {
    console.error('Erreur lors de la suppression du compte:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
