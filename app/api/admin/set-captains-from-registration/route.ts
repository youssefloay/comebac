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
    const db = getFirestore()

    // Récupérer toutes les inscriptions approuvées
    const registrationsSnap = await db.collection('teamRegistrations')
      .where('status', '==', 'approved')
      .get()

    let updated = 0
    let errors = 0

    for (const regDoc of registrationsSnap.docs) {
      const registration = regDoc.data()
      const firstPlayerEmail = registration.players?.[0]?.email

      if (!firstPlayerEmail) {
        console.log(`⚠️ Pas de joueurs pour ${registration.teamName}`)
        continue
      }

      // Trouver l'équipe
      const teamsSnap = await db.collection('teams')
        .where('name', '==', registration.teamName)
        .get()

      if (teamsSnap.empty) {
        console.log(`⚠️ Équipe non trouvée: ${registration.teamName}`)
        errors++
        continue
      }

      const teamId = teamsSnap.docs[0].id

      // Récupérer tous les joueurs de cette équipe
      const playersSnap = await db.collection('players')
        .where('teamId', '==', teamId)
        .get()

      // Le premier joueur de la liste d'inscription devient capitaine
      for (const playerDoc of playersSnap.docs) {
        const player = playerDoc.data()
        const isCaptain = player.email?.toLowerCase() === firstPlayerEmail.toLowerCase()
        
        await playerDoc.ref.update({ isCaptain })

        if (isCaptain) {
          console.log(`✅ Capitaine: ${player.name} (${registration.teamName})`)
          updated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${updated} capitaine(s) défini(s)${errors > 0 ? `, ${errors} erreur(s)` : ''}`
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
