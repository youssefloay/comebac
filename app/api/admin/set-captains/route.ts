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

    // Récupérer toutes les équipes
    const teamsSnap = await db.collection('teams').get()
    let updated = 0

    for (const teamDoc of teamsSnap.docs) {
      const teamId = teamDoc.id
      const teamData = teamDoc.data()

      // Récupérer les joueurs de cette équipe
      const playersSnap = await db.collection('players')
        .where('teamId', '==', teamId)
        .get()

      if (playersSnap.empty) continue

      // Trier les joueurs par numéro
      const players = playersSnap.docs.sort((a, b) => {
        const numA = a.data().number || 999
        const numB = b.data().number || 999
        return numA - numB
      })

      // Le premier joueur (numéro le plus bas) devient capitaine
      for (let i = 0; i < players.length; i++) {
        const playerDoc = players[i]
        const isCaptain = i === 0

        await playerDoc.ref.update({ isCaptain })
        
        if (isCaptain) {
          console.log(`✅ Capitaine défini: ${playerDoc.data().name} (${teamData.name})`)
          updated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${updated} capitaine(s) défini(s)`
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
