import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { sendEmail, generateWelcomeEmail } from '@/lib/email-service'

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
    const { teamId } = await request.json()

    if (!teamId) {
      return NextResponse.json(
        { error: 'ID de l\'équipe requis' },
        { status: 400 }
      )
    }

    const auth = getAuth()
    const db = getFirestore()

    // Récupérer l'équipe
    const teamDoc = await db.collection('teams').doc(teamId).get()
    if (!teamDoc.exists) {
      return NextResponse.json(
        { error: 'Équipe non trouvée' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()
    const teamName = teamData?.name || 'Équipe'

    // Récupérer tous les comptes joueurs de cette équipe
    const playerAccountsSnapshot = await db
      .collection('playerAccounts')
      .where('teamId', '==', teamId)
      .get()

    if (playerAccountsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Aucun compte joueur trouvé pour cette équipe' },
        { status: 404 }
      )
    }

    const results = []
    const errors = []

    // Envoyer un email à chaque joueur
    for (const doc of playerAccountsSnapshot.docs) {
      const player = doc.data()
      const playerEmail = player.email
      const playerName = `${player.firstName} ${player.lastName}`

      try {
        // Générer le lien de réinitialisation
        const resetLink = await auth.generatePasswordResetLink(playerEmail)

        // Envoyer l'email
        const emailResult = await sendEmail(generateWelcomeEmail(playerName, teamName, resetLink, playerEmail))

        if (emailResult.success) {
          results.push({ email: playerEmail, name: playerName, success: true })
        } else {
          errors.push({ email: playerEmail, name: playerName, error: 'Échec envoi email' })
        }
      } catch (error: any) {
        console.error(`Erreur pour ${playerEmail}:`, error)
        errors.push({ email: playerEmail, name: playerName, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.length} email(s) envoyé(s) avec succès${errors.length > 0 ? `, ${errors.length} erreur(s)` : ''}`,
      results,
      errors
    })
  } catch (error: any) {
    console.error('Erreur lors du renvoi des emails:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
