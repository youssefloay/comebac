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
    const { accountId, accountType, phone, email } = await request.json()

    if (!accountId || !accountType) {
      return NextResponse.json(
        { error: 'ID et type de compte requis' },
        { status: 400 }
      )
    }

    const auth = getAuth()
    const db = getFirestore()

    // Déterminer la collection selon le type
    const collectionName = 
      accountType === 'player' ? 'playerAccounts' :
      accountType === 'coach' ? 'coachAccounts' :
      'users'

    // Mettre à jour Firestore
    await db.collection(collectionName).doc(accountId).update({
      phone: phone || ''
    })

    console.log(`✅ Téléphone mis à jour dans ${collectionName}/${accountId}`)

    // Mettre à jour Firebase Auth si possible
    if (email) {
      try {
        const userRecord = await auth.getUserByEmail(email)
        await auth.updateUser(userRecord.uid, {
          phoneNumber: phone ? (phone.startsWith('+') ? phone : `+20${phone}`) : null
        })
        console.log(`✅ Téléphone mis à jour dans Firebase Auth`)
      } catch (authError: any) {
        console.log(`⚠️ Impossible de mettre à jour Firebase Auth: ${authError.message}`)
        // On continue même si Auth échoue
      }
    }

    // Mettre à jour aussi dans la collection players si c'est un joueur
    if (accountType === 'player') {
      const playersSnap = await db.collection('players')
        .where('email', '==', email)
        .get()
      
      for (const doc of playersSnap.docs) {
        await doc.ref.update({ phone: phone || '' })
        console.log(`✅ Téléphone mis à jour dans players/${doc.id}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Téléphone mis à jour avec succès'
    })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du téléphone:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
